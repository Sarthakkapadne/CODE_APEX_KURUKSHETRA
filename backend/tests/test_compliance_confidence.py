"""
Unit tests for Compliance Confidence & Dependency Graph Engine
Verifies 4-factor formula, downstream propagation, impact ranking, and simulation.
"""
import pytest
from backend.services.compliance_confidence import ComplianceConfidenceService


@pytest.fixture
def mock_audit_payload():
    return {
        "inspection_id": "test_insp_123",
        "title": "Natural Vitamin C Face Serum 50ml",
        "brand_name": "OrganicAura",
        "country_of_origin": "India",
        "destination_markets": ["US", "EU"],
        "extracted_attributes": {
            "category": "Cosmetics",
            "ingredients": ["Water", "Ascorbic Acid", "Hyaluronic Acid"],
            "marketing_claims": ["100% natural, reduces dark spots"],
            "contains_battery": False,
        },
        "matrix": {
            "US": [
                {"rule_code": "US_MOCRA_SAFE", "status": "pass", "statute_citation": "FD&C Act § 607"},
                {"rule_code": "US_LABEL_INCI", "status": "pass", "statute_citation": "21 CFR § 701.3"},
            ],
            "EU": [
                {"rule_code": "EU_COSMETICS_1223", "status": "pass", "statute_citation": "EC 1223/2009"},
                {"rule_code": "EU_RESPONSIBLE_PERSON", "status": "warning", "statute_citation": "Article 4 EC 1223/2009"},
            ],
        },
        "required_documents": [
            {
                "doc_code": "LAB_MICROBIAL_ASSAY",
                "doc_name": "ISO 17025 Microbial Contamination Assay",
                "country_code": "US",
                "is_mandatory": True,
                "seller_status": "pending_upload",
            },
            {
                "doc_code": "EU_PIF_DOSSIER",
                "doc_name": "Product Information File (PIF)",
                "country_code": "EU",
                "is_mandatory": True,
                "seller_status": "verified",
            },
        ],
    }


def test_confidence_formula_calculation(mock_audit_payload):
    service = ComplianceConfidenceService()
    res = service.calculate_confidence(mock_audit_payload)

    assert 0.0 <= res.confidence_score <= 100.0
    assert res.confidence_tier in ("HIGH", "MEDIUM", "LOW")
    assert res.factors.rule_coverage.weight == 0.30
    assert res.factors.evidence_verification.weight == 0.30
    assert res.factors.product_data_completeness.weight == 0.20
    assert res.factors.dependency_health.weight == 0.20

    # Composite score sum check
    expected = round(
        (res.factors.rule_coverage.score * 0.30)
        + (res.factors.evidence_verification.score * 0.30)
        + (res.factors.product_data_completeness.score * 0.20)
        + (res.factors.dependency_health.score * 0.20),
        1,
    )
    assert abs(res.confidence_score - expected) < 0.2


def test_downstream_dependency_propagation(mock_audit_payload):
    service = ComplianceConfidenceService()
    res = service.calculate_confidence(mock_audit_payload)

    # Missing doc should exist
    missing_doc = next((n for n in res.graph.nodes if n.type == "document" and n.status == "missing"), None)
    assert missing_doc is not None

    # Edges should reflect state
    blocked_edges = [e for e in res.graph.edges if e.status == "blocked"]
    assert len(blocked_edges) > 0


def test_interactive_simulation_mode(mock_audit_payload):
    service = ComplianceConfidenceService()
    base_res = service.calculate_confidence(mock_audit_payload)

    # Simulate resolving the missing lab assay
    sim_res = service.calculate_confidence(
        mock_audit_payload,
        simulated_resolved_ids=["node_doc_LAB_MICROBIAL_ASSAY"],
    )

    assert sim_res.is_simulated is True
    assert sim_res.confidence_score > base_res.confidence_score
    assert sim_res.factors.evidence_verification.score >= base_res.factors.evidence_verification.score


def test_impact_analysis_ranking(mock_audit_payload):
    service = ComplianceConfidenceService()
    res = service.calculate_confidence(mock_audit_payload)

    assert res.impact_analysis.top_recommended_action is not None
    assert res.impact_analysis.top_recommended_action.confidence_gain_pct > 0
    assert len(res.impact_analysis.top_score_reducers) > 0


