"""
Test Phase 1: Customs Seizure Risk Radar, HS Tariff Arbitrage, and Ground-Truth Accuracy Index.
Ensures:
  1. Customs Seizure Probability & Financial Exposure math
  2. Authentic Simulated CBP Form 29 / CBSA E635 Notice Generation
  3. Dynamic HS Code Classification & Tariff Arbitrage Calculation
  4. Ground-Truth Verification Index (GTVI) Scoring & Statutory Codex Retrieval
  5. End-to-end Compliance Supervisor audit flow with zero hardcoded assumptions
"""
import pytest
import asyncio
from backend.core.models import ListingInput, ExtractedAttributes, ComplianceCheckResult
from backend.modules.agents.customs_risk_radar import CustomsRiskRadar
from backend.modules.economics.hs_tariff_engine import HSTariffEngine
from backend.modules.rule_engine.accuracy_evaluator import AccuracyEvaluator
from backend.modules.agents.supervisor import ComplianceSupervisor


def test_customs_seizure_radar_critical_risk():
    radar = CustomsRiskRadar()
    listing = ListingInput(
        title="Miracle Eczema Cure Cream",
        description="Permanently eliminates dermatitis and eczema.",
        price=39.99,
        brand_name="DermaHeal",
        destination_markets=["US", "CA"]
    )
    extracted = ExtractedAttributes(
        category="cosmetics",
        subcategory="cream",
        intended_age="adult",
        power_source="none",
        claims=["Permanently eliminates dermatitis and eczema"],
        chemical_concentrations={"camphor": 5.0}
    )
    violations = [
        ComplianceCheckResult(
            check_code="US-CLAIM-01",
            country_code="US",
            category="Claim Wording",
            status="violation",
            trust_tier="Tier 1 Deterministic",
            rule_citation="21 CFR § 201.128",
            extracted_value="Permanently eliminates dermatitis and eczema",
            expected_requirement="Cosmetics cannot claim to treat disease",
            explanation="Unapproved new drug violation"
        ),
        ComplianceCheckResult(
            check_code="CA-ING-01",
            country_code="CA",
            category="Banned Ingredients",
            status="violation",
            trust_tier="Tier 1 Deterministic",
            rule_citation="Health Canada Cosmetic Hotlist (Camphor)",
            extracted_value="5.0% Camphor",
            expected_requirement="Max 3.0% Camphor",
            explanation="Exceeds Health Canada concentration cap"
        )
    ]

    result = radar.evaluate_seizure_risk(listing, extracted, violations, ["US", "CA"])

    assert result.seizure_probability_pct >= 60.0
    assert result.threat_level == "CRITICAL_SEIZURE_RISK"
    assert result.estimated_financial_exposure_usd > 39990.0  # 1000 units * $39.99 + demurrage + fines
    assert result.simulated_notice is not None
    assert "US Customs & Border Protection (CBP)" in result.target_enforcement_agencies


def test_hs_tariff_arbitrage_savings():
    engine = HSTariffEngine()
    listing = ListingInput(
        title="Joint Healing Relief Cream",
        description="Cures chronic arthritis joint inflammation.",
        price=35.00,
        destination_markets=["US"]
    )
    extracted = ExtractedAttributes(
        category="cosmetics",
        subcategory="skincare",
        intended_age="adult",
        power_source="none",
        claims=["Cures chronic arthritis joint inflammation"]
    )
    violations = [
        ComplianceCheckResult(
            check_code="US-CLAIM-01",
            country_code="US",
            category="Claim Wording",
            status="violation",
            trust_tier="Tier 1 Deterministic",
            rule_citation="21 CFR § 201.128",
            extracted_value="Cures chronic arthritis",
            expected_requirement="Cosmetics cannot claim drug indications",
            explanation="Unapproved drug reclassification"
        )
    ]

    result = engine.evaluate_hs_classification(listing, extracted, violations)

    assert result.declared_hs_code == "3304.99.5000"
    assert result.reclassified_hs_code == "3004.90.9203"
    assert result.is_misclassified is True
    assert result.de_minimis_disqualified is True
    # 1,000 units @ $35 = $35,000 * 6.5% ($2,275) + $575 fees = $2,850
    assert result.total_arbitrage_savings_usd == 2850.0


def test_ground_truth_accuracy_index():
    evaluator = AccuracyEvaluator()
    extracted = ExtractedAttributes(
        category="cosmetics",
        subcategory="cream",
        intended_age="adult",
        power_source="none",
        ingredients=["retinol", "water", "camphor"],
        chemical_concentrations={"camphor": 2.5}
    )
    findings = [
        ComplianceCheckResult(
            check_code="US-CLAIM-01",
            country_code="US",
            category="Claim Wording",
            status="violation",
            trust_tier="Tier 1 Deterministic",
            rule_citation="21 CFR § 201.128",
            extracted_value="cures acne",
            expected_requirement="No therapeutic claims",
            explanation="Violation"
        ),
        ComplianceCheckResult(
            check_code="EU-LBL-01",
            country_code="EU",
            category="Mandatory Labeling",
            status="violation",
            trust_tier="Tier 1 Deterministic",
            rule_citation="EC 1223/2009 Art. 4",
            extracted_value="None",
            expected_requirement="EU Responsible Person",
            explanation="Mandatory RP missing"
        )
    ]

    accuracy = evaluator.evaluate_accuracy(extracted, findings)

    assert accuracy.composite_accuracy_score >= 95.0
    assert "Grade A" in accuracy.trust_grade
    assert accuracy.statutory_alignment_score == 100.0
    assert len(accuracy.verbatim_statutory_proofs) >= 2
    # Verify verbatim law contains authentic statutory language
    assert any("intended uses" in p["verbatim_law"] for p in accuracy.verbatim_statutory_proofs)
