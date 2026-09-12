"""
LexPort — Impact Analysis Engine ("What Should I Fix First?")
Ranks missing compliance evidence, tests, and attributes by their marginal contribution
to the overall confidence score (Delta %) and downstream graph reach.
"""
from __future__ import annotations
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

from backend.services.dependency_graph import DependencyGraphPayload, DependencyNode


class ImpactItem(BaseModel):
    id: str
    node_id: str
    title: str
    category: str
    priority_rank: int
    current_status: str
    confidence_gain_pct: float
    downstream_nodes_unlocked: int
    affected_markets: List[str] = Field(default_factory=list)
    statutory_citation: Optional[str] = None
    action_directive: str
    effort_level: str = "Medium"  # "Quick Fix" | "Medium" | "Comprehensive"
    is_simulated: bool = False


class ImpactAnalysisResult(BaseModel):
    top_recommended_action: Optional[ImpactItem] = None
    all_actions: List[ImpactItem] = Field(default_factory=list)
    top_score_reducers: List[Dict[str, Any]] = Field(default_factory=list)
    total_potential_gain_pct: float = 0.0


class ImpactAnalysisService:
    """
    Analyzes dependency bottlenecks and calculates mathematical marginal gain
    for resolving each missing evidence node or product attribute.
    """

    def analyze_graph(
        self,
        graph: DependencyGraphPayload,
        audit_data: Dict[str, Any],
        base_confidence_score: float,
        calculate_simulated_score_fn,
    ) -> ImpactAnalysisResult:
        # Find all nodes that are currently hurting the score
        missing_nodes = [
            n for n in graph.nodes
            if n.status in ("missing", "blocked", "partial") and n.type in ("document", "product_info", "regulation") and not n.is_simulated
        ]

        if not missing_nodes:
            return ImpactAnalysisResult(
                top_recommended_action=None,
                all_actions=[],
                top_score_reducers=[],
                total_potential_gain_pct=0.0,
            )

        impact_candidates: List[ImpactItem] = []

        # Find downstream reach by tracing edges
        forward_edges: Dict[str, List[str]] = {}
        for edge in graph.edges:
            forward_edges.setdefault(edge.source, []).append(edge.target)

        markets = audit_data.get("destination_markets") or ["US", "EU"]

        for node in missing_nodes:
            # Count downstream reach
            affected_reqs = sum(1 for n in graph.nodes if n.type == "requirement" and (node.id in n.affected_by or ("safety" in node.label.lower() and "safety" in n.id.lower())))
            reach_count = affected_reqs if affected_reqs > 0 else self._count_downstream_reach(node.id, forward_edges)
            
            # Simulate resolving only this node and compute delta score
            sim_score = calculate_simulated_score_fn(audit_data, [node.id])
            delta = round(max(0.5, sim_score - base_confidence_score), 1)

            # Determine effort & directive
            if "safety" in node.label.lower() or "safety" in node.id.lower():
                action_title = "Upload Safety Test Report"
                directive = "Upload accredited Safety Test Report (EN 62368-1 / LVD) to unblock 3 requirements and resolve GPSR compliance."
                effort = "Lab Inspection (3-5 Days)"
            elif "Attribute" in node.category or node.type == "product_info":
                action_title = f"Resolve: {node.label}"
                directive = node.description or f"Complete missing listing attribute: {node.label}."
                effort = "Quick Fix (Listing Edit)"
            else:
                action_title = f"Resolve: {node.label}"
                directive = node.description or f"Complete and upload evidentiary proof for {node.label}."
                effort = "Document Submission"

            # Relevant markets
            node_mkts = [m for m in markets if m in node.id or m in (node.statute_citation or "")]
            if not node_mkts:
                node_mkts = markets[:2]

            candidate = ImpactItem(
                id=f"impact_{node.id}",
                node_id=node.id,
                title=action_title,
                category=node.category,
                priority_rank=0,
                current_status=node.status,
                confidence_gain_pct=delta,
                downstream_nodes_unlocked=reach_count,
                affected_markets=node_mkts,
                statutory_citation=node.statute_citation,
                action_directive=directive,
                effort_level=effort,
                is_simulated=node.is_simulated,
            )
            impact_candidates.append(candidate)

        # Rank candidates by confidence gain desc, then downstream reach desc
        impact_candidates.sort(key=lambda x: (x.confidence_gain_pct, x.downstream_nodes_unlocked), reverse=True)

        for rank, item in enumerate(impact_candidates, start=1):
            item.priority_rank = rank

        top_action = impact_candidates[0] if impact_candidates else None
        
        # Build Top Reducers summary for Section B
        top_reducers = []
        for item in impact_candidates[:5]:
            top_reducers.append({
                "node_id": item.node_id,
                "label": item.title,
                "category": item.category,
                "penalty_pct": item.confidence_gain_pct,
                "citation": item.statutory_citation or "Mandatory statutory clearance requirement",
                "directive": item.action_directive,
                "status": item.current_status,
            })

        total_gain = round(min(100.0 - base_confidence_score, sum(i.confidence_gain_pct for i in impact_candidates)), 1)

        return ImpactAnalysisResult(
            top_recommended_action=top_action,
            all_actions=impact_candidates,
            top_score_reducers=top_reducers,
            total_potential_gain_pct=total_gain,
        )

    def _count_downstream_reach(self, start_id: str, edges: Dict[str, List[str]]) -> int:
        visited = set()
        queue = [start_id]
        while queue:
            curr = queue.pop(0)
            for neighbor in edges.get(curr, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return len(visited)
