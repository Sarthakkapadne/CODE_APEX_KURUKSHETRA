"""
LexPort — Listings & Presets Router
Provides 1-click loading of the 5 real-world documented failure cases for judging demos.
"""
from __future__ import annotations
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from backend.db.seed_data import PRESET_LISTINGS

router = APIRouter()


@router.get("/presets", summary="Get all 5 documented real-world case study presets")
async def get_presets():
    """
    Returns the 5 real-world documented cross-border case studies:
    1. Ayurvedic Herbal Joint Healing Cream (FDA unapproved drug / disease cure)
    2. Infant Developmental Baby Walker (Canada criminal ban vs US/UK ASTM/EN compliance)
    3. All-Natural Bamboo Cutting Board (US EPA FIFRA pesticide registration trigger)
    4. Smart Rest Infant Sleep Positioner (US Safe Sleep for Babies Act federal ban)
    5. Rechargeable Heated Thermal Eye Wand (Lithium battery IATA Hazmat air freight)
    """
    return PRESET_LISTINGS


@router.get("/preset/{preset_id}", summary="Get a specific preset by ID")
async def get_preset_by_id(preset_id: str):
    for p in PRESET_LISTINGS:
        if p["id"] == preset_id:
            return p
    raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found")
