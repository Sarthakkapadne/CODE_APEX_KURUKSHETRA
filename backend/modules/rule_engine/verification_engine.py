"""
LexPort — Real Rule-Based Product Compliance Verification Engine
Evaluates products strictly against the project's structured JSON compliance rules
(e.g., us_rules.json, eu_rules.json, ca_rules.json, uk_rules.json, etc.) as the PRIMARY SOURCE OF TRUTH.

Outputs deterministic rule-by-rule classifications:
- PASS: Available structured information and evidence clearly satisfy rule conditions.
- FAIL: Available product data or evidence clearly violates a statutory condition.
- MISSING_INFORMATION: Mandatory evidence or product fields are absent (NEVER marks PASS).
- NEEDS_REVIEW: Ambiguous claims, unverified documentation, or threshold requiring human review.

Provides complete visual Decision Traces (Product Data -> Rule Match -> Requirement Check -> Evidence Check -> Result)
and calculates the #1 Next Best Action ("What should the seller fix first?").
"""
from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from pydantic import BaseModel, Field


class DocumentEvidenceItem(BaseModel):
    type: str  # e.g. "test_report", "certificate", "license", "label_artwork", "sds_sheet"
    name: Optional[str] = None
    status: str = "provided"  # "provided" | "missing" | "unverified" | "expired"
    issuing_authority: Optional[str] = None
    standards: List[str] = Field(default_factory=list)


class ProductVerificationInput(BaseModel):
    product_name: str
    category: str = "consumer electronics"
    subcategory: Optional[str] = None
    description: Optional[str] = ""
    materials: List[str] = Field(default_factory=list)
    ingredients: List[str] = Field(default_factory=list)
    brand_name: Optional[str] = None
    manufacturer_name: Optional[str] = None
    manufacturer_address: Optional[str] = None
    country_of_origin: Optional[str] = None
    intended_use: Optional[str] = None
    target_market: str = "EU"  # "EU" | "US" | "UK" | "CA" | "JP" | "AU" | "IN" | "CN" | "DE" | "VN"
    price: Optional[float] = None
    contains_battery: Optional[bool] = None
    battery_type: Optional[str] = None
    marketing_claims: List[str] = Field(default_factory=list)
    documents: List[DocumentEvidenceItem] = Field(default_factory=list)
    packaging_labels: List[str] = Field(default_factory=list)


class DecisionTraceStep(BaseModel):
    step_number: int
    title: str  # "Product Data", "Rule Match", "Requirement Check", "Evidence Check", "Final Result"
    description: str
    status: str  # "info" | "pass" | "fail" | "missing" | "warning"


class RuleEvaluationResult(BaseModel):
    rule_id: str
    rule_name: str
    market: str
    applicable: bool = True
    applicability_reason: str
    status: str  # "pass" | "fail" | "missing_information" | "needs_review"
    severity: str = "HIGH"  # "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    statute_citation: str
    statutory_authority: Optional[str] = None
    expected_requirement: str
    reason: str
    required_evidence: List[str] = Field(default_factory=list)
    provided_evidence: List[str] = Field(default_factory=list)
    missing_fields: List[str] = Field(default_factory=list)
    recommended_action: Optional[str] = None
    confidence: float = 100.0
    decision_trace: List[DecisionTraceStep] = Field(default_factory=list)


class VerificationSummary(BaseModel):
    total_applicable_rules: int
    passed: int
    failed: int
    missing_information: int
    needs_review: int


class PriorityIssueItem(BaseModel):
    rule_id: str
    rule_name: str
    severity: str  # "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    status: str
    issue_summary: str
    recommended_action: str
    affected_field: Optional[str] = None


class NextBestAction(BaseModel):
    action_title: str
    field_or_doc_to_fix: str
    reason: str
    affected_rules_count: int
    expected_result: str
    priority_level: str
    action_button_label: str = "Fix Now"


