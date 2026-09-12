"""
LexPort — Intelligence Copilot Router (NL-to-SQL)
Translates natural language questions into SQLite analytics with Recharts visualization specs.
"""
from __future__ import annotations
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.session import get_db
from backend.modules.intelligence.sql_agent import ComplianceSQLAgent

router = APIRouter()
_sql_agent = ComplianceSQLAgent()


class IntelligenceQueryRequest(BaseModel):
    query: str


@router.post("/query", summary="Query cross-border compliance intelligence via natural language")
async def query_compliance_intelligence(
    req: IntelligenceQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Translates a natural language question into SQL, executes it against the
    compliance database, and returns structured data suitable for charts and
    the chatbot. The response always includes an 'answer' field for chatbot use.
    """
    try:
        result = await _sql_agent.query(db, req.query)

        # Build a human-readable 'answer' from the structured result
        # so the frontend chatbot can display it directly
        data = result.get("data", [])
        summary = result.get("summary", "Compliance analytical insights")

        if data:
            # Build concise textual summary
            answer_lines = [summary, ""]
            for row in data[:10]:  # limit to 10 rows for readability
                parts = [f"{k}: {v}" for k, v in row.items()]
                answer_lines.append("• " + " | ".join(parts))
            if len(data) > 10:
                answer_lines.append(f"… and {len(data) - 10} more records.")
            answer = "\n".join(answer_lines)
        else:
            answer = f"{summary}\n\nNo records found in the database yet. Run a compliance audit first to populate data."

        result["answer"] = answer
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query error: {str(e)}")
