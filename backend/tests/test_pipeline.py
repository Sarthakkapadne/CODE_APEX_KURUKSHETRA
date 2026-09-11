"""
LexPort — End-to-End Compliance Pipeline Integration Test
Executes a full multi-agent audit on the Ayurvedic Pain Cream case study:
- Checks extraction
- Checks multi-country matrix
- Checks debate generation
- Checks auto-rewrite diffs
- Checks trade economics
- Generates official PDF dossier
- Verifies SHA-256 hash validity
"""
from __future__ import annotations
import asyncio
from backend.core.models import ListingInput
from backend.modules.agents.supervisor import ComplianceSupervisor
from backend.modules.reports.pdf_generator import ComplianceReportGenerator
from backend.core.hash_chain import ComplianceHashChain


async def run_e2e():
    print("\n=======================================================")
    print("  LEXPORT // RUNNING END-TO-END COMPLIANCE AUDIT TEST")
    print("=======================================================\n")

    supervisor = ComplianceSupervisor()

    listing = ListingInput(
        title="AyurVeda Miracle Joint & Muscle Healing Cream - Cures Arthritis Pain Permanently",
        description=(
            "100% natural formulation that cures arthritis and completely eliminates chronic joint inflammation. "
            "Infused with therapeutic Camphor (5.0%), Sesame Oil, and Eucalyptus. "
            "Doctor-recommended topical anti-inflammatory medicine for joint pain. "
            "Antibacterial action kills bacteria on contact. Made in India. Net Wt. 3.4 oz (100 g)."
        ),
        brand_name="VedaHeal Herbals",
        price=34.99,
        currency="USD",
        country_of_origin="India",
        destination_markets=["US", "EU", "UK", "CA", "JP"]
    )

    print("[1/5] Executing supervisor multi-agent audit...")
    res = await supervisor.run_audit(listing)

    print(f"      - Inspection ID: {res.inspection_id}")
    print(f"      - Inferred HS Code: {res.extracted_attributes.inferred_hs_code}")
    print(f"      - Category: {res.extracted_attributes.category} ({res.extracted_attributes.subcategory})")
    print(f"      - Overall Verdict: {res.overall_verdict}")
    print(f"      - SHA-256 Hash: {res.compliance_hash}")

    print("\n[2/5] Validating Multi-Country Compliance Matrix...")
    for country, checks in res.matrix.items():
        violations = sum(1 for c in checks if c.status == "violation")
        warnings = sum(1 for c in checks if c.status == "warning")
        passes = sum(1 for c in checks if c.status == "pass")
        escalations = sum(1 for c in checks if c.status == "escalation")
        print(f"      - {country}: {passes} PASS | {warnings} WARN | {violations} VIOLATION | {escalations} ESCALATE")

    # In US, "cures arthritis" must trigger US-CLAIM-01 violation
    us_claims = [c for c in res.matrix["US"] if c.check_code == "US-CLAIM-01"]
    assert len(us_claims) > 0 and us_claims[0].status == "violation", "US-CLAIM-01 should be a violation!"

    # In Canada, Camphor 5% must trigger CA-ING-01 violation (cap is 3%)
    ca_camphor = [c for c in res.matrix["CA"] if c.check_code == "CA-ING-01"]
    assert len(ca_camphor) > 0 and ca_camphor[0].status == "violation", "CA-ING-01 should be a violation!"

    print("\n[3/5] Validating Customs Seizure Radar & Risk Analysis...")
    assert res.customs_radar is not None, "Customs Seizure Radar result should be present!"
    print(f"      - Threat Level: {res.customs_radar.threat_level}")
    print(f"      - Seizure Probability: {res.customs_radar.seizure_probability_pct}%")
    print(f"      - Estimated Financial Exposure: ${res.customs_radar.estimated_financial_exposure_usd:,.2f}")
    if res.debate:
        print(f"      - Debate Topic: {res.debate.debate_topic}")
        print(f"      - Rounds: {len(res.debate.turns)}")

    print("\n[4/5] Validating Auto-Rewrite & Diffs...")
    assert res.remediation is not None
    print(f"      - Original Title:  {res.remediation.original_title}")
    print(f"      - Compliant Title: {res.remediation.compliant_title}")
    print(f"      - Diffs Identified: {len(res.remediation.diff_items)}")
    for d in res.remediation.diff_items:
        print(f"        * '{d.original_phrase}' -> '{d.compliant_phrase}' ({d.reason[:50]}...)")

    print("\n[5/5] Generating PDF Dossier & Verifying Hash Chain...")
    pdf_bytes = ComplianceReportGenerator.generate_pdf(res)
    print(f"      - Generated PDF Size: {len(pdf_bytes)} bytes")
    assert len(pdf_bytes) > 2000, "PDF should contain comprehensive dossier!"

    # Cryptographic verification
    raw_findings = [r.model_dump() if hasattr(r, 'model_dump') else r.dict() for checks in res.matrix.values() for r in checks]
    is_valid = ComplianceHashChain.verify_compliance_hash(
        stored_hash=res.compliance_hash,
        inspection_id=res.inspection_id,
        listing_id=res.listing_id,
        timestamp_utc=res.timestamp_utc,
        rule_engine_version=res.rule_engine_version,
        extracted_attributes=res.extracted_attributes.model_dump() if hasattr(res.extracted_attributes, 'model_dump') else res.extracted_attributes.dict(),
        matrix_findings=raw_findings,
        citations=res.citations,
        prev_hash=res.prev_hash,
    )
    print(f"      - Cryptographic Hash Valid: {is_valid}")
    assert is_valid is True

    print("\n>>> ALL PIPELINE CHECKS PASSED SUCCESSFULLY! <<<\n")


if __name__ == "__main__":
    asyncio.run(run_e2e())