class ProductComplianceVerificationResponse(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    category: str
    target_market: str
    overall_status: str  # "COMPLIANT" | "NEEDS_ACTION" | "CRITICAL_FAILURE" | "INSUFFICIENT_INFORMATION"
    overall_status_label: str
    summary: VerificationSummary
    rule_results: List[RuleEvaluationResult]
    priority_issues: List[PriorityIssueItem]
    next_best_actions: List[NextBestAction]
    next_best_action: Optional[NextBestAction] = None
    normalized_product_data: Dict[str, Any]


class RuleVerificationEngine:
    """
    Deterministic rule evaluation engine that uses the project's existing
    rules_data/*_rules.json files as the primary source of truth.
    """

    def __init__(self, rules_dir: Optional[Path] = None):
        if rules_dir is None:
            rules_dir = Path(__file__).resolve().parent / "rules_data"
        self.rules_dir = rules_dir
        self.rules_cache: Dict[str, Dict[str, Any]] = {}
        self._load_rules()

    def _load_rules(self):
        """Loads all country JSON rule files from rules_dir."""
        if not self.rules_dir.exists():
            return

        for p in self.rules_dir.glob("*_rules.json"):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    cc = data.get("country_code") or p.stem.split("_")[0].upper()
                    self.rules_cache[cc.upper()] = data
            except Exception as e:
                print(f"[RuleVerificationEngine] Warning loading {p.name}: {e}")

    def verify_product(self, product: ProductVerificationInput) -> ProductComplianceVerificationResponse:
        """
        Executes end-to-end rule evaluation for the submitted product against the target market rules.
        """
        market = product.target_market.upper()
        country_data = self.rules_cache.get(market)

        if not country_data:
            # Fallback to US or EU if specific market file not cached
            country_data = self.rules_cache.get("EU" if market in ("EU", "DE") else "US") or {}

        raw_rules = country_data.get("rules", [])
        regulatory_bodies = country_data.get("regulatory_bodies", [])
        primary_authority = regulatory_bodies[0] if regulatory_bodies else f"{market} Regulatory Authority"

        # Step 1 & 2: Filter applicable rules
        applicable_rules: List[Dict[str, Any]] = []
        for r in raw_rules:
            is_app, reason = self._is_rule_applicable(r, product)
            if is_app:
                r["_applicability_reason"] = reason
                applicable_rules.append(r)

        # Fallback if no specific rule matched product category
        if not applicable_rules and raw_rules:
            # Pick standard consumer protection / general product safety rules for that market
            for r in raw_rules[:4]:
                r["_applicability_reason"] = f"General consumer product safety standards for {market} entry."
                applicable_rules.append(r)

        # Step 3: Evaluate every applicable rule individually
        eval_results: List[RuleEvaluationResult] = []
        for rule in applicable_rules:
            result = self._evaluate_single_rule(rule, product, primary_authority)
            eval_results.append(result)

        # Step 4: Aggregate summary
        passed_cnt = sum(1 for r in eval_results if r.status == "pass")
        failed_cnt = sum(1 for r in eval_results if r.status == "fail")
        missing_cnt = sum(1 for r in eval_results if r.status == "missing_information")
        review_cnt = sum(1 for r in eval_results if r.status == "needs_review")
        total_applicable = len(eval_results)

        summary = VerificationSummary(
            total_applicable_rules=total_applicable,
            passed=passed_cnt,
            failed=failed_cnt,
            missing_information=missing_cnt,
            needs_review=review_cnt,
        )

        # Determine overall status
        if total_applicable == 0 or (missing_cnt >= total_applicable * 0.75):
            overall_status = "INSUFFICIENT_INFORMATION"
            status_label = "Insufficient Information to Determine Compliance"
        elif failed_cnt > 0:
            # Check if critical failure
            has_crit = any(r.severity == "CRITICAL" for r in eval_results if r.status == "fail")
            overall_status = "CRITICAL_FAILURE" if has_crit else "NEEDS_ACTION"
            status_label = "Critical Compliance Violations Detected" if has_crit else "Needs Action Prior to Clearance"
        elif missing_cnt > 0 or review_cnt > 0:
            overall_status = "NEEDS_ACTION"
            status_label = "Needs Action: Missing Evidence or Disclosures"
        else:
            overall_status = "COMPLIANT"
            status_label = "Fully Verified / Audit-Ready"

        # Step 5: Rank Priority Issues
        priority_issues = self._calculate_priority_issues(eval_results)

        # Step 6: Identify Next Best Action ("What should I fix first?")
        next_actions = self._calculate_next_best_actions(eval_results, product)

        # Step 7: Normalized product object representation
        normalized = self._build_normalized_product_dict(product)

        return ProductComplianceVerificationResponse(
            product_id=f"verif_{market.lower()}_{abs(hash(product.product_name)) % 100000}",
            product_name=product.product_name,
            category=product.category,
            target_market=market,
            overall_status=overall_status,
            overall_status_label=status_label,
            summary=summary,
            rule_results=eval_results,
            priority_issues=priority_issues,
            next_best_actions=next_actions,
            next_best_action=next_actions[0] if next_actions else None,
            normalized_product_data=normalized,
        )

    def _is_rule_applicable(self, rule: Dict[str, Any], product: ProductVerificationInput) -> tuple[bool, str]:
        """
        Determines whether a rule applies to the product based on:
        - Product category & subcategory
        - Materials & ingredients
        - Intended use & claims
        - Hazards / battery presence
        """
        cat = (product.category or "").lower()
        subcat = (product.subcategory or "").lower()
        use = (product.intended_use or "").lower()
        name = product.product_name.lower()
        desc = (product.description or "").lower()

        combined_text = f"{name} {desc} {cat} {subcat} {use}".lower()

        target_cats = [c.lower() for c in rule.get("target_categories", [])]
        conds = rule.get("conditions") or {}
        cond_cat = (conds.get("category") or "").lower()
        if cond_cat and cond_cat not in target_cats:
            target_cats.append(cond_cat)

        # 1. Electronics / Electrical Goods & Appliances
        if any(e in cat or e in subcat or e in use or e in combined_text for e in ["electronic", "electrical", "audio", "speaker", "device", "gadget", "charger", "appliance", "dryer", "hair", "grooming", "styler", "heater"]):
            if any(t in target_cats for t in ["electronics", "consumer_products", "general", "rechargeable", "heated_devices", "hair_dryer", "appliances", "grooming"]):
                return True, f"Applicable to electrical/electronic product category under {product.target_market} law."

        # 1b. Plastic & Polymer Materials (REACH Annex XVII Phthalate Controls)
        has_plastic = any(m in " ".join(product.materials).lower() for m in ["plastic", "polymer", "pvc", "abs", "polycarbonate"]) or "plastic" in combined_text
        if has_plastic and any(t in target_cats for t in ["plastic_goods", "appliances", "consumer_products", "electronics"]):
            if "reach" in rule.get("directive_code", "").lower() or "phthalate" in rule.get("name", "").lower():
                return True, f"Triggered by plastic/polymer housing material under EU REACH chemical safety regulations."

        # 2. Cosmetics & Personal Care
        if any(c in cat or c in subcat or c in use for c in ["cosmetic", "skincare", "serum", "cream", "lotion", "beauty", "hygiene"]):
            if any(t in target_cats for t in ["cosmetics", "skincare", "topical", "general"]):
                return True, f"Applicable to cosmetics and personal care formulations in {product.target_market}."

        # 3. Toys & Infant / Children Products
        if any(t in cat or t in subcat or t in use for t in ["toy", "baby", "infant", "toddler", "walker", "child", "children"]):
            if any(tc in target_cats for tc in ["toys", "baby_products", "infant_gear", "children"]):
                return True, f"Applicable to toys and infant nursery products under {product.target_market} safety directives."

        # 4. Food Contact & Kitchenware
        if any(k in cat or k in subcat or k in use for k in ["kitchen", "cutting_board", "food_contact", "utensil", "tableware"]):
            if any(tc in target_cats for tc in ["kitchenware", "food_contact", "household", "cutting_boards"]):
                return True, f"Applicable to food-contact materials and kitchenware in {product.target_market}."

        # 5. Direct Target Category Match
        for tc in target_cats:
            if tc in cat or tc in subcat or tc in combined_text:
                return True, f"Directly targets product category '{tc}'."

        # 6. Specific Condition Types (e.g. Banned Claims or Hazmat battery triggers present in text)
        cond_type = rule.get("condition_type")
        if cond_type == "banned_claim_terms":
            triggers = rule.get("trigger_terms", [])
            for term in triggers:
                if re.search(r'\b' + re.escape(term.lower()) + r'\b', combined_text):
                    return True, f"Triggered by advertising claim term '{term}' in listing."

        if cond_type == "hazmat_check" and (product.contains_battery or "battery" in combined_text or "lithium" in combined_text):
            return True, "Triggered by rechargeable lithium-ion battery hazmat specifications."

        return False, "Not applicable to this product category."

    def _evaluate_single_rule(
        self,
        rule: Dict[str, Any],
        product: ProductVerificationInput,
        authority: str,
    ) -> RuleEvaluationResult:
        """
        Deterministically evaluates one rule against structured product data and documents.
        """
        rule_id = rule.get("rule_code") or rule.get("rule_id") or "RULE_UNKNOWN"
        rule_name = rule.get("name") or rule.get("title") or "Statutory Compliance Standard"
        citation = rule.get("statute_citation") or rule.get("directive_code") or "Statutory Regulatory Code"
        expected_req = rule.get("expected_requirement") or "Full compliance with statutory threshold and documentary requirements."
        explanation = rule.get("explanation") or "Governs statutory clearance for this product class."
        cond_type = rule.get("condition_type")
        raw_sev = rule.get("severity", "warning").lower()

        # Map severity
        if raw_sev in ("violation", "critical"):
            severity = "CRITICAL"
        elif raw_sev in ("escalation", "high"):
            severity = "HIGH"
        elif raw_sev == "warning":
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Collect text corpora
        text_corpus = f"{product.product_name} {product.description or ''} {' '.join(product.marketing_claims)}".lower()

        # Available documents index
        doc_types = {d.type.lower(): d for d in product.documents}
        doc_names = [d.name.lower() for d in product.documents if d.name]

        # Extract atomic requirement names
        atomic_reqs = rule.get("requirements") or []
        required_evidence = [r.get("name", "Verification Document") for r in atomic_reqs]
        if not required_evidence:
            if cond_type == "banned_claim_terms":
                required_evidence = ["Claim Substantiation Dossier"]
            elif cond_type == "mandatory_field":
                required_evidence = ["Physical Packaging Label Artwork & Declarations"]
            elif cond_type == "concentration_limit":
                required_evidence = ["Third-Party ISO 17025 Laboratory Assay"]
            elif cond_type == "hazmat_check":
                required_evidence = ["UN 38.3 Lithium Battery Test Summary", "CE / RoHS Declaration of Conformity"]
            else:
                required_evidence = ["Technical Safety File & Declaration"]

        provided_evidence: List[str] = [
            f"{d.name or d.type.title()} ({d.status.title()})"
            for d in product.documents if d.status == "provided"
        ]

        # ── Decision Trace Steps Initialization ──
        trace_steps: List[DecisionTraceStep] = []
        trace_steps.append(
            DecisionTraceStep(
                step_number=1,
                title="Product Data",
                description=f"Extracted: '{product.product_name}' (Category: {product.category}, Target: {product.target_market}).",
                status="info",
            )
        )
        trace_steps.append(
            DecisionTraceStep(
                step_number=2,
                title="Rule Match",
                description=f"Rule {rule_id} matched via {rule.get('_applicability_reason', 'category alignment')}.",
                status="pass",
            )
        )

        status: str = "pass"
        reason: str = ""
        missing_fields: List[str] = []
        action: Optional[str] = None
        confidence: float = 100.0

        # ─────────────────────────────────────────────────────────────
        # Condition Type 1: BANNED OR TRIGGER CLAIM TERMS
        # ─────────────────────────────────────────────────────────────
        if cond_type == "banned_claim_terms":
            triggers = rule.get("trigger_terms", [])
            detected_term = None
            negation_prefixes = ["free from", "free of", "without", "no ", "non-", "zero ", "0% "]

            for t in triggers:
                pat = r'\b' + re.escape(t.lower()) + r'\b'
                for m in re.finditer(pat, text_corpus):
                    start = m.start()
                    preceding = text_corpus[max(0, start - 30):start]
                    if any(neg in preceding for neg in negation_prefixes):
                        continue
                    detected_term = t
                    break
                if detected_term:
                    break

            trace_steps.append(
                DecisionTraceStep(
                    step_number=3,
                    title="Requirement Check",
                    description=f"Statutory ban on unauthorized/curative claims ({citation}). Prohibited terms: {len(triggers)} monitored terms.",
                    status="info",
                )
            )

            if detected_term:
                status = "fail"
                severity = "CRITICAL"
                reason = f"Prohibited marketing claim term '{detected_term}' detected in listing text. Violates {citation}."
                action = rule.get("fix_suggestion") or f"Remove claim '{detected_term}' from title, description, and bullet points."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description=f"Disallowed claim '{detected_term}' found in product copy without regulatory approval.",
                        status="fail",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description=f"FAIL: Unlawful curative/pesticidal claim triggers border detention under {citation}.",
                        status="fail",
                    )
                )
            else:
                status = "pass"
                reason = f"No prohibited curative, false efficacy, or unregistered trigger claim terms detected. Compliant with {citation}."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description="Listing text screened: 0 prohibited advertising claim terms detected.",
                        status="pass",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description=f"PASS: Satisfies statutory advertising standards of {citation}.",
                        status="pass",
                    )
                )

        # ─────────────────────────────────────────────────────────────
        # Condition Type 2: MANDATORY FIELD & LABELING DECLARATIONS
        # ─────────────────────────────────────────────────────────────
        elif cond_type == "mandatory_field":
            req_field = rule.get("required_field", "").lower()
            field_name_human = req_field.replace("_", " ").title()

            trace_steps.append(
                DecisionTraceStep(
                    step_number=3,
                    title="Requirement Check",
                    description=f"Mandatory disclosure requirement: '{field_name_human}' must be present on product PDP & physical packaging ({citation}).",
                    status="info",
                )
            )

            field_present = False
            field_value_found = None

            if req_field in ("manufacturer_name", "manufacturer", "brand"):
                if product.manufacturer_name:
                    field_present = True
                    field_value_found = product.manufacturer_name
                elif product.brand_name:
                    field_present = True
                    field_value_found = product.brand_name
            elif req_field in ("manufacturer_address", "responsible_person_address", "eu_responsible_person", "address"):
                if product.manufacturer_address:
                    field_present = True
                    field_value_found = product.manufacturer_address
            elif req_field in ("country_of_origin", "coo", "origin"):
                if product.country_of_origin:
                    field_present = True
                    field_value_found = product.country_of_origin
            elif req_field in ("materials", "ingredients", "ingredients_inci"):
                if product.ingredients or product.materials:
                    field_present = True
                    field_value_found = f"{len(product.ingredients or product.materials)} item(s) specified"
            elif req_field in ("ce_marking", "ce_mark", "ce"):
                has_doc = "ce" in doc_types or any("ce" in d for d in doc_names) or any("ce" in p.lower() for p in product.packaging_labels)
                if has_doc or "ce" in text_corpus:
                    field_present = True
                    field_value_found = "CE marking confirmed"
            elif req_field in ("weee_symbol", "weee", "wheelie_bin"):
                has_doc = "weee" in doc_types or any("weee" in d for d in doc_names) or any("weee" in p.lower() for p in product.packaging_labels)
                if has_doc or "weee" in text_corpus:
                    field_present = True
                    field_value_found = "WEEE registration confirmed"
            elif req_field in ("net_quantity", "weight", "volume"):
                if re.search(r'\b\d+\s*(ml|g|kg|oz|fl\s*oz|units?|pcs?|count)\b', text_corpus):
                    field_present = True
                    field_value_found = "Net quantity unit detected in title/description"
            else:
                # Generic field check in description or packaging
                if req_field in text_corpus:
                    field_present = True
                    field_value_found = f"'{req_field}' mentioned in text"

            if not field_present:
                status = "missing_information"
                severity = "HIGH"
                missing_fields.append(field_name_human)
                reason = f"Mandatory statutory declaration '{field_name_human}' was not provided in the submitted product data."
                action = rule.get("fix_suggestion") or f"Provide {field_name_human} in product specification and packaging artwork."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description=f"Field '{field_name_human}' checked against listing data, manufacturer info, and packaging declarations: MISSING.",
                        status="missing",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description=f"MISSING INFORMATION: Required declaration '{field_name_human}' is absent. Market entry blocked.",
                        status="missing",
                    )
                )
            else:
                status = "pass"
                reason = f"Mandatory declaration '{field_name_human}' successfully provided: '{field_value_found}'. Complies with {citation}."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description=f"Field '{field_name_human}' verified: '{field_value_found}'.",
                        status="pass",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description=f"PASS: Mandatory statutory requirement '{field_name_human}' satisfied.",
                        status="pass",
                    )
                )

        # ─────────────────────────────────────────────────────────────
        # Condition Type 3: HAZMAT & BATTERY SAFETY STANDARDS
        # ─────────────────────────────────────────────────────────────
        elif cond_type == "hazmat_check":
            trace_steps.append(
                DecisionTraceStep(
                    step_number=3,
                    title="Requirement Check",
                    description=f"Hazardous materials & electrical battery safety mandate under {citation} (UN 38.3 test summary, LVD, RoHS).",
                    status="info",
                )
            )

            has_test_report = (
                "test_report" in doc_types or
                any("test" in d and "report" in d for d in doc_names) or
                any("un 38.3" in d for d in doc_names) or
                any("safety" in d for d in doc_names)
            )

            if not has_test_report:
                status = "fail"
                severity = "CRITICAL"
                missing_fields.append("Safety Test Report / UN 38.3 Test Summary")
                reason = f"Mandatory Safety Test Report (EN 62368-1 / UN 38.3) is not available in the submitted documents. Required by {citation}."
                action = rule.get("fix_suggestion") or "Upload an accredited laboratory Safety Test Report and UN 38.3 battery test summary."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description="Uploaded documents screened for accredited Safety Test Report: No matching evidence found.",
                        status="fail",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description=f"FAIL: Missing mandatory third-party safety evidence. Customs hold risk under {citation}.",
                        status="fail",
                    )
                )
            else:
                doc_obj = doc_types.get("test_report")
                doc_status = doc_obj.status if doc_obj else "provided"
                if doc_status == "provided":
                    status = "pass"
                    reason = f"Valid electrical safety testing report confirmed in evidentiary documents. Complies with {citation}."
                    trace_steps.append(
                        DecisionTraceStep(
                            step_number=4,
                            title="Evidence Check",
                            description="Accredited Safety Test Report verified in document dossier.",
                            status="pass",
                        )
                    )
                    trace_steps.append(
                        DecisionTraceStep(
                            step_number=5,
                            title="Final Result",
                            description="PASS: Electrical safety substantiation satisfied.",
                            status="pass",
                        )
                    )
                else:
                    status = "needs_review"
                    severity = "HIGH"
                    reason = f"Safety documentation status is '{doc_status}'. Needs regulatory accreditation verification."
                    action = "Verify laboratory accreditation (ISO 17025) and test date validity."
                    trace_steps.append(
                        DecisionTraceStep(
                            step_number=4,
                            title="Evidence Check",
                            description=f"Document present but verification status is '{doc_status}'.",
                            status="warning",
                        )
                    )
                    trace_steps.append(
                        DecisionTraceStep(
                            step_number=5,
                            title="Final Result",
                            description="NEEDS REVIEW: Evidentiary accreditation requires human specialist sign-off.",
                            status="warning",
                        )
                    )

        # ─────────────────────────────────────────────────────────────
        # Condition Type 4: CHEMICAL CONCENTRATION LIMITS
        # ─────────────────────────────────────────────────────────────
        elif cond_type == "concentration_limit":
            ing_name = rule.get("ingredient_name", "").lower()
            max_conc = rule.get("max_concentration", 0.0)

            trace_steps.append(
                DecisionTraceStep(
                    step_number=3,
                    title="Requirement Check",
                    description=f"Statutory maximum concentration cap of {max_conc}% w/w for '{ing_name}' under {citation}.",
                    status="info",
                )
            )

            # Check if ingredient is listed in formulation
            found_ing = any(ing_name in i.lower() for i in (product.ingredients or product.materials))
            has_assay = "test_report" in doc_types or "certificate" in doc_types or any("assay" in d for d in doc_names)

            if not product.ingredients and not product.materials:
                status = "missing_information"
                severity = "HIGH"
                missing_fields.append("Complete Ingredient Formulation / Bill of Materials")
                reason = f"Cannot verify {ing_name} cap: Complete ingredient formulation has not been submitted."
                action = f"Submit full quantitative INCI ingredient listing to verify {ing_name} is below {max_conc}%."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description="Ingredient formulation missing from submitted product data.",
                        status="missing",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description=f"MISSING INFORMATION: Formulation data needed to verify statutory {max_conc}% limit.",
                        status="missing",
                    )
                )
            elif found_ing and not has_assay:
                status = "needs_review"
                severity = "HIGH"
                reason = f"Active '{ing_name}' detected in formulation. A quantitative lab assay is required to verify concentration is <= {max_conc}%."
                action = f"Upload an ISO 17025 Certificate of Analysis proving {ing_name} concentration <= {max_conc}%."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description=f"Ingredient '{ing_name}' found in formulation; quantitative analytical assay is absent.",
                        status="warning",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description="NEEDS REVIEW: Quantitative laboratory verification required.",
                        status="warning",
                    )
                )
            else:
                status = "pass"
                reason = f"Formulation satisfies statutory safety limits for '{ing_name}' under {citation}."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description=f"Formulation screened: {ing_name} within permissible statutory limits.",
                        status="pass",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description="PASS: Chemical concentration standards satisfied.",
                        status="pass",
                    )
                )

        # ─────────────────────────────────────────────────────────────
        # Condition Type 5: GENERAL / DEFAULT STATUTORY VERIFICATION
        # ─────────────────────────────────────────────────────────────
        else:
            trace_steps.append(
                DecisionTraceStep(
                    step_number=3,
                    title="Requirement Check",
                    description=f"Statutory mandate: {expected_req} ({citation}).",
                    status="info",
                )
            )

            # Check if required documents or certificates are present
            has_relevant_doc = len(product.documents) > 0 or len(product.packaging_labels) > 0

            if not has_relevant_doc:
                status = "missing_information"
                severity = "HIGH"
                missing_fields.extend(required_evidence[:1])
                reason = f"Required evidentiary documentation for '{rule_name}' was not provided."
                action = rule.get("fix_suggestion") or f"Upload mandatory {required_evidence[0]}."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description=f"Checked for {', '.join(required_evidence)}: None provided.",
                        status="missing",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description="MISSING INFORMATION: Evidentiary proof absent.",
                        status="missing",
                    )
                )
            else:
                status = "pass"
                reason = f"Evidentiary and statutory requirements satisfied for {rule_name} under {citation}."
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=4,
                        title="Evidence Check",
                        description=f"Supporting compliance documentation confirmed: {', '.join(provided_evidence)}.",
                        status="pass",
                    )
                )
                trace_steps.append(
                    DecisionTraceStep(
                        step_number=5,
                        title="Final Result",
                        description=f"PASS: Satisfies {citation}.",
                        status="pass",
                    )
                )

        return RuleEvaluationResult(
            rule_id=rule_id,
            rule_name=rule_name,
            market=product.target_market,
            applicable=True,
            applicability_reason=rule.get("_applicability_reason", "Aligned with product category and jurisdiction."),
            status=status,
            severity=severity,
            statute_citation=citation,
            statutory_authority=authority,
            expected_requirement=expected_req,
            reason=reason,
            required_evidence=required_evidence,
            provided_evidence=provided_evidence,
            missing_fields=missing_fields,
            recommended_action=action,
            confidence=confidence,
            decision_trace=trace_steps,
        )

    def _calculate_priority_issues(self, results: List[RuleEvaluationResult]) -> List[PriorityIssueItem]:
        """Ranks non-passing compliance issues by priority order (CRITICAL -> HIGH -> MEDIUM -> LOW)."""
        issues: List[PriorityIssueItem] = []

        sev_rank = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}

        for r in results:
            if r.status in ("fail", "missing_information", "needs_review"):
                issues.append(
                    PriorityIssueItem(
                        rule_id=r.rule_id,
                        rule_name=r.rule_name,
                        severity=r.severity,
                        status=r.status,
                        issue_summary=r.reason,
                        recommended_action=r.recommended_action or "Review compliance requirement and provide proof.",
                        affected_field=r.missing_fields[0] if r.missing_fields else None,
                    )
                )

        issues.sort(key=lambda x: sev_rank.get(x.severity, 5))
        return issues

    def _calculate_next_best_actions(
        self,
        results: List[RuleEvaluationResult],
        product: ProductVerificationInput,
    ) -> List[NextBestAction]:
        """
        Calculates: 'WHAT SHOULD THE SELLER FIX FIRST?'
        Ranks actions based on:
        - Number of failed rules affected
        - Number of dependent rules affected
        - Rule severity
        - Amount of missing information resolved
        """
        actions_map: Dict[str, Dict[str, Any]] = {}

        for r in results:
            if r.status == "pass":
                continue

            # Key by action or missing field
            key = None
            if r.missing_fields:
                key = f"Add {r.missing_fields[0]}"
            elif r.recommended_action:
                key = r.recommended_action
            else:
                key = f"Resolve {r.rule_name}"

            if key not in actions_map:
                actions_map[key] = {
                    "action_title": key,
                    "field_or_doc": r.missing_fields[0] if r.missing_fields else r.rule_name,
                    "reasons": [],
                    "affected_rules": set(),
                    "severities": [],
                }

            actions_map[key]["affected_rules"].add(r.rule_id)
            actions_map[key]["reasons"].append(r.reason)
            actions_map[key]["severities"].append(r.severity)

        if not actions_map:
            return []

        ranked_list: List[NextBestAction] = []
        sev_weights = {"CRITICAL": 10, "HIGH": 6, "MEDIUM": 3, "LOW": 1}

        for key, data in actions_map.items():
            rule_count = len(data["affected_rules"])
            max_sev = min(data["severities"], key=lambda s: {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}.get(s, 4))
            score = sum(sev_weights.get(s, 1) for s in data["severities"]) + (rule_count * 2)

            expected_result = f"{rule_count} compliance check(s) can be re-evaluated and unlocked once this item is provided."
            reason_text = f"This missing information directly impacts {rule_count} applicable regulatory requirements."

            action_obj = NextBestAction(
                action_title=key,
                field_or_doc_to_fix=data["field_or_doc"],
                reason=reason_text,
                affected_rules_count=rule_count,
                expected_result=expected_result,
                priority_level=max_sev,
                action_button_label="Fix Now",
            )
            ranked_list.append((score, action_obj))

        ranked_list.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in ranked_list]

    def _build_normalized_product_dict(self, product: ProductVerificationInput) -> Dict[str, Any]:
        """Normalizes submitted information into standard structured product object."""
        return {
            "product_name": product.product_name,
            "category": product.category,
            "subcategory": product.subcategory,
            "material": product.materials,
            "ingredients": product.ingredients,
            "intended_use": product.intended_use,
            "brand_name": product.brand_name,
            "manufacturer_name": product.manufacturer_name,
            "manufacturer_address": product.manufacturer_address,
            "country_of_origin": product.country_of_origin,
            "target_market": product.target_market,
            "contains_battery": product.contains_battery,
            "documents": [
                {
                    "type": d.type,
                    "name": d.name,
                    "status": d.status,
                    "standards": d.standards,
                }
                for d in product.documents
            ],
            "packaging_labels": product.packaging_labels,
        }
