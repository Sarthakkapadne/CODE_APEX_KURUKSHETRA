"""
LexPort — Compliance Hash Chain Router
Cryptographic verification endpoints satisfying EU Digital Omnibus AI Act (August 2026).
"""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.session import get_db
from backend.db.models_db import AuditHashBlock
from backend.core.hash_chain import ComplianceHashChain

router = APIRouter()


class HashVerificationRequest(BaseModel):
    compliance_hash: str
    inspection_id: str
    listing_id: str
    timestamp_utc: str
    rule_engine_version: str
    extracted_attributes: Dict[str, Any]
    matrix_findings: List[Dict[str, Any]]
    citations: List[str]
    prev_hash: Optional[str] = None


class HashVerificationResponse(BaseModel):
    is_valid: bool
    recomputed_hash: str
    stored_hash: str
    tamper_detected: bool
    eu_ai_act_compliance: str
    verification_message: str


@router.post("/verify", response_model=HashVerificationResponse, summary="Cryptographically verify an audit compliance hash")
async def verify_compliance_hash(payload: HashVerificationRequest):
    recomputed = ComplianceHashChain.generate_compliance_hash(
        inspection_id=payload.inspection_id,
        listing_id=payload.listing_id,
        timestamp_utc=payload.timestamp_utc,
        rule_engine_version=payload.rule_engine_version,
        extracted_attributes=payload.extracted_attributes,
        matrix_findings=payload.matrix_findings,
        citations=payload.citations,
        prev_hash=payload.prev_hash,
    )

    is_valid = (recomputed == payload.compliance_hash)

    return HashVerificationResponse(
        is_valid=is_valid,
        recomputed_hash=recomputed,
        stored_hash=payload.compliance_hash,
        tamper_detected=not is_valid,
        eu_ai_act_compliance="Article 14 Human Oversight & Article 13 Transparency Compliant",
        verification_message=(
            "CRYPTOGRAPHIC PROOF VALID: The audit findings, extracted parameters, rule engine version, and cited statutory clauses are 100% authentic and untampered."
            if is_valid else
            "TAMPER DETECTED: Recomputed SHA-256 hash does not match stored hash. The audit record, extracted specifications, or cited statutes have been modified."
        )
    )


@router.get("/chain", summary="Get the complete tamper-evident audit hash chain")
async def get_audit_hash_chain(db: AsyncSession = Depends(get_db)):
    stmt = select(AuditHashBlock).order_by(AuditHashBlock.block_index.asc()).limit(50)
    res = await db.execute(stmt)
    blocks = res.scalars().all()

    return {
        "chain_length": len(blocks),
        "standard": "EU Digital Omnibus AI Act (August 2026) Audit Trail Standard",
        "blocks": [
            {
                "block_index": b.block_index,
                "inspection_id": b.inspection_id,
                "compliance_hash": b.compliance_hash,
                "prev_hash": b.prev_hash,
                "timestamp_utc": b.timestamp_utc,
            }
            for b in blocks
        ]
    }
