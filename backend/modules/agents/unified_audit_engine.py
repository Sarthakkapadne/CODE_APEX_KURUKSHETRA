"""
LexPort — Unified Audit Reasoning Engine
Consolidates all Gemini audit intelligence into a SINGLE prompt:
  1. Attribute Extraction & Intent Classification
  2. Multi-Modal Packaging OCR & Vision Inspection (if images provided)
  3. Statutory Remediation & Compliant Title/Description Rewrite

Minimizes latency, eliminates redundant sequential LLM calls, and protects API quotas.
"""
from __future__ import annotations
import json
import logging
import base64
from typing import Optional, Dict, Any, Tuple, List

from google import genai
from google.genai import types

from backend.core.config import get_settings
from backend.core.models import (
    ListingInput, ExtractedAttributes, PackagingAnalysisResult,
    RemediationResult, DiffItem, PackagingOCRRegion, TranslationProvenanceItem
)

logger = logging.getLogger("lexport.unified_engine")

_UNIFIED_CACHE: Dict[str, Dict[str, Any]] = {}

UNIFIED_SYSTEM_PROMPT = """You are LexPort AI, the Tier-2 Grounded Reasoning Engine of the LexPort Cross-Border Trade Compliance Platform.
Your purpose is to evaluate an e-commerce product listing and its physical packaging (if provided) for export clearance into specified target destination markets.

You must perform comprehensive statutory analysis and output a SINGLE valid JSON object with exactly three top-level keys:
1. "extracted_attributes":
   - "category": string (e.g. "cosmetics", "electronics", "toys", "kitchenware", "supplements", "apparel", "home")
   - "subcategory": string (e.g. "anti_aging_cream", "baby_walker", "cutting_board", "heated_eye_wand")
   - "intended_age": string ("all_ages", "adults", "infants", "children")
   - "power_source": string ("none", "battery", "mains_ac", "usb")
   - "has_battery": boolean (true if device operates on rechargeable or disposable battery)
   - "battery_type": string ("none", "lithium_ion", "lithium_metal", "alkaline")
   - "ingredients": array of string (all detected chemical, herbal, or food ingredients)
   - "claims": array of string (all explicit and implied marketing, medical, sanitizing, or functional claims)
   - "inferred_hs_code": string (6-digit Harmonized System classification, e.g. "3304.99", "9503.00", "4419.90")
   - "missing_required_fields": array of string (mandatory customs/regulatory fields missing from copy, e.g. "manufacturer_address", "batch_number", "net_quantity")
   - "intent_classifications": array of string (e.g. "DISEASE_TREATMENT_INTENT", "STRUCTURE_FUNCTION_INTENT", "PESTICIDAL_ANTIMICROBIAL_INTENT", "INFANT_SAFETY_RISK_INTENT")
   - "target_ailments": array of string (ailments or conditions claimed to be cured, treated, or prevented, e.g. "arthritis", "joint inflammation", "eczema")
   - "antimicrobial_target": string ("none", "human_body", "article_surface", "environmental")

2. "packaging_analysis":
   - "detected_language": string (e.g. "English", "Multilingual (EN/FR)", "Japanese", "Hindi")
   - "raw_ocr_text": string (all text visible on packaging panels, or estimated text from product attributes)
   - "translated_english_text": string
   - "detected_certification_logos": array of string (e.g. ["CE", "FDA VCRP", "GMP", "FCC", "UKCA", "RoHS"])
   - "missing_certification_logos": array of string (required logos missing for target markets)
   - "net_quantity_declaration": string or null (e.g. "50g / 1.76 oz")
   - "is_bilingual": boolean (true if mandatory bilingual French/English or English/Spanish is present)
   - "detected_barcode": string or null (UPC/EAN barcode number if provided or visible)
   - "detected_iso_symbols": array of string (e.g. ["PAO 12M", "Keep Dry", "CE Mark", "Recyclable"])
   - "physical_readiness_score": float (0.0 to 100.0)
   - "physical_verdict": string ("READY_FOR_EXPORT", "REPACKAGING_MANDATORY", "SEIZURE_RISK")

3. "remediation":
   - "compliant_title": string (fully rewritten, commercially attractive title stripped of unlawful drug/pesticide/safety claims)
   - "compliant_description": string (fully rewritten listing copy that converts buyers while complying strictly with destination laws)
   - "diff_items": array of objects with keys:
       - "original_phrase": string (the non-compliant claim)
       - "compliant_phrase": string (the compliant replacement phrase)
       - "reason": string (statutory citation explaining why change is required, e.g. "FDA FD&C Act § 505 / Health Canada")
       - "severity": "high" | "medium" | "low"
   - "ready_to_paste_bullets": array of 3 to 5 clean, compliant marketing bullet points for Amazon/Shopify
   - "escalation_checklist": array of required seller actions before international dispatch (e.g. "Register facility with FDA MoCRA", "Obtain bilingual label verification")

Output strictly valid JSON. Do not include markdown code block syntax or extraneous text outside the JSON object.
"""


