"""
LexPort — Member 1 Hard Backend Verification Suite
Tests:
1. GS1 Barcode Modulo-10 Checksum Algorithm & Country Prefix Allocation
2. ISO 7000 Handling Marks & Packaging Symbol Identification
3. Mandatory Document & License Matrix Determination across 5 Jurisdictions
4. 50-Item Ground-Truth Benchmark Evaluation Suite (Accuracy, Precision, Recall, F1)
5. End-to-End Supervisor Integration with Member 1 Deliverables
6. FastAPI GET /compliance/benchmark-stats Endpoint
"""
import pytest
from httpx import AsyncClient, ASGITransport

from backend.core.models import ListingInput
from backend.modules.rule_engine.barcode_validator import BarcodeValidator
from backend.modules.rule_engine.document_matrix import DocumentMatrixEngine
from backend.modules.agents.supervisor import ComplianceSupervisor
from backend.tests.eval_benchmark import BenchmarkEvaluator
from backend.api.main import app


# ─── 1. GS1 BARCODE VALIDATOR TESTS ───

def test_gs1_barcode_validator_valid_upc_and_ean():
    validator = BarcodeValidator()

    # Valid UPC-A (12 digits) - United States prefix
    res_upc = validator.validate_barcode("012345678905")
    assert res_upc.is_valid_gs1 is True
    assert res_upc.barcode_type == "UPC-A"
    assert res_upc.gs1_check_digit == 5
    assert "United States" in res_upc.country_of_registration

    # Valid EAN-13 (13 digits) - Japan prefix 490
    res_ean_jp = validator.validate_barcode("4901234567894")
    assert res_ean_jp.is_valid_gs1 is True
    assert res_ean_jp.barcode_type == "EAN-13"
    assert res_ean_jp.gs1_check_digit == 4
    assert res_ean_jp.country_of_registration == "Japan"

    # Valid EAN-13 (13 digits) - India prefix 890
    res_ean_in = validator.validate_barcode("8901030865435")
    assert res_ean_in.is_valid_gs1 is True
    assert res_ean_in.barcode_type == "EAN-13"
    assert res_ean_in.gs1_check_digit == 5
    assert res_ean_in.country_of_registration == "India"


def test_gs1_barcode_validator_checksum_failures_and_errors():
    validator = BarcodeValidator()

    # Invalid check digit (last digit is 9 instead of 5)
    res_fail = validator.validate_barcode("012345678909")
    assert res_fail.is_valid_gs1 is False
    assert res_fail.barcode_type == "INVALID_CHECKSUM"
    assert "GS1 Checksum Failure" in res_fail.warning_message

    # Invalid length (10 digits)
    res_len = validator.validate_barcode("1234567890")
    assert res_len.is_valid_gs1 is False
    assert res_len.barcode_type == "INVALID_LENGTH"

    # Non-numeric barcode
    res_alpha = validator.validate_barcode("ABC-123456789")
    assert res_alpha.is_valid_gs1 is False
    assert res_alpha.barcode_type == "NON_NUMERIC"

    # Empty / None barcode
    res_none = validator.validate_barcode(None)
    assert res_none.is_valid_gs1 is False
    assert res_none.barcode_type == "NOT_PROVIDED"


# ─── 2. ISO 7000 HANDLING MARKS TESTS ───

def test_iso_symbols_detection():
    validator = BarcodeValidator()

    # From detected OCR marks
    symbols = validator.detect_iso_symbols(
        text="Store in cool dry place. Glass dropper bottle.",
        detected_marks=["ISO-7000-0621", "RECYCLING_MOBIOUS"],
        category="cosmetics"
    )

    symbol_codes = [s.symbol_code for s in symbols]
    assert "ISO-7000-0621" in symbol_codes  # Fragile
    assert "ISO-7000-1135" in symbol_codes  # Recycling
    assert "ISO-7000-0623" in symbol_codes  # This Way Up (liquid cosmetic)

    # WEEE mark for electronics
    elec_symbols = validator.detect_iso_symbols(
        text="Bluetooth ANC Earbuds with rechargeable lithium battery.",
        detected_marks=["WEEE"],
        category="consumer electronics"
    )
    elec_codes = [s.symbol_code for s in elec_symbols]
    assert "EU-WEEE-SYMBOL" in elec_codes


# ─── 3. MANDATORY DOCUMENT MATRIX TESTS ───

def test_document_matrix_cosmetics():
    matrix_engine = DocumentMatrixEngine()
    docs = matrix_engine.determine_required_documents(
        category="Cosmetics",
        target_markets=["US", "EU", "UK", "CA", "JP"],
        has_battery=False,
        raw_text="Organic Anti-Aging Face Serum with Retinol"
    )

    codes = [d.doc_code for d in docs]
    assert "US-DOC-MOCRA" in codes      # US FDA MoCRA listing
    assert "EU-DOC-CPSR" in codes       # EU Safety Report
    assert "EU-DOC-CPNP" in codes       # EU CPNP notification
    assert "UK-DOC-SCPN" in codes       # UK SCPN notification
    assert "CA-DOC-CNF" in codes        # Health Canada CNF
    assert "JP-DOC-PMDA" in codes       # Japan PMDA accreditation
    assert "GLOBAL-DOC-COMMERCIAL-INVOICE" in codes


