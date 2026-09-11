"""
LexPort — Trade Economics Advisor (Tax / Duty / De Minimis Comparator)
Structural differentiator: Moves beyond binary pass/fail compliance into strategic expansion guidance.
Compares import de minimis thresholds, VAT/GST regimes (e.g. EU IOSS vs US Section 321),
and ranks target destination markets by ease of market entry.
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

from backend.core.models import TradeEconomicsItem

DATA_FILE = Path(__file__).resolve().parent.parent / "rule_engine" / "rules_data" / "trade_economics.json"


class TradeEconomicsAdvisor:
    def __init__(self, data_file: Optional[Path] = None):
        self.data_file = data_file or DATA_FILE
        self._data: Dict[str, Any] = {}
        self.load_data()

    def load_data(self) -> None:
        if self.data_file.exists():
            with open(self.data_file, "r", encoding="utf-8") as f:
                self._data = json.load(f).get("markets", {})

    def evaluate_markets(
        self,
        target_markets: List[str],
        product_price_usd: float = 29.99,
        category: str = "cosmetics"
    ) -> List[TradeEconomicsItem]:
        """
        Evaluate and rank selected target markets based on economic friction and customs entry ease.
        """
        items: List[TradeEconomicsItem] = []

        for country in target_markets:
            c_upper = country.upper()
            info = self._data.get(c_upper)
            if not info:
                continue

            # Compute contextual recommendation
            threshold = info.get("de_minimis_threshold", 0.0)
            currency = info.get("de_minimis_currency", "USD")
            rec = info.get("recommendation_summary", "")

            # Tailor recommendation based on product price
            if c_upper == "US" and product_price_usd < 800.0:
                rec = f"Highly Recommended: At ${product_price_usd:.2f}, parcel qualifies for US Section 321 duty-free & tax-free de minimis entry. Zero customs tariffs apply."
            elif c_upper == "CA" and product_price_usd > 20.0:
                rec = f"Fiscal Friction Alert: At ${product_price_usd:.2f} USD (~${product_price_usd * 1.35:.2f} CAD), shipment exceeds Canada's $20 CAD de minimis. CBSA import taxes and carrier disbursement fees will apply."
            elif c_upper == "EU":
                rec = f"VAT Required: Product will incur EU VAT (~21%). Recommend using EU IOSS (Import One-Stop Shop) to collect VAT at checkout and bypass customs holding."

            items.append(TradeEconomicsItem(
                country_code=c_upper,
                country_name=info.get("country_name", c_upper),
                de_minimis_threshold=threshold,
                de_minimis_currency=currency,
                vat_gst_rate=info.get("vat_gst_rate", "Standard"),
                simplification_scheme=info.get("simplification_scheme", "Standard clearance"),
                customs_complexity_score=int(info.get("customs_complexity_score", 5)),
                estimated_duty_rate=info.get("estimated_duty_rate", "Standard"),
                entry_friction_rank=int(info.get("entry_friction_rank", 99)),
                recommendation_summary=rec,
            ))

        # Sort by entry friction rank (1 = easiest)
        return sorted(items, key=lambda x: x.entry_friction_rank)
