"""
LexPort — Cross-Border Compliance & Trade Intelligence Chatbot Agent
Powered by Gemini API with Local Statutory Rule Grounding & Landed Cost / Tariff Intelligence.
"""
from __future__ import annotations
import json
import logging
import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

from google import genai
from google.genai import types

from backend.core.config import get_settings
from backend.modules.rule_engine.document_matrix import DocumentMatrixEngine
from backend.core.models import RequiredDocumentItem

logger = logging.getLogger(__name__)

RULES_DIR = Path(__file__).resolve().parent.parent / "rule_engine" / "rules_data"
TRADE_FILE = RULES_DIR / "trade_economics.json"

COUNTRY_CURRENCIES = {
    "US": {"code": "USD", "symbol": "$", "rate": 1.0},
    "UK": {"code": "GBP", "symbol": "£", "rate": 0.77},
    "EU": {"code": "EUR", "symbol": "€", "rate": 0.92},
    "DE": {"code": "EUR", "symbol": "€", "rate": 0.92},
    "CA": {"code": "CAD", "symbol": "C$", "rate": 1.36},
    "JP": {"code": "JPY", "symbol": "¥", "rate": 152.0},
    "AU": {"code": "AUD", "symbol": "A$", "rate": 1.52},
    "IN": {"code": "INR", "symbol": "₹", "rate": 86.5},
    "CN": {"code": "CNY", "symbol": "¥", "rate": 7.24},
    "VN": {"code": "VND", "symbol": "₫", "rate": 25400.0},
}

DEFAULT_DUTY_RATES = {
    "cosmetics": {"US": 0.0, "UK": 0.0, "EU": 0.0, "DE": 0.0, "CA": 0.065, "JP": 0.0, "AU": 0.05, "IN": 0.20, "CN": 0.091, "VN": 0.20},
    "toys": {"US": 0.0, "UK": 0.0, "EU": 0.0, "DE": 0.0, "CA": 0.0, "JP": 0.0, "AU": 0.0, "IN": 0.70, "CN": 0.0, "VN": 0.15},
    "kitchenware": {"US": 0.032, "UK": 0.02, "EU": 0.027, "DE": 0.027, "CA": 0.07, "JP": 0.039, "AU": 0.05, "IN": 0.20, "CN": 0.08, "VN": 0.15},
    "electronics": {"US": 0.0, "UK": 0.0, "EU": 0.0, "DE": 0.0, "CA": 0.0, "JP": 0.0, "AU": 0.0, "IN": 0.15, "CN": 0.0, "VN": 0.10},
    "general": {"US": 0.03, "UK": 0.025, "EU": 0.035, "DE": 0.035, "CA": 0.06, "JP": 0.04, "AU": 0.05, "IN": 0.20, "CN": 0.091, "VN": 0.15}
}

SYSTEM_PROMPT = """You are the LexPort Cross-Border Trade & Regulatory Compliance AI Copilot.
You assist e-commerce sellers, brand owners, and cross-border exporters selling across:
US, CA, EU, UK, JP, AU, IN, CN, DE, and VN.

CORE INSTRUCTION — ALWAYS ANSWER DIRECTLY IN NATURAL TEXT:
1. Direct Text Answer: Answer the user's specific question immediately and concisely in plain, natural conversational text.
2. No Generic Boilerplate: DO NOT generate unprompted multi-section dossiers, unsolicited lengthy descriptions, or redundant tables unless the user explicitly requests a full financial or regulatory report.
3. Tailor to the User's Intent:
   - Tariff Question: State the exact customs tariff rate, import VAT/GST rate, and de minimis threshold directly in clear text.
   - Profit Question: State the estimated net profit and profit margin percentage clearly in text.
   - Document Question: List the specific mandatory certificates, registrations, and invoices needed in clean, concise bullet points.
   - Legal/Compliance Question: State clearly if the product is permitted, restricted, or banned, quoting the specific statute and practical solution in text.
   - Greetings & General Questions: Respond warmly, briefly, and helpfully in text.
4. Grounding: Use the provided grounded trade economics and statutory rules for 100% factual accuracy, but only extract what directly answers the question.
"""


