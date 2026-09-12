"""
LexPort — Trade Economics Router
Provides de minimis thresholds, VAT/GST OSS comparisons, and market expansion ease rankings.
"""
from __future__ import annotations
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.session import get_db
from backend.db.models_db import TradeMarketRecord
from backend.modules.economics.trade_advisor import TradeEconomicsAdvisor
from backend.core.models import TradeEconomicsItem

router = APIRouter()
_advisor = TradeEconomicsAdvisor()


class EconomicsRequest(BaseModel):
    target_markets: List[str] = ["US", "EU", "UK", "CA", "JP"]
    product_price_usd: float = 29.99
    category: str = "cosmetics"


@router.post("/compare", response_model=List[TradeEconomicsItem], summary="Compare trade economics and rank easiest markets to enter")
async def compare_trade_economics(req: EconomicsRequest):
    return _advisor.evaluate_markets(
        target_markets=req.target_markets,
        product_price_usd=req.product_price_usd,
        category=req.category,
    )


@router.get("/markets", summary="Get reference fiscal and de minimis data for all markets dynamically from database")
async def get_market_economics_reference(db: AsyncSession = Depends(get_db)):
    """
    Returns trade economics, GPS coordinates, de minimis thresholds, and duty profiles
    queried live from SQLite TradeMarketRecord.
    """
    stmt = select(TradeMarketRecord).order_by(TradeMarketRecord.country_name.asc())
    result = await db.execute(stmt)
    records = result.scalars().all()
    if records:
        out: Dict[str, Any] = {}
        for r in records:
            out[r.country_code] = {
                "country_code": r.country_code,
                "country_name": r.country_name,
                "flag": r.flag,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "governing_agency": r.governing_agency,
                "currency_code": r.currency_code,
                "currency_symbol": r.currency_symbol,
                "usd_exchange_rate": r.usd_exchange_rate,
                "de_minimis_threshold": r.de_minimis_threshold_usd,
                "de_minimis_threshold_usd": r.de_minimis_threshold_usd,
                "de_minimis_currency": r.currency_code,
                "de_minimis_description": r.de_minimis_description,
                "standard_duty_rate": str(r.standard_duty_rate or "0%"),
                "standard_duty_pct": float(r.standard_duty_pct or 0.0),
                "vat_gst_rate": str(r.vat_gst_rate or "0%"),
                "vat_gst_numeric": float(r.vat_gst_pct or 0.0),
                "air_transit_days": r.air_transit_days,
                "ocean_transit_days": r.ocean_transit_days,
                "customs_complexity_score": r.complexity_score,
                "trade_status": r.trade_status,
                "estimated_duty_rate": str(r.standard_duty_rate or "0%"),
            }
        # Also cache into _advisor for synchronous evaluate_markets
        _advisor._data = out
        return out
    return _advisor._data
