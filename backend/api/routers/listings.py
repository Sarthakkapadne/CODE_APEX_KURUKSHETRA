"""
LexPort — Listings & Presets Router
Provides 1-click loading of the 5 real-world documented failure cases for judging demos.
"""
from __future__ import annotations
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import json
from backend.db.seed_data import PRESET_LISTINGS
from backend.db.session import get_db
from backend.db.models_db import Listing, ListingPresetRecord

router = APIRouter()


@router.get("/presets", summary="Get all documented real-world case study presets dynamically from database")
async def get_presets(db: AsyncSession = Depends(get_db)):
    """
    Returns the real-world documented cross-border case studies queried live from SQLite:
    1. Ayurvedic Herbal Joint Healing Cream (FDA unapproved drug / disease cure)
    2. Infant Developmental Baby Walker (Canada criminal ban vs US/UK ASTM/EN compliance)
    3. All-Natural Bamboo Cutting Board (US EPA FIFRA pesticide registration trigger)
    4. Smart Rest Infant Sleep Positioner (US Safe Sleep for Babies Act federal ban)
    5. Rechargeable Heated Thermal Eye Wand (Lithium battery IATA Hazmat air freight)
    6. Organic Anti-Aging Serum with SPF (EU Cosmetics Regulation Annex VI / US OTC sunscreen)
    """
    stmt = select(ListingPresetRecord).order_by(ListingPresetRecord.created_at.asc())
    result = await db.execute(stmt)
    records = result.scalars().all()
    if records:
        presets = []
        for r in records:
            imgs = []
            if r.images_json:
                try:
                    imgs = json.loads(r.images_json)
                except Exception:
                    imgs = []
            presets.append({
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "brand_name": r.brand_name,
                "category": r.category,
                "price": r.price,
                "currency": r.currency,
                "country_of_origin": r.country_of_origin,
                "source_url": r.source_url,
                "icon": r.icon,
                "sub_label": r.sub_label,
                "images": imgs,
            })
        return presets
    return PRESET_LISTINGS


@router.get("/preset/{preset_id}", summary="Get a specific preset by ID from database")
async def get_preset_by_id(preset_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ListingPresetRecord).where(ListingPresetRecord.id == preset_id)
    result = await db.execute(stmt)
    r = result.scalars().first()
    if r:
        imgs = []
        if r.images_json:
            try:
                imgs = json.loads(r.images_json)
            except Exception:
                imgs = []
        return {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "brand_name": r.brand_name,
            "category": r.category,
            "price": r.price,
            "currency": r.currency,
            "country_of_origin": r.country_of_origin,
            "source_url": r.source_url,
            "icon": r.icon,
            "sub_label": r.sub_label,
            "images": imgs,
        }
    for p in PRESET_LISTINGS:
        if p["id"] == preset_id:
            return p
    raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found")


@router.get("/history", summary="Get all listings saved dynamically in database")
async def get_listing_history(db: AsyncSession = Depends(get_db)):
    """
    Returns up to 50 recent listings stored dynamically in SQLite lexport.db.
    """
    stmt = select(Listing).order_by(Listing.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    listings = result.scalars().all()
    return [
        {
            "id": l.id,
            "title": l.title,
            "brand_name": l.brand_name,
            "category": l.category,
            "price": l.price,
            "currency": l.currency,
            "country_of_origin": l.country_of_origin,
            "source_url": l.source_url,
            "created_at": str(l.created_at) if l.created_at else None,
        }
        for l in listings
    ]

