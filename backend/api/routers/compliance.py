"""
LexPort — Compliance Audit Router
Main orchestration endpoint for the Multi-Agent Cross-Border Compliance Audit.
"""
from __future__ import annotations
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.models import ListingInput, AuditResponse
from backend.db.session import get_db
from backend.db.models_db import Listing, Inspection, ComplianceResultRecord, AuditHashBlock
from backend.modules.agents.supervisor import ComplianceSupervisor
from backend.modules.rule_engine.deterministic_engine import DeterministicRuleEngine
from backend.modules.simulator.regulatory_simulator import RegulatorySimulator

router = APIRouter()

# Shared singleton supervisor
_shared_engine = DeterministicRuleEngine()
_shared_sim = RegulatorySimulator()
_shared_supervisor = ComplianceSupervisor(rule_engine=_shared_engine, simulator=_shared_sim)


def get_supervisor() -> ComplianceSupervisor:
    return _shared_supervisor


def get_simulator() -> RegulatorySimulator:
    return _shared_sim


def get_rule_engine() -> DeterministicRuleEngine:
    return _shared_engine


@router.post("/audit", response_model=AuditResponse, summary="Execute Multi-Agent Compliance Audit")
async def run_compliance_audit(
    listing_input: ListingInput,
    db: AsyncSession = Depends(get_db),
    supervisor: ComplianceSupervisor = Depends(get_supervisor),
):
    """
    Runs the full Three-Tier Multi-Agent Compliance Pipeline:
    1. Attribute Extraction (marketing text -> technical parameters)
    2. Deterministic Rule Checks across destination markets (US, EU, UK, CA, JP)
    3. Layer 1b Classification Mismatch Detection
    4. Layer 3 Explicit Human Escalations (Strict Non-Automation)
    5. Adversarial Debate (Customs Inspector vs Seller Advocate)
    6. Remediation & Auto-Rewrite Engine (Diffs & compliant copy)
    7. Trade Economics Advisor (De minimis, VAT/GST OSS, Market entry ranking)
    8. SHA-256 Cryptographic Hash Chain Ledger
    """
    try:
        # Find latest inspection hash for chain linking
        latest_block_stmt = select(AuditHashBlock).order_by(AuditHashBlock.block_index.desc()).limit(1)
        latest_block_res = await db.execute(latest_block_stmt)
        latest_block = latest_block_res.scalars().first()
        prev_hash = latest_block.compliance_hash if latest_block else "GENESIS_BLOCK_00000000000000000000000000000000000000000000000000000000"

        # Execute supervisor pipeline
        audit_res = await supervisor.run_audit(listing_input, prev_hash=prev_hash)

        # Persist to database
        db_listing = Listing(
            id=audit_res.listing_id,
            title=listing_input.title,
            description=listing_input.description,
            brand_name=listing_input.brand_name,
            category=audit_res.extracted_attributes.category,
            price=listing_input.price,
            currency=listing_input.currency,
            country_of_origin=listing_input.country_of_origin,
            source_url=listing_input.source_url,
        )
        db.add(db_listing)
        await db.flush()

        db_inspection = Inspection(
            id=audit_res.inspection_id,
            listing_id=db_listing.id,
            timestamp_utc=audit_res.timestamp_utc,
            rule_engine_version=audit_res.rule_engine_version,
            compliance_hash=audit_res.compliance_hash,
            prev_hash=audit_res.prev_hash,
            overall_verdict=audit_res.overall_verdict,
            destination_markets=json.dumps(audit_res.destination_markets),
            extracted_attributes_json=json.dumps(audit_res.extracted_attributes.dict()),
            summary=audit_res.debate.consensus_verdict if audit_res.debate else "Completed audit",
        )
        db.add(db_inspection)
        await db.flush()

        # Add compliance results
        for country, checks in audit_res.matrix.items():
            for c in checks:
                db_record = ComplianceResultRecord(
                    inspection_id=db_inspection.id,
                    country_code=country,
                    category=c.category,
                    check_code=c.check_code,
                    status=c.status,
                    trust_tier=c.trust_tier,
                    rule_citation=c.rule_citation,
                    extracted_value=c.extracted_value,
                    expected_requirement=c.expected_requirement,
                    explanation=c.explanation,
                    fix_suggestion=c.fix_suggestion,
                )
                db.add(db_record)

        # Add to hash chain ledger
        next_index = (latest_block.block_index + 1) if latest_block else 1
        db_hash_block = AuditHashBlock(
            inspection_id=db_inspection.id,
            block_index=next_index,
            compliance_hash=audit_res.compliance_hash,
            prev_hash=audit_res.prev_hash,
            payload_canonical=json.dumps({
                "inspection_id": audit_res.inspection_id,
                "listing_id": audit_res.listing_id,
                "rule_engine_version": audit_res.rule_engine_version,
                "timestamp_utc": audit_res.timestamp_utc,
            }, sort_keys=True),
            timestamp_utc=audit_res.timestamp_utc,
        )
        db.add(db_hash_block)

        await db.commit()
        return audit_res

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Audit execution failed: {str(e)}")


