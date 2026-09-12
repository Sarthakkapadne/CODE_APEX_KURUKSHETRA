"""
LexPort — Compliance Confidence & Dependency Graph Router
Endpoints:
- POST /compliance/confidence: Calculates score, breakdown, DAG, and impact actions for live audit data.
- POST /compliance/confidence/simulate: Dynamic simulation resolving selected nodes.
- GET  /api/products/{product_id}/compliance-confidence: Fetches and calculates confidence for a product/inspection ID.
"""
from __future__ import annotations
import json
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.session import get_db
from backend.db.models_db import Inspection, Listing, ComplianceResultRecord
from backend.services.compliance_confidence import (
    ComplianceConfidenceService,
    ComplianceConfidenceResponse,
)

router = APIRouter()
_service = ComplianceConfidenceService()


class ConfidenceRequest(BaseModel):
    audit_data: Dict[str, Any]
    target_market: Optional[str] = None
    simulated_resolved_ids: Optional[List[str]] = Field(default_factory=list)


class SimulationRequest(BaseModel):
    audit_data: Dict[str, Any]
    target_market: Optional[str] = None
    resolved_node_ids: List[str] = Field(default_factory=list)


@router.post("/confidence", response_model=ComplianceConfidenceResponse, summary="Calculate Compliance Confidence & Dependency Graph")
async def calculate_compliance_confidence(request: ConfidenceRequest):
    """
    Calculates the 4-factor compliance confidence score:
    Score = (Rule Coverage * 30%) + (Evidence Verification * 30%) + (Product Data Completeness * 20%) + (Dependency Health * 20%)
    Constructs the downstream dependency graph and calculates 'What should I fix first?' impact actions.
    """
    try:
        response = _service.calculate_confidence(
            audit_data=request.audit_data,
            target_market=request.target_market,
            simulated_resolved_ids=request.simulated_resolved_ids,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate compliance confidence: {str(e)}")


@router.post("/confidence/simulate", response_model=ComplianceConfidenceResponse, summary="Interactive Simulation Mode")
async def simulate_confidence_resolution(request: SimulationRequest):
    """
    Simulates resolution of missing evidence or product attributes without persisting database changes.
    Dynamically recalculates the confidence score, unblocks downstream requirements, and updates graph state.
    """
    try:
        response = _service.calculate_confidence(
            audit_data=request.audit_data,
            target_market=request.target_market,
            simulated_resolved_ids=request.resolved_node_ids,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to simulate confidence resolution: {str(e)}")


@router.get("/products/{product_id}/compliance-confidence", response_model=ComplianceConfidenceResponse, summary="Get Product Compliance Confidence")
async def get_product_compliance_confidence(
    product_id: str,
    target_market: Optional[str] = Query(None, description="Optional target market filter (US, EU, CA, etc.)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches an existing product or inspection from the database and returns its compliance confidence and dependency graph.
    """
    # 1. Check if product_id matches an Inspection
    stmt = select(Inspection).where(Inspection.id == product_id)
    res = await db.execute(stmt)
    inspection = res.scalars().first()

    if inspection:
        extracted = {}
        try:
            extracted = json.loads(inspection.extracted_attributes_json) if inspection.extracted_attributes_json else {}
        except Exception:
            pass

        markets = []
        try:
            markets = json.loads(inspection.destination_markets) if inspection.destination_markets else ["US", "EU"]
        except Exception:
            markets = ["US", "EU"]

        # Fetch results
        results_stmt = select(ComplianceResultRecord).where(ComplianceResultRecord.inspection_id == inspection.id)
        r_res = await db.execute(results_stmt)
        records = r_res.scalars().all()

        matrix: Dict[str, List[Dict[str, Any]]] = {}
        for r in records:
            matrix.setdefault(r.country_code, []).append({
                "rule_code": r.rule_code,
                "status": r.status,
                "severity": r.severity,
                "statute_citation": r.statute_citation,
                "explanation": r.explanation,
                "fix_suggestion": r.fix_suggestion,
            })

        listing_title = "Commercial Product"
        brand_name = "Generic Brand"
        country_origin = "India"
        if inspection.listing_id:
            l_stmt = select(Listing).where(Listing.id == inspection.listing_id)
            l_res = await db.execute(l_stmt)
            listing = l_res.scalars().first()
            if listing:
                listing_title = listing.title
                brand_name = listing.brand_name
                country_origin = listing.country_of_origin

        audit_data = {
            "inspection_id": inspection.id,
            "listing_id": inspection.listing_id,
            "title": listing_title,
            "brand_name": brand_name,
            "country_of_origin": country_origin,
            "destination_markets": markets,
            "extracted_attributes": extracted,
            "matrix": matrix,
            "required_documents": [
                {
                    "doc_code": "LAB_TEST_REPORT",
                    "doc_name": "ISO 17025 Third-Party Safety & Lab Assay",
                    "issuing_authority": "Accredited Testing Laboratory",
                    "country_code": markets[0] if markets else "US",
                    "category": "Testing & Safety",
                    "is_mandatory": True,
                    "statutory_citation": "16 CFR § 1107 / CPSIA § 102",
                    "seller_action_needed": "Upload third-party accredited lab report.",
                    "seller_status": "pending_upload",
                }
            ],
        }
        return _service.calculate_confidence(audit_data, target_market=target_market)

    # 2. Check if product_id matches a Listing directly
    l_stmt = select(Listing).where(Listing.id == product_id)
    l_res = await db.execute(l_stmt)
    listing = l_res.scalars().first()

    if listing:
        audit_data = {
            "inspection_id": f"insp_{listing.id}",
            "listing_id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "brand_name": listing.brand_name,
            "country_of_origin": listing.country_of_origin,
            "destination_markets": ["US", "EU", "CA"],
            "extracted_attributes": {"category": listing.category},
            "matrix": {
                "US": [{"rule_code": "US_GEN_01", "status": "pass", "statute_citation": "CPSC Standard"}],
                "EU": [{"rule_code": "EU_GEN_01", "status": "warning", "statute_citation": "GPSR 2023/988"}],
            },
            "required_documents": [],
        }
        return _service.calculate_confidence(audit_data, target_market=target_market)

    # Fallback: if not in DB, generate default response for the product ID
    fallback_data = {
        "inspection_id": product_id,
        "listing_id": product_id,
        "title": f"Product {product_id}",
        "brand_name": "Cross-Border Seller",
        "country_of_origin": "India",
        "destination_markets": ["US", "EU"],
        "extracted_attributes": {"category": "Cosmetics"},
        "matrix": {
            "US": [{"rule_code": "FDA_MOCRA_01", "status": "warning", "statute_citation": "FD&C Act § 607"}],
            "EU": [{"rule_code": "EU_REG_1223", "status": "pass", "statute_citation": "EC 1223/2009"}],
        },
        "required_documents": [
            {
                "doc_code": "MOCRA_LISTING",
                "doc_name": "FDA MoCRA Facility Registration Proof",
                "issuing_authority": "US FDA",
                "country_code": "US",
                "category": "Regulatory Filing",
                "is_mandatory": True,
                "seller_status": "pending_upload",
            }
        ],
    }
    return _service.calculate_confidence(fallback_data, target_market=target_market)
