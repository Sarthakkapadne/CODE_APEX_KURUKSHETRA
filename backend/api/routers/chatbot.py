"""
LexPort — Compliance & Trade Intelligence Chatbot Router
Provides interactive chat, tariff checking, profit margin calculations,
and statutory document checklists for cross-border e-commerce sellers.
"""
from __future__ import annotations
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from backend.modules.intelligence.compliance_chatbot import ComplianceChatbot
from backend.db.session import get_db
from backend.db.models_db import TradeMarketRecord, RequiredDocumentRecord

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


@router.get("/documents", summary="Retrieve mandatory compliance document checklist dynamically from database")
async def get_required_documents(
    category: str = Query("cosmetics", description="Product category"),
    country: Optional[str] = Query(None, description="Target country code (e.g. US, CA, EU, UK, JP, AU, IN, CN, DE, VN)"),
    country_code: Optional[str] = Query(None, description="Target country code alias"),
    raw_text: Optional[str] = Query("", description="Optional listing description text"),
    db: AsyncSession = Depends(get_db)
):
    """Returns official statutory document checklist, authorities, and citations queried from SQLite database."""
    target_country = (country_code or country or "US").upper()
    try:
        # First query live DB for stored statutory document records
        stmt = select(RequiredDocumentRecord).where(
            or_(
                RequiredDocumentRecord.country_code == target_country,
                RequiredDocumentRecord.country_code == "ALL"
            )
        )
        res = await db.execute(stmt)
        records = res.scalars().all()
        
        # Fall back or complement with deterministic document engine
        engine_docs = _chatbot.get_documents_checklist(category=category, country_code=target_country, raw_text=raw_text)
        
        if records:
            db_docs = [
                {
                    "doc_code": r.id,
                    "doc_name": r.doc_name,
                    "is_mandatory": r.is_mandatory,
                    "statutory_citation": r.statutory_citation,
                    "governing_agency": r.governing_agency,
                    "issuing_authority": r.issuing_authority,
                    "description": r.description,
                    "seller_action_needed": r.seller_action_needed,
                    "category": r.category,
                    "country_code": r.country_code,
                }
                for r in records
            ]
            # Merge unique documents by doc_name or doc_code
            seen = {d["doc_name"].lower() for d in db_docs}
            for ed in engine_docs:
                if ed["doc_name"].lower() not in seen:
                    db_docs.append(ed)
                    seen.add(ed["doc_name"].lower())
            return db_docs

        return engine_docs
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Document lookup error: {str(e)}")


@router.get("/countries", summary="List supported destination countries and trade economic profiles from database")
async def list_supported_countries(db: AsyncSession = Depends(get_db)):
    """Returns list of supported countries, currency codes, and de minimis profiles queried dynamically from SQLite."""
    stmt = select(TradeMarketRecord).order_by(TradeMarketRecord.country_name.asc())
    res = await db.execute(stmt)
    records = res.scalars().all()
    if records:
        profiles = [
            {
                "code": r.country_code,
                "country_code": r.country_code,
                "name": r.country_name,
                "flag": r.flag,
                "currency": r.currency_code,
                "vat_gst_rate": str(r.vat_gst_rate or "0%"),
                "estimated_duty_rate": str(r.standard_duty_rate or "0%"),
                "de_minimis_threshold": r.de_minimis_threshold_usd,
                "de_minimis_description": r.de_minimis_description,
                "governing_agency": r.governing_agency,
                "latitude": r.latitude,
                "longitude": r.longitude,
            }
            for r in records
        ]
        return {"countries": profiles, "supported_countries": profiles}

    # Fallback if DB not seeded yet
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
    return {"countries": profiles, "supported_countries": profiles}
