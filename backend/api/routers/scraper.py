"""
LexPort — E-Commerce Listing Scraper Router
Fetches and extracts product listing content from marketplace URLs (Amazon, Shopify, etc.).
"""
from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from backend.modules.scraper.listing_scraper import ListingScraper

router = APIRouter()
_scraper = ListingScraper()


class ScrapeRequest(BaseModel):
    url: str


@router.post("/scrape", summary="Scrape product title, description, price, and specs from marketplace URL")
async def scrape_listing_url(req: ScrapeRequest):
    return await _scraper.scrape(req.url)
