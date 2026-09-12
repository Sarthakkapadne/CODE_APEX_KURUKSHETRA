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
Table: rules (id, country_code, category, name, directive_code, statute_citation, severity, condition_type, required_field, expected_requirement, explanation, fix_suggestion, is_active)
Table: trade_markets (country_code, country_name, flag, latitude, longitude, governing_agency, currency_code, currency_symbol, usd_exchange_rate, de_minimis_threshold_usd, de_minimis_description, standard_duty_rate, standard_duty_pct, vat_gst_rate, vat_gst_pct, air_transit_days, ocean_transit_days, complexity_score, trade_status)
Table: required_documents (id, country_code, category, doc_name, is_mandatory, statutory_citation, governing_agency, issuing_authority, description, seller_action_needed)
Table: listing_presets (id, title, description, brand_name, category, price, currency, country_of_origin, source_url, icon, sub_label)
Table: listings (id, title, brand_name, category, price, country_of_origin, created_at)
Table: inspections (id, listing_id, overall_verdict, rule_engine_version, compliance_hash, created_at)
Table: compliance_results (id, inspection_id, country_code, category, check_code, status, rule_citation)

Relationships:
- inspections.listing_id = listings.id
- compliance_results.inspection_id = inspections.id
- rules.country_code = trade_markets.country_code
- required_documents.country_code = trade_markets.country_code

Enums & Key Values:
- rules.severity: 'violation', 'warning', 'escalation'
- inspections.overall_verdict: 'COMPLIANT', 'REMEDIATION_REQUIRED', 'IMPORT_PROHIBITED', 'ESCALATION_REQUIRED'
- compliance_results.status: 'pass', 'warning', 'violation', 'escalation'
- trade_markets.country_code: 'US', 'CA', 'EU', 'UK', 'JP', 'AU', 'IN', 'DE', 'CN', 'VN'
"""

SYSTEM_PROMPT = f"""You are a specialized Compliance Data Analyst for the LexPort Cross-Border platform.
Translate natural language questions into valid, read-only SQLite SQL queries against the master database.

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
  "sql": "SELECT country_name, standard_duty_rate * 100 as duty_percentage FROM trade_markets ORDER BY standard_duty_rate DESC",
  "chart_type": "bar",
  "x_axis": "country_name",
  "y_axis": "duty_percentage",
  "summary": "Standard import tariff rates compared across destination trade markets"
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

        sql_query = ai_plan.get("sql", "SELECT country_code, COUNT(id) as count FROM rules GROUP BY country_code")

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
            model_name = getattr(self.settings, "GEMINI_MODEL", "gemini-3.5-flash")
            response = client.models.generate_content(
                model=model_name,
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
        if any(k in query for k in ["rule", "statute", "citation", "law", "directive"]):
            return {
                "sql": "SELECT country_code, COUNT(id) as rule_count FROM rules GROUP BY country_code ORDER BY rule_count DESC",
                "chart_type": "bar",
                "x_axis": "country_code",
                "y_axis": "rule_count",
                "summary": "Total statutory compliance rules codified per destination market"
            }
        elif any(k in query for k in ["duty", "tariff", "standard duty"]):
            return {
                "sql": "SELECT country_name, ROUND(standard_duty_rate * 100, 1) as duty_pct FROM trade_markets ORDER BY standard_duty_rate DESC",
                "chart_type": "bar",
                "x_axis": "country_name",
                "y_axis": "duty_pct",
                "summary": "Standard customs duty tariffs across sovereign markets"
            }
        elif any(k in query for k in ["vat", "gst", "tax"]):
            return {
                "sql": "SELECT country_name, ROUND(vat_gst_rate * 100, 1) as tax_pct FROM trade_markets ORDER BY vat_gst_rate DESC",
                "chart_type": "bar",
                "x_axis": "country_name",
                "y_axis": "tax_pct",
                "summary": "Import VAT / GST rates comparison by country"
            }
        elif any(k in query for k in ["de minimis", "threshold", "exemption"]):
            return {
                "sql": "SELECT country_name, de_minimis_threshold_usd FROM trade_markets ORDER BY de_minimis_threshold_usd DESC",
                "chart_type": "bar",
                "x_axis": "country_name",
                "y_axis": "de_minimis_threshold_usd",
                "summary": "Duty-free de minimis import threshold comparison (in USD)"
            }
        elif any(k in query for k in ["document", "certificate", "paperwork", "checklist", "license"]):
            return {
                "sql": "SELECT country_code, COUNT(id) as document_count FROM required_documents GROUP BY country_code ORDER BY document_count DESC",
                "chart_type": "bar",
                "x_axis": "country_code",
                "y_axis": "document_count",
                "summary": "Mandatory compliance documents and lab certificates required by jurisdiction"
            }
        elif any(k in query for k in ["preset", "case study", "study", "sample", "product"]):
            return {
                "sql": "SELECT title, category, price, country_of_origin FROM listing_presets LIMIT 10",
                "chart_type": "table",
                "x_axis": "title",
                "y_axis": "price",
                "summary": "Documented failure case study listings in database"
            }
        elif "country" in query or "market" in query or "where" in query:
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
                "sql": "SELECT country_code, COUNT(id) as rule_count FROM rules GROUP BY country_code ORDER BY rule_count DESC",
                "chart_type": "bar",
                "x_axis": "country_code",
                "y_axis": "rule_count",
                "summary": "Active statutory rules codified in database"
            }
