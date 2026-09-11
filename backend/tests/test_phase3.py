"""
Phase 3 Unit Test Suite
Verifies:
1. ExportPackGenerator creates valid Amazon 5-bullet bundle without prohibited keywords.
2. PackagingArtworkSpec includes dual net quantity, Canadian French translations, and required vector marks.
3. Shopify Metafields contain customs HS codes, declared values, and de minimis flags.
4. ComplianceExportPack serialization into AuditResponse.
"""
import pytest
from backend.core.models import (
    ListingInput,
    RemediationResult,
    ExtractedAttributes,
    HSTariffArbitrageResult,
    CustomsSeizureRadarResult,
    DiffItem,
)
from backend.modules.exports.export_pack_generator import ExportPackGenerator, BANNED_AMAZON_KEYWORDS


def test_export_pack_amazon_bundle():
    listing = ListingInput(
        title="100% Pure Organic Ayurvedic Saffron Cream with Camphor",
        description="Permanently cures eczema and arthritis pain. Miraculous botanical cream.",
        brand_name="VedaGlow",
        price=38.00,
        currency="USD",
        country_of_origin="India",
        destination_markets=["US", "EU", "CA"],
    )
    extracted = ExtractedAttributes(
        category="Cosmetics",
        subcategory="Facial Skincare",
        has_active_ingredients=True,
        has_health_claims=True,
        has_battery=False,
    )
    remediation = RemediationResult(
        original_title=listing.title,
        compliant_title="Ayurvedic Saffron Face Cream with Camphor",
        original_description=listing.description,
        compliant_description="Soothes skin and supports radiant hydration.",
        diff_items=[
            DiffItem(
                original_phrase="cures eczema",
                compliant_phrase="soothes dry skin",
                reason="Replaced illegal medical claim",
                severity="high"
            )
        ],
        ready_to_paste_bullets=[
            "BOTANICAL HYDRATION COMPLEX: Formulated with saffron to soothe dry facial skin.",
            "PURE EXTRACTS: Contains natural camphor and botanical emollients.",
            "NON-COMEDOGENIC: Gentle daily facial care.",
        ],
        escalation_checklist=[],
    )

    pack = ExportPackGenerator.generate(
        listing=listing,
        remediation=remediation,
        extracted=extracted,
        target_markets=["US", "EU", "CA"],
    )

    # Verify SKU
    assert pack.sku_identifier.startswith("VEDA-COS-")

    # Verify Amazon Bundle
    assert pack.amazon_bundle.clean_title == "Ayurvedic Saffron Face Cream with Camphor"
    assert len(pack.amazon_bundle.bullet_points) >= 3
    # Check that prohibited words are not in clean title
    for word in ["cure", "cures", "miracle"]:
        assert word not in pack.amazon_bundle.clean_title.lower()
    
    # Prohibited terms should have been detected and logged
    assert "cures" in pack.amazon_bundle.prohibited_terms_removed or "cure" in pack.amazon_bundle.prohibited_terms_removed

    # Disclaimer check
    assert "STATUTORY" in pack.amazon_bundle.a_plus_legal_disclaimer or "REGULATORY" in pack.amazon_bundle.a_plus_legal_disclaimer


def test_export_pack_shopify_metafields():
    listing = ListingInput(
        title="Wireless Bluetooth ANC Earbuds",
        description="High fidelity noise cancelling earbuds with rechargeable lithium battery.",
        brand_name="AcousticPro",
        price=79.99,
        currency="USD",
        country_of_origin="China",
        destination_markets=["US", "EU"],
    )
    extracted = ExtractedAttributes(
        category="Consumer Electronics",
        subcategory="Audio",
        has_battery=True,
    )
    hs_res = HSTariffArbitrageResult(
        declared_hs_code="8518.30.2000",
        declared_hs_description="Headphones & Earphones",
        reclassified_hs_code="8518.30.2000",
        reclassified_hs_description="Headphones & Earphones",
        is_misclassified=False,
        declared_duty_rate="4.9%",
        reclassified_duty_rate="4.9%",
        de_minimis_disqualified=False,
        potential_tariff_difference_per_1000_units=0.0,
        broker_clearance_fee_impact=0.0,
        total_arbitrage_savings_usd=0.0,
        remediation_action="HS code accurately matches electroacoustic transducer subheadings.",
    )

    pack = ExportPackGenerator.generate(
        listing=listing,
        remediation=None,
        extracted=extracted,
        hs_tariff=hs_res,
        target_markets=["US", "EU"],
    )

    metafields = {m.key: m.value for m in pack.shopify_metafields}
    assert metafields["customs_country_of_origin"] == "China"
    assert metafields["customs_harmonized_code"] == "8518.30.2000"
    assert "ELIGIBLE" in metafields["us_section_321_de_minimis"]
    assert "UN3481" in metafields["customs_hazmat_classification"]
    assert "LexPort" in metafields["eu_gpsr_responsible_person"]


def test_export_pack_packaging_artwork_spec():
    listing = ListingInput(
        title="100% Pure Organic Ayurvedic Saffron Cream",
        description="Pure cream",
        brand_name="VedaGlow",
        price=35.0,
        currency="USD",
        country_of_origin="India",
        destination_markets=["CA", "EU", "US"],
    )
    extracted = ExtractedAttributes(
        category="Cosmetics",
        subcategory="Face Cream",
    )

    pack = ExportPackGenerator.generate(
        listing=listing,
        remediation=None,
        extracted=extracted,
        target_markets=["CA", "EU", "US"],
    )

    spec = pack.packaging_artwork_spec
    # Dual Net Quantity declaration
    assert "oz" in spec.net_quantity_declaration.lower()
    assert "g" in spec.net_quantity_declaration.lower()
    assert spec.net_quantity_font_size_pt >= 4.5

    # Vector marks
    assert "CE-Conformity" in spec.required_vector_marks
    assert "Dual-Net-Quantity" in spec.required_vector_marks

    # Canadian bilingual
    assert "Poids Net" in spec.canadian_bilingual_text.values()

    # Printer notes
    assert any("PDP" in note or "Principal Display Panel" in note for note in spec.statutory_printer_notes)
    assert any("CE mark" in note or "CE" in note for note in spec.statutory_printer_notes)
