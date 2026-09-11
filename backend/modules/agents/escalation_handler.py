"""
LexPort — Human Escalation Layer (Tier 3 Strict Non-Automation)
Enforces a strict architectural principle:
NEVER auto-resolve physical laboratory safety testing (1d), hazmat shipping documentation (1f),
marketplace ungating policies (Layer 2), or IP/grey-market distribution rights (Layer 3).

Surfaces explicit, transparent escalation items with required paperwork checklists.
This guarantees that LexPort never creates legal liability by giving false-positive green checkmarks.
"""
from __future__ import annotations
from typing import List, Dict, Any
from backend.core.models import ComplianceCheckResult, ExtractedAttributes


class EscalationHandler:
    """Manages explicit routing of non-textual compliance requirements to Human Review."""

    def identify_escalations(
        self,
        extracted: ExtractedAttributes,
        raw_text: str,
        target_markets: List[str]
    ) -> List[ComplianceCheckResult]:
        escalations: List[ComplianceCheckResult] = []
        lower = (raw_text or "").lower()

        # ── 1d: Laboratory Safety Testing & Certification (CE, CPC, ASTM, EN) ──
        if extracted.category == "toys" or "walker" in lower:
            for country in target_markets:
                if country == "US":
                    escalations.append(ComplianceCheckResult(
                        check_code="ESCALATE-US-CPC-TEST",
                        country_code="US",
                        category="Safety/Certifications",
                        status="escalation",
                        trust_tier="Tier 3 Escalation",
                        rule_citation="CPSIA Section 102 / 16 CFR Part 1110",
                        extracted_value="Children's product requires 3rd-party laboratory testing",
                        expected_requirement="Children's Product Certificate (CPC) from CPSC-accredited laboratory",
                        explanation="NON-AUTOMATED REQUIREMENT: Digital listing text cannot substitute for physical stair-fall testing under ASTM F977. Seller must retain test reports for 5 years.",
                        fix_suggestion="Commission accredited CPSC laboratory testing and issue CPC certificate."
                    ))
                elif country in ["EU", "UK"]:
                    std = "EN 1273:2020" if country == "EU" else "BS EN 1273:2020"
                    escalations.append(ComplianceCheckResult(
                        check_code=f"ESCALATE-{country}-SAFETY-TEST",
                        country_code=country,
                        category="Safety/Certifications",
                        status="escalation",
                        trust_tier="Tier 3 Escalation",
                        rule_citation=f"{std} / General Product Safety Directive",
                        extracted_value=f"Mandatory physical test file required ({std})",
                        expected_requirement=f"Declaration of Conformity + Accredited Lab Test Report to {std}",
                        explanation="NON-AUTOMATED REQUIREMENT: Requires physical stability and dynamic stair-step testing documentation.",
                        fix_suggestion="Upload laboratory test report demonstrating conformity to the applicable EN standard."
                    ))

        # ── 1f: Hazardous Materials & Battery Freight Logistics ──
        if extracted.has_battery or "lithium" in lower or "battery" in lower:
            for country in target_markets:
                escalations.append(ComplianceCheckResult(
                    check_code=f"ESCALATE-{country}-LITHIUM-DG",
                    country_code=country,
                    category="Hazmat/Shipping",
                    status="escalation",
                    trust_tier="Tier 3 Escalation",
                    rule_citation="UN Manual of Tests and Criteria Section 38.3 / IATA DGR",
                    extracted_value=f"Rechargeable Lithium-Ion Battery ({extracted.battery_type})",
                    expected_requirement="Manufacturer UN 38.3 Lithium Battery Test Summary",
                    explanation="NON-AUTOMATED HAZMAT REQUIREMENT: Lithium batteries shipped internationally via air freight must have a verified UN 38.3 test summary confirming thermal, altitude, and short-circuit test passage.",
                    fix_suggestion="Request UN 38.3 Test Summary from cell supplier and provide to freight forwarder."
                ))

        # ── Layer 2: Marketplace Platform Ungating Policies ──
        if "US" in target_markets:
            is_topical_or_supp = (
                extracted.category in ["cosmetics", "supplements"] or
                any(w in lower for w in ["skincare", "dietary supplement", "topical lotion", "face cream", "moisturizer", "serum", "capsules", "tablets"])
            ) and not any(w in lower for w in ["ice cream", "whipped cream", "cream color", "creamer", "shaving brush"])
            if is_topical_or_supp:
                escalations.append(ComplianceCheckResult(
                    check_code="ESCALATE-MKT-UNGATING",
                    country_code="US",
                    category="Safety/Certifications",
                    status="escalation",
                    trust_tier="Tier 3 Escalation",
                    rule_citation="Amazon Category Ungating Policy: Topical Skincare & Dietary Supplements",
                    extracted_value="Amazon Category Ungating Pre-Approval Required",
                    expected_requirement="Recent wholesale invoice, GMP certificate, and COA (Certificate of Analysis)",
                    explanation="MARKETPLACE POLICY: Even if 100% legally compliant with US law, Amazon requires pre-approval (category ungating) for topical skincare, demanding invoices from a verified distributor.",
                    fix_suggestion="Submit distributor invoice and GMP facility certification via Amazon Seller Central."
                ))

        # ── Layer 3: Intellectual Property & Regional Distribution Rights ──
        if "EU" in target_markets and any(brand in lower for brand in ["apple", "dyson", "nike", "samsung", "rolex"]):
            escalations.append(ComplianceCheckResult(
                check_code="ESCALATE-IP-RIGHTS",
                country_code="EU",
                category="Safety/Certifications",
                status="escalation",
                trust_tier="Tier 3 Escalation",
                rule_citation="EU Trademark Directive (Directive 2015/2436 / Silhouette Case)",
                extracted_value="Potential Parallel Import / Grey-Market Distribution Conflict",
                expected_requirement="Written Letter of Authorization (LOA) from brand owner for European territory",
                explanation="LEGAL ESCALATION: Under EU principle of regional trademark exhaustion, goods purchased outside the EEA cannot be resold within the EU without express trademark owner consent.",
                fix_suggestion="Obtain formal territorial distribution authorization from the brand owner."
            ))

        return escalations
