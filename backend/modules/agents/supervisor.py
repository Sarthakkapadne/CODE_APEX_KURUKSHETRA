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
    AdversarialDebateResult, RemediationResult, TradeEconomicsItem
)
from backend.core.hash_chain import ComplianceHashChain
from backend.modules.rule_engine.deterministic_engine import DeterministicRuleEngine
from backend.modules.agents.attribute_extractor import AttributeExtractorAgent
from backend.modules.agents.classification_mismatch import ClassificationMismatchDetector
from backend.modules.agents.adversarial_debate import AdversarialDebateEngine
from backend.modules.agents.remediation_rewriter import RemediationRewriterAgent
from backend.modules.agents.escalation_handler import EscalationHandler
from backend.modules.economics.trade_advisor import TradeEconomicsAdvisor
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
        self.mismatch_detector = ClassificationMismatchDetector()
        self.debate_engine = AdversarialDebateEngine()
        self.rewriter = RemediationRewriterAgent()
        self.escalation_handler = EscalationHandler()
        self.economics_advisor = TradeEconomicsAdvisor()

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
                    if esc.rule_citation:
                        citations_set.add(esc.rule_citation)

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

        # 6. Adversarial Inspection Debate (Customs Inspector vs Seller Advocate)
        critical_violations = [f for f in all_findings if f.status in ["violation", "escalation", "warning"]]
        debate_result: AdversarialDebateResult = await self.debate_engine.run_debate(
            title=listing.title,
            description=listing.description,
            extracted=extracted,
            violations=critical_violations,
            target_markets=target_markets,
        )

        # 7. Remediation / Auto-Rewrite Engine
        remediation_result: RemediationResult = await self.rewriter.rewrite(
            title=listing.title,
            description=listing.description,
            extracted=extracted,
            violations=critical_violations,
            target_markets=target_markets,
        )

        # 8. Trade Economics Advisor (De minimis, VAT/GST OSS, Market Entry Ranking)
        trade_economics: List[TradeEconomicsItem] = self.economics_advisor.evaluate_markets(
            target_markets=target_markets,
            product_price_usd=float(listing.price or 29.99),
            category=extracted.category,
        )

        # 9. Cryptographic Hash Chain Generation (SHA-256 Tamper-Evident Ledger)
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
            debate=debate_result,
            remediation=remediation_result,
            trade_economics=trade_economics,
            citations=citations_list,
            is_hash_valid=True,
        )
