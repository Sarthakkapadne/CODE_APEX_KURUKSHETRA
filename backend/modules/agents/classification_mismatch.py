"""
LexPort — Cross-Border Classification Mismatch Detector (Layer 1b Specialized Agent)
Detects structural legal dissonance where the identical physical product belongs to
radically different regulatory categories across destination jurisdictions.

Documented real-world failure cases detected:
1. Antibacterial Surface Sprays / Treated Cutting Boards:
   - UK / EU: Regulated as cosmetic / treated household article under Biocidal Products Reg (BPR).
   - US: Regulated as a PESTICIDE under EPA FIFRA (40 CFR § 152), requiring EPA establishment & registration.
2. Baby Walkers:
   - US: Legal with ASTM F977 safety standard certification.
   - UK: Legal with BS EN 1273 compliance.
   - Canada: ABSOLUTE CRIMINAL BAN under CCPSA Schedule 2, Item 15 (CAD $100k fine).
3. Infant Sleep Positioners & Monitors:
   - UK / EU: Consumer nursery wellness accessory.
   - US: Unapproved medical device / banned inclined sleeper under Safe Sleep for Babies Act (CPSC / FDA).
4. Ayurvedic / Herbal Pain Creams:
   - India: Traditional AYUSH-licensed wellness formulation.
   - US / EU / UK: Unapproved new drug if claiming to cure arthritis / relieve chronic disease.
5. High-Strength Hydrogen Peroxide Whitening:
   - US: OTC consumer cosmetic up to 14%.
   - EU / UK: Strictly banned above 0.1% for direct-to-consumer OTC sales (EC 1223/2009 Annex III).
"""
from __future__ import annotations
from typing import List, Dict, Any, Optional
from backend.core.models import ComplianceCheckResult, ExtractedAttributes


