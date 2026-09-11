"""
LexPort — Customs Seizure Risk Radar & Notice of Action Generator
Replaces theoretical debate with realistic port-of-entry customs enforcement intelligence.
Calculates:
  - Seizure Probability Index (0 - 100%)
  - Multi-Agency Border Detention Triggers (CBP, FDA, CBSA, EU RAPEX, UK OPSS)
  - Financial Penalty Exposure (Inventory at risk + Demurrage + Civil Fines under 19 U.S.C. § 1592)
  - Simulated Government Detention Notice (CBP Form 29 / CBSA Form E635)
"""
from __future__ import annotations
import uuid
from typing import List, Dict, Any, Optional

from backend.core.models import (
    ListingInput, ExtractedAttributes, ComplianceCheckResult,
    CustomsSeizureRadarResult, CBPNoticeOfAction
)


class CustomsRiskRadar:
    """
    Simulates Port-of-Entry Customs Border Control and calculates real enforcement risk.
    """

    def evaluate_seizure_risk(
        self,
        listing: ListingInput,
        extracted: ExtractedAttributes,
        violations: List[ComplianceCheckResult],
        target_markets: List[str]
    ) -> CustomsSeizureRadarResult:
        price = float(listing.price or 29.99)
        shipment_units = 1000  # Standard commercial cross-border pilot batch
        inventory_value = round(price * shipment_units, 2)

        # 1. Calculate Seizure Probability & Identify Primary Detention Triggers
        triggers: List[str] = []
        agencies: set[str] = set()
        score = 2.0  # Base customs baseline inspection friction

        has_critical_violation = False
        has_medical_claim = False
        has_epa_trigger = False
        has_battery_hazard = False
        has_banned_substance = False

        for v in violations:
            if v.status == "violation":
                has_critical_violation = True
                if "CLAIM" in v.check_code:
                    has_medical_claim = True
                    score += 28.0
                    triggers.append(f"[{v.country_code}] Unapproved Therapeutic Claim: {v.extracted_value} ({v.rule_citation})")
                    if v.country_code == "US":
                        agencies.add("US Customs & Border Protection (CBP)")
                        agencies.add("US FDA Office of Regulatory Affairs (ORA)")
                    elif v.country_code == "CA":
                        agencies.add("Health Canada Inspectorate")
                        agencies.add("Canada Border Services Agency (CBSA)")

                elif "ING" in v.check_code or "BAN" in v.check_code:
                    has_banned_substance = True
                    score += 35.0
                    triggers.append(f"[{v.country_code}] Prohibited Substance/Concentration: {v.extracted_value} ({v.rule_citation})")
                    if v.country_code == "CA":
                        agencies.add("Health Canada Cosmetic Unit")
                    elif v.country_code == "EU":
                        agencies.add("EU Market Surveillance (RAPEX)")

                elif "PEST" in v.check_code or "EPA" in v.check_code:
                    has_epa_trigger = True
                    score += 24.0
                    triggers.append(f"[{v.country_code}] Unregistered Antimicrobial Pesticide Trigger ({v.rule_citation})")
                    agencies.add("US EPA Import Surveillance Division")

                elif "LBL" in v.check_code:
                    score += 12.0
                    triggers.append(f"[{v.country_code}] Mandatory Labeling Omission: {v.expected_requirement} ({v.rule_citation})")

            elif v.status == "escalation":
                score += 15.0
                triggers.append(f"[{v.country_code}] Mandatory Lab Safety/Ungating Hold: {v.check_code}")
                if "HAZ" in v.check_code or extracted.has_battery:
                    has_battery_hazard = True
                    score += 18.0
                    triggers.append("FAA / IATA Lithium Battery Hazmat Safety Hold (Missing UN 38.3 test summary)")
                    agencies.add("US DOT / FAA Dangerous Goods Office")

        # Market-specific default border authorities
        if "US" in target_markets:
            agencies.add("US Customs & Border Protection (CBP)")
        if "EU" in target_markets:
            agencies.add("EU Customs Union (DG TAXUD)")
        if "CA" in target_markets:
            agencies.add("Canada Border Services Agency (CBSA)")
        if "UK" in target_markets:
            agencies.add("UK Border Force / HMRC")
        if "JP" in target_markets:
            agencies.add("Japan Customs Bureau / PMDA")

        # Cap probability between 1.5% (clean) and 98.5% (blatant prohibited)
        seizure_probability = min(max(round(score, 1), 1.5), 98.5)

        # 2. Assign Threat Level
        if seizure_probability >= 60.0:
            threat_level = "CRITICAL_SEIZURE_RISK"
        elif seizure_probability >= 40.0:
            threat_level = "ELEVATED_DETENTION_RISK"
        elif seizure_probability >= 20.0:
            threat_level = "MODERATE_CUSTOMS_HOLD"
        else:
            threat_level = "LOW_FRICTION_CLEAR"

        # 3. Calculate Financial Exposure (Inventory + Demurrage + Civil Fines)
        # Port demurrage: $150 per day for 14-day mandatory detention quarantine
        demurrage_est = 2100.0 if seizure_probability >= 30.0 else 0.0
        
        # CBP Civil Penalties under 19 U.S.C. § 1592
        if threat_level == "CRITICAL_SEIZURE_RISK":
            cbp_penalties_est = 15000.0
        elif threat_level == "ELEVATED_DETENTION_RISK":
            cbp_penalties_est = 5000.0
        elif threat_level == "MODERATE_CUSTOMS_HOLD":
            cbp_penalties_est = 1500.0
        else:
            cbp_penalties_est = 0.0

        total_financial_exposure = round(inventory_value + demurrage_est + cbp_penalties_est, 2)

        # 4. Synthesize Authentic Simulated Government Notice (CBP Form 29 or CBSA E635)
        simulated_notice = None
        if threat_level in ["CRITICAL_SEIZURE_RISK", "ELEVATED_DETENTION_RISK"]:
            notice_num = uuid.uuid4().hex[:8].upper()
            if "CA" in target_markets and has_banned_substance:
                simulated_notice = CBPNoticeOfAction(
                    notice_id=f"CBSA-E635-{notice_num}",
                    form_type="CBSA Form E635 (Notice of Commercial Goods Detention)",
                    issuing_port="Port of Toronto Pearson International (CBSA Code 0497)",
                    issuing_officer="Senior Border Commercial Inspector #8142",
                    target_consignee=listing.brand_name or "Commercial Importer of Record",
                    action_type="DETENTION_HOLD",
                    grounds_for_action=(
                        "Goods detained pursuant to Section 101 of the Customs Act and Health Canada CCPSA "
                        "due to presence of prohibited substances on the Cosmetic Ingredient Hotlist and absence of bilingual French labeling."
                    ),
                    cited_statutes=[
                        "Canada Customs Act (R.S.C., 1985, c. 1 (2nd Supp.)) s. 101",
                        "Health Canada Cosmetic Ingredient Hotlist (Item: Camphor/Peroxide)",
                        "Consumer Packaging and Labelling Act (R.S.C., 1985, c. C-38) Section 6"
                    ],
                    response_deadline_days=30,
                    estimated_civil_penalty_usd=cbp_penalties_est,
                    potential_forfeiture_risk="Destruction of shipment at importer's expense or mandatory re-export within 30 days."
                )
            else:
                simulated_notice = CBPNoticeOfAction(
                    notice_id=f"CBP-29-LAX-{notice_num}",
                    form_type="CBP Form 29 (Notice of Action - Proposed Detention & Seizure)",
                    issuing_port="Port of Los Angeles/Long Beach (CBP Port Code 2704)",
                    issuing_officer="Customs Import Specialist Team 412 (Consumer Products/Health Branch)",
                    target_consignee=listing.brand_name or "Commercial Importer of Record",
                    action_type="PROPOSED_SEIZURE",
                    grounds_for_action=(
                        "Physical examination and paperwork audit indicate product is misbranded and subject to detention under "
                        "19 U.S.C. § 1595a(c) and 21 U.S.C. § 352. Product claims unapproved drug-level therapeutic efficacy and/or "
                        "lacks required EPA pesticide establishment numbers / Section 321 de minimis disqualification."
                    ),
                    cited_statutes=[
                        "19 U.S.C. § 1592 (Penalties for Fraud, Gross Negligence, and Negligence)",
                        "19 U.S.C. § 1595a(c) (Aiding Unlawful Importation)",
                        "21 U.S.C. § 352(f) (Misbranded Drugs / Devices Without Adequate Directions)",
                        "19 C.F.R. § 134.11 (Country of Origin Marking Mandate)"
                    ],
                    response_deadline_days=20,
                    estimated_civil_penalty_usd=cbp_penalties_est,
                    potential_forfeiture_risk="Immediate transfer to General Order warehouse followed by forfeiture and destruction."
                )

        # 5. Directives to Neutralize Seizure
        directives = []
        if has_medical_claim:
            directives.append("Replace disease/cure claims with structure/function cosmetic wellness phrasing.")
        if has_banned_substance:
            directives.append("Reformulate concentration or restrict sales to eligible non-prohibited jurisdictions.")
        if has_epa_trigger:
            directives.append("Remove antimicrobial/antibacterial pesticide triggers from title and bullet copy.")
        if has_battery_hazard:
            directives.append("Upload UN 38.3 Lithium Battery Test Summary and Watt-hour compliance label.")
        if not directives:
            directives.append("Listing is pre-cleared for physical customs clearance. Ensure Bill of Lading matches HTS code.")

        return CustomsSeizureRadarResult(
            seizure_probability_pct=seizure_probability,
            threat_level=threat_level,
            primary_detention_triggers=triggers[:6],
            estimated_financial_exposure_usd=total_financial_exposure,
            breakdown_fees={
                "inventory_risk_usd": inventory_value,
                "port_demurrage_quarantine_usd": demurrage_est,
                "statutory_civil_penalties_usd": cbp_penalties_est
            },
            target_enforcement_agencies=sorted(list(agencies)),
            simulated_notice=simulated_notice,
            seizure_avoidance_directives=directives
        )
