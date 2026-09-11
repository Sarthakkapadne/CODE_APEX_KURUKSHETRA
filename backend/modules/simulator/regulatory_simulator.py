"""
LexPort — Regulatory Change Simulator & Alert Broadcaster
Allows testing dynamic regulatory shocks mid-demo:
- US EPA Emergency Guidance on Antimicrobial Claims
- EU SCCS Cosmetic Concentration Reduction (0.05% Peroxide)
- Health Canada Expansion of Infant Product Bans (Rockers/Bouncers)

Emits live broadcast notices and flips matrix evaluation statuses in real time.
"""
from __future__ import annotations
from typing import Dict, List, Any
from datetime import datetime, timezone


class RegulatorySimulator:
    def __init__(self):
        self._active_simulations: Dict[str, bool] = {
            "sim_us_epa_crackdown": False,
            "sim_eu_peroxide_crackdown": False,
            "sim_ca_rockers_ban": False,
        }
        self._broadcast_history: List[Dict[str, Any]] = []

    def get_simulation_status(self) -> Dict[str, bool]:
        return dict(self._active_simulations)

    def toggle_simulation(self, simulation_id: str, is_active: bool) -> Dict[str, Any]:
        self._active_simulations[simulation_id] = is_active

        alert_metadata = {
            "sim_us_epa_crackdown": {
                "title": "US EPA Emergency Enforcement Advisory 2026-09",
                "affected_country": "US",
                "authority": "United States Environmental Protection Agency (EPA)",
                "summary": "EPA issues immediate stop-sale orders against consumer surface goods using 'hygienic' or 'protective shield' terminology without FIFRA Section 3 registration.",
                "impact": "Previously borderline or green cutting boards and cleaners now flip to VIOLATION."
            },
            "sim_eu_peroxide_crackdown": {
                "title": "EU SCCS Opinion / Regulation Amendment (EU) 2026/891",
                "affected_country": "EU",
                "authority": "European Commission / Scientific Committee on Consumer Safety (SCCS)",
                "summary": "Direct-to-consumer cosmetic threshold for hydrogen peroxide lowered from 0.1% to 0.05% w/w.",
                "impact": "Cosmetic teeth whitening formulations with >0.05% peroxide immediately flip to VIOLATION."
            },
            "sim_ca_rockers_ban": {
                "title": "Health Canada Gazette Part II: Schedule 2 Expansion",
                "affected_country": "CA",
                "authority": "Health Canada Consumer Product Safety Directorate",
                "summary": "Canada Consumer Product Safety Act Schedule 2 broadened to outlaw all motorized infant rockers, gliders, and bouncers.",
                "impact": "All infant rockers and bouncer listings are subject to criminal border seizure."
            }
        }.get(simulation_id, {
            "title": f"Regulatory Update: {simulation_id}",
            "affected_country": "GLOBAL",
            "authority": "LexPort Regulatory Monitor",
            "summary": "Dynamic rule condition toggled.",
            "impact": "Affected compliance matrix cells updated."
        })

        broadcast_entry = {
            "id": f"alert-{int(datetime.now(timezone.utc).timestamp())}",
            "simulation_id": simulation_id,
            "is_active": is_active,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **alert_metadata
        }

        if is_active:
            self._broadcast_history.insert(0, broadcast_entry)

        return broadcast_entry

    def get_broadcasts(self) -> List[Dict[str, Any]]:
        return self._broadcast_history[:20]
