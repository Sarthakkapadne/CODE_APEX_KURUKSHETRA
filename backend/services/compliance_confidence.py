"""
LexPort — Compliance Confidence Score Engine
Calculates explainable compliance confidence score from four deterministic factors:
1. Rule Coverage (30%)
2. Evidence Verification (30%)
3. Product Data Completeness (20%)
4. Dependency Health (20%)

Integrates with DependencyGraphService and ImpactAnalysisService.
"""
from __future__ import annotations
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

from backend.services.dependency_graph import DependencyGraphService, DependencyGraphPayload
from backend.services.impact_analysis import ImpactAnalysisService, ImpactAnalysisResult


class FactorScore(BaseModel):
    name: str
    score: float  # 0.0 to 100.0
    weight: float  # e.g. 0.30
    weighted_score: float  # score * weight
    status: str  # "optimal" | "warning" | "critical"
    details: Dict[str, Any] = Field(default_factory=dict)
    explanation: str


class FactorBreakdown(BaseModel):
    rule_coverage: FactorScore
    evidence_verification: FactorScore
    product_data_completeness: FactorScore
    dependency_health: FactorScore


class ComplianceConfidenceResponse(BaseModel):
    product_id: Optional[str] = None
    target_market: Optional[str] = "ALL"
    confidence_score: float  # 0.0 to 100.0
    confidence_tier: str  # "HIGH" | "MEDIUM" | "LOW"
    confidence_label: str  # "High Confidence" | "Medium Confidence" | "Low Confidence"
    tier_color: str  # "emerald" | "amber" | "rose"
    verdict_summary: str
    factors: FactorBreakdown
    graph: DependencyGraphPayload
    impact_analysis: ImpactAnalysisResult
    is_simulated: bool = False
    simulated_nodes: List[str] = Field(default_factory=list)


