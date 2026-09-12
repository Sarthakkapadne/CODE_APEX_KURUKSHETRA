"""
LexPort — Real Rule-Based Compliance Verification Router
Endpoints:
- POST /api/compliance/verify: Verifies a product against the project's structured JSON rules.
- POST /compliance/verify: Alias endpoint.
- GET  /api/compliance/verify/presets: Demo product cases for hackathon testing.
"""
from __future__ import annotations
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from backend.modules.rule_engine.verification_engine import (
    RuleVerificationEngine,
    ProductVerificationInput,
    DocumentEvidenceItem,
    ProductComplianceVerificationResponse,
)

router = APIRouter()
_engine = RuleVerificationEngine()


class VerifyRequest(BaseModel):
    product: Optional[Dict[str, Any]] = None
    target_market: Optional[str] = "EU"
    # Allow flat fields as fallback
    product_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    materials: Optional[List[str]] = None
    ingredients: Optional[List[str]] = None
    brand_name: Optional[str] = None
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    country_of_origin: Optional[str] = None
    intended_use: Optional[str] = None
    contains_battery: Optional[bool] = None
    documents: Optional[List[Dict[str, Any]]] = None
    marketing_claims: Optional[List[str]] = None


DEMO_VERIFICATION_PRESETS = [
    {
        "id": "demo-hair-dryer",
        "product_name": "Electric Hair Dryer",
        "category": "electronics",
        "materials": ["Plastic", "Copper wiring", "Ceramic heating element"],
        "intended_use": "personal hair drying and styling",
        "manufacturer_name": "EuroGroom Appliances Ltd",
        "manufacturer_address": None,
        "country_of_origin": "China",
        "target_market": "EU",
        "contains_battery": False,
        "description": "Professional 2200W salon electric hair dryer with ionic conditioning and flame-retardant plastic casing.",
        "marketing_claims": ["Ionic condition tech", "Fast drying"],
        "documents": [],
    },
    {
        "id": "demo-speaker",
        "product_name": "Wireless Bluetooth Speaker",
        "category": "consumer electronics",
        "materials": ["plastic", "electronic components"],
        "intended_use": "consumer audio",
        "manufacturer_name": "SoundWave Electronics Ltd",
        "manufacturer_address": None,
        "country_of_origin": "China",
        "target_market": "EU",
        "contains_battery": True,
        "battery_type": "Lithium-Ion 1200mAh",
        "description": "Portable wireless audio speaker with enhanced bass and rechargeable battery.",
        "documents": [
            {
                "type": "test_report",
                "name": "Safety Test Report",
                "status": "provided",
                "standards": ["EN 62368-1", "LVD 2014/35/EU"],
            }
        ],
    },
    {
        "id": "demo-heated-wand",
        "product_name": "Consumer Electronic Product - Rechargeable Sonic Thermal Eye Wand",
        "category": "consumer electronics",
        "materials": ["aluminum", "electronic components", "lithium-ion cell"],
        "intended_use": "thermal cosmetic eye massage",
        "manufacturer_name": "AuraTech Global",
        "manufacturer_address": None,
        "country_of_origin": "Japan",
        "target_market": "EU",
        "contains_battery": True,
        "battery_type": "Lithium-Ion 800mAh",
        "description": "Smart thermal massage wand with 42C warming head and high-density rechargeable battery.",
        "documents": [
            {
                "type": "test_report",
                "name": "Safety Test Report",
                "status": "missing",
                "standards": ["EN 62368-1"],
            },
            {
                "type": "certificate",
                "name": "EU Responsible Person Mandate",
                "status": "provided",
            }
        ],
    },
    {
        "id": "demo-turmeric-cream",
        "product_name": "Ayurvedic Turmeric Glow Herbal Skin Relief Cream 50g",
        "category": "cosmetics",
        "materials": ["Curcuma Longa Extract", "Sandalwood Oil", "Aqua", "Glycerin"],
        "ingredients": ["Curcuma Longa Extract", "Sandalwood Oil", "Aqua", "Glycerin"],
        "intended_use": "topical skincare moisturization",
        "manufacturer_name": "VedaAura Herbal Labs",
        "manufacturer_address": "Sector 4, Industrial Area, Mumbai, India",
        "country_of_origin": "India",
        "target_market": "US",
        "description": "100% natural Ayurvedic cream. Clinically proven miraculous cure for eczema and psoriasis.",
        "marketing_claims": ["Clinically proven miraculous cure for eczema and psoriasis"],
        "documents": [],
    },
    {
        "id": "demo-baby-walker",
        "product_name": "Baby Joy 3-in-1 Foldable Activity Baby Walker with Wheels",
        "category": "toys",
        "materials": ["ABS plastic", "polyurethane wheels", "steel fasteners"],
        "intended_use": "infant walking mobility and play",
        "manufacturer_name": "BabyJoy Infant Gear",
        "manufacturer_address": "No. 88 Industrial Road, Shenzhen, China",
        "country_of_origin": "China",
        "target_market": "US",
        "description": "Multi-directional swivel wheel infant activity walker with interactive sound tray.",
        "documents": [
            {
                "type": "test_report",
                "name": "ASTM F977 Stair Fall Test Report",
                "status": "provided",
            }
        ],
    },
    {
        "id": "demo-cutting-board",
        "product_name": "EcoGreen Organic Bamboo Kitchen Cutting Board with Antibacterial Surface Protection",
        "category": "kitchenware",
        "materials": ["100% organic moso bamboo", "mineral oil"],
        "intended_use": "food preparation and meat slicing",
        "manufacturer_name": "EcoGreen Living Ltd",
        "manufacturer_address": "Industrial Zone 2, Binh Duong, Vietnam",
        "country_of_origin": "Vietnam",
        "target_market": "US",
        "description": "Natural bamboo cutting board. Built-in antibacterial protection kills 99.9% of household germs on contact.",
        "marketing_claims": ["antibacterial protection kills 99.9% of household germs on contact"],
        "documents": [],
    }
]