def test_document_matrix_electronics_and_battery():
    matrix_engine = DocumentMatrixEngine()
    docs = matrix_engine.determine_required_documents(
        category="Consumer Electronics",
        target_markets=["US", "EU", "JP", "CA"],
        has_battery=True,
        raw_text="Wireless ANC Earbuds with 1200mAh Lithium-ion battery"
    )

    codes = [d.doc_code for d in docs]
    # Electronics certs
    assert "US-DOC-FCC" in codes        # FCC SDoC / ID
    assert "EU-DOC-CE" in codes         # CE DoC
    assert "EU-DOC-ROHS" in codes       # RoHS 3
    assert "EU-DOC-WEEE" in codes       # WEEE EPR
    assert "JP-DOC-PSE" in codes        # Japan PSE Mark
    assert "CA-DOC-ISED" in codes       # Canada ISED
    # Hazmat / Battery safety docs
    assert "GLOBAL-DOC-UN383" in codes  # UN 38.3 Lithium Test Summary
    assert "GLOBAL-DOC-DGD" in codes    # Dangerous Goods Transport Mark
    assert "GLOBAL-DOC-SDS" in codes    # 16-Section Safety Data Sheet


def test_document_matrix_toys_and_kitchenware():
    matrix_engine = DocumentMatrixEngine()

    # Toys
    toy_docs = matrix_engine.determine_required_documents(
        category="Children's Products",
        target_markets=["US", "EU", "CA"],
        has_battery=False,
        raw_text="Organic Wooden Teething Rattle Toy for Infants"
    )
    toy_codes = [d.doc_code for d in toy_docs]
    assert "US-DOC-CPC" in toy_codes       # US CPC + ASTM F963
    assert "EU-DOC-TOY-CE" in toy_codes   # EU EN 71 DoC
    assert "CA-DOC-CCPSA-TOY" in toy_codes # Canada CCPSA

    # Kitchenware Food Contact
    kitchen_docs = matrix_engine.determine_required_documents(
        category="Kitchenware",
        target_markets=["US", "EU"],
        has_battery=False,
        raw_text="Stainless Steel Chef Knife and Cutting Board"
    )
    kitchen_codes = [d.doc_code for d in kitchen_docs]
    assert "US-DOC-FDA-FCS" in kitchen_codes # FDA Food Contact Substance
    assert "EU-DOC-FCM" in kitchen_codes     # EU FCM Regulation 1935/2004


# ─── 4. 50-ITEM GROUND TRUTH BENCHMARK EVALUATION TESTS ───

def test_50_item_ground_truth_benchmark_suite():
    evaluator = BenchmarkEvaluator()
    assert len(evaluator.cases) == 50

    stats = evaluator.run_benchmark()
    assert stats.total_cases == 50
    assert stats.accuracy_score >= 95.0
    assert stats.precision_score >= 95.0
    assert stats.recall_score >= 95.0
    assert stats.f1_score >= 0.95

    # Verify jurisdiction breakdown
    for j in ["US", "EU", "CA", "UK", "JP"]:
        assert stats.breakdown_by_jurisdiction.get(j, 0) > 0


# ─── 5. SUPERVISOR INTEGRATION WITH MEMBER 1 DELIVERABLES ───

@pytest.mark.asyncio
async def test_supervisor_integration_member1_fields():
    supervisor = ComplianceSupervisor()

    listing = ListingInput(
        title="Active Noise Cancelling Wireless Earbuds TWS-800",
        description="Bluetooth 5.3 earbuds with 1200mAh lithium battery. Fast charging USB-C case.",
        category_hint="Consumer Electronics",
        destination_markets=["US", "EU"],
        barcode_raw="6901234567892"
    )

    audit = await supervisor.run_audit(listing)

    # Check Barcode analysis is attached
    assert audit.barcode_analysis is not None
    assert audit.barcode_analysis.is_valid_gs1 is True
    assert audit.barcode_analysis.barcode_type == "EAN-13"
    assert audit.barcode_analysis.country_of_registration == "China"

    # Check ISO handling marks are attached
    assert len(audit.iso_symbols_detected) > 0
    symbol_codes = [s.symbol_code for s in audit.iso_symbols_detected]
    assert any("WEEE" in c or "0626" in c or "1135" in c for c in symbol_codes)

    # Check Required Documents matrix is populated
    assert len(audit.required_documents) > 0
    doc_codes = [d.doc_code for d in audit.required_documents]
    assert "US-DOC-FCC" in doc_codes
    assert "EU-DOC-CE" in doc_codes
    assert "GLOBAL-DOC-UN383" in doc_codes  # Triggered by battery


# ─── 6. FASTAPI GET /compliance/benchmark-stats ENDPOINT TEST ───

@pytest.mark.asyncio
async def test_benchmark_stats_api_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/compliance/benchmark-stats")
        assert response.status_code == 200
        data = response.json()
        assert data["total_cases"] == 50
        assert data["accuracy_score"] >= 95.0
        assert data["precision_score"] >= 95.0
        assert data["recall_score"] >= 95.0
        assert data["f1_score"] >= 0.95
        assert "US" in data["breakdown_by_jurisdiction"]
        assert len(data["categories_tested"]) >= 5