def test_consumer_electronics_eu_scenario():
    """
    Verifies user-specified scenario:
    Product: Consumer Electronic Product | Market: European Union
    Rules Identified: 100% | Product Information: 90% | Evidence: 60% | Dependency Health: 65%
    Initial Confidence: ~72%
    Missing: Safety Test Report
    Impact: 3 requirements affected, GPSR compliance partially blocked
    Recommended Action: Upload Safety Test Report
    Simulation: 72% -> 84% (+12% gain)
    """
    service = ComplianceConfidenceService()

    electronic_audit = {
        "inspection_id": "insp_ce_eu_001",
        "title": "Consumer Electronic Product",
        "description": "High-precision rechargeable thermal sonic device with ergonomic aluminum body, USB-C input, and comprehensive user safety manual.",
        "brand_name": "AuraTech",
        "country_of_origin": "Japan",
        "destination_markets": ["EU"],
        "category": "Consumer Electronics",
        "extracted_attributes": {
            "category": "Consumer Electronics",
            "detected_product_type": "Consumer Electronic Product",
            "materials": ["ABS Polycarbonate", "Copper PCB", "Silicon"],
            "contains_battery": True,
            "battery_type": "Lithium-Ion 800mAh",
        },
        "matrix": {
            "EU": [
                {
                    "rule_code": "EU_GPSR_SAFETY",
                    "statute_citation": "Regulation (EU) 2023/988 (GPSR) / LVD 2014/35/EU",
                    "status": "warning",
                    "explanation": "GPSR compliance partially blocked: Missing Safety Test Report.",
                },
                {
                    "rule_code": "EU_ROHS_DIRECTIVE",
                    "statute_citation": "Directive 2011/65/EU (RoHS)",
                    "status": "pass",
                    "explanation": "RoHS hazardous substances limits compliant.",
                },
            ]
        },
        "required_documents": [
            {
                "doc_code": "SAFETY_TEST_REPORT",
                "doc_name": "Safety Test Report",
                "country_code": "EU",
                "is_mandatory": True,
                "seller_status": "pending_upload",
                "seller_action_needed": "Upload Safety Test Report (EN 62368-1 / LVD).",
            },
            {
                "doc_code": "EU_RP_MANDATE",
                "doc_name": "EU Responsible Person Mandate",
                "country_code": "EU",
                "is_mandatory": True,
                "seller_status": "verified",
            },
            {
                "doc_code": "WEEE_REGISTRATION",
                "doc_name": "WEEE National Registry Filing",
                "country_code": "EU",
                "is_mandatory": True,
                "seller_status": "verified",
            },
            {
                "doc_code": "ROHS_DECLARATION",
                "doc_name": "RoHS Substance Declaration",
                "country_code": "EU",
                "is_mandatory": True,
                "seller_status": "verified",
            },
            {
                "doc_code": "UN383_BATTERY_SUMMARY",
                "doc_name": "UN 38.3 Lithium Battery Test Summary",
                "country_code": "EU",
                "is_mandatory": False,
                "seller_status": "pending_upload",
            },
        ],
    }

    res = service.calculate_confidence(electronic_audit, target_market="EU")

    # 1. Verify factors
    assert res.factors.product_data_completeness.score == 90.0
    assert res.factors.evidence_verification.score == 60.0
    assert res.factors.dependency_health.score == 65.0
    assert 70.0 <= res.confidence_score <= 74.0  # approximately 72%

    # 2. Verify missing document
    missing_docs = [n.label for n in res.graph.nodes if n.type == "document" and n.status == "missing"]
    assert "Safety Test Report" in missing_docs

    # 3. Verify impact: 3 requirements affected & GPSR compliance partially blocked
    req_affected = [n for n in res.graph.nodes if n.type == "requirement" and n.status == "blocked"]
    assert len(req_affected) == 3

    reg_blocked = [n for n in res.graph.nodes if n.type == "regulation" and n.status == "partial"]
    assert any("GPSR" in r.label or "GPSR" in r.description for r in reg_blocked)

    # 4. Verify recommended action
    top_action = res.impact_analysis.top_recommended_action
    assert top_action is not None
    assert "Safety Test Report" in top_action.title

    # 5. Verify simulation
    sim_res = service.calculate_confidence(
        electronic_audit,
        target_market="EU",
        simulated_resolved_ids=["node_doc_safety_test_report"],
    )
    assert sim_res.confidence_score >= 80.0

