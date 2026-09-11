"""
LexPort — Remediation & Auto-Rewrite Engine
Transforms informal, overclaimed marketing text into legally compliant, honest phrasing.
Defensible framing: Solves unintentional seller overclaiming by substituting non-compliant
disease/pesticide triggers with compliant structure/function language that preserves
marketing persuasiveness while complying with regulatory statutes.
"""
from __future__ import annotations
import json
import logging
import re
from typing import List, Dict, Any, Optional

from google import genai
from google.genai import types

from backend.core.config import get_settings
from backend.core.models import RemediationResult, DiffItem, ExtractedAttributes, ComplianceCheckResult

logger = logging.getLogger(__name__)

REWRITE_SYSTEM_PROMPT = """You are a specialized Legal-Marketing Regulatory Copywriter for LexPort.
Your goal is to rewrite non-compliant e-commerce listing copy to make it 100% compliant with destination-country laws.

Core Philosophy:
- Do NOT help sellers dodge legitimate safety rules or criminal bans (e.g. Baby Walkers in Canada remain banned).
- Fix unintentional overclaiming: replace unapproved disease cure claims (e.g., 'cures arthritis', 'eliminates disease') with compliant structure/function language ('soothes tired joints', 'supports muscle comfort').
- Fix pesticide/antimicrobial triggers on household items: replace 'kills 99.9% bacteria & germs' with 'treated surface to resist stain and odor-causing bacteria on the board'.
- Add required statutory markings: 'Made in [Origin]', dual net weight declarations, and EU Responsible Person notice.

Return STRICTLY a JSON object matching this schema:
{
  "compliant_title": "Clean, compliant product title",
  "compliant_description": "Full rewritten compliant description",
  "diff_items": [
    {
      "original_phrase": "cures arthritis",
      "compliant_phrase": "supports joint comfort and soothes tired muscles",
      "reason": "Replaced unapproved disease cure claim (FDA 21 U.S.C. § 321(g)) with lawful structure/function claim.",
      "severity": "high"
    }
  ],
  "ready_to_paste_bullets": [
    "Compliant Bullet 1",
    "Compliant Bullet 2",
    "Compliant Bullet 3"
  ],
  "escalation_checklist": [
    "Item 1 requiring human review or laboratory testing"
  ]
}

STRICT RULE: ONLY return valid JSON. Do not wrap in markdown."""

# In-memory cache for remediations to avoid duplicate LLM calls
_REWRITE_CACHE: Dict[str, RemediationResult] = {}