def _parse_image_data(img_str: str) -> Optional[Tuple[bytes, str]]:
    if not img_str:
        return None
    try:
        if "," in img_str:
            header, data = img_str.split(",", 1)
            mime = "image/jpeg"
            if "image/png" in header:
                mime = "image/png"
            elif "image/webp" in header:
                mime = "image/webp"
            return base64.b64decode(data), mime
        return base64.b64decode(img_str), "image/jpeg"
    except Exception:
        return None


class UnifiedAuditReasoningEngine:
    def __init__(self):
        self.settings = get_settings()

    async def execute_unified_reasoning(
        self,
        listing: ListingInput,
        target_markets: List[str]
    ) -> Tuple[Optional[ExtractedAttributes], Optional[PackagingAnalysisResult], Optional[RemediationResult]]:
        """
        Executes a single consolidated Gemini prompt that simultaneously performs:
        1. Attribute extraction
        2. Packaging vision OCR (if images provided)
        3. Compliant listing rewrite and diff generation
        """
        api_key = self.settings.GEMINI_API_KEY
        if not api_key:
            logger.info("[UNIFIED_ENGINE] No GEMINI_API_KEY found; falling back to deterministic modules.")
            return None, None, None

        # Build cache key from title, description, and target markets
        cache_key = str(hash(f"{listing.title}_{listing.description}_{''.join(target_markets)}"))
        if cache_key in _UNIFIED_CACHE:
            logger.info("[UNIFIED_ENGINE] Serving cached unified audit reasoning (0 LLM calls).")
            cached = _UNIFIED_CACHE[cache_key]
            return (
                ExtractedAttributes(**cached["extracted_attributes"]),
                PackagingAnalysisResult(**cached["packaging_analysis"]),
                RemediationResult(**cached["remediation"])
            )

        try:
            client = genai.Client(api_key=api_key)
            model_name = getattr(self.settings, "GEMINI_MODEL", "gemini-3.5-flash")

            prompt_text = (
                f"AUDIT REQUEST FOR CROSS-BORDER EXPORT\n\n"
                f"Product Title: {listing.title}\n"
                f"Product Description:\n{listing.description}\n"
                f"Brand Name: {listing.brand_name or 'Generic'}\n"
                f"Category Hint: {listing.category_hint or 'general'}\n"
                f"Country of Origin: {listing.country_of_origin or 'India'}\n"
                f"Retail Price: {listing.price or 29.99} {listing.currency or 'USD'}\n"
                f"Destination Sovereign Markets: {', '.join(target_markets)}\n"
            )
            if listing.barcode_raw:
                prompt_text += f"Provided Barcode: {listing.barcode_raw}\n"

            # Check if packaging images are attached
            image_parts = []
            for img_cand in [listing.front_image_base64, listing.image_base64, listing.back_image_base64]:
                if img_cand:
                    parsed = _parse_image_data(img_cand)
                    if parsed:
                        img_bytes, mime = parsed
                        image_parts.append(types.Part.from_bytes(data=img_bytes, mime_type=mime))

            contents: List[Any] = []
            if image_parts:
                contents.extend(image_parts)
                prompt_text += f"\nNote: {len(image_parts)} physical packaging image panel(s) are attached above for physical OCR inspection.\n"

            contents.append(prompt_text)

            logger.info(f"[UNIFIED_ENGINE] Dispatching SINGLE unified Gemini prompt (Model: {model_name})...")
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=UNIFIED_SYSTEM_PROMPT,
                    temperature=0.15,
                    response_mime_type="application/json"
                ),
            )

            if not response or not response.text:
                logger.warning("[UNIFIED_ENGINE] Empty response from Gemini.")
                return None, None, None

            raw_json = response.text.strip()
            # Clean markdown formatting if present
            if raw_json.startswith("```"):
                raw_json = raw_json.split("\n", 1)[1]
            if raw_json.endswith("```"):
                raw_json = raw_json.rsplit("\n", 1)[0]
            if raw_json.startswith("json"):
                raw_json = raw_json[4:].strip()

            parsed = json.loads(raw_json)
            _UNIFIED_CACHE[cache_key] = parsed

            # 1. Parse ExtractedAttributes
            extracted_dict = parsed.get("extracted_attributes", {})
            extracted = ExtractedAttributes(
                category=extracted_dict.get("category", "cosmetics"),
                subcategory=extracted_dict.get("subcategory", "general"),
                intended_age=extracted_dict.get("intended_age", "all_ages"),
                power_source=extracted_dict.get("power_source", "none"),
                has_battery=bool(extracted_dict.get("has_battery", False)),
                battery_type=extracted_dict.get("battery_type", "none"),
                ingredients=extracted_dict.get("ingredients", []),
                claims=extracted_dict.get("claims", []),
                inferred_hs_code=extracted_dict.get("inferred_hs_code", "3304.99"),
                technical_specs=extracted_dict.get("technical_specs", {}),
                missing_required_fields=extracted_dict.get("missing_required_fields", []),
                intent_classifications=extracted_dict.get("intent_classifications", []),
                target_ailments=extracted_dict.get("target_ailments", []),
                antimicrobial_target=extracted_dict.get("antimicrobial_target", "none"),
            )

            # 2. Parse PackagingAnalysisResult
            pkg_dict = parsed.get("packaging_analysis", {})
            packaging = PackagingAnalysisResult(
                detected_language=pkg_dict.get("detected_language", "English"),
                raw_ocr_text=pkg_dict.get("raw_ocr_text", listing.title),
                translated_english_text=pkg_dict.get("translated_english_text", listing.title),
                detected_certification_logos=pkg_dict.get("detected_certification_logos", []),
                missing_certification_logos=pkg_dict.get("missing_certification_logos", []),
                net_quantity_declaration=pkg_dict.get("net_quantity_declaration", "50g"),
                is_bilingual=bool(pkg_dict.get("is_bilingual", False)),
                detected_barcode=pkg_dict.get("detected_barcode") or listing.barcode_raw,
                detected_iso_symbols=pkg_dict.get("detected_iso_symbols", []),
                physical_readiness_score=float(pkg_dict.get("physical_readiness_score", 85.0)),
                physical_verdict=pkg_dict.get("physical_verdict", "READY_FOR_EXPORT"),
            )

            # 3. Parse RemediationResult
            rem_dict = parsed.get("remediation", {})
            diff_items_raw = rem_dict.get("diff_items", [])
            diff_items = []
            for d in diff_items_raw:
                if isinstance(d, dict) and "original_phrase" in d and "compliant_phrase" in d:
                    diff_items.append(DiffItem(
                        original_phrase=d.get("original_phrase", ""),
                        compliant_phrase=d.get("compliant_phrase", ""),
                        reason=d.get("reason", "Statutory alignment"),
                        severity=d.get("severity", "high"),
                    ))

            remediation = RemediationResult(
                original_title=listing.title,
                compliant_title=rem_dict.get("compliant_title", listing.title),
                original_description=listing.description,
                compliant_description=rem_dict.get("compliant_description", listing.description),
                diff_items=diff_items,
                ready_to_paste_bullets=rem_dict.get("ready_to_paste_bullets", []),
                escalation_checklist=rem_dict.get("escalation_checklist", []),
            )

            logger.info("[UNIFIED_ENGINE] Successfully completed unified reasoning via single Gemini prompt.")
            return extracted, packaging, remediation

        except Exception as e:
            err_msg = str(e).lower()
            if "429" in err_msg or "resourceexhausted" in err_msg or "quota" in err_msg:
                logger.warning("[UNIFIED_ENGINE] Gemini rate limit reached (429). Falling back instantly to Tier 1 deterministic engine.")
            else:
                logger.warning(f"[UNIFIED_ENGINE] Unified Gemini reasoning error: {e}. Falling back to deterministic pipeline.")
            return None, None, None
