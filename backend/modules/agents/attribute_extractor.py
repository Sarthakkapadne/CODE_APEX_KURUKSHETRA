"""
LexPort — Attribute Extraction Agent (Tier 2 Grounded AI)
Converts unstructured, marketing-driven product copy into formal technical parameters.
Uses Gemini API with robust heuristic fallback.
"""
from __future__ import annotations
import json
import logging
import os
import re
from typing import Dict, Any, List

from google import genai
from google.genai import types

from backend.core.config import get_settings
from backend.core.models import ExtractedAttributes

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a specialized Customs & Regulatory Technical Classifier for LexPort.
Your job is to extract true technical parameters and regulatory specifications from informal e-commerce marketing text.

Extract the following JSON structure:
{
  "category": "cosmetics | electronics | toys | kitchenware | supplements | apparel | medical_device",
  "subcategory": "e.g., pain_cream | baby_walker | teeth_whitening | cutting_board | heated_device",
  "intended_age": "adult | infant_0_3 | child_3_12 | all_ages",
  "power_source": "battery | usb | mains_ac | none",
  "has_battery": true | false,
  "battery_type": "lithium_ion | aa_alkaline | none",
  "ingredients": ["list", "of", "ingredients"],
  "chemical_concentrations": {"ingredient_name": percentage_number},
  "claims": ["list", "of", "explicit", "claims", "made"],
  "inferred_hs_code": "e.g., 3304.99 or 9503.00 or 8509.80",
  "technical_specs": {"voltage": "5V", "wattage": "10W"},
  "missing_required_fields": ["country_of_origin", "net_quantity", "manufacturer_contact"]
}

