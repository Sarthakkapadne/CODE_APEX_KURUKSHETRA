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

from backend.core.models import (
    ListingInput, AuditResponse, PackagingAnalysisResult, ComplianceExportPack,
    BenchmarkStatsResponse
)
from backend.db.session import get_db
from backend.db.models_db import Listing, Inspection, ComplianceResultRecord, AuditHashBlock
from backend.modules.agents.supervisor import ComplianceSupervisor
from backend.modules.exports.export_pack_generator import ExportPackGenerator
from backend.modules.rule_engine.deterministic_engine import DeterministicRuleEngine
from backend.modules.simulator.regulatory_simulator import RegulatorySimulator
from backend.tests.eval_benchmark import BenchmarkEvaluator

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
            summary=f"{audit_res.overall_verdict} (Risk: {audit_res.customs_radar.threat_level if audit_res.customs_radar else 'N/A'})",
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


@router.get("/inspections/{inspection_id}", summary="Get full inspection details by ID")
async def get_inspection_by_id(inspection_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Inspection).where(Inspection.id == inspection_id)
    res = await db.execute(stmt)
    inspection = res.scalars().first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    listing_stmt = select(Listing).where(Listing.id == inspection.listing_id)
    listing_res = await db.execute(listing_stmt)
    listing = listing_res.scalars().first()

    results_stmt = select(ComplianceResultRecord).where(ComplianceResultRecord.inspection_id == inspection_id)
    results_res = await db.execute(results_stmt)
    results = results_res.scalars().all()

    hash_stmt = select(AuditHashBlock).where(AuditHashBlock.inspection_id == inspection_id)
    hash_res = await db.execute(hash_stmt)
    hash_block = hash_res.scalars().first()

    return {
        "inspection": {
            "id": inspection.id,
            "listing_id": inspection.listing_id,
            "timestamp_utc": inspection.timestamp_utc,
            "rule_engine_version": inspection.rule_engine_version,
            "compliance_hash": inspection.compliance_hash,
            "prev_hash": inspection.prev_hash,
            "overall_verdict": inspection.overall_verdict,
            "destination_markets": json.loads(inspection.destination_markets or "[]"),
            "extracted_attributes": json.loads(inspection.extracted_attributes_json or "{}"),
            "summary": inspection.summary,
        },
        "listing": {
            "id": listing.id if listing else None,
            "title": listing.title if listing else None,
            "description": listing.description if listing else None,
            "brand_name": listing.brand_name if listing else None,
            "category": listing.category if listing else None,
            "price": listing.price if listing else None,
            "currency": listing.currency if listing else None,
            "country_of_origin": listing.country_of_origin if listing else None,
            "source_url": listing.source_url if listing else None,
        } if listing else None,
        "results": [
            {
                "country_code": r.country_code,
                "category": r.category,
                "check_code": r.check_code,
                "status": r.status,
                "trust_tier": r.trust_tier,
                "rule_citation": r.rule_citation,
                "extracted_value": r.extracted_value,
                "expected_requirement": r.expected_requirement,
                "explanation": r.explanation,
                "fix_suggestion": r.fix_suggestion,
            }
            for r in results
        ],
        "hash_block": {
            "block_index": hash_block.block_index if hash_block else None,
            "compliance_hash": hash_block.compliance_hash if hash_block else None,
            "prev_hash": hash_block.prev_hash if hash_block else None,
            "timestamp_utc": hash_block.timestamp_utc if hash_block else None,
        } if hash_block else None,
    }



@router.post("/ocr-scan", response_model=PackagingAnalysisResult, summary="Multi-Modal Packaging Vision OCR & Rosetta Stone Translation")
async def scan_packaging_label(
    payload: dict,
    supervisor: ComplianceSupervisor = Depends(get_supervisor),
):
    """
    Direct endpoint for scanning packaging box / label images,
    detecting languages (Kanji, German, French, etc.), standardizing to English INCI,
    and identifying certification logos.
    """
    return await supervisor.ocr_engine.inspect_packaging(
        image_base64=payload.get("image_base64"),
        image_url=payload.get("image_url"),
        listing_title=payload.get("title", "Product Packaging"),
        category_hint=payload.get("category_hint", "cosmetics"),
        target_markets=payload.get("destination_markets", ["US", "EU", "CA"])
    )


@router.post("/export-pack", response_model=ComplianceExportPack, summary="Generate 1-Click Amazon & Shopify Ready Export Pack")
async def generate_export_pack(
    listing: ListingInput,
    supervisor: ComplianceSupervisor = Depends(get_supervisor),
):
    """
    Generates a production-ready export pack containing compliance-scrubbed
    Amazon title & 5 bullets, Shopify customs metafields, and print-ready
    packaging artwork specifications with vector statutory marks.
    """
    # Quick attribute extraction
    extracted = await supervisor.extractor.extract(listing.title, listing.description)
    hs_res = supervisor.hs_tariff_engine.evaluate_hs_classification(listing, extracted, [])
    radar_res = supervisor.customs_radar.evaluate_seizure_risk(listing, extracted, [], listing.destination_markets or ["US"])

    return ExportPackGenerator.generate(
        listing=listing,
        remediation=None,
        extracted=extracted,
        hs_tariff=hs_res,
        customs_radar=radar_res,
        target_markets=listing.destination_markets or ["US"],
    )


@router.get("/benchmark-stats", response_model=BenchmarkStatsResponse, summary="Retrieve 50-Item Ground-Truth Accuracy Benchmark Statistics")
async def get_benchmark_stats():
    """
    Returns verified accuracy, precision, recall, and F1-score computed against
    50 ground-truth regulatory cases from US FDA, Health Canada, EU RAPEX, and EPA.
    """
    evaluator = BenchmarkEvaluator()
    return evaluator.run_benchmark()