@router.post("/verify", response_model=ProductComplianceVerificationResponse, summary="Execute Rule-Based Compliance Verification")
async def verify_compliance(request: VerifyRequest):
    """
    Evaluates a product against the project's structured JSON compliance rules.
    Identifies PASS, FAIL, MISSING_INFORMATION, and NEEDS_REVIEW.
    Provides complete Decision Traces and Next Best Action rankings.
    """
    try:
        # Extract product attributes
        p_dict = request.product or {}
        p_name = p_dict.get("product_name") or request.product_name or p_dict.get("title") or "Unnamed Product"
        category = p_dict.get("category") or request.category or "consumer electronics"
        materials = p_dict.get("material") or p_dict.get("materials") or request.materials or []
        ingredients = p_dict.get("ingredients") or request.ingredients or []
        intended_use = p_dict.get("intended_use") or request.intended_use
        brand = p_dict.get("brand_name") or p_dict.get("brand") or request.brand_name
        mfg_name = p_dict.get("manufacturer_name") or p_dict.get("manufacturer") or request.manufacturer_name
        mfg_addr = p_dict.get("manufacturer_address") or request.manufacturer_address
        coo = p_dict.get("country_of_origin") or request.country_of_origin
        market = request.target_market or p_dict.get("target_market") or "EU"
        desc = p_dict.get("description") or request.description or ""
        claims = p_dict.get("marketing_claims") or request.marketing_claims or []
        has_battery = p_dict.get("contains_battery") if p_dict.get("contains_battery") is not None else request.contains_battery
        battery_type = p_dict.get("battery_type")

        # Parse documents
        raw_docs = p_dict.get("documents") or request.documents or []
        docs: List[DocumentEvidenceItem] = []
        for d in raw_docs:
            if isinstance(d, dict):
                docs.append(
                    DocumentEvidenceItem(
                        type=d.get("type", "document"),
                        name=d.get("name"),
                        status=d.get("status", "provided"),
                        issuing_authority=d.get("issuing_authority"),
                        standards=d.get("standards", []),
                    )
                )

        product_input = ProductVerificationInput(
            product_name=p_name,
            category=category,
            description=desc,
            materials=materials,
            ingredients=ingredients,
            brand_name=brand,
            manufacturer_name=mfg_name,
            manufacturer_address=mfg_addr,
            country_of_origin=coo,
            intended_use=intended_use,
            target_market=market,
            contains_battery=has_battery,
            battery_type=battery_type,
            marketing_claims=claims,
            documents=docs,
        )

        response = _engine.verify_product(product_input)
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rule verification evaluation failed: {str(e)}")


@router.get("/verify/presets", summary="Get Demo Verification Product Presets")
async def get_verification_presets():
    """Returns realistic demo products for verification testing."""
    return DEMO_VERIFICATION_PRESETS
