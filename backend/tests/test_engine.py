"""
LexPort — Unit Tests for Deterministic Rule Engine & Classification Mismatch
Tests known real-world failure cases against curated rule bases.
"""
from __future__ import annotations
import pytest
from backend.core.models import ExtractedAttributes
from backend.modules.rule_engine.deterministic_engine import DeterministicRuleEngine
from backend.modules.agents.classification_mismatch import ClassificationMismatchDetector
from backend.modules.economics.trade_advisor import TradeEconomicsAdvisor


@pytest.fixture
def engine():
    return DeterministicRuleEngine()


@pytest.fixture
def mismatch_detector():
    return ClassificationMismatchDetector()


@pytest.fixture
def economics_advisor():
    return TradeEconomicsAdvisor()


def test_us_epa_pesticide_trigger(engine, mismatch_detector):
    """Verifies that antibacterial claims on cutting boards trigger US EPA FIFRA pesticide violation."""
    extracted = ExtractedAttributes(
        category="kitchenware",
        subcategory="cutting_boards",
        intended_age="adult",
        power_source="none",
        claims=["antibacterial", "kills 99.9% germs"],
        inferred_hs_code="4419.90"
    )
    text = "Organic bamboo cutting board with antibacterial protection that kills 99.9% of bacteria and germs."

    results = engine.evaluate("US", extracted, text)
    epa_rule = next((r for r in results if r.check_code == "US-CLASS-01"), None)

    assert epa_rule is not None
    assert epa_rule.status == "violation"
    assert "FIFRA" in epa_rule.rule_citation

    # Check dedicated Layer 1b mismatch detector
    mismatches = mismatch_detector.detect_mismatches(extracted, text, ["US", "UK"])
    assert any(m.check_code == "MISMATCH-EPA-PESTICIDE" for m in mismatches)


def test_canada_baby_walker_criminal_ban(engine, mismatch_detector):
    """Verifies that baby walkers trigger an absolute ban in Canada under CCPSA Schedule 2."""
    extracted = ExtractedAttributes(
        category="toys",
        subcategory="baby_walker",
        intended_age="infant_0_3",
        power_source="none",
        claims=["swivel wheels for walking"],
        inferred_hs_code="9503.00"
    )
    text = "Foldable activity baby walker with swivel rolling wheels for infants."

    ca_results = engine.evaluate("CA", extracted, text)
    ca_ban = next((r for r in ca_results if r.check_code == "CA-BAN-01"), None)

    assert ca_ban is not None
    assert ca_ban.status == "violation"
    assert "Schedule 2" in ca_ban.rule_citation

    # Check Layer 1b mismatch
    mismatches = mismatch_detector.detect_mismatches(extracted, text, ["CA", "US", "UK"])
    assert any(m.check_code == "MISMATCH-CA-WALKER-BAN" for m in mismatches)


def test_us_fda_unapproved_drug_claim(engine):
    """Verifies that 'cures arthritis' triggers US FDA Section 505 unapproved drug violation."""
    extracted = ExtractedAttributes(
        category="cosmetics",
        subcategory="pain_cream",
        intended_age="adult",
        power_source="none",
        claims=["cures arthritis", "eliminates pain"],
        inferred_hs_code="3304.99"
    )
    text = "Ayurvedic herbal cream that cures arthritis pain and heals chronic inflammation."

    us_results = engine.evaluate("US", extracted, text)
    drug_rule = next((r for r in us_results if r.check_code == "US-CLAIM-01"), None)

    assert drug_rule is not None
    assert drug_rule.status == "violation"
    assert "321(g)" in drug_rule.rule_citation


def test_eu_hydrogen_peroxide_cap(engine):
    """Verifies that hydrogen peroxide over 0.1% violates EU cosmetic limits."""
    extracted = ExtractedAttributes(
        category="cosmetics",
        subcategory="teeth_whitening",
        intended_age="adult",
        power_source="none",
        chemical_concentrations={"hydrogen peroxide": 10.0},
        inferred_hs_code="3306.90"
    )
    text = "Teeth whitening kit containing 10% hydrogen peroxide formula."

    eu_results = engine.evaluate("EU", extracted, text)
    peroxide_rule = next((r for r in eu_results if r.check_code == "EU-ING-01"), None)

    assert peroxide_rule is not None
    assert peroxide_rule.status == "violation"
    assert "1223/2009" in peroxide_rule.rule_citation


def test_trade_economics_ranking(economics_advisor):
    """Verifies that US ranks #1 due to $800 de minimis while Canada ranks #5 due to $20 threshold."""
    ranked = economics_advisor.evaluate_markets(["US", "EU", "UK", "CA", "JP"], product_price_usd=29.99)
    assert len(ranked) == 5
    assert ranked[0].country_code == "US"
    assert ranked[0].entry_friction_rank == 1
    assert ranked[-1].country_code == "CA"
    assert ranked[-1].entry_friction_rank == 5
