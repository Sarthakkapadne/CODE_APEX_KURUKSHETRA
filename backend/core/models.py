from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ListingInput(BaseModel):
    title: str = Field(..., description="Product title as written by seller")
    description: str = Field(..., description="Marketing product description / bullet points")
    brand_name: Optional[str] = "Generic Brand"
    category_hint: Optional[str] = None
    price: Optional[float] = 29.99
    currency: Optional[str] = "USD"
    country_of_origin: Optional[str] = "India"
    destination_markets: List[str] = Field(default=["US", "EU", "UK", "CA", "JP"])
    source_url: Optional[str] = None


class ExtractedAttributes(BaseModel):
    category: str
    subcategory: str
    intended_age: str
    power_source: str
    has_battery: bool = False
    battery_type: str = "none"
    ingredients: List[str] = []
    chemical_concentrations: Dict[str, float] = {}
    claims: List[str] = []
    inferred_hs_code: str = "3304.99"
    technical_specs: Dict[str, Any] = {}
    missing_required_fields: List[str] = []


class ComplianceCheckResult(BaseModel):
    check_code: str
    country_code: str
    category: str  # Classification, Banned Ingredients, Claim Wording, Mandatory Labeling, Safety/Certifications, Hazmat/Shipping
    status: str  # pass, warning, violation, escalation
    trust_tier: str  # Tier 1 Deterministic, Tier 2 Grounded AI, Tier 3 Escalation
    rule_citation: str
    extracted_value: str
    expected_requirement: str
    explanation: str
    fix_suggestion: Optional[str] = None


class DebateTurn(BaseModel):
    round_number: int
    speaker: str  # "Customs Inspector", "Seller Advocate", "Consensus Arbiter"
    role_title: str
    argument: str
    cited_rules: List[str] = []
    risk_level: str = "medium"  # high, medium, low, neutral


class AdversarialDebateResult(BaseModel):
    debate_topic: str
    turns: List[DebateTurn] = []
    consensus_verdict: str
    binding_remediations: List[str] = []


class DiffItem(BaseModel):
    original_phrase: str
    compliant_phrase: str
    reason: str
    severity: str = "high"


class RemediationResult(BaseModel):
    original_title: str
    compliant_title: str
    original_description: str
    compliant_description: str
    diff_items: List[DiffItem] = []
    ready_to_paste_bullets: List[str] = []
    escalation_checklist: List[str] = []


class TradeEconomicsItem(BaseModel):
    country_code: str
    country_name: str
    de_minimis_threshold: float
    de_minimis_currency: str
    vat_gst_rate: str
    simplification_scheme: str  # e.g., "EU IOSS", "US Section 321", "UK HMRC Low Value"
    customs_complexity_score: int  # 1 (lowest friction) to 10 (highest friction)
    estimated_duty_rate: str
    entry_friction_rank: int  # 1 = easiest to expand into first
    recommendation_summary: str


class AuditResponse(BaseModel):
    inspection_id: str
    listing_id: str
    timestamp_utc: str
    rule_engine_version: str
    compliance_hash: str
    prev_hash: str
    overall_verdict: str  # COMPLIANT, REMEDIATION_REQUIRED, IMPORT_PROHIBITED, ESCALATION_REQUIRED
    destination_markets: List[str]
    extracted_attributes: ExtractedAttributes
    matrix: Dict[str, List[ComplianceCheckResult]]  # country_code -> list of results
    summary_by_country: Dict[str, Dict[str, int]]  # country_code -> {pass: X, warning: Y, violation: Z, escalation: W}
    debate: Optional[AdversarialDebateResult] = None
    remediation: Optional[RemediationResult] = None
    trade_economics: List[TradeEconomicsItem] = []
    citations: List[str] = []
    is_hash_valid: bool = True
