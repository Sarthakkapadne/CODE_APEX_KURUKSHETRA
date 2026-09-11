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
    try:
        return await _sql_agent.query(db, req.query)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query error: {str(e)}")
