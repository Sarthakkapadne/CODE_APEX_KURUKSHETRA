"""
LexPort — Deterministic Rule Engine (Tier 1 & Tier 3 Escalation Gateway)
Zero LLM, 100% deterministic, cites the exact statutory clause.
Evaluates listings against curated rule bases for US, EU, UK, CA, and JP.
"""
from __future__ import annotations
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

from backend.core.models import ComplianceCheckResult, ExtractedAttributes

RULES_DIR = Path(__file__).resolve().parent / "rules_data"


class DeterministicRuleEngine:
    def __init__(self, rules_dir: Optional[Path] = None):
        self.rules_dir = rules_dir or RULES_DIR
        self._rules_cache: Dict[str, Dict[str, Any]] = {}
        self._simulator_overrides: Dict[str, Any] = {}
        self.load_rules()

    def load_rules(self) -> None:
        """Load all country rule databases dynamically from rules_dir."""
        for file_path in self.rules_dir.glob("*_rules.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    country_code = data.get("country_code") or file_path.stem.split("_")[0].upper()
                    self._rules_cache[country_code.upper()] = data
            except Exception as e:
                pass

    def set_simulation_override(self, simulation_id: str, is_active: bool) -> None:
        """Toggle a simulated regulatory change."""
        self._simulator_overrides[simulation_id] = is_active

    def clear_simulation_overrides(self) -> None:
        self._simulator_overrides.clear()

    def evaluate(
        self,
        country_code: str,
        extracted: ExtractedAttributes,
        raw_text: str,
        listing_fields: Optional[Dict[str, Any]] = None,
    ) -> List[ComplianceCheckResult]:
        """
        Evaluate a single country's regulatory rules against the product listing.
        """
        results: List[ComplianceCheckResult] = []
        country_data = self._rules_cache.get(country_code.upper())
        if not country_data:
            return results

        normalized_text = (raw_text or "").lower()
        fields = listing_fields or {}

        # ── Apply active simulator adjustments ──
        epa_crackdown_active = self._simulator_overrides.get("sim_us_epa_crackdown", False)
        eu_lower_threshold_active = self._simulator_overrides.get("sim_eu_peroxide_crackdown", False)
        ca_rocker_ban_active = self._simulator_overrides.get("sim_ca_rockers_ban", False)

        for rule in country_data.get("rules", []):
            cond_type = rule.get("condition_type")
            rule_code = rule.get("rule_code")

            # ── 1. Outright Product Type Ban (e.g. Baby walkers in Canada, Sleep positioners in US) ──
            if cond_type == "product_type_ban":
                triggers = rule.get("trigger_terms", [])
                matched_term = self._match_any_term(normalized_text, triggers)
                cat_match = any(
                    t in extracted.category.lower() or t in extracted.subcategory.lower()
                    for t in rule.get("target_categories", [])
                )

                if matched_term or cat_match:
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Classification Status"),
                        status="violation",
                        trust_tier="Tier 1 Deterministic",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value=f"Product matched banned category/term: '{matched_term or extracted.subcategory}'",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation=rule.get("explanation", ""),
                        fix_suggestion=rule.get("fix_suggestion"),
                    ))
                else:
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Classification Status"),
                        status="pass",
                        trust_tier="Tier 1 Deterministic",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value="Not classified as prohibited device/category",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation="Product does not violate outright product bans in this jurisdiction.",
                    ))

            # ── 2. Banned / Misbranding Claim Terms (e.g. cures, antibacterial EPA trigger) ──
            elif cond_type == "banned_claim_terms":
                triggers = rule.get("trigger_terms", [])
                matched_term = self._match_any_term(normalized_text, triggers)

                # Check simulator override for US EPA crackdown
                is_epa_rule = (country_code == "US" and rule_code == "US-CLASS-01")
                if is_epa_rule and epa_crackdown_active:
                    # In simulation mode, even subtle terms like 'hygienic' trigger EPA review
                    if not matched_term and self._match_any_term(normalized_text, ["hygienic", "cleanse", "pure", "shield"]):
                        matched_term = "hygienic (flagged under Emergency EPA Guidance)"

                if matched_term:
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Claim Wording"),
                        status=rule.get("severity", "violation"),
                        trust_tier="Tier 1 Deterministic",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value=f"Prohibited claim word detected: '{matched_term}'",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation=rule.get("explanation", ""),
                        fix_suggestion=rule.get("fix_suggestion"),
                    ))
                else:
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Claim Wording"),
                        status="pass",
                        trust_tier="Tier 1 Deterministic",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value="No prohibited claim keywords found",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation="Listing text does not trigger unlawful therapeutic or pesticidal claim classifications.",
                    ))

            # ── 3. Chemical / Ingredient Concentration Limits ──
            elif cond_type == "concentration_limit":
                ing_name = rule.get("ingredient_name", "").lower()
                max_allowed = float(rule.get("max_concentration", 0.0))

                # If EU hydrogen peroxide crackdown simulated, lower to 0.05%
                if country_code == "EU" and ing_name == "hydrogen peroxide" and eu_lower_threshold_active:
                    max_allowed = 0.05

                detected_conc = self._find_ingredient_concentration(extracted, normalized_text, ing_name)

                if detected_conc is not None:
                    if detected_conc > max_allowed:
                        results.append(ComplianceCheckResult(
                            check_code=rule_code,
                            country_code=country_code,
                            category=rule.get("category", "Banned Ingredients"),
                            status="violation",
                            trust_tier="Tier 1 Deterministic",
                            rule_citation=rule.get("statute_citation", ""),
                            extracted_value=f"{ing_name.title()}: {detected_conc:.2f}% detected",
                            expected_requirement=f"Max {max_allowed:.2f}% w/w allowed for consumer goods",
                            explanation=rule.get("explanation", ""),
                            fix_suggestion=rule.get("fix_suggestion"),
                        ))
                    else:
                        results.append(ComplianceCheckResult(
                            check_code=rule_code,
                            country_code=country_code,
                            category=rule.get("category", "Banned Ingredients"),
                            status="pass",
                            trust_tier="Tier 1 Deterministic",
                            rule_citation=rule.get("statute_citation", ""),
                            extracted_value=f"{ing_name.title()}: {detected_conc:.2f}% (Within {max_allowed:.2f}% cap)",
                            expected_requirement=rule.get("expected_requirement", ""),
                            explanation=f"Concentration satisfies statutory limits for {country_code}.",
                        ))
                else:
                    # Ingredient not detected or negligible
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Banned Ingredients"),
                        status="pass",
                        trust_tier="Tier 1 Deterministic",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value=f"{ing_name.title()} not detected or within standard OTC tolerance",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation="Formulation does not breach concentration thresholds.",
                    ))

            # ── 4. Mandatory Labeling Declarations Checklist ──
            elif cond_type == "mandatory_field":
                target_cats = rule.get("target_categories")
                if target_cats:
                    cat_match = any(
                        t in extracted.category.lower() or t in extracted.subcategory.lower() or t in normalized_text
                        for t in target_cats
                    )
                    if not cat_match:
                        continue

                field_name = rule.get("required_field")
                has_field = self._check_mandatory_field(field_name, normalized_text, fields, country_code)

                if not has_field:
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Mandatory Labeling"),
                        status=rule.get("severity", "violation"),
                        trust_tier="Tier 1 Deterministic",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value=f"Missing mandatory declaration: {field_name}",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation=rule.get("explanation", ""),
                        fix_suggestion=rule.get("fix_suggestion"),
                    ))
                else:
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Mandatory Labeling"),
                        status="pass",
                        trust_tier="Tier 1 Deterministic",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value=f"Mandatory declaration satisfied ({field_name})",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation="Mandatory labeling requirement verified.",
                    ))

            # ── 5. Safety / Certifications (Tier 3 Escalation) ──
            elif cond_type == "certification_check":
                triggers = rule.get("trigger_terms", [])
                matched_term = self._match_any_term(normalized_text, triggers)
                cat_match = any(
                    t in extracted.category.lower() or t in extracted.subcategory.lower()
                    for t in rule.get("target_categories", [])
                )

                if matched_term or cat_match:
                    # Strict non-automation: ESCALATION REQUIRED
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Safety/Certifications"),
                        status="escalation",
                        trust_tier="Tier 3 Escalation",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value=f"Category requires physical laboratory certificate ({matched_term or extracted.subcategory})",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation=rule.get("explanation", ""),
                        fix_suggestion=rule.get("fix_suggestion"),
                    ))
                else:
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Safety/Certifications"),
                        status="pass",
                        trust_tier="Tier 1 Deterministic",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value="No specialized high-risk certification required",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation="Standard consumer goods safety rules apply.",
                    ))

            # ── 6. Hazmat / Dangerous Goods Shipping (Tier 3 Escalation) ──
            elif cond_type == "hazmat_check":
                triggers = rule.get("trigger_terms", [])
                matched_term = self._match_any_term(normalized_text, triggers)
                has_battery = extracted.has_battery or bool(matched_term)

                if has_battery:
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Hazmat/Shipping"),
                        status="escalation",
                        trust_tier="Tier 3 Escalation",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value=f"Powered device with rechargeable lithium battery detected ({extracted.battery_type or 'Li-ion'})",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation=rule.get("explanation", ""),
                        fix_suggestion=rule.get("fix_suggestion"),
                    ))
                else:
                    results.append(ComplianceCheckResult(
                        check_code=rule_code,
                        country_code=country_code,
                        category=rule.get("category", "Hazmat/Shipping"),
                        status="pass",
                        trust_tier="Tier 1 Deterministic",
                        rule_citation=rule.get("statute_citation", ""),
                        extracted_value="No hazardous materials or lithium batteries declared",
                        expected_requirement=rule.get("expected_requirement", ""),
                        explanation="Standard commercial postal/courier shipping permitted.",
                    ))

        # ── Additional dynamic simulation: Canada Rockers Ban ──
        if country_code == "CA" and ca_rocker_ban_active:
            if "rocker" in normalized_text or "bouncer" in normalized_text or "walker" in normalized_text:
                results.insert(0, ComplianceCheckResult(
                    check_code="CA-SIM-01",
                    country_code="CA",
                    category="Classification Status",
                    status="violation",
                    trust_tier="Tier 1 Deterministic",
                    rule_citation="Simulated Health Canada Emergency Directive 2026-GC4",
                    extracted_value="Infant rocker/sleeper motion mechanism detected",
                    expected_requirement="Immediate prohibition under amended CCPSA Schedule 2",
                    explanation="[SIMULATION ACTIVE] Health Canada has broadened Schedule 2 to include all wheeled rockers and motorized bouncers.",
                    fix_suggestion="Halt all shipments of infant rockers and bouncers to Canadian territory.",
                ))

        return results

    def _match_any_term(self, text: str, terms: List[str]) -> Optional[str]:
        negation_prefixes = ["free from", "free of", "without", "no ", "non-", "zero ", "0% "]
        for term in terms:
            pattern = r'\b' + re.escape(term.lower()) + r'\b'
            for match in re.finditer(pattern, text):
                start = match.start()
                # Check preceding 30 characters for negation
                preceding_text = text[max(0, start - 30):start].lower()
                if any(neg in preceding_text for neg in negation_prefixes):
                    continue  # Negated claim, not a violation
                return term
        return None

    def _find_ingredient_concentration(
        self, extracted: ExtractedAttributes, text: str, ing_name: str
    ) -> Optional[float]:
        # Check if explicitly negated as zero / free
        ing_lower = ing_name.lower()
        if any(f"{ing_lower} free" in text or f"free of {ing_lower}" in text or f"no {ing_lower}" in text for _ in [1]):
            return 0.0

        # Check extracted chemical concentrations dict
        for k, v in extracted.chemical_concentrations.items():
            if ing_lower in k.lower():
                return float(v)

        # Regex: "X% ingredient" or "ingredient (X%)" or "ingredient X%" or "X percent"
        pattern1 = rf'(\d+(?:\.\d+)?)\s*%\s*(?:w\/w\s*)?[\s)\]:]*{re.escape(ing_lower)}'
        pattern2 = rf'{re.escape(ing_lower)}[\s:(\[\-]*(\d+(?:\.\d+)?)\s*%'
        pattern3 = rf'(\d+(?:\.\d+)?)\s*(?:percent|pct)\s*(?:w\/w\s*)?[\s)\]:]*{re.escape(ing_lower)}'

        m1 = re.search(pattern1, text)
        if m1:
            return float(m1.group(1))

        m2 = re.search(pattern2, text)
        if m2:
            return float(m2.group(1))

        m3 = re.search(pattern3, text)
        if m3:
            return float(m3.group(1))

        return None

    def _check_mandatory_field(
        self, field_name: str, text: str, fields: Dict[str, Any], country_code: str
    ) -> bool:
        if field_name == "country_of_origin":
            return any(phrase in text for phrase in [
                "made in", "product of", "country of origin", "manufactured in", "origin:"
            ]) or bool(fields.get("country_of_origin"))

        if field_name == "net_quantity_dual":
            # Dual units: oz / fl oz AND g / ml
            has_metric = bool(re.search(r'\b\d+\s*(?:ml|g|kg|l)\b', text))
            has_customary = bool(re.search(r'\b\d+\s*(?:oz|fl\s*oz|lb)\b', text))
            return has_metric and has_customary

        if field_name == "eu_responsible_person":
            return any(phrase in text for phrase in [
                "responsible person", "eu rp", "rp:", "ec rep", "eu address", "distributor in eu"
            ]) or bool(fields.get("has_rp") or fields.get("eu_responsible_person"))

        if field_name == "uk_responsible_person":
            return any(phrase in text for phrase in [
                "uk responsible person", "uk rp", "great britain address", "uk address"
            ]) or bool(fields.get("has_rp") or fields.get("uk_responsible_person"))

        if field_name == "bilingual_en_fr":
            # Check for common French words or bilingual indicator
            french_markers = [
                "ingrédients", "mode d'emploi", "fabriqué", "avertissement", "poids net",
                "français", "sirop", "d'érable", "produit du", "flocons", "biologique", "produit"
            ]
            return any(m in text for m in french_markers) or fields.get("is_bilingual") is True or "bilingual" in text

        if field_name == "inci_ingredients_list":
            return "ingredients:" in text or "inci" in text or len(fields.get("ingredients", [])) > 2 or bool(fields.get("inci_ingredients_list") or fields.get("has_rp"))

        if field_name == "japanese_labeling_mah":
            return any(p in text for p in ["mah", "marketing authorization holder", "japanese label", "輸入販売元"]) or bool(fields.get("has_mah") or fields.get("japanese_labeling_mah") or fields.get("has_rp"))

        if field_name == "cdsco_registration":
            return any(p in text for p in ["cdsco", "cos-2", "form 42", "form cos-2"]) or bool(fields.get("has_cdsco") or fields.get("cdsco_registration") or fields.get("has_rp"))

        if field_name == "legal_metrology_declarations":
            return any(p in text for p in ["mrp", "maximum retail price", "m.r.p", "₹", "rs."]) or bool(fields.get("has_mrp") or fields.get("legal_metrology") or fields.get("legal_metrology_declarations") or fields.get("has_rp"))

        if field_name == "nmpa_filing_voucher":
            return any(p in text for p in ["nmpa", "csar", "guozhuang", "国妆"]) or bool(fields.get("has_nmpa") or fields.get("nmpa_filing") or fields.get("nmpa_filing_voucher") or fields.get("has_rp"))

        if field_name == "simplified_chinese_label":
            has_chinese_chars = bool(re.search(r'[\u4e00-\u9fff]', text))
            return has_chinese_chars or any(p in text for p in ["chinese label", "simplified chinese", "中文标签"]) or bool(fields.get("has_chinese_label") or fields.get("simplified_chinese_label") or fields.get("has_rp"))

        if field_name == "lucid_registration_number":
            return any(p in text for p in ["lucid", "verpackg", "dual system", "der grüne punkt", "interseroh"]) or bool(fields.get("has_lucid") or fields.get("lucid_number") or fields.get("lucid_registration_number") or fields.get("has_rp"))

        if field_name == "german_language_instructions":
            german_markers = ["anleitung", "warnung", "hergestellt in", "zutaten", "gebrauchsanweisung", "deutsch"]
            return any(m in text for m in german_markers) or bool(fields.get("is_german") or fields.get("has_german_label") or fields.get("german_language_instructions") or fields.get("has_rp"))

        if field_name == "vietnamese_sub_label":
            vn_markers = ["nhãn phụ", "hướng dẫn", "xuất xứ", "thành phần", "nhập khẩu bởi", "tiếng việt"]
            return any(m in text for m in vn_markers) or bool(fields.get("is_vietnamese") or fields.get("has_vietnamese_label") or fields.get("vietnamese_sub_label") or fields.get("has_rp"))

        if field_name == "vietnam_dav_proclamation":
            return any(p in text for p in ["phiếu công bố", "dav", "công bố mỹ phẩm", "cục quản lý dược"]) or bool(fields.get("has_dav") or fields.get("dav_proclamation") or fields.get("vietnam_dav_proclamation") or fields.get("has_rp"))

        if field_name == "health_canada_cnf_submission":
            return any(p in text for p in ["cnf", "cosmetic notification form", "santé canada cnf"]) or bool(fields.get("has_cnf") or fields.get("cnf_number") or fields.get("health_canada_cnf_submission") or fields.get("has_rp"))

        if field_name == "us_contact_for_adverse_events":
            return any(p in text for p in ["1-800", "adverse event", "contact:", "questions:", "tel:", "www.", ".com", "@"]) or bool(fields.get("has_us_contact") or fields.get("us_contact_for_adverse_events") or fields.get("has_rp"))

        return False
