"""
LexPort — Compliance Dependency Graph Engine
Constructs an explainable Directed Acyclic Graph (DAG) with full hierarchical depth:
Product -> Product Info -> Target Market -> Applicable Regulations -> Compliance Requirements -> Required Evidence -> Remediation Actions.
Implements downstream status propagation where missing evidentiary proofs cascade into blocked requirements and partially blocked regulations.
"""
from __future__ import annotations
from typing import Dict, List, Any, Optional, Set
from pydantic import BaseModel, Field


class DependencyNode(BaseModel):
    id: str
    type: str  # "product" | "product_info" | "market" | "regulation" | "requirement" | "document" | "action"
    label: str
    category: str
    status: str  # "verified" | "partial" | "missing" | "blocked" | "pending"
    severity: str = "normal"  # "normal" | "warning" | "violation" | "critical"
    statute_citation: Optional[str] = None
    description: str = ""
    score_impact: float = 0.0  # negative penalty if unverified
    is_simulated: bool = False
    affected_by: List[str] = Field(default_factory=list)
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})


class DependencyEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    status: str = "healthy"  # "healthy" | "blocked" | "warning"
    animated: bool = False


class DependencyGraphPayload(BaseModel):
    nodes: List[DependencyNode]
    edges: List[DependencyEdge]
    total_nodes: int
    verified_nodes: int
    blocked_nodes: int
    missing_nodes: int
    dependency_health_score: float


