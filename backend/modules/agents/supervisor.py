"""
LexPort — Multi-Agent Compliance Supervisor
Orchestrates the entire end-to-end compliance verification pipeline:
  Listing Input → Attribute Extraction → Deterministic Rules → Mismatch Detection
  → Adversarial Debate → Remediation Rewrite → Trade Economics → Hash Chain Seal.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

from backend.core.config import get_settings
from backend.core.models import (
    ListingInput, AuditResponse, ComplianceCheckResult, ExtractedAttributes,
    RemediationResult, TradeEconomicsItem, CustomsSeizureRadarResult,
    HSTariffArbitrageResult, GroundTruthAccuracyIndex, PackagingAnalysisResult
)
from backend.core.hash_chain import ComplianceHashChain
from backend.modules.rule_engine.deterministic_engine import DeterministicRuleEngine
from backend.modules.rule_engine.accuracy_evaluator import AccuracyEvaluator
from backend.modules.rule_engine.barcode_validator import BarcodeValidator
from backend.modules.rule_engine.document_matrix import DocumentMatrixEngine
from backend.modules.ocr.multimodal_ocr import MultiModalOCREngine
from backend.modules.agents.attribute_extractor import AttributeExtractorAgent
from backend.modules.agents.classification_mismatch import ClassificationMismatchDetector
from backend.modules.agents.triangulation_engine import TriangulationEngine
from backend.modules.agents.customs_risk_radar import CustomsRiskRadar
from backend.modules.agents.remediation_rewriter import RemediationRewriterAgent
from backend.modules.agents.escalation_handler import EscalationHandler
from backend.modules.economics.trade_advisor import TradeEconomicsAdvisor
from backend.modules.economics.hs_tariff_engine import HSTariffEngine
from backend.modules.exports.export_pack_generator import ExportPackGenerator
from backend.modules.simulator.regulatory_simulator import RegulatorySimulator


class ComplianceSupervisor:
    def __init__(
        self,
        rule_engine: Optional[DeterministicRuleEngine] = None,
        simulator: Optional[RegulatorySimulator] = None
    ):
        self.settings = get_settings()
        self.rule_engine = rule_engine or DeterministicRuleEngine()
        self.simulator = simulator or RegulatorySimulator()
        self.extractor = AttributeExtractorAgent()
        self.ocr_engine = MultiModalOCREngine()
        self.triangulation_engine = TriangulationEngine()
        self.mismatch_detector = ClassificationMismatchDetector()
        self.customs_radar = CustomsRiskRadar()
        self.hs_tariff_engine = HSTariffEngine()
        self.accuracy_evaluator = AccuracyEvaluator()
        self.rewriter = RemediationRewriterAgent()
        self.escalation_handler = EscalationHandler()
        self.economics_advisor = TradeEconomicsAdvisor()
        self.barcode_validator = BarcodeValidator()
        self.document_matrix = DocumentMatrixEngine()

    async def run_audit(
        self,
        listing: ListingInput,
        prev_hash: Optional[str] = None
    ) -> AuditResponse:
        inspection_id = f"insp-{uuid.uuid4().hex[:10]}"
        listing_id = f"list-{uuid.uuid4().hex[:8]}"
        timestamp_utc = datetime.now(timezone.utc).isoformat()
        target_markets = listing.destination_markets or ["US", "EU", "UK", "CA", "JP"]
        full_text = f"{listing.title}\n{listing.description}"

        # 1. Attribute Extraction (informal text -> structured technical parameters)
        extracted: ExtractedAttributes = await self.extractor.extract(
            title=listing.title,
            description=listing.description,
            raw_text=full_text
        )

        # 1b. Multi-Modal Vision OCR & Multi-Lingual Rosetta Stone Packaging Inspection
        packaging_analysis: PackagingAnalysisResult = await self.ocr_engine.inspect_packaging(
            image_base64=listing.image_base64,
            image_url=listing.image_url,
            front_image_base64=listing.front_image_base64,
            back_image_base64=listing.back_image_base64,
            barcode_raw=listing.barcode_raw,
            listing_title=listing.title,
            category_hint=listing.category_hint or "cosmetics",
            target_markets=target_markets
        )

        # 1c. 3-Way Triangulation (Listing Copy vs Physical Packaging Reality vs Destination Law)
        discrepancies = self.triangulation_engine.reconcile(
            listing=listing,
            extracted=extracted,
            packaging=packaging_analysis,
            target_markets=target_markets
        )
        packaging_analysis.discrepancies = discrepancies

        # 1d. GS1 Barcode Modulo-10 Check & ISO 7000 Handling Marks
        raw_barcode = listing.barcode_raw or packaging_analysis.detected_barcode
        barcode_analysis = self.barcode_validator.validate_barcode(raw_barcode)
        iso_symbols_detected = self.barcode_validator.detect_iso_symbols(
            text=full_text,
            detected_marks=packaging_analysis.detected_iso_symbols,
            category=extracted.category
        )

        # 1e. Mandatory Document & License Matrix Determination
        required_documents = self.document_matrix.determine_required_documents(
            category=extracted.category,
            target_markets=target_markets,
            has_battery=extracted.has_battery,
            raw_text=full_text
        )

        # 2. Deterministic Rule Engine Evaluation per Country (Tier 1 & Tier 3)
        matrix: Dict[str, List[ComplianceCheckResult]] = {}
        all_findings: List[ComplianceCheckResult] = []
        citations_set = set()

        listing_fields = {
            "country_of_origin": listing.country_of_origin,
            "ingredients": extracted.ingredients,
        }

        for country in target_markets:
            country_res = self.rule_engine.evaluate(
                country_code=country,
                extracted=extracted,
                raw_text=full_text,
                listing_fields=listing_fields,
            )
            matrix[country] = country_res
            all_findings.extend(country_res)
            for r in country_res:
                if r.rule_citation:
                    citations_set.add(r.rule_citation)

        # 3. Layer 1b: Classification Mismatch Detection
        mismatches = self.mismatch_detector.detect_mismatches(
            extracted=extracted,
            raw_text=full_text,
            target_markets=target_markets
        )
        for m in mismatches:
            if m.country_code in matrix:
                # Insert at top of country findings
                matrix[m.country_code].insert(0, m)
                all_findings.append(m)
                if m.rule_citation:
                    citations_set.add(m.rule_citation)

        # 4. Layer 3: Explicit Human Escalation Injection
        escalations = self.escalation_handler.identify_escalations(
            extracted=extracted,
            raw_text=full_text,
            target_markets=target_markets
        )
        for esc in escalations:
            if esc.country_code in matrix:
                # Add if not already present
                if not any(item.check_code == esc.check_code for item in matrix[esc.country_code]):
                    matrix[esc.country_code].append(esc)
                    all_findings.append(esc)
        # 4b. Layer 2: 3-Way Triangulation Discrepancies Injection
        for disc in discrepancies:
            disc_status = "violation" if "CRITICAL" in disc.severity or "HIGH" in disc.severity else "warning"
            disc_country = "CA" if "LANG" in disc.check_code else ("EU" if "LOGO" in disc.check_code else "US")
            if disc_country not in target_markets and target_markets:
                disc_country = target_markets[0]

            disc_check = ComplianceCheckResult(
                check_code=disc.check_code,
                country_code=disc_country,
                category="Packaging & Labeling Discrepancy",
                status=disc_status,
                trust_tier="Tier 2 Multi-Modal Triangulation",
                rule_citation=disc.destination_statute,
                extracted_value=disc.physical_label_reality[:120],
                expected_requirement=disc.listing_claim[:120],
                explanation=disc.border_impact,
                fix_suggestion="Update physical label packaging or revise digital marketing copy to ensure 100% alignment."
            )
            if disc_country in matrix:
                matrix[disc_country].append(disc_check)
            all_findings.append(disc_check)
            if disc.destination_statute:
                citations_set.add(disc.destination_statute)

        # 5. Summarize status counts per country
        summary_by_country: Dict[str, Dict[str, int]] = {}
        total_violations = 0
        total_escalations = 0
        total_warnings = 0

        for country, checks in matrix.items():
            counts = {"pass": 0, "warning": 0, "violation": 0, "escalation": 0}
            for c in checks:
                counts[c.status] = counts.get(c.status, 0) + 1
            summary_by_country[country] = counts
            total_violations += counts["violation"]
            total_escalations += counts["escalation"]
            total_warnings += counts["warning"]

        # Determine overall verdict
        if any(matrix[c][0].check_code == "CA-BAN-01" and matrix[c][0].status == "violation" for c in matrix if "CA" in matrix):
            overall_verdict = "IMPORT_PROHIBITED"
        elif total_violations > 0:
            overall_verdict = "REMEDIATION_REQUIRED"
        elif total_escalations > 0:
            overall_verdict = "ESCALATION_REQUIRED"
        elif total_warnings > 0:
            overall_verdict = "WARNINGS_DETECTED"
        else:
            overall_verdict = "COMPLIANT"

        # 6. Customs Seizure Risk Radar & Simulated Notice of Action (replaces old debate)
        critical_violations = [f for f in all_findings if f.status in ["violation", "escalation", "warning"]]
        customs_radar_result: CustomsSeizureRadarResult = self.customs_radar.evaluate_seizure_risk(
            listing=listing,
            extracted=extracted,
            violations=critical_violations,
            target_markets=target_markets,
        )

        # 7. Dynamic HS Code & Tariff Arbitrage Engine
        hs_tariff_result: HSTariffArbitrageResult = self.hs_tariff_engine.evaluate_hs_classification(
            listing=listing,
            extracted=extracted,
            violations=critical_violations,
        )

        # 8. Ground-Truth Verification Index (GTVI) Evaluator
        accuracy_index: GroundTruthAccuracyIndex = self.accuracy_evaluator.evaluate_accuracy(
            extracted=extracted,
            findings=all_findings,
        )

        # 9. Remediation / Auto-Rewrite Engine
        remediation_result: RemediationResult = await self.rewriter.rewrite(
            title=listing.title,
            description=listing.description,
            extracted=extracted,
            violations=critical_violations,
            target_markets=target_markets,
        )

        # 10. Trade Economics Advisor (De minimis, VAT/GST OSS, Market Entry Ranking)
        trade_economics: List[TradeEconomicsItem] = self.economics_advisor.evaluate_markets(
            target_markets=target_markets,
            product_price_usd=float(listing.price or 29.99),
            category=extracted.category,
        )

        # 11. Cryptographic Hash Chain Generation (SHA-256 Tamper-Evident Ledger)
        citations_list = sorted(list(citations_set))
        raw_matrix_list = [r.dict() for r in all_findings]

        compliance_hash = ComplianceHashChain.generate_compliance_hash(
            inspection_id=inspection_id,
            listing_id=listing_id,
            timestamp_utc=timestamp_utc,
            rule_engine_version=self.settings.RULE_ENGINE_VERSION,
            extracted_attributes=extracted.dict(),
            matrix_findings=raw_matrix_list,
            citations=citations_list,
            prev_hash=prev_hash,
        )

        # 12. 1-Click Amazon & Shopify Ready Export Pack
        export_pack = ExportPackGenerator.generate(
            listing=listing,
            remediation=remediation_result,
            extracted=extracted,
            hs_tariff=hs_tariff_result,
            customs_radar=customs_radar_result,
            target_markets=target_markets,
        )

        return AuditResponse(
            inspection_id=inspection_id,
            listing_id=listing_id,
            timestamp_utc=timestamp_utc,
            rule_engine_version=self.settings.RULE_ENGINE_VERSION,
            compliance_hash=compliance_hash,
            prev_hash=prev_hash or "GENESIS_BLOCK_00000000000000000000000000000000000000000000000000000000",
            overall_verdict=overall_verdict,
            destination_markets=target_markets,
            extracted_attributes=extracted,
            matrix=matrix,
            summary_by_country=summary_by_country,
            customs_radar=customs_radar_result,
            hs_tariff=hs_tariff_result,
            accuracy_index=accuracy_index,
            packaging_analysis=packaging_analysis,
            debate=None,
            remediation=remediation_result,
            export_pack=export_pack,
            required_documents=required_documents,
            barcode_analysis=barcode_analysis,
            iso_symbols_detected=iso_symbols_detected,
            trade_economics=trade_economics,
            citations=citations_list,
            is_hash_valid=True,
        )
