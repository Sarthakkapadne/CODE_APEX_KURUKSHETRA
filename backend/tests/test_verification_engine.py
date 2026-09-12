import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.modules.rule_engine.verification_engine import (
    RuleVerificationEngine,
    ProductVerificationInput,
    DocumentEvidenceItem,
)


@pytest.fixture
def engine():
    return RuleVerificationEngine()


@pytest.fixture
def client():
    return TestClient(app)


def test_rule_verification_speaker_missing_responsible_person(engine):
    product = ProductVerificationInput(
        product_name="Wireless Bluetooth Speaker",
        category="consumer electronics",
        target_market="EU",
        manufacturer_name="SoundWave Ltd",
        country_of_origin="China",
        contains_battery=True,
        documents=[
            DocumentEvidenceItem(
                type="test_report",
                name="Safety Test Report",
                status="provided",
                standards=["EN 62368-1"],
            )
        ],
    )

    res = engine.verify_product(product)
    assert res.target_market == "EU"
    assert res.summary.total_applicable_rules >= 2
    assert res.summary.missing_information >= 1
    assert res.overall_status == "NEEDS_ACTION"
    assert len(res.next_best_actions) >= 1

    for rule_res in res.rule_results:
        assert len(rule_res.decision_trace) == 5
        step_titles = [s.title for s in rule_res.decision_trace]
        assert step_titles == [
            "Product Data",
            "Rule Match",
            "Requirement Check",
            "Evidence Check",
            "Final Result",
        ]


def test_rule_verification_banned_claim_fails(engine):
    product = ProductVerificationInput(
        product_name="Ayurvedic Turmeric Glow Herbal Skin Relief Cream",
        category="cosmetics",
        target_market="US",
        marketing_claims=["Clinically proven miraculous cure for eczema and psoriasis"],
    )

    res = engine.verify_product(product)
    assert res.target_market == "US"
    assert res.summary.failed >= 1
    assert res.overall_status == "CRITICAL_FAILURE"
    failed_issues = [i for i in res.priority_issues if i.severity == "CRITICAL"]
    assert len(failed_issues) >= 1


def test_rule_verification_api_presets(client):
    response = client.get("/api/compliance/verify/presets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    ids = [p["id"] for p in data]
    assert "demo-speaker" in ids
    assert "demo-heated-wand" in ids


def test_rule_verification_api_verify(client):
    payload = {
        "product_name": "Consumer Electronic Product - Rechargeable Sonic Thermal Eye Wand",
        "category": "consumer electronics",
        "target_market": "EU",
        "contains_battery": True,
        "documents": [
            {
                "type": "test_report",
                "name": "Safety Test Report",
                "status": "missing",
            }
        ],
    }
    response = client.post("/api/compliance/verify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["target_market"] == "EU"
    assert "summary" in data
    assert data["summary"]["total_applicable_rules"] > 0
    assert "next_best_actions" in data
    assert "rule_results" in data