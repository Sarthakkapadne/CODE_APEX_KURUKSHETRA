"""
LexPort — Cryptographic Hash Chain Audit Trail Unit Tests
Tests tamper-evidence, canonicalization, and mathematical verification.
"""
from __future__ import annotations
from backend.core.hash_chain import ComplianceHashChain


def test_hash_chain_generation_and_verification():
    """Verifies that an unmodified inspection payload computes identical SHA-256 hash."""
    attrs = {
        "category": "cosmetics",
        "subcategory": "pain_cream",
        "intended_age": "adult",
        "power_source": "none",
        "has_battery": False,
        "battery_type": "none",
        "ingredients": ["sesame oil", "camphor"],
        "claims": ["soothes joints"],
        "inferred_hs_code": "3304.99",
    }
    findings = [
        {
            "country_code": "US",
            "category": "Claim Wording",
            "check_code": "US-CLAIM-01",
            "status": "pass",
            "rule_citation": "21 U.S.C. § 321(g)",
        }
    ]
    citations = ["21 U.S.C. § 321(g)"]

    hash_val = ComplianceHashChain.generate_compliance_hash(
        inspection_id="insp-001",
        listing_id="list-001",
        timestamp_utc="2026-09-11T12:00:00Z",
        rule_engine_version="LexPort-Rules-v2026.1",
        extracted_attributes=attrs,
        matrix_findings=findings,
        citations=citations,
        prev_hash="GENESIS",
    )

    assert len(hash_val) == 64  # SHA-256 is 64 hex characters

    # Verification must succeed
    is_valid = ComplianceHashChain.verify_compliance_hash(
        stored_hash=hash_val,
        inspection_id="insp-001",
        listing_id="list-001",
        timestamp_utc="2026-09-11T12:00:00Z",
        rule_engine_version="LexPort-Rules-v2026.1",
        extracted_attributes=attrs,
        matrix_findings=findings,
        citations=citations,
        prev_hash="GENESIS",
    )
    assert is_valid is True


def test_tamper_detection_on_single_character_alteration():
    """Verifies that tampering with even a single field or citation produces a tamper alert."""
    attrs = {
        "category": "cosmetics",
        "subcategory": "pain_cream",
        "intended_age": "adult",
        "power_source": "none",
        "has_battery": False,
        "battery_type": "none",
        "ingredients": ["sesame oil", "camphor"],
        "claims": ["soothes joints"],
        "inferred_hs_code": "3304.99",
    }
    findings = [
        {
            "country_code": "US",
            "category": "Claim Wording",
            "check_code": "US-CLAIM-01",
            "status": "pass",
            "rule_citation": "21 U.S.C. § 321(g)",
        }
    ]
    citations = ["21 U.S.C. § 321(g)"]

    legitimate_hash = ComplianceHashChain.generate_compliance_hash(
        inspection_id="insp-001",
        listing_id="list-001",
        timestamp_utc="2026-09-11T12:00:00Z",
        rule_engine_version="LexPort-Rules-v2026.1",
        extracted_attributes=attrs,
        matrix_findings=findings,
        citations=citations,
        prev_hash="GENESIS",
    )

    # TAMPER: change status from 'pass' to 'violation'
    tampered_findings = [
        {
            "country_code": "US",
            "category": "Claim Wording",
            "check_code": "US-CLAIM-01",
            "status": "violation",  # TAMPERED
            "rule_citation": "21 U.S.C. § 321(g)",
        }
    ]

    is_valid = ComplianceHashChain.verify_compliance_hash(
        stored_hash=legitimate_hash,
        inspection_id="insp-001",
        listing_id="list-001",
        timestamp_utc="2026-09-11T12:00:00Z",
        rule_engine_version="LexPort-Rules-v2026.1",
        extracted_attributes=attrs,
        matrix_findings=tampered_findings,
        citations=citations,
        prev_hash="GENESIS",
    )

    assert is_valid is False  # Tamper detected!