@router.get("/inspections", summary="List recent compliance inspections")
async def list_inspections(db: AsyncSession = Depends(get_db)):
    stmt = select(Inspection).order_by(Inspection.created_at.desc()).limit(20)
    result = await db.execute(stmt)
    inspections = result.scalars().all()
    return [
        {
            "id": i.id,
            "listing_id": i.listing_id,
            "timestamp_utc": i.timestamp_utc,
            "rule_engine_version": i.rule_engine_version,
            "compliance_hash": i.compliance_hash,
            "overall_verdict": i.overall_verdict,
            "destination_markets": json.loads(i.destination_markets or "[]"),
            "summary": i.summary,
        }
        for i in inspections
    ]


@router.get("/heatmap", summary="Get global risk heat map data")
async def get_heatmap_data(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    query = text("""
        SELECT country_code, status, COUNT(id) as count 
        FROM compliance_results 
        GROUP BY country_code, status
    """)
    result = await db.execute(query)
    rows = result.mappings().all()

    # Base regions
    regions = {
        "nam": {"id": "nam", "name": "North America", "risk": "low", "score": 95, "alerts": 0, "trend": "+2%"},
        "eur": {"id": "eur", "name": "Europe", "risk": "low", "score": 90, "alerts": 0, "trend": "-1%"},
        "apac": {"id": "apac", "name": "Asia Pacific", "risk": "low", "score": 92, "alerts": 0, "trend": "+1%"},
        "latam": {"id": "latam", "name": "Latin America", "risk": "low", "score": 85, "alerts": 0, "trend": "0%"},
        "mena": {"id": "mena", "name": "Middle East", "risk": "low", "score": 80, "alerts": 0, "trend": "0%"},
    }

    # Map country codes to regions
    country_to_region = {
        "US": "nam", "CA": "nam",
        "EU": "eur", "UK": "eur",
        "JP": "apac"
    }

    alerts_by_region = {"nam": 0, "eur": 0, "apac": 0, "latam": 0, "mena": 0}

    for row in rows:
        c = row["country_code"]
        r_id = country_to_region.get(c, "latam")
        if row["status"] in ("violation", "escalation"):
            alerts_by_region[r_id] += row["count"]

    for r_id in regions:
        alerts = alerts_by_region[r_id]
        regions[r_id]["alerts"] = alerts
        if alerts > 10:
            regions[r_id]["risk"] = "high"
            regions[r_id]["score"] = max(40, 95 - (alerts * 3))
        elif alerts > 0:
            regions[r_id]["risk"] = "medium"
            regions[r_id]["score"] = max(70, 95 - (alerts * 2))

    return list(regions.values())