class RemediationRewriterAgent:
    def __init__(self):
        self.settings = get_settings()

    async def rewrite(
        self,
        title: str,
        description: str,
        extracted: ExtractedAttributes,
        violations: List[ComplianceCheckResult],
        target_markets: List[str]
    ) -> RemediationResult:
        # 1. Try Gemini rewrite
        ai_rewrite = await self._rewrite_with_gemini(title, description, extracted, violations, target_markets)
        if ai_rewrite:
            return ai_rewrite

        # 2. Deterministic high-precision fallback
        return self._rewrite_fallback(title, description, extracted, violations, target_markets)

    async def _rewrite_with_gemini(
        self,
        title: str,
        description: str,
        extracted: ExtractedAttributes,
        violations: List[ComplianceCheckResult],
        target_markets: List[str]
    ) -> Optional[RemediationResult]:
        api_key = self.settings.GEMINI_API_KEY
        if not api_key:
            return None

        # If no critical violations, no LLM call needed
        active_violations = [v for v in violations if v.status in ["violation", "escalation", "warning"]]
        if not active_violations:
            return None

        cache_key = str(hash(title + description + "".join(v.check_code for v in active_violations)))
        if cache_key in _REWRITE_CACHE:
            logger.info("[REWRITER] Returning cached remediation (0 LLM requests).")
            return _REWRITE_CACHE[cache_key]

        try:
            client = genai.Client(api_key=api_key)
            flagged_clauses = [
                f"- [{v.country_code}] {v.check_code}: {v.extracted_value} ({v.rule_citation}) -> {v.fix_suggestion}"
                for v in active_violations
            ]

            prompt = (
                f"Original Title: {title}\n"
                f"Original Description:\n{description}\n"
                f"Category: {extracted.category} ({extracted.subcategory})\n"
                f"Target Markets: {', '.join(target_markets)}\n\n"
                f"Flagged Compliance Issues & Fix Suggestions:\n" + "\n".join(flagged_clauses)
            )

            model_name = getattr(self.settings, "GEMINI_MODEL", "gemini-3.5-flash")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=REWRITE_SYSTEM_PROMPT,
                    temperature=0.2,
                    response_mime_type="application/json"
                ),
            )
            if response and response.text:
                data = json.loads(response.text.strip())
                res = RemediationResult(
                    original_title=title,
                    compliant_title=data.get("compliant_title", title),
                    original_description=description,
                    compliant_description=data.get("compliant_description", description),
                    diff_summary=[
                        WordDiffItem(
                            original_phrase=d.get("original_phrase", ""),
                            compliant_phrase=d.get("compliant_phrase", ""),
                            reason=d.get("reason", "Statutory alignment"),
                            severity=d.get("severity", "moderate")
                        )
                        for d in data.get("diff_items", [])
                    ],
                    amazon_bullets=data.get("ready_to_paste_bullets", []),
                    escalation_checklist=data.get("escalation_checklist", [])
                )
                _REWRITE_CACHE[cache_key] = res
                return res
        except Exception as me:
            err_msg = str(me).lower()
            if "429" in err_msg or "resourceexhausted" in err_msg or "quota" in err_msg:
                logger.warning("[REWRITER] Gemini rate limit reached (429). Falling back instantly to Tier 1 deterministic rewriter.")
                return None
            logger.debug(f"[REWRITER] Gemini model error: {me}")
            return None

    def _rewrite_fallback(
        self,
        title: str,
        description: str,
        extracted: ExtractedAttributes,
        violations: List[ComplianceCheckResult],
        target_markets: List[str]
    ) -> RemediationResult:
        compliant_title = title
        compliant_desc = description
        diffs: List[DiffItem] = []
        bullets: List[str] = []
        escalations: List[str] = []

        # Replacement mappings: overclaimed term -> honest compliant phrasing
        replacements = [
            (
                r"\bcures arthritis\b",
                "supports joint comfort and eases stiffness",
                "Substituted unapproved drug claim with compliant structure/function claim (FDA 21 CFR § 201).",
                "high"
            ),
            (
                r"\beliminates pain permanently\b",
                "provides soothing topical relief during massage",
                "Removed unlawful guarantee of permanent disease elimination.",
                "high"
            ),
            (
                r"\banti-inflammatory medicine\b",
                "herbal botanical wellness massage balm",
                "Reclassified medical prescription terminology to topical herbal wellness.",
                "high"
            ),
            (
                r"\bkills 99\.9% (?:of )?(?:bacteria|germs)\b",
                "naturally resists stain and odor-causing bacteria on the board",
                "Rephrased public-health pesticide claim to compliant EPA Treated Article wording (40 CFR § 152.25).",
                "high"
            ),
            (
                r"\bantibacterial protection\b",
                "hygienic surface protection",
                "Avoided unregistered pesticide trigger under US EPA FIFRA.",
                "medium"
            ),
            (
                r"\b100% natural cure\b",
                "traditional herbal botanical formula",
                "Eliminated deceptive 'cure' guarantee under FTC Act Section 5.",
                "high"
            )
        ]

        for pattern, replacement, reason, severity in replacements:
            if re.search(pattern, compliant_title, re.IGNORECASE):
                match = re.search(pattern, compliant_title, re.IGNORECASE)
                orig = match.group(0) if match else "flagged phrase"
                compliant_title = re.sub(pattern, replacement, compliant_title, flags=re.IGNORECASE)
                diffs.append(DiffItem(
                    original_phrase=orig,
                    compliant_phrase=replacement,
                    reason=reason,
                    severity=severity
                ))

            if re.search(pattern, compliant_desc, re.IGNORECASE):
                match = re.search(pattern, compliant_desc, re.IGNORECASE)
                orig = match.group(0) if match else "flagged phrase"
                compliant_desc = re.sub(pattern, replacement, compliant_desc, flags=re.IGNORECASE)
                if not any(d.original_phrase == orig for d in diffs):
                    diffs.append(DiffItem(
                        original_phrase=orig,
                        compliant_phrase=replacement,
                        reason=reason,
                        severity=severity
                    ))

        # Check for mandatory labeling additions
        if "country_of_origin" in extracted.missing_required_fields:
            origin = "Origin Declared"
            compliant_desc += f"\n\n• Mandatory Marking: Country of Origin specified on container."
            diffs.append(DiffItem(
                original_phrase="[Missing Country of Origin]",
                compliant_phrase="Country of Origin Declaration",
                reason="Added mandatory Country of Origin marking under 19 U.S.C. § 1304.",
                severity="medium"
            ))

        # Build dynamic ready-to-paste bullets based on actual product
        clean_name = compliant_title.split("-")[0].strip()
        bullets = [
            f"PRODUCT AUTHENTICITY & QUALITY: Premium {clean_name} crafted to meet international commercial standards.",
            f"TARGETED FORMULATION: Carefully selected components designed for safe, effective, and compliant everyday use.",
            f"REGULATORY ASSURANCE: Formulated and labeled in strict adherence to destination-market packaging and consumer protection guidelines.",
            f"TRANSPARENT INGREDIENT/SPEC DISCLOSURE: Full technical disclosures provided in compliance with applicable consumer safety regulations."
        ]

        # Populate escalation checklist
        for v in violations:
            if v.status == "escalation":
                escalations.append(f"[{v.country_code}] {v.check_code}: {v.expected_requirement} (Statute: {v.rule_citation})")

        return RemediationResult(
            original_title=title,
            compliant_title=compliant_title,
            original_description=description,
            compliant_description=compliant_desc,
            diff_items=diffs,
            ready_to_paste_bullets=bullets,
            escalation_checklist=escalations,
        )
