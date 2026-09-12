"""
LexPort — Adversarial Inspection Debate Engine
Orchestrates a point-counterpoint debate between:
  1. Customs Inspector Agent (identifies every reason to seize, ban, or reject the listing)
  2. Seller Advocate Agent (defends the commercial value, explores legal exceptions, proposes lowest-friction remediation)
  3. Consensus Arbiter (synthesizes the arguments into a legally defensible verdict)

Uses Gemini API for dynamic debate generation with high-fidelity pre-compiled fallbacks
for standard demo presets to guarantee rock-solid demo reliability.
"""
from __future__ import annotations
import json
import logging
from typing import List, Dict, Any, Optional

from google import genai
from google.genai import types

from backend.core.config import get_settings
from backend.core.models import (
    AdversarialDebateResult, DebateTurn, ExtractedAttributes, ComplianceCheckResult
)

logger = logging.getLogger(__name__)

DEBATE_SYSTEM_PROMPT = """You are orchestrating a formal regulatory debate for LexPort.
Generate a high-stakes, realistic 4-turn debate between:
1. Customs Inspector (strict, cites regulations, aggressive border defense against misbranding/safety)
2. Seller Advocate (practical, defends marketing intent, cites exemptions, proposes compliant language)
3. Customs Inspector (cross-examines the defense, identifies missing paperwork or hazardous risks)
4. Consensus Arbiter (final binding legal ruling and clear remediation directives)

Format your output STRICTLY as a JSON object matching this schema:
{
  "debate_topic": "string summarizing the core legal conflict",
  "turns": [
    {
      "round_number": 1,
      "speaker": "Customs Inspector",
      "role_title": "Senior Border Compliance Officer",
      "argument": "detailed technical/statutory challenge",
      "cited_rules": ["statute 1", "regulation 2"],
      "risk_level": "high"
    },
    {
      "round_number": 2,
      "speaker": "Seller Advocate",
      "role_title": "Cross-Border Trade Counsel",
      "argument": "defense and compliant alternative proposal",
      "cited_rules": ["statutory exemption / DSHEA / FPLA"],
      "risk_level": "medium"
    },
    {
      "round_number": 3,
      "speaker": "Customs Inspector",
      "role_title": "Senior Border Compliance Officer",
      "argument": "counter-challenge regarding paperwork, registration or test standards",
      "cited_rules": ["statute 3"],
      "risk_level": "high"
    },
    {
      "round_number": 4,
      "speaker": "Consensus Arbiter",
      "role_title": "LexPort Regulatory Adjudicator",
      "argument": "balanced synthesis and final verdict",
      "cited_rules": ["applicable consensus standard"],
      "risk_level": "neutral"
    }
  ],
  "consensus_verdict": "Clear 2-sentence summary of the final binding ruling",
  "binding_remediations": ["Bullet 1", "Bullet 2", "Bullet 3"]
}

STRICT RULE: ONLY return valid JSON. Do not wrap in markdown or commentary."""


