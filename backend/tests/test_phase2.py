"""
Test Phase 2: Multi-Modal Vision OCR & 3-Way Triangulation Engine.
Ensures:
  1. Multi-Lingual Rosetta Stone extraction (Japanese Kanji -> English INCI Camphor)
  2. Translation Provenance tracking with confidence and international codex standards
  3. 3-Way Triangulation (Listing Copy vs Physical Packaging Reality vs Destination Law)
  4. Deceptive marketing claim fraud detection (100% natural vs synthetic chemicals)
  5. Missing mandatory market certification logo detection (CE mark for EU)
  6. Missing bilingual French packaging detection for Canada (CPLA Section 6)
"""
import pytest
import asyncio
from backend.core.models import ListingInput, ExtractedAttributes, PackagingAnalysisResult
from backend.modules.ocr.multimodal_ocr import MultiModalOCREngine
from backend.modules.agents.triangulation_engine import TriangulationEngine
from backend.modules.agents.supervisor import ComplianceSupervisor


@pytest.mark.asyncio
async def test_multimodal_ocr_rosetta_stone_kanji():
    ocr = MultiModalOCREngine()
    res = await ocr.inspect_packaging(
        listing_title="Ayurvedic Saffron Glow Cream",
        category_hint="cosmetics",
        target_markets=["US", "EU", "CA"]
    )

    assert res.detected_language == "Japanese"
    assert "カンフル" in res.raw_ocr_text
    assert "Camphor" in res.translated_english_text
    assert len(res.translation_provenance) >= 2
    # Verify INCI standardization
    assert any("INCI" in p.standardized_standard for p in res.translation_provenance)
    # Verify bounding boxes exist
    assert len(res.bounding_boxes) >= 2


def test_triangulation_deceptive_natural_claim():
    triangulator = TriangulationEngine()
    listing = ListingInput(
        title="100% Pure Organic All-Natural Herbal Joint Comfort Salve",
        description="Zero chemicals, completely pure organic plant extracts.",
        price=35.0,
        destination_markets=["US", "EU"]
    )
    extracted = ExtractedAttributes(
        category="cosmetics",
        subcategory="salve",
        intended_age="adult",
        power_source="none",
        claims=["100% Pure Organic"]
    )
    packaging = PackagingAnalysisResult(
        detected_language="English",
        raw_ocr_text="Active Ingredients: Camphor 5.0%, Phenoxyethanol 0.8%, Synthetic Fragrance",
        translated_english_text="Active Ingredients: Camphor 5.0%, Phenoxyethanol 0.8%, Synthetic Fragrance",
        detected_certification_logos=[],
        missing_certification_logos=[],
        is_bilingual=False
    )

    discrepancies = triangulator.reconcile(listing, extracted, packaging, ["US", "EU"])

    assert len(discrepancies) >= 1
    fraud_disc = next((d for d in discrepancies if d.check_code == "TRI-DECEPT-01"), None)
    assert fraud_disc is not None
    assert fraud_disc.severity == "CRITICAL_FRAUD_RISK"
    assert "15 U.S.C. § 45" in fraud_disc.destination_statute


def test_triangulation_missing_ce_mark_for_eu():
    triangulator = TriangulationEngine()
    listing = ListingInput(
        title="Pro Wireless Bluetooth Earbuds Noise Cancelling",
        description="Premium active noise cancelling earbuds.",
        price=49.99,
        destination_markets=["EU"]
    )
    extracted = ExtractedAttributes(
        category="electronics",
        subcategory="audio",
        intended_age="adult",
        power_source="battery",
        has_battery=True
    )
    packaging = PackagingAnalysisResult(
        detected_language="English",
        raw_ocr_text="Model TWS-800. FCC ID: 2ABCD-TWS800.",
        translated_english_text="Model TWS-800. FCC ID: 2ABCD-TWS800.",
        detected_certification_logos=["FCC_ID"],
        missing_certification_logos=[],
        is_bilingual=False
    )

    discrepancies = triangulator.reconcile(listing, extracted, packaging, ["EU"])

    ce_disc = next((d for d in discrepancies if d.check_code == "TRI-LOGO-03"), None)
    assert ce_disc is not None
    assert ce_disc.severity == "HIGH_DETENTION_RISK"
    assert "765/2008" in ce_disc.destination_statute


def test_triangulation_missing_bilingual_french_for_canada():
    triangulator = TriangulationEngine()
    listing = ListingInput(
        title="Botanical Face Serum 30ml",
        description="Daily hydrating skin care serum.",
        price=24.99,
        destination_markets=["CA"]
    )
    extracted = ExtractedAttributes(
        category="cosmetics",
        subcategory="serum",
        intended_age="adult",
        power_source="none"
    )
    packaging = PackagingAnalysisResult(
        detected_language="English",
        raw_ocr_text="Apply 3 drops to face daily. Net Wt. 30ml.",
        translated_english_text="Apply 3 drops to face daily. Net Wt. 30ml.",
        detected_certification_logos=[],
        missing_certification_logos=[],
        is_bilingual=False
    )

    discrepancies = triangulator.reconcile(listing, extracted, packaging, ["CA"])

    lang_disc = next((d for d in discrepancies if d.check_code == "TRI-LANG-04"), None)
    assert lang_disc is not None
    assert lang_disc.severity == "HIGH_DETENTION_RISK"
    assert "Section 6" in lang_disc.destination_statute