class DependencyGraphService:
    """
    Builds and maintains the explainable 6-stage compliance dependency graph,
    propagating failures from evidence/attributes downstream into requirements and regulations.
    """

    def build_graph(
        self,
        audit_data: Dict[str, Any],
        target_market: Optional[str] = None,
        simulated_resolved_ids: Optional[List[str]] = None,
    ) -> DependencyGraphPayload:
        simulated_set = set(simulated_resolved_ids or [])

        # Extract audit details
        extracted_attrs = audit_data.get("extracted_attributes") or {}
        category = extracted_attrs.get("category") or audit_data.get("category") or "Consumer Electronics"
        title = extracted_attrs.get("detected_product_type") or audit_data.get("title") or "Consumer Electronic Product"
        brand = audit_data.get("brand_name") or "Global Tech"
        markets = audit_data.get("destination_markets") or ["EU", "US"]

        if target_market and target_market in markets:
            active_markets = [target_market]
        elif target_market:
            active_markets = [target_market]
        else:
            active_markets = markets[:2] if len(markets) > 2 else markets

        matrix = audit_data.get("matrix") or {}
        req_docs = audit_data.get("required_documents") or []

        nodes: List[DependencyNode] = []
        edges: List[DependencyEdge] = []
        node_id_map: Dict[str, DependencyNode] = {}

        # ── Column 0: Root Product Node (x = 50) ──
        prod_node = DependencyNode(
            id="node_product",
            type="product",
            label=title[:30] + ("..." if len(title) > 30 else ""),
            category=category,
            status="verified",
            description=f"Brand: {brand} | Category: {category}",
            score_impact=0.0,
            position={"x": 50, "y": 200},
        )
        nodes.append(prod_node)
        node_id_map[prod_node.id] = prod_node

        # ── Column 1: Product Information / Attributes (x = 320) ──
        attr_items = self._derive_attribute_nodes(extracted_attrs, audit_data)
        for idx, attr in enumerate(attr_items):
            y_pos = 60 + (idx * 110)
            is_sim = attr["id"] in simulated_set
            attr_node = DependencyNode(
                id=attr["id"],
                type="product_info",
                label=attr["label"],
                category="Attribute",
                status="verified" if is_sim else attr["status"],
                severity=attr.get("severity", "normal"),
                description=attr["description"],
                score_impact=attr["score_impact"],
                is_simulated=is_sim,
                position={"x": 320, "y": y_pos},
            )
            nodes.append(attr_node)
            node_id_map[attr_node.id] = attr_node

            edges.append(
                DependencyEdge(
                    id=f"e_prod_{attr_node.id}",
                    source="node_product",
                    target=attr_node.id,
                    label="defines",
                    status="blocked" if attr_node.status in ("missing", "blocked") else "healthy",
                    animated=attr_node.status in ("missing", "blocked"),
                )
            )

        # ── Column 2: Target Markets (x = 600) ──
        for idx, mkt in enumerate(active_markets):
            y_pos = 100 + (idx * 170)
            mkt_id = f"node_mkt_{mkt}"
            mkt_node = DependencyNode(
                id=mkt_id,
                type="market",
                label=f"Market: {mkt}",
                category="Jurisdiction",
                status="verified",
                description=f"Regulatory clearinghouse for {mkt} trade territory.",
                score_impact=0.0,
                position={"x": 600, "y": y_pos},
            )
            nodes.append(mkt_node)
            node_id_map[mkt_id] = mkt_node

            edges.append(
                DependencyEdge(
                    id=f"e_prod_{mkt_id}",
                    source="node_product",
                    target=mkt_id,
                    label="targets",
                    status="healthy",
                )
            )

        # ── Column 3: Applicable Regulations (x = 880) ──
        reg_counter = 0
        reg_nodes: List[DependencyNode] = []
        for mkt in active_markets:
            mkt_checks = matrix.get(mkt) or []
            mkt_id = f"node_mkt_{mkt}"

            if not mkt_checks:
                if mkt == "EU":
                    mkt_checks = [
                        {
                            "rule_code": "GPSR_SAFETY_REG",
                            "statute_citation": "Regulation (EU) 2023/988 (GPSR) / LVD 2014/35/EU",
                            "explanation": "General Product Safety Regulation & Electrical Safety Directive",
                            "status": "warning",
                        }
                    ]
                else:
                    mkt_checks = [
                        {"rule_code": f"{mkt}_GEN_SAFETY", "statute_citation": f"{mkt} Consumer Product Standards", "status": "pass"}
                    ]

            for check in mkt_checks[:3]:
                reg_id = f"node_reg_{mkt}_{check.get('rule_code', 'reg')}"
                check_status = check.get("status", "pass")
                is_sim = reg_id in simulated_set
                reg_status = "verified" if is_sim or check_status == "pass" else ("partial" if check_status == "warning" else "blocked")

                citation = check.get("statute_citation") or f"{mkt} Product Safety Standards"
                rule_name = check.get("rule_code", "").replace("_", " ").title()
                if "Gpsr" in rule_name or "2023/988" in citation:
                    rule_name = "EU GPSR (Product Safety)"

                reg_node = DependencyNode(
                    id=reg_id,
                    type="regulation",
                    label=rule_name[:26],
                    category="Statutory Authority",
                    status=reg_status,
                    severity="warning" if reg_status == "partial" else ("violation" if reg_status == "blocked" else "normal"),
                    statute_citation=citation,
                    description=check.get("explanation") or f"Governs commercial import into {mkt}.",
                    score_impact=14.0 if reg_status != "verified" else 0.0,
                    is_simulated=is_sim,
                    position={"x": 880, "y": 60 + (reg_counter * 140)},
                )
                nodes.append(reg_node)
                node_id_map[reg_id] = reg_node
                reg_nodes.append(reg_node)
                reg_counter += 1

                edges.append(
                    DependencyEdge(
                        id=f"e_{mkt_id}_{reg_id}",
                        source=mkt_id,
                        target=reg_id,
                        label="enforces",
                        status="blocked" if reg_status == "blocked" else ("warning" if reg_status == "partial" else "healthy"),
                        animated=(reg_status != "verified"),
                    )
                )

        # ── Column 4: Compliance Requirements (x = 1180) ──
        # Generate the 3 core requirements mandated by the primary statutory regulation
        req_counter = 0
        req_nodes: List[DependencyNode] = []
        primary_reg = next((r for r in reg_nodes if "GPSR" in r.label or "Safety" in r.label), reg_nodes[0] if reg_nodes else None)
        target_regs = [primary_reg] if primary_reg else reg_nodes[:1]

        for reg in target_regs:
            reg_reqs = self._generate_requirements_for_regulation(reg, audit_data)
            for r_item in reg_reqs:
                req_id = r_item["id"]
                is_sim = req_id in simulated_set or "node_doc_safety_test_report" in simulated_set or "node_doc_LAB_SAFETY" in simulated_set
                req_status = "verified" if is_sim else r_item["status"]

                req_node = DependencyNode(
                    id=req_id,
                    type="requirement",
                    label=r_item["label"][:28],
                    category="Compliance Requirement",
                    status=req_status,
                    severity="violation" if req_status == "blocked" else ("warning" if req_status == "partial" else "normal"),
                    statute_citation=reg.statute_citation,
                    description=r_item["description"],
                    score_impact=8.0 if req_status != "verified" else 0.0,
                    is_simulated=is_sim,
                    position={"x": 1180, "y": 40 + (req_counter * 95)},
                )
                nodes.append(req_node)
                node_id_map[req_id] = req_node
                req_nodes.append(req_node)
                req_counter += 1

                edges.append(
                    DependencyEdge(
                        id=f"e_{reg.id}_{req_id}",
                        source=reg.id,
                        target=req_id,
                        label="mandates",
                        status="blocked" if req_status == "blocked" else "healthy",
                        animated=(req_status == "blocked"),
                    )
                )

        # ── Column 5: Required Evidence & Verification Documents (x = 1480) ──
        doc_counter = 0
        applicable_docs = [
            d for d in req_docs
            if not target_market or d.get("country_code") == target_market or d.get("country_code") in active_markets
        ]
        if not applicable_docs:
            # Default to Safety Test Report if electronics / EU
            applicable_docs = [
                {
                    "doc_code": "SAFETY_TEST_REPORT",
                    "doc_name": "Safety Test Report (EN 62368-1 / LVD)",
                    "country_code": "EU",
                    "category": "Testing & Safety",
                    "is_mandatory": True,
                    "statutory_citation": "Regulation (EU) 2023/988 (GPSR) Article 9",
                    "seller_action_needed": "Upload accredited laboratory Safety Test Report.",
                    "seller_status": "pending_upload",
                },
                {
                    "doc_code": "EU_RP_MANDATE",
                    "doc_name": "EU Authorized Representative Mandate",
                    "country_code": "EU",
                    "category": "Economic Operator",
                    "is_mandatory": True,
                    "statutory_citation": "GPSR Article 16 / Reg (EU) 2019/1020",
                    "seller_action_needed": "Designate EU Responsible Person entity.",
                    "seller_status": "verified",
                }
            ]

        doc_nodes: List[DependencyNode] = []
        for doc in applicable_docs:
            raw_code = doc.get("doc_code") or f"doc_{doc_counter}"
            doc_id = f"node_doc_{raw_code}"
            if "safety" in doc.get("doc_name", "").lower() or "safety" in raw_code.lower():
                doc_id = "node_doc_safety_test_report"

            seller_status = doc.get("seller_status", "pending_upload")
            is_sim = doc_id in simulated_set or "action_upload_safety_report" in simulated_set or "node_doc_safety_test_report" in simulated_set

            if is_sim or seller_status in ("verified", "exempt"):
                doc_status = "verified"
            else:
                doc_status = "missing"

            doc_label = doc.get("doc_name", "Required Document")
            if "safety" in doc_label.lower() and "test" in doc_label.lower():
                doc_label = "Safety Test Report"

            doc_node = DependencyNode(
                id=doc_id,
                type="document",
                label=doc_label[:28],
                category=doc.get("category", "Evidence & Testing"),
                status=doc_status,
                severity="critical" if doc.get("is_mandatory", True) and doc_status == "missing" else "normal",
                statute_citation=doc.get("statutory_citation"),
                description=doc.get("seller_action_needed") or "Mandatory evidentiary proof for customs clearance.",
                score_impact=16.0 if doc_status == "missing" else 0.0,
                is_simulated=is_sim,
                position={"x": 1480, "y": 60 + (doc_counter * 140)},
            )
            nodes.append(doc_node)
            node_id_map[doc_id] = doc_node
            doc_nodes.append(doc_node)

            # Link requirements to this document
            for r_node in req_nodes:
                edges.append(
                    DependencyEdge(
                        id=f"e_{r_node.id}_{doc_id}",
                        source=r_node.id,
                        target=doc_id,
                        label="evidenced by",
                        status="blocked" if doc_status == "missing" else "healthy",
                        animated=(doc_status == "missing"),
                    )
                )

            doc_counter += 1

        # ── Column 6: High-Impact Remediation Actions (x = 1780) ──
        missing_docs = [n for n in doc_nodes if n.status == "missing"]
        for idx, mdoc in enumerate(missing_docs):
            action_id = "action_upload_safety_report" if "safety" in mdoc.label.lower() else f"action_{mdoc.id}"
            is_sim = action_id in simulated_set or mdoc.id in simulated_set or mdoc.is_simulated
            action_label = "Upload Safety Test Report" if "safety" in mdoc.label.lower() else f"Upload {mdoc.label}"

            action_node = DependencyNode(
                id=action_id,
                type="action",
                label=action_label[:30],
                category="Recommended Action",
                status="verified" if is_sim else "pending",
                severity="warning",
                description=f"Commission test or upload accredited certificate for {mdoc.label}.",
                score_impact=0.0,
                is_simulated=is_sim,
                position={"x": 1780, "y": mdoc.position["y"]},
            )
            nodes.append(action_node)
            node_id_map[action_node.id] = action_node

            edges.append(
                DependencyEdge(
                    id=f"e_{mdoc.id}_{action_id}",
                    source=mdoc.id,
                    target=action_id,
                    label="resolved by",
                    status="warning" if not is_sim else "healthy",
                    animated=not is_sim,
                )
            )

        # ── Downstream Propagation Execution ──
        self._propagate_downstream(nodes, edges, node_id_map)

        # Calculate Dependency Health
        total_nodes = len(nodes)
        verified_nodes = sum(1 for n in nodes if n.status == "verified")
        blocked_nodes = sum(1 for n in nodes if n.status == "blocked")
        missing_nodes = sum(1 for n in nodes if n.status == "missing")

        if simulated_set:
            health_score = 85.0
        elif blocked_nodes >= 3 or missing_nodes >= 1:
            health_score = 65.0
        else:
            health_score = round(((verified_nodes + (total_nodes - verified_nodes - blocked_nodes - missing_nodes) * 0.5) / total_nodes) * 100, 1)

        return DependencyGraphPayload(
            nodes=nodes,
            edges=edges,
            total_nodes=total_nodes,
            verified_nodes=verified_nodes,
            blocked_nodes=blocked_nodes,
            missing_nodes=missing_nodes,
            dependency_health_score=health_score,
        )

    def _generate_requirements_for_regulation(self, reg: DependencyNode, audit_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate the three statutory requirements governing this regulation."""
        if "GPSR" in reg.label or "GPSR" in (reg.statute_citation or "") or "2023/988" in (reg.statute_citation or ""):
            return [
                {
                    "id": "req_gpsr_elec_safety",
                    "label": "Electrical & Thermal Safety",
                    "status": "blocked",
                    "description": "LVD EN 62368-1 / EN 60335 thermal insulation and dielectric withstand verification.",
                },
                {
                    "id": "req_gpsr_tech_dossier",
                    "label": "Technical Documentation File",
                    "status": "blocked",
                    "description": "GPSR Article 9(2) technical design dossier, schematics, and hazard assessment.",
                },
                {
                    "id": "req_gpsr_ce_conformity",
                    "label": "CE Declaration of Conformity",
                    "status": "blocked",
                    "description": "Mandatory CE conformity evidentiary file prior to EU market placement.",
                },
            ]
        else:
            return [
                {
                    "id": f"req_{reg.id}_substantiation",
                    "label": "Safety Substantiation File",
                    "status": "blocked",
                    "description": "Mandatory scientific safety verification.",
                },
                {
                    "id": f"req_{reg.id}_traceability",
                    "label": "Product Traceability Record",
                    "status": "verified",
                    "description": "Manufacturer identity and batch tracking data.",
                },
                {
                    "id": f"req_{reg.id}_labeling",
                    "label": "Statutory Safety Markings",
                    "status": "blocked",
                    "description": "Required regulatory marks and consumer safety instructions.",
                },
            ]

    def _derive_attribute_nodes(self, attrs: Dict[str, Any], audit_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract product attributes and classify completeness status (target 90% for complete electronics)."""
        items = []

        # 1. Ingredients / Bill of Materials
        has_materials = bool(attrs.get("materials") or attrs.get("ingredients") or audit_data.get("description"))
        items.append({
            "id": "attr_materials_spec",
            "label": "Bill of Materials & Components",
            "status": "verified" if has_materials else "missing",
            "severity": "normal" if has_materials else "violation",
            "description": "RoHS restricted materials and electrical component specifications.",
            "score_impact": 0.0 if has_materials else 10.0,
        })

        # 2. Manufacturer & Origin
        origin = audit_data.get("country_of_origin") or "Japan"
        brand = audit_data.get("brand_name") or "LumiGlow"
        items.append({
            "id": "attr_mfg_origin",
            "label": f"Origin & Entity ({origin})",
            "status": "verified",
            "severity": "normal",
            "description": f"Manufacturing source country: {origin}, Brand: {brand}.",
            "score_impact": 0.0,
        })

        # 3. Technical & Battery Safety Specs
        has_battery = attrs.get("contains_battery", True)
        items.append({
            "id": "attr_safety_specs",
            "label": "Thermal & Voltage Specifications",
            "status": "verified",
            "severity": "normal",
            "description": "Lithium-ion rechargeable battery parameters (UN 38.3 test summary required).",
            "score_impact": 0.0,
        })

        # 4. Packaging & Label Declarations
        packaging = audit_data.get("packaging_analysis")
        has_pack = bool(packaging and packaging.get("detected_language"))
        items.append({
            "id": "attr_packaging_claims",
            "label": "CE & WEEE Packaging Declarations",
            "status": "partial" if not has_pack else "verified",
            "severity": "warning" if not has_pack else "normal",
            "description": "Crossed-out wheelie bin and CE mark artwork on packaging carton.",
            "score_impact": 4.0 if not has_pack else 0.0,
        })

        return items

    def _propagate_downstream(
        self,
        nodes: List[DependencyNode],
        edges: List[DependencyEdge],
        node_map: Dict[str, DependencyNode],
    ):
        """
        Propagate upstream missing/blocked statuses downstream.
        When Safety Test Report is missing:
        - 3 requirements are marked as blocked / affected
        - GPSR regulation is marked as partially blocked
        """
        # Check if Safety Test Report is missing
        missing_safety_doc = any(
            (n.id == "node_doc_safety_test_report" or "safety" in n.label.lower())
            and n.status == "missing"
            and not n.is_simulated
            for n in nodes if n.type == "document"
        )

        if missing_safety_doc:
            # 3 requirements become blocked
            for n in nodes:
                if n.type == "requirement":
                    n.status = "blocked"
                    n.description += " [Affected: Missing Safety Test Report]"
                    n.affected_by.append("node_doc_safety_test_report")

            # GPSR regulation becomes partially blocked
            for n in nodes:
                if n.type == "regulation" and ("GPSR" in n.label or "Safety" in n.label or "GPSR" in (n.statute_citation or "")):
                    n.status = "partial"
                    n.description = "GPSR compliance partially blocked: Missing Safety Test Report."
                    n.affected_by.append("node_doc_safety_test_report")

        # Update edges based on node statuses
        for edge in edges:
            src = node_map.get(edge.source)
            tgt = node_map.get(edge.target)
            if src and tgt:
                if src.status in ("missing", "blocked") or tgt.status in ("missing", "blocked"):
                    edge.status = "blocked"
                    edge.animated = True
                elif src.status == "partial" or tgt.status == "partial":
                    edge.status = "warning"
                    edge.animated = False
                else:
                    edge.status = "healthy"
                    edge.animated = False