class ComplianceConfidenceService:
    """
    Coordinates calculation of multi-factor confidence scores,
    downstream dependency graphs, and bottleneck impact analysis.
    """

    def __init__(self):
        self.graph_service = DependencyGraphService()
        self.impact_service = ImpactAnalysisService()

    def calculate_confidence(
        self,
        audit_data: Dict[str, Any],
        target_market: Optional[str] = None,
        simulated_resolved_ids: Optional[List[str]] = None,
    ) -> ComplianceConfidenceResponse:
        simulated_set = set(simulated_resolved_ids or [])
        is_sim = len(simulated_set) > 0

        # 1. Build Dependency Graph with propagation
        graph = self.graph_service.build_graph(
            audit_data=audit_data,
            target_market=target_market,
            simulated_resolved_ids=simulated_resolved_ids,
        )

        # 2. Factor 1: Rule Coverage (30%)
        rule_factor = self._compute_rule_coverage(audit_data, target_market, simulated_set)

        # 3. Factor 2: Evidence Verification (30%)
        evidence_factor = self._compute_evidence_verification(audit_data, target_market, simulated_set)

        # 4. Factor 3: Product Data Completeness (20%)
        data_factor = self._compute_data_completeness(audit_data, simulated_set)

        # 5. Factor 4: Dependency Health (20%)
        dep_factor = self._compute_dependency_health(graph)

        # 6. Composite Score Formula:
        # Confidence Score = (Rule Coverage * 30%) + (Evidence Verification * 30%) + (Product Data Completeness * 20%) + (Dependency Health * 20%)
        composite_score = round(
            (rule_factor.score * 0.30) +
            (evidence_factor.score * 0.30) +
            (data_factor.score * 0.20) +
            (dep_factor.score * 0.20),
            1,
        )
        composite_score = max(0.0, min(100.0, composite_score))

        # 7. Tier Classification
        if composite_score >= 80.0:
            tier = "HIGH"
            label = "High Confidence"
            color = "emerald"
            summary = "Audit-Ready: Mandatory rules pass and evidentiary proofs are verified with strong dependency integrity."
        elif composite_score >= 50.0:
            tier = "MEDIUM"
            label = "Medium Confidence"
            color = "amber"
            summary = "Action Required: Conditional clearance with outstanding lab tests, missing documentation, or warning flags."
        else:
            tier = "LOW"
            label = "Low Confidence"
            color = "rose"
            summary = "Critical Risk: High probability of customs seizure, border detention, or statutory non-compliance."

        breakdown = FactorBreakdown(
            rule_coverage=rule_factor,
            evidence_verification=evidence_factor,
            product_data_completeness=data_factor,
            dependency_health=dep_factor,
        )

        # 8. Impact Analysis ("What should I fix first?")
        # Helper lambda for isolated simulation score
        def sim_eval_fn(data, node_ids):
            return self._compute_quick_score(data, target_market, list(simulated_set.union(node_ids)))

        impact_result = self.impact_service.analyze_graph(
            graph=graph,
            audit_data=audit_data,
            base_confidence_score=composite_score,
            calculate_simulated_score_fn=sim_eval_fn,
        )

        return ComplianceConfidenceResponse(
            product_id=audit_data.get("inspection_id") or audit_data.get("listing_id"),
            target_market=target_market or "ALL",
            confidence_score=composite_score,
            confidence_tier=tier,
            confidence_label=label,
            tier_color=color,
            verdict_summary=summary,
            factors=breakdown,
            graph=graph,
            impact_analysis=impact_result,
            is_simulated=is_sim,
            simulated_nodes=list(simulated_set),
        )

    def _compute_rule_coverage(
        self,
        audit_data: Dict[str, Any],
        target_market: Optional[str],
        simulated_set: set,
    ) -> FactorScore:
        matrix = audit_data.get("matrix") or {}
        markets = [target_market] if target_market and target_market in matrix else list(matrix.keys())

        passed = 0
        warnings = 0
        violations = 0
        total = 0

        for mkt in markets:
            checks = matrix.get(mkt) or []
            for check in checks:
                total += 1
                reg_id = f"node_reg_{mkt}_{check.get('rule_code', 'rule')}"
                if reg_id in simulated_set:
                    passed += 1
                    continue

                status = check.get("status", "pass")
                if status == "pass":
                    passed += 1
                elif status == "warning":
                    warnings += 1
                else:
                    violations += 1

        if total == 0:
            score = 100.0
        else:
            score = round(((passed * 1.0) + (warnings * 0.5)) / total * 100, 1)

        status_flag = "optimal" if score >= 80 else ("warning" if score >= 50 else "critical")
        explanation = f"{passed}/{total} rules passing ({warnings} warnings, {violations} violations across {len(markets)} jurisdiction(s))."

        return FactorScore(
            name="Rule Coverage",
            score=score,
            weight=0.30,
            weighted_score=round(score * 0.30, 1),
            status=status_flag,
            details={"passed": passed, "warnings": warnings, "violations": violations, "total": total},
            explanation=explanation,
        )

    def _compute_evidence_verification(
        self,
        audit_data: Dict[str, Any],
        target_market: Optional[str],
        simulated_set: set,
    ) -> FactorScore:
        req_docs = audit_data.get("required_documents") or []
        applicable = [
            d for d in req_docs
            if not target_market or d.get("country_code") == target_market
        ]
        if not applicable:
            applicable = req_docs

        if not applicable:
            return FactorScore(
                name="Evidence Verification",
                score=100.0,
                weight=0.30,
                weighted_score=30.0,
                status="optimal",
                details={"verified": 0, "missing": 0, "total": 0},
                explanation="No mandatory lab tests or certificates required for this product class.",
            )

        verified = 0
        missing = 0
        for doc in applicable:
            raw_code = str(doc.get('doc_code', ''))
            raw_name = str(doc.get('doc_name', ''))
            doc_id = f"node_doc_{raw_code}"
            if "safety" in raw_name.lower() or "safety" in raw_code.lower():
                doc_id = "node_doc_safety_test_report"

            is_sim = (
                doc_id in simulated_set or
                f"action_{doc_id}" in simulated_set or
                ("safety" in raw_name.lower() and ("node_doc_safety_test_report" in simulated_set or "action_upload_safety_report" in simulated_set))
            )
            if is_sim or doc.get("seller_status") in ("verified", "exempt"):
                verified += 1
            else:
                missing += 1

        total = len(applicable)
        score = round((verified / total) * 100, 1) if total > 0 else 100.0
        status_flag = "optimal" if score >= 80 else ("warning" if score >= 50 else "critical")
        explanation = f"{verified}/{total} required evidentiary documents & lab certificates verified."

        return FactorScore(
            name="Evidence Verification",
            score=score,
            weight=0.30,
            weighted_score=round(score * 0.30, 1),
            status=status_flag,
            details={"verified": verified, "missing": missing, "total": total},
            explanation=explanation,
        )

    def _compute_data_completeness(
        self,
        audit_data: Dict[str, Any],
        simulated_set: set,
    ) -> FactorScore:
        extracted = audit_data.get("extracted_attributes") or {}
        
        checks = {
            "title": bool(audit_data.get("title") or extracted.get("detected_product_type")),
            "description": bool(audit_data.get("description") and len(str(audit_data.get("description"))) > 20),
            "category": bool(extracted.get("category")),
            "brand_name": bool(audit_data.get("brand_name")),
            "country_of_origin": bool(audit_data.get("country_of_origin")),
            "ingredients_or_materials": bool(extracted.get("ingredients") or extracted.get("materials")),
            "technical_specs": bool(extracted.get("materials") or extracted.get("contains_battery") is not None),
            "battery_safety_specs": not extracted.get("contains_battery", False) or bool(extracted.get("battery_type")),
            "user_instructions": bool(audit_data.get("description")),
            "packaging_art_or_label": bool(audit_data.get("packaging_analysis")),
        }

        # Handle simulation overrides
        if "attr_ingredients_spec" in simulated_set or "attr_materials_spec" in simulated_set:
            checks["ingredients_or_materials"] = True
        if "attr_mfg_origin" in simulated_set:
            checks["country_of_origin"] = True
            checks["brand_name"] = True
        if "attr_packaging_claims" in simulated_set:
            checks["packaging_art_or_label"] = True
        if "attr_safety_specs" in simulated_set:
            checks["battery_safety_specs"] = True
            checks["technical_specs"] = True

        total_fields = len(checks)
        present_fields = sum(1 for v in checks.values() if v)
        missing_keys = [k for k, v in checks.items() if not v]

        # For well-specified electronic listings with missing packaging OCR art, yield 90%
        score = round((present_fields / total_fields) * 100, 1)
        status_flag = "optimal" if score >= 80 else ("warning" if score >= 50 else "critical")
        explanation = f"{present_fields}/{total_fields} core listing & regulatory data fields complete."

        return FactorScore(
            name="Product Data Completeness",
            score=score,
            weight=0.20,
            weighted_score=round(score * 0.20, 1),
            status=status_flag,
            details={"present": present_fields, "total": total_fields, "missing": missing_keys},
            explanation=explanation,
        )

    def _compute_dependency_health(self, graph: DependencyGraphPayload) -> FactorScore:
        score = graph.dependency_health_score
        status_flag = "optimal" if score >= 80 else ("warning" if score >= 50 else "critical")
        explanation = f"{graph.verified_nodes}/{graph.total_nodes} nodes healthy; {graph.blocked_nodes} blocked by upstream gaps."

        return FactorScore(
            name="Dependency Health",
            score=score,
            weight=0.20,
            weighted_score=round(score * 0.20, 1),
            status=status_flag,
            details={
                "total_nodes": graph.total_nodes,
                "verified_nodes": graph.verified_nodes,
                "blocked_nodes": graph.blocked_nodes,
                "missing_nodes": graph.missing_nodes,
            },
            explanation=explanation,
        )

    def _compute_quick_score(
        self,
        audit_data: Dict[str, Any],
        target_market: Optional[str],
        simulated_resolved_ids: List[str],
    ) -> float:
        """Lightweight calculation of composite score for simulation candidate evaluation."""
        sim_set = set(simulated_resolved_ids)
        graph = self.graph_service.build_graph(audit_data, target_market, simulated_resolved_ids)
        r = self._compute_rule_coverage(audit_data, target_market, sim_set)
        e = self._compute_evidence_verification(audit_data, target_market, sim_set)
        d = self._compute_data_completeness(audit_data, sim_set)
        h = self._compute_dependency_health(graph)

        composite = round((r.score * 0.30) + (e.score * 0.30) + (d.score * 0.20) + (h.score * 0.20), 1)
        return max(0.0, min(100.0, composite))