class AdversarialDebateEngine:
    def __init__(self):
        self.settings = get_settings()

    async def run_debate(
        self,
        title: str,
        description: str,
        extracted: ExtractedAttributes,
        violations: List[ComplianceCheckResult],
        target_markets: List[str],
    ) -> AdversarialDebateResult:
        """Run an adversarial debate over the flagged compliance issues."""
        
        # 1. Try dynamic Gemini debate
        gemini_result = await self._debate_with_gemini(title, description, extracted, violations, target_markets)
        if gemini_result:
            return gemini_result

        # 2. Fallback to specialized pre-compiled debate engines
        return self._generate_fallback_debate(title, description, extracted, violations, target_markets)

    async def _debate_with_gemini(
        self,
        title: str,
        description: str,
        extracted: ExtractedAttributes,
        violations: List[ComplianceCheckResult],
        target_markets: List[str]
    ) -> Optional[AdversarialDebateResult]:
        api_key = self.settings.GEMINI_API_KEY
        if not api_key:
            return None

        models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        try:
            client = genai.Client(api_key=api_key)
            violation_summary = "\n".join([
                f"- [{v.country_code}] {v.check_code} ({v.category}): {v.extracted_value} -> Expected: {v.expected_requirement} (Statute: {v.rule_citation})"
                for v in violations if v.status in ["violation", "escalation", "warning"]
            ])

            prompt = (
                f"Product: {title}\n"
                f"Category: {extracted.category} ({extracted.subcategory})\n"
                f"Target Markets: {', '.join(target_markets)}\n"
                f"Detected Regulatory Violations & Escalations:\n{violation_summary or 'No critical violations'}\n\n"
                f"Full Listing Text:\n{description[:800]}"
            )

            for model_name in models_to_try:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=DEBATE_SYSTEM_PROMPT,
                            temperature=0.3,
                            response_mime_type="application/json"
                        ),
                    )

                    if response and response.text:
                        data = json.loads(response.text.strip())
                        return AdversarialDebateResult(**data)
                except Exception as me:
                    logger.debug(f"[DEBATE] Gemini model {model_name} error: {me}")
                    continue
        except Exception as e:
            logger.warning(f"[DEBATE] Gemini debate error: {e}. Using deterministic debate generator.")
        return None

    def _generate_fallback_debate(
        self,
        title: str,
        description: str,
        extracted: ExtractedAttributes,
        violations: List[ComplianceCheckResult],
        target_markets: List[str]
    ) -> AdversarialDebateResult:
        lower = f"{title} {description}".lower()

        # Preset Case A: Ayurvedic / Pain Relief Cream
        if "arthritis" in lower or "ayurvedic" in lower or "pain" in lower:
            return AdversarialDebateResult(
                debate_topic="Therapeutic Disease Claims ('Cures Arthritis') vs Cosmetic / Herbal Structure-Function Claims",
                turns=[
                    DebateTurn(
                        round_number=1,
                        speaker="Customs Inspector",
                        role_title="FDA Import Operations / Port Inspector",
                        argument="This shipment is subject to immediate detention under Section 801(a) of the FD&C Act. The seller boldly claims this cream 'cures arthritis and permanently eliminates joint inflammation.' Under 21 U.S.C. § 321(g)(1)(B), asserting cure for arthritis legally transforms this topical formulation into an unapproved new drug. In the US, drugs require an approved NDA or OTC monograph registration. Furthermore, camphor appears to be unstandardized, and there is no FDA Facility Establishment Identifier on file.",
                        cited_rules=["21 U.S.C. § 321(g)(1)", "21 CFR § 201.128", "FD&C Act § 505"],
                        risk_level="high"
                    ),
                    DebateTurn(
                        round_number=2,
                        speaker="Seller Advocate",
                        role_title="Cross-Border E-Commerce Trade Counsel",
                        argument="We concede the wording 'cures arthritis' was an unfortunate marketing overstatement by the copywriter. However, the product itself is a time-tested, safe herbal topical balm containing natural sesame oil, camphor, and herbal extracts licensed under India's AYUSH ministry. We do not intend to market this as a pharmaceutical drug. We propose immediately amending the listing to compliant structure/function language: 'formulated to support joint comfort and soothe sore muscles during massage.'",
                        cited_rules=["DSHEA Structure/Function Guidance", "FTC Act Section 5 Substantiation"],
                        risk_level="medium"
                    ),
                    DebateTurn(
                        round_number=3,
                        speaker="Customs Inspector",
                        role_title="FDA Import Operations / Port Inspector",
                        argument="The proposed text modification solves the primary disease claim violation for the US and EU markets. However, the seller is overlooking destination packaging mandates! Canada requires mandatory English/French bilingual declarations under the Consumer Packaging Act. The EU requires an EU-based Responsible Person address and full INCI ingredient nomenclature. If this packaging lands at Frankfurt or Toronto without an EU RP or French text, customs will reject the physical cartons regardless of digital listing changes.",
                        cited_rules=["Regulation (EC) No 1223/2009 Art. 4", "Canada Packaging Act Sec. 6"],
                        risk_level="high"
                    ),
                    DebateTurn(
                        round_number=4,
                        speaker="Consensus Arbiter",
                        role_title="LexPort Regulatory Adjudicator",
                        argument="Consensus reached through structured two-part remediation. Part 1 (Digital Listing): The seller must apply the compliant structure/function text rewrite ('soothes tired joints' in place of 'cures arthritis'). Part 2 (Physical Packaging & Escalation): The seller must print an EU Responsible Person address and bilingual French declarations on the outer carton. This separates digital copy correction from physical labeling diligence.",
                        cited_rules=["LexPort Unified Compliance Framework 2026"],
                        risk_level="neutral"
                    )
                ],
                consensus_verdict="Digital listing approved conditional upon immediate structure/function claim auto-rewrite. Physical packaging must add EU RP address and Canadian bilingual labels before dispatch.",
                binding_remediations=[
                    "Replace all instances of 'cures arthritis' and 'eliminates pain' with 'supports joint comfort and soothes tired muscles'.",
                    "Add mandatory Country of Origin declaration: 'Made in India'.",
                    "For Canadian orders, ensure bilingual English/French packaging is affixed.",
                    "Designate and print an EU Responsible Person address for European distribution."
                ]
            )

        # Preset Case B: Baby Walker
        if "walker" in lower:
            return AdversarialDebateResult(
                debate_topic="Baby Walker Cross-Border Divergence: Canadian Criminal Ban vs US/UK Certified Compliance",
                turns=[
                    DebateTurn(
                        round_number=1,
                        speaker="Customs Inspector",
                        role_title="Canada Border Services Agency (CBSA) Officer",
                        argument="RED ALERT: This listing contains a baby walker with rolling wheels. Under the Canada Consumer Product Safety Act (CCPSA) Schedule 2, Item 15, baby walkers are totally prohibited across Canada. Selling or advertising a baby walker in Canada is a criminal offense punishable by fines up to $100,000. It doesn't matter if the listing has 5-star reviews or safety certifications in other countries — Canada has zero tolerance for wheeled infant walkers.",
                        cited_rules=["CCPSA Schedule 2, Item 15", "Canada Hazardous Products Regulations"],
                        risk_level="high"
                    ),
                    DebateTurn(
                        round_number=2,
                        speaker="Seller Advocate",
                        role_title="Global Marketplace Operations Lead",
                        argument="We acknowledge Canada's strict ban, but this product is manufactured to high standards and is currently sold in the United States and United Kingdom. In the US, it complies with ASTM F977 stair-fall protection, and in the UK/EU it satisfies BS EN 1273. We should not have to shut down global sales merely because one country has a prohibition. We propose geofencing: excluding Canadian shipping addresses while maintaining US and European listings with verified lab test documentation.",
                        cited_rules=["16 CFR Part 1216 / ASTM F977", "BS EN 1273:2020"],
                        risk_level="medium"
                    ),
                    DebateTurn(
                        round_number=3,
                        speaker="Customs Inspector",
                        role_title="CPSC Compliance Investigator",
                        argument="The US and UK will permit entry, BUT ONLY on the condition of strict physical certification proof. The seller cannot simply claim it is safe in the description. In the US, an accredited CPSC-accepted third-party laboratory must issue a Children's Product Certificate (CPC) proving the walker cannot fall down steps. Furthermore, tracking labels with date and batch of manufacture must be permanently molded onto the frame under CPSIA Section 103.",
                        cited_rules=["CPSIA Section 103", "16 CFR Part 1110"],
                        risk_level="high"
                    ),
                    DebateTurn(
                        round_number=4,
                        speaker="Consensus Arbiter",
                        role_title="LexPort Regulatory Adjudicator",
                        argument="Final Binding Resolution: 1. Strict Market Exclusion: Disable Canadian shipping immediately on all storefronts. 2. Tier 3 Lab Documentation Escalation: Flag US and UK listings as 'Human Review / Test Report Required' until the seller uploads an accredited ASTM F977 / BS EN 1273 test certificate. Never auto-resolve child safety items without verified laboratory test reports.",
                        cited_rules=["LexPort Multi-Jurisdiction Geofence Protocol"],
                        risk_level="neutral"
                    )
                ],
                consensus_verdict="Total shipping block enforced for Canada (Criminal Prohibition). US and UK markets require upload and verification of third-party accredited safety testing reports.",
                binding_remediations=[
                    "CRITICAL: Exclude Canada from international shipping templates immediately (CCPSA Schedule 2).",
                    "Upload CPSC-accepted ASTM F977-18 Children's Product Certificate (CPC) for US customs.",
                    "Verify BS EN 1273:2020 test report for UK / European distribution.",
                    "Ensure permanent molded tracking label (batch, manufacturer, date) is present on walker chassis."
                ]
            )

        # Preset Case C: Cutting Board / Antimicrobial Spray (EPA Pesticide)
        if "antibacterial" in lower or "cutting board" in lower or "germs" in lower or "spray" in lower:
            return AdversarialDebateResult(
                debate_topic="EPA FIFRA Pesticide Classification Mismatch on Antimicrobial Hard Surfaces",
                turns=[
                    DebateTurn(
                        round_number=1,
                        speaker="Customs Inspector",
                        role_title="EPA Border Enforcement / CBP Liaison",
                        argument="Stop the shipment. The listing describes this kitchen surface spray / cutting board as 'kills 99.9% of bacteria and germs permanently.' Under 40 CFR § 152.15, any product making public health claims to kill or mitigate pathogens on inanimate surfaces is an EPA-regulated PESTICIDE. Without a valid EPA Registration Number and EPA Establishment Number, this product is an illegal unregistered pesticide under FIFRA Section 12.",
                        cited_rules=["40 CFR § 152.15", "FIFRA Section 12(a)(1)(A)"],
                        risk_level="high"
                    ),
                    DebateTurn(
                        round_number=2,
                        speaker="Seller Advocate",
                        role_title="E-Commerce Merchant Representative",
                        argument="This is an all-natural bamboo cutting board / organic cleaning spray! The seller is not a chemical pesticide manufacturer; they used the word 'antibacterial' merely to signify cleanliness and hygiene. In the UK and EU, antimicrobial cutting boards are lawful as 'treated articles' under Biocidal Products Regulation without pesticide registration. Can we not simply clarify that it protects the board itself rather than treating diseases?",
                        cited_rules=["EPA PR Notice 2000-1 (Treated Article Exemption)", "EU BPR Regulation (EU) 528/2012"],
                        risk_level="medium"
                    ),
                    DebateTurn(
                        round_number=3,
                        speaker="Customs Inspector",
                        role_title="EPA Border Enforcement / CBP Liaison",
                        argument="The advocate correctly points to the Treated Article Exemption (40 CFR § 152.25(a)). BUT the exemption ONLY applies if the claim is strictly limited to protecting the cutting board itself against discoloration or odor (e.g. 'antimicrobial properties built in to protect the board'). The moment the listing claims 'kills 99.9% germs' to protect human users from food poisoning, the exemption is void and EPA pesticide penalties apply!",
                        cited_rules=["40 CFR § 152.25(a)", "EPA Compliance Advisory 2021"],
                        risk_level="high"
                    ),
                    DebateTurn(
                        round_number=4,
                        speaker="Consensus Arbiter",
                        role_title="LexPort Regulatory Adjudicator",
                        argument="Resolution reached via Narrowed Claim Auto-Rewrite: Reframe the marketing text to qualify for EPA's Treated Article Exemption. Strip all claims of killing pathogens or protecting human health. Rephrase strictly to: 'Naturally resistant surface that inhibits odor and stain-causing bacteria on the board.' This keeps the product 100% legal in the US without requiring an EPA registration.",
                        cited_rules=["EPA Treated Article Protocol (PR Notice 2000-1)"],
                        risk_level="neutral"
                    )
                ],
                consensus_verdict="Listing rewritten to qualify under the EPA Treated Article Exemption. Unlawful public-health pathogen claims removed.",
                binding_remediations=[
                    "Remove 'kills 99.9% bacteria and germs' from title and bullet points.",
                    "Adopt compliant treated article claim: 'Inhibits stain and odor-causing bacteria to protect the cutting board surface.'",
                    "Add explicit disclaimer: 'This product does not protect users or others against food-borne bacteria.'",
                    "Declare active botanical extract on packaging for UK/EU BPR compliance."
                ]
            )

        # Default Generic Debate
        return AdversarialDebateResult(
            debate_topic="Regulatory Harmonization vs Informal Marketing Discrepancy",
            turns=[
                DebateTurn(
                    round_number=1,
                    speaker="Customs Inspector",
                    role_title="Senior Border Compliance Officer",
                    argument=f"The listing contains technical and labeling ambiguities across {', '.join(target_markets)}. Unsubstantiated claims and missing mandatory statutory fields prevent standard clearance.",
                    cited_rules=["General Import Regulations / FPLA"],
                    risk_level="high"
                ),
                DebateTurn(
                    round_number=2,
                    speaker="Seller Advocate",
                    role_title="Trade Operations Advisor",
                    argument="The commercial intent is transparent and compliant with standard consumer retail. We propose standardizing the declarations and harmonizing the claims language.",
                    cited_rules=["Consumer Protection Framework"],
                    risk_level="low"
                ),
                DebateTurn(
                    round_number=3,
                    speaker="Consensus Arbiter",
                    role_title="LexPort Adjudicator",
                    argument="Listing approved subject to mandatory statutory field disclosures and claims harmonization across chosen destination markets.",
                    cited_rules=["LexPort Standard Protocol"],
                    risk_level="neutral"
                )
            ],
            consensus_verdict="Listing approved conditional upon adopting compliant product declarations.",
            binding_remediations=[
                "Ensure all mandatory label declarations are present.",
                "Verify third-party safety testing documentation where applicable."
            ]
        )
