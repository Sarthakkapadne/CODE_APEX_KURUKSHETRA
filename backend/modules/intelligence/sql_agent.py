"""
LexPort — NL-to-SQL Compliance Intelligence Copilot
Translates natural language questions into SQLite analytical queries over compliance history.
Returns JSON with raw data, chart type ('bar', 'pie', 'line', 'table'), and axis metadata for Recharts.
"""
from __future__ import annotations
import json
import logging
import os
import re
from typing import Dict, Any, Optional

from google import genai
from google.genai import types
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import get_settings

logger = logging.getLogger(__name__)

SCHEMA_SUMMARY = """
Table: listings (id, title, brand_name, category, price, country_of_origin, created_at)
Table: inspections (id, listing_id, overall_verdict, rule_engine_version, compliance_hash, created_at)
Table: compliance_results (id, inspection_id, country_code, category, check_code, status, rule_citation)

Relationships:
- inspections.listing_id = listings.id
- compliance_results.inspection_id = inspections.id

Enums:
- inspections.overall_verdict: 'COMPLIANT', 'REMEDIATION_REQUIRED', 'IMPORT_PROHIBITED', 'ESCALATION_REQUIRED'
- compliance_results.status: 'pass', 'warning', 'violation', 'escalation'
- compliance_results.country_code: 'US', 'EU', 'UK', 'CA', 'JP'
"""

SYSTEM_PROMPT = f"""You are a specialized Compliance Data Analyst for the LexPort Cross-Border platform.
Translate natural language questions into valid, read-only SQLite SQL queries.

Database Schema:
{SCHEMA_SUMMARY}

Instructions:
1. ONLY return a valid JSON object. Do NOT wrap in markdown or backticks.
2. The JSON must contain: 'sql', 'chart_type', 'x_axis', 'y_axis', 'summary'.
3. 'sql' must be a SELECT query. Limit to 50 rows.
4. 'chart_type' must be one of: 'bar', 'pie', 'line', 'table'.
5. 'x_axis' is the categorical column name.
6. 'y_axis' is the numeric count/metric column name.

Example:
{{
  "sql": "SELECT country_code, COUNT(id) as violation_count FROM compliance_results WHERE status = 'violation' GROUP BY country_code",
  "chart_type": "bar",
  "x_axis": "country_code",
  "y_axis": "violation_count",
  "summary": "Breakdown of regulatory violations by destination country"
}}
"""


class ComplianceSQLAgent:
    def __init__(self):
        self.settings = get_settings()

    async def query(self, db: AsyncSession, natural_query: str) -> Dict[str, Any]:
        q_clean = natural_query.strip().lower()

        # 1. Try Gemini model
        ai_plan = await self._generate_sql_with_gemini(natural_query)

        # 2. Heuristic fallback query if Gemini is unavailable
        if not ai_plan:
            ai_plan = self._fallback_sql_plan(q_clean)

        sql_query = ai_plan.get("sql", "SELECT country_code, COUNT(id) as count FROM compliance_results GROUP BY country_code")

        # Security check: Read-only SELECT only
        if not sql_query.strip().lower().startswith("select"):
            raise ValueError("Only read-only SELECT queries are permitted.")

        logger.info(f"[SQL_COPILOT] Executing: {sql_query}")
        result = await db.execute(text(sql_query))
        rows = result.mappings().all()
        data = [dict(row) for row in rows]

        return {
            "query": natural_query,
            "chart_type": ai_plan.get("chart_type", "bar"),
            "x_axis": ai_plan.get("x_axis", "country_code"),
            "y_axis": ai_plan.get("y_axis", "count"),
            "summary": ai_plan.get("summary", "Compliance analytical insights"),
            "sql": sql_query,
            "data": data,
        }

    async def _generate_sql_with_gemini(self, query_text: str) -> Optional[Dict[str, Any]]:
        api_key = self.settings.GEMINI_API_KEY
        if not api_key:
            return None

        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=query_text,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.0,
                    response_mime_type="application/json"
                ),
            )
            if response and response.text:
                return json.loads(response.text.strip())
        except Exception as e:
            logger.warning(f"[SQL_COPILOT] Gemini error: {e}")
        return None

    def _fallback_sql_plan(self, query: str) -> Dict[str, Any]:
        if "country" in query or "market" in query or "where" in query:
            return {
                "sql": "SELECT country_code, COUNT(id) as violation_count FROM compliance_results WHERE status = 'violation' GROUP BY country_code ORDER BY violation_count DESC",
                "chart_type": "bar",
                "x_axis": "country_code",
                "y_axis": "violation_count",
                "summary": "Violations grouped by destination country"
            }
        elif "category" in query or "type" in query:
            return {
                "sql": "SELECT category, COUNT(id) as count FROM compliance_results WHERE status in ('violation', 'escalation') GROUP BY category ORDER BY count DESC",
                "chart_type": "pie",
                "x_axis": "category",
                "y_axis": "count",
                "summary": "Compliance failure distribution across check categories"
            }
        elif "verdict" in query or "rate" in query:
            return {
                "sql": "SELECT overall_verdict, COUNT(id) as count FROM inspections GROUP BY overall_verdict",
                "chart_type": "pie",
                "x_axis": "overall_verdict",
                "y_axis": "count",
                "summary": "Overall product inspection verdicts"
            }
        else:
            return {
                "sql": "SELECT country_code, status, COUNT(id) as count FROM compliance_results GROUP BY country_code, status",
                "chart_type": "bar",
                "x_axis": "country_code",
                "y_axis": "count",
                "summary": "Compliance status breakdown per market"
            }
