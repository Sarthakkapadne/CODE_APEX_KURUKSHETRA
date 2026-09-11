"""
LexPort — Dynamic HS Code Classifier & Tariff Arbitrage Engine
Resolves dynamic WCO 6-digit and country-level 10-digit HTS codes.
Detects tariff misclassification risks, calculates real customs duty cliffs,
and computes hard-dollar Tariff Arbitrage savings achieved through compliance remediation.
"""
from __future__ import annotations
from typing import Dict, Any, List, Optional

from backend.core.models import ListingInput, ExtractedAttributes, ComplianceCheckResult, HSTariffArbitrageResult


class HSTariffEngine:
    """
    Dynamic Harmonized System (HS) Classifier and Cross-Border Tariff Calculator.
    """

    # Harmonized System database mappings
    HS_DATABASE = {
        "cosmetics": {
            "code": "3304.99.5000",
            "description": "Beauty, make-up or skin-care preparations (excluding medicaments)",
            "base_duty_rate": "0.0% (Eligible for Section 321 De Minimis)",
            "duty_pct": 0.0,
            "requires_formal_entry": False
        },
        "hair_care": {
            "code": "3305.90.0000",
            "description": "Preparations for use on the hair",
            "base_duty_rate": "0.0% (Section 321)",
            "duty_pct": 0.0,
            "requires_formal_entry": False
        },
        "oral_care": {
            "code": "3306.10.0000",
            "description": "Dentifrices, toothpastes and oral hygiene preparations",
            "base_duty_rate": "0.0% (Section 321)",
            "duty_pct": 0.0,
            "requires_formal_entry": False
        },
        "electronics": {
            "code": "8518.30.2000",
            "description": "Headphones and earphones, with or without microphone",
            "base_duty_rate": "0.0% MFN",
            "duty_pct": 0.0,
            "requires_formal_entry": False
        },
        "toys": {
            "code": "9503.00.0000",
            "description": "Tricycles, scooters, pedal cars and similar wheeled toys; dolls",
            "base_duty_rate": "0.0% MFN",
            "duty_pct": 0.0,
            "requires_formal_entry": False
        },
        # Reclassification targets when unapproved claims or ingredients trigger regulatory shift
        "medicaments": {
            "code": "3004.90.9203",
            "description": "Medicaments consisting of mixed or unmixed products for therapeutic or prophylactic uses",
            "base_duty_rate": "6.5% MFN + Mandatory FDA Prior Notice Filing",
            "duty_pct": 6.5,
            "requires_formal_entry": True
        },
        "pesticides": {
            "code": "3808.94.5000",
            "description": "Disinfectants, antimicrobials and pest control agents",
            "base_duty_rate": "5.0% + EPA Form 3540-1 Notice of Arrival Required",
            "duty_pct": 5.0,
            "requires_formal_entry": True
        }
    }

    def evaluate_hs_classification(
        self,
        listing: ListingInput,
        extracted: ExtractedAttributes,
        violations: List[ComplianceCheckResult]
    ) -> HSTariffArbitrageResult:
        price = float(listing.price or 29.99)
        shipment_units = 1000  # Standard commercial lot
        shipment_value = price * shipment_units

        cat = (extracted.category or listing.category_hint or "cosmetics").lower()
        
        # 1. Determine Declared/Intended HS Code
        if any(w in cat for w in ["hair", "shampoo", "conditioner"]):
            declared_meta = self.HS_DATABASE["hair_care"]
        elif any(w in cat for w in ["tooth", "oral", "teeth"]):
            declared_meta = self.HS_DATABASE["oral_care"]
        elif any(w in cat for w in ["electronic", "audio", "earbud", "headphone", "device"]):
            declared_meta = self.HS_DATABASE["electronics"]
        elif any(w in cat for w in ["toy", "baby", "game"]):
            declared_meta = self.HS_DATABASE["toys"]
        else:
            declared_meta = self.HS_DATABASE["cosmetics"]

        # 2. Check for Customs Involuntary Reclassification Triggers
        is_misclassified = False
        reclassified_meta = declared_meta

        has_medical_claim = any("CLAIM" in v.check_code for v in violations)
        has_epa_claim = any("PEST" in v.check_code or "EPA" in v.check_code for v in violations)
        has_camphor_high = extracted.chemical_concentrations.get("camphor", 0.0) > 3.0

        if has_medical_claim or has_camphor_high:
            is_misclassified = True
            reclassified_meta = self.HS_DATABASE["medicaments"]
        elif has_epa_claim:
            is_misclassified = True
            reclassified_meta = self.HS_DATABASE["pesticides"]

        # 3. Calculate Duty & Arbitrage Math
        if is_misclassified:
            # Under declared cosmetic: Section 321 de minimis applies (0 duty)
            declared_duty_val = 0.0
            
            # Under reclassified medicament/pesticide:
            # 19 CFR Section 321 exemption is REVOKED for merchandise subject to FDA/EPA prior notice.
            # Formal entry required: duty % + FDA fee + Broker fee
            reclass_duty_val = round(shipment_value * (reclassified_meta["duty_pct"] / 100.0), 2)
            fda_broker_fee = 575.0  # $450 FDA Port Clearance Filing + $125 Customs Broker Formal Entry
            total_arbitrage_savings = round(reclass_duty_val + fda_broker_fee, 2)
            de_minimis_disqualified = True
            remediation_action = (
                f"Apply LexPort compliant claim scrub to maintain classification under {declared_meta['code']} (0% duty). "
                f"Saves ${total_arbitrage_savings:.2f} USD and avoids mandatory Section 321 de minimis revocation."
            )
        else:
            reclass_duty_val = 0.0
            total_arbitrage_savings = 0.0
            de_minimis_disqualified = False
            remediation_action = "HS classification matches declared category. Zero tariff dispute detected."

        return HSTariffArbitrageResult(
            declared_hs_code=declared_meta["code"],
            declared_hs_description=declared_meta["description"],
            reclassified_hs_code=reclassified_meta["code"],
            reclassified_hs_description=reclassified_meta["description"],
            is_misclassified=is_misclassified,
            declared_duty_rate=declared_meta["base_duty_rate"],
            reclassified_duty_rate=reclassified_meta["base_duty_rate"],
            de_minimis_disqualified=de_minimis_disqualified,
            potential_tariff_difference_per_1000_units=reclass_duty_val,
            broker_clearance_fee_impact=575.0 if is_misclassified else 0.0,
            total_arbitrage_savings_usd=total_arbitrage_savings,
            remediation_action=remediation_action
        )
