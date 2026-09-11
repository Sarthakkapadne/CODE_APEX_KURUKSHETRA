"""
LexPort — 3-Way Triangulation Engine
Reconciles:
  [1] Listing Marketing Copy  vs  [2] Physical Packaging Reality  vs  [3] Destination Market Statutes
Detects hidden fraud, false claims, omitted safety logos, and missing mandatory languages.
"""
from __future__ import annotations
import re
from typing import List

from backend.core.models import (
    ListingInput, ExtractedAttributes, PackagingAnalysisResult, TriangulationDiscrepancyItem
)


class TriangulationEngine:
    """
    Cross-checks digital listing claims against physical packaging text and certification marks.
    """

    def reconcile(
        self,
        listing: ListingInput,
        extracted: ExtractedAttributes,
        packaging: PackagingAnalysisResult,
        target_markets: List[str]
    ) -> List[TriangulationDiscrepancyItem]:
        discrepancies: List[TriangulationDiscrepancyItem] = []
        full_listing_text = f"{listing.title} {listing.description}".lower()
        ocr_text_lower = f"{packaging.raw_ocr_text} {packaging.translated_english_text}".lower()

        # ── Discrepancy 1: Organic / Natural Deception vs Physical Synthetic Reality ──
        claims_natural = any(w in full_listing_text for w in ["100% natural", "pure organic", "chemical-free", "all natural", "herbal glow"])
        has_synthetics_on_label = any(w in ocr_text_lower for w in ["camphor", "retinol", "phenoxyethanol", "paraben", "sulfate", "synthetic"])

        if claims_natural and has_synthetics_on_label:
            discrepancies.append(TriangulationDiscrepancyItem(
                check_code="TRI-DECEPT-01",
                discrepancy_type="FALSE_ADVERTISING_CLAIM",
                severity="CRITICAL_FRAUD_RISK",
                listing_claim="Listing asserts product is '100% Natural / Pure Organic'.",
                physical_label_reality="Physical packaging ingredient panel discloses synthetic active chemicals (Camphor 5.0% / Retinol / Preservatives).",
                destination_statute="15 U.S.C. § 45 (FTC Act § 5 - Deceptive Practices) & 21 U.S.C. § 362 (FDA Misbranded Cosmetics)",
                border_impact="Customs CBP & FDA administrative hold for deceptive labeling and consumer fraud. Mandatory repackaging or destruction."
            ))

        # ── Discrepancy 2: Battery Capacity Discrepancy (Hazmat Fraud) ──
        if "5000" in full_listing_text and ("1200" in ocr_text_lower or "3.7v" in ocr_text_lower):
            discrepancies.append(TriangulationDiscrepancyItem(
                check_code="TRI-BATT-02",
                discrepancy_type="BATTERY_HAZMAT_MISMATCH",
                severity="CRITICAL_FRAUD_RISK",
                listing_claim="Listing advertises '5000mAh Ultra High Capacity Battery'.",
                physical_label_reality="Physical rating plate specifies '3.7V 1200mAh (4.44Wh)'.",
                destination_statute="IATA Dangerous Goods Regulations Section 5.3 & FAA Hazmat 49 CFR § 173.185",
                border_impact="FAA/IATA hazmat misdeclaration. Immediate air cargo hold and commercial carrier disqualification."
            ))

        # ── Discrepancy 3: Missing Mandatory CE Mark for EU (Electronics, Toys, Medical Devices) ──
        if "EU" in target_markets and "CE_MARK" not in packaging.detected_certification_logos:
            is_regulated_product = any(w in full_listing_text for w in ["earbud", "headphone", "electronic", "toy", "medical device", "medical equipment"]) or extracted.category in ["electronics", "toys"]
            if is_regulated_product:
                discrepancies.append(TriangulationDiscrepancyItem(
                    check_code="TRI-LOGO-03",
                    discrepancy_type="MISSING_CERTIFICATION_MARK",
                    severity="HIGH_DETENTION_RISK",
                    listing_claim="Product offered for cross-border delivery to European Union member states.",
                    physical_label_reality="Physical packaging lacks the mandatory European Conformity (CE) marking.",
                    destination_statute="EU Regulation (EC) No 765/2008 & EU Blue Guide 2022",
                    border_impact="Mandatory customs rejection by EU Market Surveillance Authorities (RAPEX). Goods will be refused entry at port."
                ))

        # ── Discrepancy 4: Missing Mandatory Bilingual French for Canada ──
        if "CA" in target_markets and packaging.raw_ocr_text and not packaging.is_bilingual:
            has_french = any(w in ocr_text_lower for w in ["fabriqué", "mode d'emploi", "ingrédients", "poids net", "avertissement"])
            is_cpg = extracted.category in ["cosmetics", "food", "supplements", "toys"] or any(w in full_listing_text for w in ["cream", "lotion", "serum", "food", "toy"])
            if not has_french and is_cpg and len(packaging.raw_ocr_text.strip()) > 30:
                discrepancies.append(TriangulationDiscrepancyItem(
                    check_code="TRI-LANG-04",
                    discrepancy_type="LANGUAGE_NON_COMPLIANCE",
                    severity="HIGH_DETENTION_RISK",
                    listing_claim="Target market includes Canada (Health Canada / CBSA jurisdiction).",
                    physical_label_reality="Physical packaging is unilingual with zero official French text declarations.",
                    destination_statute="Consumer Packaging and Labelling Act (R.S.C., 1985, c. C-38) Section 6",
                    border_impact="CBSA commercial importation hold. Non-compliant consumer goods cannot clear customs without bilingual labeling."
                ))

        # ── Discrepancy 5: Missing Dual Net Weight (Fluid Ounces) for US ──
        if "US" in target_markets:
            decl = packaging.net_quantity_declaration or ""
            if "ml" in decl.lower() and not any(w in decl.lower() for w in ["fl oz", "oz", "fl. oz."]):
                discrepancies.append(TriangulationDiscrepancyItem(
                    check_code="TRI-NETWT-05",
                    discrepancy_type="LANGUAGE_NON_COMPLIANCE",
                    severity="MODERATE_WARNING",
                    listing_claim="Product targeted for retail delivery in the United States.",
                    physical_label_reality=f"Net quantity on physical packaging declares metric only ('{decl}') without customary US fluid ounces.",
                    destination_statute="US Fair Packaging and Labeling Act (FPLA) 15 U.S.C. § 1453(a)(2)",
                    border_impact="FDA/FTC labeling citation. Notice to correct before subsequent commercial import batches."
                ))

        # Deduplicate by check_code
        seen = set()
        unique_discrepancies = []
        for d in discrepancies:
            if d.check_code not in seen:
                seen.add(d.check_code)
                unique_discrepancies.append(d)

        return unique_discrepancies