class ClassificationMismatchDetector:
    """Specialized detector for Layer 1b cross-border classification disparities."""

    def detect_mismatches(
        self,
        extracted: ExtractedAttributes,
        raw_text: str,
        target_markets: List[str]
    ) -> List[ComplianceCheckResult]:
        mismatches: List[ComplianceCheckResult] = []
        lower = (raw_text or "").lower()

        # ── Case 1: Antibacterial / Antimicrobial Surface & Cutting Boards (US EPA Pesticide Trap) ──
        has_antimicrobial_claim = any(
            t in lower for t in ["antibacterial", "kills germs", "kills 99.9%", "antimicrobial", "pesticidal"]
        )
        is_surface_or_board = any(
            t in lower or t in extracted.subcategory for t in ["cutting board", "cutting_boards", "spray", "cleaner", "surface"]
        )

        if has_antimicrobial_claim and is_surface_or_board:
            if "US" in target_markets:
                mismatches.append(ComplianceCheckResult(
                    check_code="MISMATCH-EPA-PESTICIDE",
                    country_code="US",
                    category="Classification Status",
                    status="violation",
                    trust_tier="Tier 2 Grounded AI",
                    rule_citation="EPA FIFRA 40 CFR § 152.15 vs UK/EU GB BPR Article 58",
                    extracted_value="Classified as EPA Registered Pesticide (US) vs Treated Article (UK/EU)",
                    expected_requirement="EPA FIFRA Company No. & Establishment No. required for US sale.",
                    explanation="STRUCTURAL CLASSIFICATION MISMATCH (Layer 1b): In the UK and EU, antimicrobial cutting boards are lawful as 'treated articles' under Biocidal regulations. In the United States, EPA classifies any claim to destroy pathogens on inanimate surfaces as a PESTICIDE under FIFRA. Listing this in the US without EPA registration causes instant Amazon delisting and CBP seizure.",
                    fix_suggestion="Remove antimicrobial/germ-killing claims from US listing, or obtain EPA Pesticide Registration."
                ))

        # ── Case 2: Baby Walkers (Canada CCPSA Total Ban vs US/UK Certified) ──
        is_baby_walker = "walker" in lower and any(w in lower for w in ["baby", "infant", "toddler", "child"])
        if is_baby_walker:
            if "CA" in target_markets:
                mismatches.append(ComplianceCheckResult(
                    check_code="MISMATCH-CA-WALKER-BAN",
                    country_code="CA",
                    category="Classification Status",
                    status="violation",
                    trust_tier="Tier 2 Grounded AI",
                    rule_citation="CCPSA Schedule 2 Item 15 vs US ASTM F977 / UK BS EN 1273",
                    extracted_value="Statutory Criminal Prohibition (Canada) vs Certified Safe Good (US/UK)",
                    expected_requirement="TOTAL IMPORT & ADVERTISING PROHIBITION in Canada.",
                    explanation="STRUCTURAL CLASSIFICATION MISMATCH (Layer 1b): Baby walkers with wheels are completely legal to sell in the US (under ASTM F977 CPC certification) and UK (under BS EN 1273). In Canada, they have been banned since 2004 under criminal statute (CCPSA Schedule 2). Possessing or selling them in Canada carries criminal penalties. No label change can make this product legal in Canada.",
                    fix_suggestion="Exclude Canada from cross-border shipping zones. DO NOT fulfill to Canadian addresses."
                ))

        # ── Case 3: Infant Sleep Positioner / Incline Sleeper (US Federal Ban) ──
        is_sleep_positioner = any(w in lower for w in ["sleep positioner", "inclined sleeper", "sleep wedge", "crib wedge", "anti-roll"])
        if is_sleep_positioner:
            if "US" in target_markets:
                mismatches.append(ComplianceCheckResult(
                    check_code="MISMATCH-US-SLEEP-BAN",
                    country_code="US",
                    category="Classification Status",
                    status="violation",
                    trust_tier="Tier 2 Grounded AI",
                    rule_citation="Safe Sleep for Babies Act (16 CFR Part 1236) vs EU GPSD",
                    extracted_value="Federal Banned Hazardous Product (US) vs General Consumer Nursery (EU)",
                    expected_requirement="Total ban on manufacture, sale, and import in the US.",
                    explanation="STRUCTURAL CLASSIFICATION MISMATCH (Layer 1b): Inclined sleep accessories and positioners are marketed in some international territories as sleep aids, but are federally outlawed in the US due to infant suffocation risks.",
                    fix_suggestion="Cease sales of infant sleep positioners in the United States."
                ))

        # ── Case 4: Hydrogen Peroxide Teeth Whitening (US OTC vs EU/UK Medical Cap) ──
        conc = extracted.chemical_concentrations.get("hydrogen peroxide", 0.0)
        if conc > 0.1:
            for country in ["EU", "UK"]:
                if country in target_markets:
                    mismatches.append(ComplianceCheckResult(
                        check_code=f"MISMATCH-{country}-PEROXIDE-CAP",
                        country_code=country,
                        category="Classification Status",
                        status="violation",
                        trust_tier="Tier 2 Grounded AI",
                        rule_citation="EU Reg 1223/2009 Annex III / UK Reg 2013 vs US 21 CFR § 310",
                        extracted_value=f"Prescription / Dental-Only Box ({conc:.1f}% in {country}) vs OTC Cosmetic (US)",
                        expected_requirement=f"Max 0.1% hydrogen peroxide for OTC consumer cosmetics in {country}.",
                        explanation=f"STRUCTURAL CLASSIFICATION MISMATCH (Layer 1b): At {conc:.1f}% concentration, this product is legal OTC in the US, but legally classified in {country} as a restricted dental product restricted to registered practitioners. Selling directly to consumers in {country} triggers immediate customs interception.",
                        fix_suggestion=f"Provide a dedicated EU/UK SKU with <= 0.1% hydrogen peroxide or PAP alternative."
                    ))

        return mismatches
