"""
LexPort — Cross-Border Compliance Co-Pilot Backend
FastAPI Main Application Entry Point
Three-Tier Multi-Agent Architecture:
  Tier 1: Deterministic Rule Layer (Zero LLM, Cites Law)
  Tier 2: Grounded Reasoning Layer (Gemini-powered Attribute Extraction & Auto-Rewrite)
  Tier 3: Human Escalation Layer (Strict Non-Automation for Testing & Hazmat)
"""
from __future__ import annotations
import logging
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.core.config import get_settings
from backend.db.session import engine, async_session
from backend.db.models_db import Base
from backend.db.seed_data import seed_database
from backend.api.routers import (
    compliance, listings, hashes, economics, simulator, reports, scraper, intelligence, chatbot, confidence, verification
)

settings = get_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("lexport")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup initialization: create tables and seed default case studies."""
    logger.info(f"Starting LexPort API {settings.APP_VERSION} (Rule Engine: {settings.RULE_ENGINE_VERSION})")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[MAIN] Database schema validated / tables created.")

        async with async_session() as session:
            await seed_database(session)
    except Exception as e:
        logger.warning(f"[MAIN] Database auto-seed warning: {e}")

    yield
    logger.info("LexPort API shutting down.")


app = FastAPI(
    title="LexPort API",
    description=(
        "Agentic Compliance Co-Pilot for Cross-Border E-Commerce Sellers. "
        "Three-Tier Architecture: Deterministic Rules (Tier 1) + Grounded AI Reasoning (Tier 2) + "
        "Human Escalation (Tier 3). Tamper-Evident SHA-256 Hash Chain per EU Digital Omnibus AI Act."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files ──
static_path = Path(settings.STATIC_DIR)
static_path.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# ── Route Registration ──
app.include_router(compliance.router,   prefix="/compliance",   tags=["Compliance Audit"])
app.include_router(listings.router,     prefix="/listings",     tags=["Listings & Presets"])
app.include_router(hashes.router,       prefix="/hashes",       tags=["Cryptographic Hash Chain"])
app.include_router(economics.router,    prefix="/economics",    tags=["Trade Economics Advisor"])
app.include_router(simulator.router,    prefix="/simulator",    tags=["Regulatory Change Simulator"])
app.include_router(reports.router,      prefix="/reports",      tags=["PDF Reports & Dossiers"])
app.include_router(scraper.router,      prefix="/scraper",      tags=["E-Commerce Scraper"])
app.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence Copilot"])
app.include_router(chatbot.router,      prefix="/chatbot",      tags=["Compliance & Trade Chatbot"])
app.include_router(confidence.router,   prefix="/compliance",   tags=["Compliance Confidence"])
app.include_router(confidence.router,   prefix="/api",          tags=["Compliance Confidence API"])
app.include_router(verification.router, prefix="/api/compliance", tags=["Rule Verification API"])
app.include_router(verification.router, prefix="/compliance",     tags=["Rule Verification"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "LexPort Agentic Compliance Co-Pilot",
        "version": settings.APP_VERSION,
        "rule_engine": settings.RULE_ENGINE_VERSION,
        "eu_ai_act_status": "Article 13/14 Transparency & Audit Ready",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "lexport-api"}
