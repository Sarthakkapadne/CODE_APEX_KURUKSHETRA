"""
LexPort — Compliance & Trade Intelligence Chatbot Router
Provides interactive chat, tariff checking, profit margin calculations,
and statutory document checklists for cross-border e-commerce sellers.
"""
from __future__ import annotations
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.modules.intelligence.compliance_chatbot import ComplianceChatbot

router = APIRouter()
_chatbot = ComplianceChatbot()


class ChatMessageRequest(BaseModel):
    message: str = Field(..., description="User query or instruction for the compliance chatbot")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="Recent conversation turns")
    context: Optional[Dict[str, Any]] = Field(None, description="Optional active listing or audit data")


class ProfitCalculationRequest(BaseModel):
    product_name: Optional[str] = "Generic Product"
    category: str = Field("general", description="cosmetics | toys | kitchenware | electronics | general")
    country_code: str = Field("US", description="Target 2-letter country code (US, CA, EU, UK, JP, AU, IN, CN, DE, VN)")
    selling_price_usd: float = Field(35.0, description="Retail selling price / MSRP in USD")
    unit_cost_usd: float = Field(10.0, description="Unit manufacturing cost / COGS in USD")
    shipping_cost_usd: float = Field(5.0, description="Unit international shipping / freight cost in USD")


@router.post("/message", summary="Send message to Compliance & Trade AI Chatbot")
async def chat_message(req: ChatMessageRequest):
    """
    Evaluates cross-border compliance questions, calculates tariffs & landed cost,
    determines profit margins, and itemizes mandatory legal documentation.
    """
    try:
        res = await _chatbot.chat(
            user_message=req.message,
            conversation_history=req.conversation_history,
            context=req.context
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")


@router.post("/calculate-profit", summary="Calculate landed cost, import tariffs, taxes & net profit")
def calculate_landed_cost_and_profit(req: ProfitCalculationRequest):
    """
    Computes precise cross-border financial metrics:
    De minimis qualification, customs duty, VAT/GST, total landed cost, and net profit.
    """
    try:
        return _chatbot.calculate_profit(
            category=req.category,
            country_code=req.country_code,
            selling_price_usd=req.selling_price_usd,
            unit_cost_usd=req.unit_cost_usd,
            shipping_cost_usd=req.shipping_cost_usd
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")


@router.get("/documents", summary="Retrieve mandatory compliance document checklist")
def get_required_documents(
    category: str = Query("cosmetics", description="Product category"),
    country: Optional[str] = Query(None, description="Target country code (e.g. US, CA, EU, UK, JP, AU, IN, CN, DE, VN)"),
    country_code: Optional[str] = Query(None, description="Target country code alias"),
    raw_text: Optional[str] = Query("", description="Optional listing description text")
):
    """Returns official statutory document checklist, authorities, and citations."""
    target_country = country_code or country or "US"
    try:
        return _chatbot.get_documents_checklist(category=category, country_code=target_country, raw_text=raw_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Document lookup error: {str(e)}")


@router.get("/countries", summary="List supported destination countries and trade economic profiles")
def list_supported_countries():
    """Returns list of supported countries, currency codes, and de minimis profiles."""
    profiles = [
        {"code": "US", "country_code": "US", "name": "United States", "flag": "🇺🇸", "currency": "USD", "vat_gst_rate": "0% (Sales Tax at checkout)", "estimated_duty_rate": "0.0%"},
        {"code": "CA", "country_code": "CA", "name": "Canada", "flag": "🇨🇦", "currency": "CAD", "vat_gst_rate": "5.0% GST", "estimated_duty_rate": "6.5%"},
        {"code": "EU", "country_code": "EU", "name": "European Union", "flag": "🇪🇺", "currency": "EUR", "vat_gst_rate": "21.0% VAT", "estimated_duty_rate": "6.5%"},
        {"code": "DE", "country_code": "DE", "name": "Germany", "flag": "🇩🇪", "currency": "EUR", "vat_gst_rate": "19.0% MwSt", "estimated_duty_rate": "6.5%"},
        {"code": "UK", "country_code": "UK", "name": "United Kingdom", "flag": "🇬🇧", "currency": "GBP", "vat_gst_rate": "20.0% VAT", "estimated_duty_rate": "6.0%"},
        {"code": "JP", "country_code": "JP", "name": "Japan", "flag": "🇯🇵", "currency": "JPY", "vat_gst_rate": "10.0% JCT", "estimated_duty_rate": "5.0%"},
        {"code": "AU", "country_code": "AU", "name": "Australia", "flag": "🇦🇺", "currency": "AUD", "vat_gst_rate": "10.0% GST", "estimated_duty_rate": "5.0%"},
        {"code": "IN", "country_code": "IN", "name": "India", "flag": "🇮🇳", "currency": "INR", "vat_gst_rate": "18.0% GST", "estimated_duty_rate": "20.0%"},
        {"code": "CN", "country_code": "CN", "name": "China", "flag": "🇨🇳", "currency": "CNY", "vat_gst_rate": "13.0% VAT", "estimated_duty_rate": "10.0%"},
        {"code": "VN", "country_code": "VN", "name": "Vietnam", "flag": "🇻🇳", "currency": "VND", "vat_gst_rate": "10.0% VAT", "estimated_duty_rate": "15.0%"},
    ]
    return {"countries": profiles}
