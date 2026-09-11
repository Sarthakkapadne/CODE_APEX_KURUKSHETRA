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
        price = float(listing.price or 25.00)
        shipment_units = 1000  # Standard commercial cross-border pilot batch
        inventory_value = round(price * shipment_units, 2)

        # Filter actual statutory violations and physical border safety escalations
        actual_violations = [v for v in violations if v.status == "violation"]
        safety_escalations = [
            v for v in violations
            if v.status == "escalation" and "MKT" not in v.check_code
        ]

        triggers: List[str] = []
        agencies: set[str] = set()
        score = 0.0

        has_medical_claim = False
        has_epa_trigger = False
        has_battery_hazard = False
        has_banned_substance = False

        # If product is 100% compliant across selected markets, baseline risk is clean 0.0%
        if not actual_violations and not safety_escalations:
            directives = [
                "Listing is pre-cleared for physical customs clearance. Ensure Bill of Lading matches HTS code."
            ]
            primary_agencies = [self._get_primary_agency(m) for m in target_markets[:2]]
            return CustomsSeizureRadarResult(
                seizure_probability_pct=0.0,
                threat_level="LOW_FRICTION_CLEAR",
                primary_detention_triggers=[],
                estimated_financial_exposure_usd=0.0,
                breakdown_fees={
                    "inventory_risk_usd": 0.0,
                    "port_demurrage_quarantine_usd": 0.0,
                    "statutory_civil_penalties_usd": 0.0
                },
                target_enforcement_agencies=[a for a in primary_agencies if a],
                simulated_notice=None,
                seizure_avoidance_directives=directives
            )

        # 1. Process Actual Statutory Violations
        for v in actual_violations:
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
                elif v.country_code == "EU":
                    agencies.add("EU Market Surveillance (RAPEX)")

            elif "ING" in v.check_code or "BAN" in v.check_code or "CHEM" in v.check_code:
                has_banned_substance = True
                score += 35.0
                triggers.append(f"[{v.country_code}] Prohibited Substance/Concentration: {v.extracted_value} ({v.rule_citation})")
                if v.country_code == "CA":
                    agencies.add("Health Canada Cosmetic Unit")
                elif v.country_code == "EU":
                    agencies.add("EU Market Surveillance (RAPEX)")
                elif v.country_code == "US":
                    agencies.add("US FDA Center for Food Safety & Applied Nutrition (CFSAN)")

            elif "PEST" in v.check_code or "EPA" in v.check_code or "CLASS" in v.check_code:
                has_epa_trigger = True
                score += 24.0
                triggers.append(f"[{v.country_code}] Unregistered Antimicrobial Pesticide Trigger ({v.rule_citation})")
                agencies.add("US EPA Import Surveillance Division")
                agencies.add("US Customs & Border Protection (CBP)")

            elif "TOY" in v.check_code:
                score += 32.0
                triggers.append(f"[{v.country_code}] Child Safety Hazard / Small Parts Ban ({v.rule_citation})")
                agencies.add("US CPSC Office of Import Surveillance")

            elif "LBL" in v.check_code or "LANG" in v.check_code:
                score += 12.0
                triggers.append(f"[{v.country_code}] Mandatory Labeling Omission: {v.expected_requirement} ({v.rule_citation})")
                if v.country_code == "US":
                    agencies.add("US Customs & Border Protection (CBP)")
                elif v.country_code == "CA":
                    agencies.add("Canada Border Services Agency (CBSA)")

            else:
                score += 15.0
                triggers.append(f"[{v.country_code}] Statutory Non-Compliance: {v.check_code} ({v.rule_citation})")

        # 2. Process Physical Safety Escalations (UN 38.3 battery hazmat or CPC lab certification)
        for esc in safety_escalations:
            if "HAZ" in esc.check_code or "LITHIUM" in esc.check_code or extracted.has_battery:
                has_battery_hazard = True
                score += 20.0
                triggers.append(f"[{esc.country_code}] Dangerous Goods Logistics Hold: Missing UN 38.3 Battery Test Summary")
                agencies.add("US DOT / FAA Dangerous Goods Office")
                agencies.add("IATA Cargo Safety Division")
            else:
                score += 15.0
                triggers.append(f"[{esc.country_code}] Physical Laboratory Certification Escalation: {esc.check_code}")
                if esc.country_code == "US":
                    agencies.add("US CPSC Office of Import Surveillance")

        # Cap probability between 5.0% and 98.5%
        seizure_probability = min(max(round(score, 1), 5.0), 98.5)

        # Assign Threat Level
        if seizure_probability >= 60.0:
            threat_level = "CRITICAL_SEIZURE_RISK"
        elif seizure_probability >= 40.0:
            threat_level = "ELEVATED_DETENTION_RISK"
        elif seizure_probability >= 20.0:
            threat_level = "MODERATE_CUSTOMS_HOLD"
        else:
            threat_level = "LOW_FRICTION_CLEAR"

        # 3. Dynamic Financial Exposure Calculation
        # Port Demurrage: standard commercial container/air freight quarantine hold ($150/day * 14 days)
        demurrage_est = 2100.0 if seizure_probability >= 30.0 else 0.0

        # Inventory Value at Risk based on threat level
        if threat_level == "CRITICAL_SEIZURE_RISK":
            inventory_at_risk = inventory_value
            statutory_penalties = round(inventory_value * 0.20, 2)  # 20% statutory negligence under 19 U.S.C. § 1592 / AMPS
        elif threat_level == "ELEVATED_DETENTION_RISK":
            inventory_at_risk = round(inventory_value * 0.50, 2)
            statutory_penalties = round(inventory_value * 0.10, 2)  # 10% statutory penalty
        elif threat_level == "MODERATE_CUSTOMS_HOLD":
            inventory_at_risk = round(inventory_value * 0.25, 2)
            statutory_penalties = round(inventory_value * 0.05, 2)
        else:
            inventory_at_risk = 0.0
            statutory_penalties = 0.0
            demurrage_est = 0.0

        total_financial_exposure = round(inventory_at_risk + demurrage_est + statutory_penalties, 2)

        # 4. Synthesize Dynamic Simulated Government Notice matching the violating jurisdiction
        simulated_notice = None
        if threat_level in ["CRITICAL_SEIZURE_RISK", "ELEVATED_DETENTION_RISK", "MODERATE_CUSTOMS_HOLD"]:
            primary_country = actual_violations[0].country_code if actual_violations else (target_markets[0] if target_markets else "US")
            simulated_notice = self._build_dynamic_notice(
                primary_country=primary_country,
                listing=listing,
                actual_violations=actual_violations,
                triggers=triggers,
                penalty_usd=statutory_penalties
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
            directives.append("Revise product packaging to resolve identified labeling declarations before shipment.")

        return CustomsSeizureRadarResult(
            seizure_probability_pct=seizure_probability,
            threat_level=threat_level,
            primary_detention_triggers=triggers[:6],
            estimated_financial_exposure_usd=total_financial_exposure,
            breakdown_fees={
                "inventory_risk_usd": inventory_at_risk,
                "port_demurrage_quarantine_usd": demurrage_est,
                "statutory_civil_penalties_usd": statutory_penalties
            },
            target_enforcement_agencies=sorted(list(agencies)),
            simulated_notice=simulated_notice,
            seizure_avoidance_directives=directives
        )

    def _get_primary_agency(self, market: str) -> Optional[str]:
        agencies = {
            "US": "US Customs & Border Protection (CBP)",
            "EU": "EU Customs Union (DG TAXUD)",
            "CA": "Canada Border Services Agency (CBSA)",
            "UK": "UK Border Force / HMRC",
            "JP": "Japan Customs Bureau / PMDA",
            "AU": "Australian Border Force (ABF)"
        }
        return agencies.get(market)

    def _build_dynamic_notice(
        self,
        primary_country: str,
        listing: ListingInput,
        actual_violations: List[ComplianceCheckResult],
        triggers: List[str],
        penalty_usd: float
    ) -> CBPNoticeOfAction:
        notice_num = uuid.uuid4().hex[:8].upper()
        consignee = listing.brand_name or "Commercial Importer of Record"

        # Build dynamic grounds from the actual failed reasons
        failed_descriptions = [v.explanation or v.expected_requirement for v in actual_violations[:3]]
        if not failed_descriptions:
            failed_descriptions = [t for t in triggers[:2]]
        grounds = (
            f"Physical examination and manifest audit indicate statutory non-compliance: "
            f"{'; '.join(failed_descriptions)}."
        )

        # Extract dynamic citations from actual failing rules
        citations = []
        for v in actual_violations:
            if v.rule_citation and v.rule_citation not in citations:
                citations.append(v.rule_citation)

        if primary_country == "CA":
            if "Canada Customs Act s. 101" not in citations:
                citations.insert(0, "Canada Customs Act (R.S.C., 1985, c. 1 (2nd Supp.)) s. 101")
            return CBPNoticeOfAction(
                notice_id=f"CBSA-E635-{notice_num}",
                form_type="CBSA Form E635 (Notice of Commercial Goods Detention)",
                issuing_port="Port of Vancouver Marine & Rail (CBSA Port Code 0803)",
                issuing_officer="Senior Border Commercial Inspector #8142",
                target_consignee=consignee,
                action_type="DETENTION_HOLD",
                grounds_for_action=grounds,
                cited_statutes=citations[:4],
                response_deadline_days=30,
                estimated_civil_penalty_usd=penalty_usd,
                potential_forfeiture_risk="Destruction of shipment at importer's expense or mandatory re-export within 30 days under Customs Act s. 101."
            )

        elif primary_country == "EU":
            if "Regulation (EU) No 952/2013 Art. 198" not in citations:
                citations.insert(0, "Regulation (EU) No 952/2013 (Union Customs Code) Article 198")
            return CBPNoticeOfAction(
                notice_id=f"EU-DET-{notice_num}",
                form_type="EU Customs Detention Order (Regulation (EU) No 952/2013 Art. 198)",
                issuing_port="Port of Rotterdam Customs Division (Customs Code NLRTM)",
                issuing_officer="Douane Customs & EU Market Surveillance Authority Unit 14",
                target_consignee=consignee,
                action_type="DETENTION_HOLD",
                grounds_for_action=grounds,
                cited_statutes=citations[:4],
                response_deadline_days=20,
                estimated_civil_penalty_usd=penalty_usd,
                potential_forfeiture_risk="Entry refused into EU Single Market; destruction or return shipment under customs supervision."
            )

        elif primary_country == "UK":
            if "CEMA 1979 Section 139" not in citations:
                citations.insert(0, "Customs and Excise Management Act 1979 (CEMA) s. 139")
            return CBPNoticeOfAction(
                notice_id=f"UKBF-SEIZ-{notice_num}",
                form_type="Border Force Notice of Seizure (CEMA 1979 Section 139)",
                issuing_port="Port of Felixstowe Border Inspection Post (Port Code GBFXT)",
                issuing_officer="UK Border Force Senior Officer / HMRC Freight Control",
                target_consignee=consignee,
                action_type="PROPOSED_SEIZURE",
                grounds_for_action=grounds,
                cited_statutes=citations[:4],
                response_deadline_days=30,
                estimated_civil_penalty_usd=penalty_usd,
                potential_forfeiture_risk="Goods liable to forfeiture under Section 49 CEMA 1979 unless notice of claim delivered within one month."
            )

        elif primary_country == "JP":
            if "Japan Customs Act Art. 69" not in citations:
                citations.insert(0, "Japan Customs Act Article 69 (関税法 第69条)")
            return CBPNoticeOfAction(
                notice_id=f"JP-CUST-{notice_num}",
                form_type="Japan Customs Act Art. 69 Detention Notice (税関差止通知書)",
                issuing_port="Tokyo Customs Narita / Yokohama Clearance Branch (Port Code TYO)",
                issuing_officer="Japan Customs Bureau Principal Import Control Examiner",
                target_consignee=consignee,
                action_type="DETENTION_HOLD",
                grounds_for_action=grounds,
                cited_statutes=citations[:4],
                response_deadline_days=30,
                estimated_civil_penalty_usd=penalty_usd,
                potential_forfeiture_risk="Import denied under Article 69 of the Customs Act; cargo subject to re-export or forfeiture."
            )

        elif primary_country == "AU":
            if "Customs Act 1901 s 205A" not in citations:
                citations.insert(0, "Australian Customs Act 1901 Section 205A")
            return CBPNoticeOfAction(
                notice_id=f"ABF-SEIZ-{notice_num}",
                form_type="ABF Seizure Notice (Customs Act 1901 s 205A)",
                issuing_port="Port of Sydney / Botany Bay (ABF Port Code AUSYD)",
                issuing_officer="Australian Border Force Commercial Cargo Operations Inspector #392",
                target_consignee=consignee,
                action_type="PROPOSED_SEIZURE",
                grounds_for_action=grounds,
                cited_statutes=citations[:4],
                response_deadline_days=30,
                estimated_civil_penalty_usd=penalty_usd,
                potential_forfeiture_risk="Goods condemned as forfeited to the Crown under Section 205 of the Customs Act 1901."
            )

        else:
            # Default to US CBP Form 29
            if "19 U.S.C. § 1592 (Penalties for Fraud, Gross Negligence, and Negligence)" not in citations:
                citations.insert(0, "19 U.S.C. § 1592 (Penalties for Fraud, Gross Negligence, and Negligence)")
            return CBPNoticeOfAction(
                notice_id=f"CBP-29-LAX-{notice_num}",
                form_type="CBP Form 29 (Notice of Action - Proposed Detention & Seizure)",
                issuing_port="Port of Los Angeles/Long Beach (CBP Port Code 2704)",
                issuing_officer="Customs Import Specialist Team 412 (Consumer Products/Health Branch)",
                target_consignee=consignee,
                action_type="PROPOSED_SEIZURE",
                grounds_for_action=grounds,
                cited_statutes=citations[:4],
                response_deadline_days=20,
                estimated_civil_penalty_usd=penalty_usd,
                potential_forfeiture_risk="Immediate transfer to General Order warehouse followed by seizure and forfeiture under 19 U.S.C. § 1595a."
            )
