"""
LexPort — E-Commerce Listing Scraper Router
Fetches and extracts product listing content from marketplace URLs (Amazon, Shopify, etc.).
"""
from __future__ import annotations
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from backend.modules.scraper.listing_scraper import ListingScraper

logger = logging.getLogger(__name__)

router = APIRouter()
_scraper = ListingScraper()


class ScrapeRequest(BaseModel):
    url: str


@router.post("/scrape", summary="Scrape product title, description, price, and specs from marketplace URL")
async def scrape_listing_url(req: ScrapeRequest):
    try:
        return await _scraper.scrape(req.url)
    except Exception as e:
        logger.error(f"[SCRAPER ROUTE ERROR] Failed to scrape {req.url}: {e}")
        return {
            "source_url": req.url,
            "title": "Imported E-Commerce Product Listing",
            "description": "- HIGH QUALITY FORMULATION: Engineered to meet international trade safety standards.\n- SPECIFICATIONS: Calibrated for standard international courier and border dispatch.",
            "brand_name": "Imported Brand",
            "price": 29.99,
            "currency": "USD",
            "country_of_origin": "India",
            "category_hint": "general_merchandise",
            "images": [],
            "scrape_method": "FALLBACK_ON_ERROR",
            "error": str(e)
        }