STRICT RULE: ONLY return valid JSON. Do not wrap in markdown or commentary."""

_EXTRACT_CACHE: Dict[str, Dict[str, Any]] = {}


class AttributeExtractorAgent:
    def __init__(self):
        self.settings = get_settings()

    async def extract(self, title: str, description: str, raw_text: Optional[str] = None) -> ExtractedAttributes:
        full_text = f"Title: {title}\nDescription:\n{description}\n{raw_text or ''}".strip()

        # 1. Try Gemini extraction
        ai_data = await self._extract_with_gemini(full_text)
        if ai_data:
            try:
                return ExtractedAttributes(**ai_data)
            except Exception as e:
                logger.warning(f"[EXTRACTOR] Pydantic parsing failed: {e}. Falling back to heuristics.")

        # 2. Heuristic fallback
        return self._extract_heuristics(title, description, full_text)

    async def _extract_with_gemini(self, text: str) -> Optional[Dict[str, Any]]:
        api_key = self.settings.GEMINI_API_KEY
        if not api_key:
            return None

        # Check in-memory cache to prevent duplicate LLM calls
        cache_key = str(hash(text))
        if cache_key in _EXTRACT_CACHE:
            logger.info("[EXTRACTOR] Returning cached extraction (0 LLM requests).")
            return _EXTRACT_CACHE[cache_key]

        try:
            client = genai.Client(api_key=api_key)
            # Use stable fast flash model directly without wasting calls
            model_name = "gemini-2.5-flash"
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=f"Analyze this e-commerce product listing:\n\n{text}",
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.1,
                        response_mime_type="application/json"
                    ),
                )
                if response and response.text:
                    raw_json = response.text.strip()
                    parsed = json.loads(raw_json)
                    _EXTRACT_CACHE[cache_key] = parsed
                    return parsed
            except Exception as me:
                err_msg = str(me).lower()
                if "429" in err_msg or "resourceexhausted" in err_msg or "quota" in err_msg:
                    logger.warning("[EXTRACTOR] Gemini rate limit reached (429). Falling back instantly to Tier 1 deterministic extractor.")
                    return None
                logger.debug(f"[EXTRACTOR] Gemini model error: {me}")
        except Exception as e:
            logger.warning(f"[EXTRACTOR] Gemini client error: {e}")
        return None

    def _extract_heuristics(self, title: str, description: str, full_text: str) -> ExtractedAttributes:
        lower = full_text.lower()

        # Detect category
        category = "cosmetics"
        subcategory = "topical_cream"
        hs_code = "3304.99"
        intended_age = "adult"
        power_source = "none"
        has_battery = False
        battery_type = "none"
        ingredients: List[str] = []
        concentrations: Dict[str, float] = {}
        claims: List[str] = []

        # Category & Subcategory Detection
        if any(w in lower for w in ["walker", "stroller", "bouncer", "toy", "child", "infant"]):
            category = "toys"
            subcategory = "baby_walker" if "walker" in lower else "children_toy"
            intended_age = "infant_0_3"
            hs_code = "9503.00"
        elif any(w in lower for w in ["cutting board", "cutting-board", "kitchen", "disinfect", "spray"]):
            category = "kitchenware"
            subcategory = "cutting_boards" if "cutting" in lower else "surface_sprays"
            hs_code = "4419.90"
        elif any(w in lower for w in ["wand", "device", "heated", "electric", "rechargeable", "led"]):
            category = "electronics"
            subcategory = "heated_devices"
            power_source = "battery"
            has_battery = True
            battery_type = "lithium_ion"
            hs_code = "8509.80"
        elif any(w in lower for w in ["whitening", "teeth", "dental", "peroxide"]):
            category = "cosmetics"
            subcategory = "teeth_whitening"
            hs_code = "3306.90"
        elif any(w in lower for w in ["ayurvedic", "herbal", "pain", "joint", "arthritis", "cream", "balm"]):
            category = "cosmetics"
            subcategory = "pain_cream"
            hs_code = "3304.99"

        # Battery check
        if any(w in lower for w in ["battery", "lithium", "li-ion", "rechargeable", "usb-c"]):
            has_battery = True
            power_source = "battery"
            battery_type = "lithium_ion"

        # Extract potential ingredients
        known_ingredients = [
            "hydrogen peroxide", "camphor", "menthol", "sesame oil", "eucalyptus oil",
            "turmeric", "ashwagandha", "ginger", "clove oil", "salicylic acid", "retinol"
        ]
        for ing in known_ingredients:
            if ing in lower:
                ingredients.append(ing)

        # Extract percentages
        pct_matches = re.findall(r'(\d+(?:\.\d+)?)\s*%\s*(?:w\/w\s*)?([a-zA-Z\s]{3,20})', lower)
        for val_str, name in pct_matches:
            try:
                name_clean = name.strip()
                concentrations[name_clean] = float(val_str)
            except Exception:
                pass

        if "hydrogen peroxide" in ingredients and "hydrogen peroxide" not in concentrations:
            if "whitening" in lower:
                concentrations["hydrogen peroxide"] = 10.0

        if "camphor" in ingredients and "camphor" not in concentrations:
            concentrations["camphor"] = 5.0

        # Extract claims
        trigger_phrases = [
            "cures arthritis", "cures", "treats", "heals arthritis", "eliminates pain",
            "antibacterial", "kills 99.9% germs", "kills germs", "antimicrobial",
            "anti-inflammatory medicine", "100% natural cure", "clinically proven"
        ]
        for c in trigger_phrases:
            if c in lower:
                claims.append(c)

        missing_fields: List[str] = []
        if not any(w in lower for w in ["made in", "product of", "origin:"]):
            missing_fields.append("country_of_origin")
        if not any(w in lower for w in ["net wt", "net weight", "fl oz", "ml", "g"]):
            missing_fields.append("net_quantity")

        return ExtractedAttributes(
            category=category,
            subcategory=subcategory,
            intended_age=intended_age,
            power_source=power_source,
            has_battery=has_battery,
            battery_type=battery_type,
            ingredients=ingredients,
            chemical_concentrations=concentrations,
            claims=claims,
            inferred_hs_code=hs_code,
            technical_specs={"extracted_via": "deterministic_heuristics"},
            missing_required_fields=missing_fields,
        )
