"""
End-to-End Verification Test for Compliance Confidence Meter & Dependency Graph
"""
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_full_pipeline():
    # 1. Test POST /compliance/confidence
    mock_audit = {
        "inspection_id": "test_e2e_insp_999",
        "title": "Ayurvedic Turmeric Glow Herbal Face Cream 50g",
        "brand_name": "VedaAura",
        "country_of_origin": "India",
        "destination_markets": ["US", "EU", "CA"],
        "extracted_attributes": {
            "category": "Cosmetics",
            "ingredients": ["Curcuma Longa Root Extract", "Sandalwood Oil", "Aqua", "Glycerin"],
            "marketing_claims": ["Miraculous cure for eczema and psoriasis within 2 days."],
            "contains_battery": False
        },
        "matrix": {
            "US": [
                {"rule_code": "FDA_MOCRA_SAFE", "status": "pass", "statute_citation": "FD&C Act § 607"},
                {"rule_code": "FDA_UNAPPROVED_NEW_DRUG", "status": "violation", "statute_citation": "21 U.S.C. § 321(g)(1)"}
            ],
            "EU": [
                {"rule_code": "EU_COSMETICS_1223", "status": "pass", "statute_citation": "EC 1223/2009"},
                {"rule_code": "EU_SAFETY_ASSESSOR", "status": "warning", "statute_citation": "Article 10 EC 1223/2009"}
            ]
        },
        "required_documents": [
            {
                "doc_code": "ISO_HEAVY_METALS_TEST",
                "doc_name": "ISO 17025 Heavy Metal & Microbial Assay",
                "country_code": "US",
                "is_mandatory": True,
                "seller_status": "pending_upload"
            },
            {
                "doc_code": "EU_CPNP_REG",
                "doc_name": "EU Cosmetic Product Notification Portal (CPNP)",
                "country_code": "EU",
                "is_mandatory": True,
                "seller_status": "verified"
            }
        ]
    }

    res = client.post(
        "/compliance/confidence",
        json={
            "audit_data": mock_audit,
            "target_market": "ALL",
            "simulated_resolved_ids": []
        }
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()

    print("\n[E2E 1] Live Confidence Evaluation:")
    print(f"  Confidence Score: {data['confidence_score']}%")
    print(f"  Tier: {data['confidence_tier']} ({data['confidence_label']})")
    print(f"  Verdict: {data['verdict_summary']}")
    print("  Factors:")
    for fkey, fval in data["factors"].items():
        print(f"    - {fval['name']}: {fval['score']}% (weighted: {fval['weighted_score']} pts)")
    
    print(f"  Graph Nodes: {len(data['graph']['nodes'])}, Edges: {len(data['graph']['edges'])}")
    print(f"  Dependency Health: {data['graph']['dependency_health_score']}%")
    
    top_action = data["impact_analysis"]["top_recommended_action"]
    assert top_action is not None, "Top recommended action should not be None"
    print(f"  Top Action: {top_action['title']}")
    print(f"  Potential Score Gain: +{top_action['confidence_gain_pct']}%")
    print(f"  Downstream Unlocked: {top_action['downstream_nodes_unlocked']} nodes")

    # 2. Test POST /compliance/confidence/simulate
    sim_res = client.post(
        "/compliance/confidence/simulate",
        json={
            "audit_data": mock_audit,
            "target_market": "ALL",
            "resolved_node_ids": [top_action["node_id"]]
        }
    )
    assert sim_res.status_code == 200
    sim_result = sim_res.json()

    print("\n[E2E 2] Simulated Resolution Test:")
    print(f"  Original Score: {data['confidence_score']}%")
    print(f"  Simulated Score: {sim_result['confidence_score']}%")
    diff = round(sim_result['confidence_score'] - data['confidence_score'], 1)
    print(f"  Actual Gain: +{diff}%")
    assert sim_result['confidence_score'] > data['confidence_score'], "Simulated score must be higher"

    # 3. Test GET /api/products/{product_id}/compliance-confidence
    get_res = client.get("/api/products/test_e2e_insp_999/compliance-confidence")
    assert get_res.status_code == 200
    get_data = get_res.json()
    print("\n[E2E 3] GET /api/products/{id}/compliance-confidence:")
    print(f"  Product ID: {get_data['product_id']}")
    print(f"  Confidence Score: {get_data['confidence_score']}%")

    print("\n>>> ALL E2E VERIFICATIONS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_full_pipeline()
