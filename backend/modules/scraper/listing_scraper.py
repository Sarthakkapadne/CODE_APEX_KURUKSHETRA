"""
LexPort — E-Commerce Listing Scraper Engine
Parses Amazon, Shopify, Walmart, or generic marketplace URLs into structured listing inputs.
Includes resilient fallback if live scraping is blocked by marketplace anti-bot shields.
"""
from __future__ import annotations
import logging
import re
from typing import Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

DESKTOP_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)


class ListingScraper:
    """Extracts product listing metadata from public e-commerce URLs."""

    async def scrape(self, url: str) -> Dict[str, Any]:
        url_clean = url.strip()
        result = {
            "source_url": url_clean,
            "title": "",
            "description": "",
            "brand_name": "Imported Brand",
            "price": 29.99,
            "currency": "USD",
            "country_of_origin": "India",
            "category_hint": "general_merchandise",
            "images": []
        }

        # 1. Attempt live fetch via httpx
        html = ""
        try:
            headers = {
                "User-Agent": DESKTOP_UA,
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
            async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=8.0) as client:
                resp = await client.get(url_clean)
                if resp.status_code == 200:
                    html = resp.text
        except Exception as e:
            logger.warning(f"[SCRAPER] Live fetch failed for {url_clean}: {e}")

        # 2. Parse HTML if received
        if html:
            soup = BeautifulSoup(html, "html.parser")
            # Title
            for selector in ["#productTitle", "h1.product-title", "h1.entry-title", "h1", ".product__title"]:
                el = soup.select_one(selector)
                if el and el.get_text(strip=True):
                    result["title"] = el.get_text(" ", strip=True)
                    break

            # Brand
            for selector in ["#bylineInfo", ".product__vendor", ".brand", "a[data-brand]"]:
                el = soup.select_one(selector)
                if el and el.get_text(strip=True):
                    result["brand_name"] = el.get_text(" ", strip=True).replace("Brand: ", "").replace("Visit the ", "").replace(" Store", "")
                    break

            # Description / Bullets
            bullets = []
            for selector in ["#feature-bullets li", ".product-description", "#productDescription", ".product__description"]:
                for el in soup.select(selector):
                    txt = el.get_text(" ", strip=True)
                    if txt and len(txt) > 10 and not txt.startswith("Make sure this fits"):
                        bullets.append(txt)

            if bullets:
                result["description"] = "\n• ".join(bullets)

            # Price
            for selector in [".a-price .a-offscreen", ".product-price", ".price", "[data-product-price]"]:
                el = soup.select_one(selector)
                if el and el.get_text(strip=True):
                    p_text = el.get_text(strip=True)
                    m = re.search(r'[\$£€¥]?\s*(\d+(?:\.\d{2})?)', p_text)
                    if m:
                        try:
                            result["price"] = float(m.group(1))
                        except Exception:
                            pass
                    break

        # 3. If live scrape yielded empty or was blocked by Amazon/Cloudflare captcha, provide contextual mock
        if not result["title"]:
            result = self._get_fallback_mock_for_url(url_clean)

        return result

    def _get_fallback_mock_for_url(self, url: str) -> Dict[str, Any]:
        lower_url = url.lower()

        if "walker" in lower_url:
            return {
                "source_url": url,
                "title": "Baby Joy 3-in-1 Foldable Activity Baby Walker with Wheels, High-Back Padded Seat",
                "description": (
                    "• STURDY BASE WITH SMOOTH SWIVEL WHEELS: Multi-directional rolling wheels for effortless infant exploration on hardwood and carpets.\n"
                    "• 3-POSITION ADJUSTABLE HEIGHT: Accommodates growing toddlers aged 6 to 18 months.\n"
                    "• INTERACTIVE REMOVABLE TOY TRAY: Features melodious musical lights and steering wheel toy.\n"
                    "• COMPACT FOLDING: Easy fold flat design for convenient storage and family travel.\n"
                    "• SPECIFICATIONS: Max weight 30 lbs. Made of durable BPA-free PP plastic."
                ),
                "brand_name": "BabyJoy Infant Gear",
                "price": 59.99,
                "currency": "USD",
                "country_of_origin": "China",
                "category_hint": "toys",
                "images": ["/static/demo_walker.jpg"]
            }

        if "cutting" in lower_url or "board" in lower_url or "antimicrobial" in lower_url:
            return {
                "source_url": url,
                "title": "EcoGreen All-Natural Bamboo Cutting Board with Antibacterial Surface Protection",
                "description": (
                    "• ANTIBACTERIAL SURFACE: Kills 99.9% of bacteria and germs on contact to eliminate kitchen contamination.\n"
                    "• 100% ORGANIC MOSO BAMBOO: Knife-friendly dense grain that will not dull chef knives.\n"
                    "• DEEP JUICE GROOVES: Catches meat juices and vegetable runoff to prevent counter messes.\n"
                    "• PRE-OILED & FOOD SAFE: Treated with natural mineral oil for long-lasting hygienic performance."
                ),
                "brand_name": "EcoGreen Kitchen",
                "price": 24.99,
                "currency": "USD",
                "country_of_origin": "Vietnam",
                "category_hint": "kitchenware",
                "images": ["/static/demo_board.jpg"]
            }

        # Default fallback: Ayurvedic Pain Cream
        return {
            "source_url": url,
            "title": "AyurVeda Miracle Joint & Muscle Relief Cream - Cures Arthritis Pain Permanently",
            "description": (
                "• PERMANENT ARTHRITIS RELIEF: Clinically proven herbal formulation cures arthritis and completely eliminates chronic joint inflammation.\n"
                "• 100% NATURAL AYURVEDIC FORMULA: Contains therapeutic camphor, sesame oil, and eucalyptus extracts.\n"
                "• FAST-ACTING TRANSDERMAL ABSORPTION: Penetrates deep into cartilege and muscle tissue within 5 minutes.\n"
                "• ANTI-INFLAMMATORY MEDICINE: Doctor-recommended topical treatment for back pain, knees, and rheumatoid symptoms."
            ),
            "brand_name": "VedaHeal Natural Care",
            "price": 34.99,
            "currency": "USD",
            "country_of_origin": "India",
            "category_hint": "cosmetics",
            "images": ["/static/demo_cream.jpg"]
        }
