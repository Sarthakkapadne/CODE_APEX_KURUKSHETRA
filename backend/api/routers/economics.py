"""
LexPort — Trade Economics Router
Provides de minimis thresholds, VAT/GST OSS comparisons, and market expansion ease rankings.
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

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


@router.get("/markets", summary="Get reference fiscal and de minimis data for all markets")
async def get_market_economics_reference():
    return _advisor._data