class ComplianceChatbot:
    """AI-driven compliance, tariff, profit, and document intelligence copilot."""

    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.GEMINI_API_KEY
        self.doc_engine = DocumentMatrixEngine()
        self.models_to_try = [
            "gemini-3.6-flash",
            "gemini-3.5-flash"
        ]
        self._rules_cache: Dict[str, Any] = {}
        self._trade_cache: Dict[str, Any] = {}
        self._load_local_data()

    def _load_local_data(self):
        # Load rules
        for f in RULES_DIR.glob("*_rules.json"):
            try:
                with open(f, "r", encoding="utf-8") as fl:
                    d = json.load(fl)
                    c = d.get("country_code") or f.stem.split("_")[0].upper()
                    self._rules_cache[c.upper()] = d
            except Exception:
                pass
        # Load trade economics
        if TRADE_FILE.exists():
            try:
                with open(TRADE_FILE, "r", encoding="utf-8") as fl:
                    self._trade_cache = json.load(fl).get("markets", {})
            except Exception:
                pass

    def calculate_profit(
        self,
        category: str = "general",
        country_code: str = "US",
        selling_price_usd: float = 35.0,
        unit_cost_usd: float = 10.0,
        shipping_cost_usd: float = 5.0
    ) -> Dict[str, Any]:
        cc = country_code.upper()
        if cc not in COUNTRY_CURRENCIES:
            cc = "US"
        curr = COUNTRY_CURRENCIES[cc]
        trade_info = self._trade_cache.get(cc, {})

        cat_key = category.lower()
        if cat_key not in DEFAULT_DUTY_RATES:
            cat_key = "general"

        de_minimis_threshold = trade_info.get("de_minimis_threshold", 800.0 if cc == "US" else 0.0)
        
        # De minimis qualification check
        price_in_local = selling_price_usd * curr["rate"]
        qualifies_de_minimis = False
        if de_minimis_threshold > 0:
            if cc in ["US", "UK", "CA", "AU"]:
                qualifies_de_minimis = (selling_price_usd <= de_minimis_threshold) if cc == "US" else (price_in_local <= de_minimis_threshold)
            elif cc == "JP":
                qualifies_de_minimis = (price_in_local <= de_minimis_threshold)
            elif cc == "VN":
                qualifies_de_minimis = (price_in_local <= de_minimis_threshold)

        # Base duty rate
        standard_duty_pct = DEFAULT_DUTY_RATES[cat_key].get(cc, 0.04)
        effective_duty_pct = 0.0 if qualifies_de_minimis else standard_duty_pct
        duty_amount = round(selling_price_usd * effective_duty_pct, 2)

        # VAT / GST rate
        vat_pct_map = {
            "US": 0.0, "UK": 0.20, "EU": 0.21, "DE": 0.19, "CA": 0.13,
            "JP": 0.10, "AU": 0.10, "IN": 0.18, "CN": 0.13, "VN": 0.10
        }
        vat_pct = vat_pct_map.get(cc, 0.10)
        tax_amount = round((selling_price_usd + duty_amount) * vat_pct, 2) if cc not in ["US"] else 0.0

        customs_clearance_fee = 0.0 if qualifies_de_minimis else (3.50 if cc in ["CA", "IN"] else 1.50)

        total_landed_cost = round(unit_cost_usd + shipping_cost_usd + duty_amount + customs_clearance_fee, 2)
        gross_revenue = round(selling_price_usd, 2)
        net_profit_usd = round(gross_revenue - total_landed_cost, 2)
        profit_margin_pct = round((net_profit_usd / gross_revenue) * 100, 1) if gross_revenue > 0 else 0.0

        profit_local = round(net_profit_usd * curr["rate"], 2)

        return {
            "country_code": cc,
            "country_name": trade_info.get("country_name", cc),
            "category": cat_key,
            "selling_price_usd": selling_price_usd,
            "selling_price_local": f"{curr['symbol']}{price_in_local:,.2f} {curr['code']}",
            "unit_cost_usd": unit_cost_usd,
            "shipping_cost_usd": shipping_cost_usd,
            "de_minimis_threshold": f"{de_minimis_threshold:,.2f} {trade_info.get('de_minimis_currency', 'USD')}",
            "qualifies_de_minimis": qualifies_de_minimis,
            "duty_rate_percent": f"{effective_duty_pct * 100:.1f}%",
            "duty_amount_usd": duty_amount,
            "vat_gst_percent": f"{vat_pct * 100:.1f}%",
            "estimated_tax_usd": tax_amount,
            "customs_clearance_fee_usd": customs_clearance_fee,
            "total_landed_cost_usd": total_landed_cost,
            "net_profit_usd": net_profit_usd,
            "net_profit_local": f"{curr['symbol']}{profit_local:,.2f} {curr['code']}",
            "profit_margin_percent": f"{profit_margin_pct}%",
            "currency": curr["code"],
            "currency_symbol": curr["symbol"],
            "recommendation": trade_info.get("recommendation_summary", "")
        }

    def get_documents_checklist(self, category: str, country_code: str, raw_text: str = "") -> List[Dict[str, Any]]:
        cc = country_code.upper()
        docs = self.doc_engine.determine_required_documents(category, [cc], raw_text=raw_text)
        result = []
        for d in docs:
            result.append({
                "doc_code": d.doc_code,
                "doc_name": d.doc_name,
                "name": d.doc_name,
                "issuing_authority": d.issuing_authority,
                "authority": d.issuing_authority,
                "country_code": d.country_code,
                "category": d.category,
                "is_mandatory": d.is_mandatory,
                "statutory_citation": d.statutory_citation,
                "seller_action_needed": d.seller_action_needed,
                "description": d.seller_action_needed
            })
        return result

    def get_country_rules_summary(self, country_code: str) -> List[Dict[str, Any]]:
        c_data = self._rules_cache.get(country_code.upper(), {})
        rules = c_data.get("rules", [])
        return [
            {
                "rule_code": r.get("rule_code"),
                "title": r.get("title"),
                "statute_citation": r.get("statute_citation"),
                "category": r.get("category"),
                "severity": r.get("severity"),
                "explanation": r.get("explanation")
            }
            for r in rules[:8]
        ]

    async def chat(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        msg_lower = user_message.lower()

        # 1. Detect target country mentioned or from context
        target_country = "US"
        country_aliases = {
            "usa": "US", "united states": "US", "us": "US", "america": "US",
            "canada": "CA", "ca": "CA",
            "uk": "UK", "united kingdom": "UK", "britain": "UK", "england": "UK",
            "eu": "EU", "europe": "EU", "european union": "EU",
            "germany": "DE", "de": "DE", "deutschland": "DE",
            "japan": "JP", "jp": "JP",
            "australia": "AU", "au": "AU",
            "india": "IN", "in": "IN",
            "china": "CN", "cn": "CN",
            "vietnam": "VN", "vn": "VN",
        }
        country_matched = False
        for alias, code in country_aliases.items():
            if re.search(r'\b' + re.escape(alias) + r'\b', msg_lower):
                target_country = code
                country_matched = True
                break

        if not country_matched and context:
            ctx_c = context.get("destination_market") or context.get("country_code")
            if ctx_c and str(ctx_c).upper() in COUNTRY_CURRENCIES:
                target_country = str(ctx_c).upper()

        # 2. Detect category from message or context
        category = "general"
        if any(w in msg_lower for w in ["cream", "cosmetic", "skincare", "beauty", "balm", "lotion", "ayurvedic", "serum"]):
            category = "cosmetics"
        elif any(w in msg_lower for w in ["toy", "baby walker", "walker", "doll", "infant", "puzzle", "plush"]):
            category = "toys"
        elif any(w in msg_lower for w in ["cutting board", "kitchen", "utensil", "bamboo board", "tableware", "knife"]):
            category = "kitchenware"
        elif any(w in msg_lower for w in ["electronics", "device", "battery", "heated wand", "rechargeable", "laser", "earbud", "charger"]):
            category = "electronics"
        elif context:
            ctx_cat = context.get("category") or context.get("detected_category")
            if ctx_cat and isinstance(ctx_cat, str):
                category = ctx_cat.lower()

        # 3. Detect price and cost if mentioned or from context
        selling_price = 35.0
        unit_cost = 10.0
        if context and context.get("price"):
            try:
                selling_price = float(context["price"])
                unit_cost = max(5.0, round(selling_price * 0.3, 2))
            except (ValueError, TypeError):
                pass

        price_match = re.search(r'(?:selling\s*(?:price|for)?|price|sell(?:ing)?|msrp)[\s:]*\$?([0-9]+(?:\.[0-9]+)?)', msg_lower)
        cost_match = re.search(r'(?:cost|cogs|buy|manufacturing|making)[\s:]*\$?([0-9]+(?:\.[0-9]+)?)', msg_lower)
        if price_match:
            try:
                selling_price = float(price_match.group(1))
            except ValueError:
                pass
        if cost_match:
            try:
                unit_cost = float(cost_match.group(1))
            except ValueError:
                pass

        # 4. Compute profit calculation data
        profit_calc = self.calculate_profit(
            category=category,
            country_code=target_country,
            selling_price_usd=selling_price,
            unit_cost_usd=unit_cost,
            shipping_cost_usd=5.0
        )

        # 5. Retrieve documents & statutory rules
        doc_checklist = self.get_documents_checklist(category, target_country, raw_text=user_message)
        country_rules = self.get_country_rules_summary(target_country)

        # 6. Build Conversation History Context
        history_snippet = ""
        if conversation_history:
            recent_turns = conversation_history[-4:]
            turns_text = []
            for t in recent_turns:
                role = t.get("role", "user")
                c = t.get("content", "")
                if c:
                    turns_text.append(f"{role.capitalize()}: {c}")
            if turns_text:
                history_snippet = "RECENT CONVERSATION:\n" + "\n".join(turns_text) + "\n\n"

        # 7. Grounded Facts strictly for reference
        grounded_facts = f"""GROUNDED KNOWLEDGE BASE (Use to accurately answer the user's specific question):
- Destination Country: {profit_calc['country_name']} ({target_country}, Currency: {profit_calc['currency']})
- Product Category: {category}
- Customs Duty / Tariff Rate: {profit_calc['duty_rate_percent']} (Estimated Duty: ${profit_calc['duty_amount_usd']})
- De Minimis Exemption Limit: {profit_calc['de_minimis_threshold']} (Duty-Free Entry Qualified: {profit_calc['qualifies_de_minimis']})
- Import VAT / GST: {profit_calc['vat_gst_percent']} (Estimated Tax: ${profit_calc['estimated_tax_usd']})
- MSRP: ${profit_calc['selling_price_usd']} ({profit_calc['selling_price_local']}), COGS: ${profit_calc['unit_cost_usd']}, Freight: ${profit_calc['shipping_cost_usd']}
- Total Landed Cost: ${profit_calc['total_landed_cost_usd']}
- Net Profit: ${profit_calc['net_profit_usd']} ({profit_calc['net_profit_local']}) | Net Margin: {profit_calc['profit_margin_percent']}
- Mandatory Documents: {', '.join([d['doc_name'] + ' (' + d['issuing_authority'] + ')' for d in doc_checklist]) if doc_checklist else 'Commercial Customs Invoice with 6-digit HS code'}
- Key Relevant Statutes: {', '.join([r['title'] + ' [' + r['statute_citation'] + ']' for r in country_rules[:4]]) if country_rules else 'Standard Customs Tariff Act'}
"""

        # 8. Call Gemini with cascade fallback
        ai_reply = None
        if self.api_key:
            try:
                client = genai.Client(api_key=self.api_key)
                prompt_messages = f"""{history_snippet}{grounded_facts}

USER QUESTION: {user_message}

RESPONSE INSTRUCTION:
Answer the USER QUESTION directly, clearly, and concisely in text form.
Do NOT give an unprompted general description or unsolicited full dossier.
Address only what the user specifically asked in natural conversational text."""

                for model_candidate in self.models_to_try:
                    try:
                        resp = client.models.generate_content(
                            model=model_candidate,
                            contents=prompt_messages,
                            config=types.GenerateContentConfig(
                                system_instruction=SYSTEM_PROMPT,
                                temperature=0.3
                            )
                        )
                        if resp and resp.text:
                            ai_reply = resp.text.strip()
                            break
                    except Exception as me:
                        err_str = str(me).lower()
                        if "503" in err_str or "unavailable" in err_str or "404" in err_str or "not_found" in err_str:
                            continue
                        logger.warning(f"[CHATBOT] Model {model_candidate} error: {me}")
            except Exception as e:
                logger.error(f"[CHATBOT] Gemini execution failed: {e}")

        # 9. Fallback to direct deterministic answer if AI call fails
        if not ai_reply:
            ai_reply = self._build_deterministic_response(
                user_message=user_message,
                country_code=target_country,
                category=category,
                profit_calc=profit_calc,
                doc_checklist=doc_checklist,
                country_rules=country_rules
            )

        return {
            "reply": ai_reply,
            "response": ai_reply,
            "country_code": target_country,
            "category": category,
            "profit_calculation": profit_calc,
            "document_checklist": doc_checklist,
            "rules_evaluated": len(country_rules)
        }

    def _build_deterministic_response(
        self,
        user_message: str,
        country_code: str,
        category: str,
        profit_calc: Dict[str, Any],
        doc_checklist: List[Dict[str, Any]],
        country_rules: List[Dict[str, Any]]
    ) -> str:
        msg = user_message.lower()
        c_name = profit_calc["country_name"]
        cc = country_code

        is_greeting = any(w in msg for w in ["hi", "hello", "hey", "who are you", "help", "good morning", "good evening"])
        is_tariff = any(w in msg for w in ["tariff", "duty", "tax", "vat", "gst", "de minimis", "customs"])
        is_profit = any(w in msg for w in ["profit", "margin", "how much", "how many", "cogs", "cost", "make", "earn"])
        is_doc = any(w in msg for w in ["document", "docs", "paperwork", "certificate", "license", "registration", "filing"])
        is_ban = any(w in msg for w in ["ban", "allowed", "prohibit", "illegal", "legal", "can i sell", "rule", "law"])

        if is_greeting and not (is_tariff or is_profit or is_doc or is_ban):
            return (
                f"Hello! I am your LexPort Compliance & Trade Copilot. "
                f"Ask me any question about import tariffs, profit margins, required documents, or legal compliance rules "
                f"for selling into {c_name} and other global markets, and I'll give you the exact details in plain text."
            )

        answers = []

        if is_tariff:
            if profit_calc['qualifies_de_minimis']:
                answers.append(
                    f"In **{c_name} ({cc})**, the customs tariff rate for {category} is **{profit_calc['duty_rate_percent']}**. "
                    f"Because your product value is under {c_name}'s de minimis threshold of **{profit_calc['de_minimis_threshold']}**, "
                    f"direct shipments enter **duty-free** ($0.00 customs tariff)."
                )
            else:
                answers.append(
                    f"In **{c_name} ({cc})**, the customs tariff rate for {category} is **{profit_calc['duty_rate_percent']}**, "
                    f"with an estimated customs duty of **${profit_calc['duty_amount_usd']:.2f}**. "
                    f"Additionally, an import VAT/GST rate of **{profit_calc['vat_gst_percent']}** (${profit_calc['estimated_tax_usd']:.2f}) applies."
                )

        if is_profit:
            answers.append(
                f"When importing into **{c_name}**, selling at **${profit_calc['selling_price_usd']:.2f}** ({profit_calc['selling_price_local']}) "
                f"with a product cost of **${profit_calc['unit_cost_usd']:.2f}** and shipping of **${profit_calc['shipping_cost_usd']:.2f}**, "
                f"your total landed cost is **${profit_calc['total_landed_cost_usd']:.2f}**. "
                f"You will earn an estimated net profit of **${profit_calc['net_profit_usd']:.2f}** per unit (**{profit_calc['net_profit_local']}**), "
                f"delivering a net profit margin of **{profit_calc['profit_margin_percent']}**."
            )

        if is_doc:
            doc_items = []
            for idx, d in enumerate(doc_checklist[:5], 1):
                doc_items.append(f"- **{d['doc_name']}**: Required by *{d['issuing_authority']}* ({d['statutory_citation']}). Action: {d['seller_action_needed']}")
            if doc_items:
                answers.append(f"Here are the mandatory documents needed for compliance in **{c_name}**:\n" + "\n".join(doc_items))
            else:
                answers.append(f"For **{c_name}**, you must provide a **Commercial Customs Invoice** declaring the correct 6-digit HS Code, packing list, and bill of lading.")

        if is_ban and country_rules:
            rule_items = []
            for r in country_rules[:3]:
                rule_items.append(f"- **{r['title']}** (*{r['statute_citation']}*): {r['explanation']}")
            answers.append(f"Key compliance safeguards in **{c_name}**:\n" + "\n".join(rule_items))

        if not answers:
            answers.append(
                f"For **{category.title()}** in **{c_name} ({cc})**, the customs tariff is **{profit_calc['duty_rate_percent']}**, "
                f"with an estimated net profit margin of **{profit_calc['profit_margin_percent']}** (${profit_calc['net_profit_usd']:.2f} per unit). "
                f"Key compliance includes registering with relevant authorities and providing valid customs documentation."
            )

        return "\n\n".join(answers)
