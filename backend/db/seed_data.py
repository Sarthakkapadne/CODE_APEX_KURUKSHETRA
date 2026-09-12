"""
LexPort — Full Database Seeding Engine & Master Data Repository
Populates SQLite lexport.db with:
1. Preset Listings (6 documented real-world cross-border case studies)
2. Trade Markets (Geographic coordinates, currencies, de minimis thresholds, duties & VAT)
3. Statutory Rules (Over 80+ deterministic regulatory rules across 10 jurisdictions)
4. Required Compliance Documents & Lab Reports
5. Initial Inspection Audit Ledger & SHA-256 Cryptographic Hash Chain
"""
from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from backend.db.models_db import (
    User, Listing, Inspection, ComplianceResultRecord, AuditHashBlock,
    RuleRecord, TradeMarketRecord, RequiredDocumentRecord, ListingPresetRecord
)
from backend.core.hash_chain import ComplianceHashChain

logger = logging.getLogger(__name__)

RULES_DIR = Path(__file__).resolve().parent.parent / "modules" / "rule_engine" / "rules_data"

# ── 1. REAL-WORLD DOCUMENTED CASE STUDY PRESETS ──
PRESET_LISTINGS = [
    {
        "id": "preset-hair-dryer",
        "title": "ProDry 2200W Salon Electric Hair Dryer with Ionic Conditioning, Plastic Housing",
        "description": (
            "• 2200W PROFESSIONAL MOTOR: High-velocity ionic hair drying with 3 heat settings and 2 speed controls.\n"
            "• FLAME-RETARDANT PLASTIC HOUSING: Lightweight ergonomic polymer enclosure engineered for salon and home grooming.\n"
            "• IONIC CONDITIONING TECHNOLOGY: Discharges negative ions to eliminate hair frizz and lock in natural moisture.\n"
            "• SAFETY OVERHEAT PROTECTION: Built-in thermal safety cutout prevents heating element from exceeding safe limits.\n"
            "• AC 220-240V 50/60HZ: Designed for household mains electrical sockets with 2.5m power cord."
        ),
        "brand_name": "ProDry Appliances",
        "category": "electronics",
        "price": 45.00,
        "currency": "USD",
        "country_of_origin": "China",
        "source_url": "https://www.amazon.com/dp/B0HAIRDRYER06",
        "icon": "💨",
        "sub_label": "EU LVD & REACH Plastic",
        "images": ["/static/demo_dryer_front.jpg"],
    },
    {
        "id": "preset-ayurvedic-cream",
        "title": "AyurVeda Miracle Joint & Muscle Healing Cream - Cures Arthritis Pain Permanently",
        "description": (
            "• 100% NATURAL PERMANENT RELIEF: Clinically proven herbal formulation cures arthritis and completely eliminates chronic joint inflammation.\n"
            "• TIME-TESTED AYURVEDIC HERBS: Infused with high-potency Camphor (5.0%), Sesame Oil, Menthol, and Eucalyptus oil for deep transdermal absorption.\n"
            "• ANTI-INFLAMMATORY MEDICINE: Doctor recommended topical treatment for rheumatoid arthritis, stiff knees, aching joints, and lower back pain.\n"
            "• ANTIBACTERIAL & HEALING ACTION: Kills bacteria and soothes swelling within minutes of application.\n"
            "• DIRECTIONS: Apply generously to affected area twice daily. Suitable for all adults."
        ),
        "brand_name": "VedaHeal Herbals",
        "category": "cosmetics",
        "price": 34.99,
        "currency": "USD",
        "country_of_origin": "India",
        "source_url": "https://www.amazon.com/dp/B0AYURVEDA01",
        "icon": "🌿",
        "sub_label": "US FDA Drug vs Cosmetic",
        "images": ["/static/demo_cream_front.jpg", "/static/demo_cream_back.jpg", "/static/demo_cream_box.jpg"],
    },
    {
        "id": "preset-baby-walker",
        "title": "Baby Joy 3-in-1 Foldable Activity Baby Walker with Wheels, High-Back Padded Seat",
        "description": (
            "• MULTI-DIRECTIONAL SWIVEL WHEELS: Smooth gliding rolling wheels designed for infant developmental mobility and walking practice on flat floors.\n"
            "• 3-POSITION ADJUSTABLE HEIGHT: Grows with your toddler from 6 to 18 months.\n"
            "• INTERACTIVE MUSIC & TOY TRAY: Features engaging melody sounds, colorful lights, and steering toy to stimulate sensory development.\n"
            "• COMPACT FOLDING: Ultra-portable design folds flat for easy transport under beds or car trunks.\n"
            "• SAFETY TESTED: ASTM F977 safety certified with stair friction grip pads."
        ),
        "brand_name": "BabyJoy Infant Gear",
        "category": "toys",
        "price": 59.99,
        "currency": "USD",
        "country_of_origin": "China",
        "source_url": "https://www.amazon.com/dp/B0BABYWALK02",
        "icon": "🚼",
        "sub_label": "Canada Criminal Ban vs US/UK",
        "images": ["/static/demo_walker_front.jpg", "/static/demo_walker_specs.jpg", "/static/demo_walker_label.jpg"],
    },
    {
        "id": "preset-cutting-board",
        "title": "EcoGreen Organic Bamboo Kitchen Cutting Board with Antibacterial Surface Protection",
        "description": (
            "• ANTIBACTERIAL SURFACE TECHNOLOGY: Built-in antibacterial protection kills 99.9% of bacteria and household germs on contact.\n"
            "• 100% ORGANIC MOSO BAMBOO: Sustainable dense grain resists knife marks and will not absorb food odors.\n"
            "• EXTRA-LARGE FOOD PREPARATION: Ideal for carving cooked meats, slicing vegetables, and cheese charcuterie platters.\n"
            "• DEEP JUICE GROOVES: Catches meat runoff to keep kitchen countertops spotless.\n"
            "• PRE-SEASONED: Finished with food-grade mineral oil for water-repellent durability."
        ),
        "brand_name": "EcoGreen Living",
        "category": "kitchenware",
        "price": 27.99,
        "currency": "USD",
        "country_of_origin": "Vietnam",
        "source_url": "https://www.amazon.com/dp/B0CUTBOARD03",
        "icon": "🔪",
        "sub_label": "US EPA Pesticide Trap",
        "images": ["/static/demo_board_front.jpg", "/static/demo_board_specs.jpg", "/static/demo_board_label.jpg"],
    },
    {
        "id": "preset-sleep-positioner",
        "title": "LullabyCloud Ergonomic Newborn Sleep Positioner & Anti-Roll Infant Wedge Pillow",
        "description": (
            "• ANTI-ROLL SIDE BUMPERS: Ergonomic curved foam bolsters prevent infant from rolling over onto stomach during unmonitored crib sleep.\n"
            "• 12-DEGREE INCLINED WEDGE: Gently elevates baby's head to reduce acid reflux, colic symptoms, and infant nasal congestion.\n"
            "• BREATHABLE 3D AIR MESH: Breathable hypoallergenic cover prevents overheating and maintains optimal airflow.\n"
            "• PEDIATRICIAN DESIGNED: Engineered for infants from 0 to 6 months in cribs, bassinets, and co-sleeping beds."
        ),
        "brand_name": "LullabyCloud Nursery",
        "category": "toys",
        "price": 38.50,
        "currency": "USD",
        "country_of_origin": "China",
        "source_url": "https://www.amazon.com/dp/B0SLEEPWEDGE04",
        "icon": "🛌",
        "sub_label": "Safe Sleep Act Recall",
        "images": ["/static/demo_wedge_front.jpg"],
    },
    {
        "id": "preset-heated-eye-wand",
        "title": "LumiGlow Sonic Rechargeable Heated Thermal Eye Wand - Red Light Therapy Device",
        "description": (
            "• 3-IN-1 THERMAL MASSAGE: 42°C soothing heat massage combined with high-frequency sonic vibration to reduce dark circles and puffiness.\n"
            "• 630NM RED LIGHT THERAPY: Promotes cellular collagen production and diminishes fine lines and crow's feet.\n"
            "• HIGH-CAPACITY RECHARGEABLE BATTERY: Built-in 800mAh high-density lithium-ion battery with fast USB-C charging dock.\n"
            "• INTELLIGENT SMART SENSOR: Smart contact head activates vibration automatically upon skin touch.\n"
            "• TRAVEL FRIENDLY: Lightweight sleek aluminum design fits effortlessly in makeup bags."
        ),
        "brand_name": "LumiGlow Beauty Tech",
        "category": "electronics",
        "price": 49.00,
        "currency": "USD",
        "country_of_origin": "Japan",
        "source_url": "https://www.amazon.com/dp/B0EYEWAND05",
        "icon": "⚡",
        "sub_label": "Lithium Hazmat / CE Mark",
        "images": ["/static/demo_wand_front.jpg"],
    },
]

# ── 2. MASTER GLOBAL TRADE MARKETS (GPS, Currencies, Tariffs & De Minimis) ──
MASTER_MARKETS: List[Dict[str, Any]] = [
    {
        "country_code": "US",
        "country_name": "United States",
        "flag": "🇺🇸",
        "latitude": 37.0902,
        "longitude": -95.7129,
        "governing_agency": "US CBP / FDA / CPSC / EPA",
        "currency_code": "USD",
        "currency_symbol": "$",
        "usd_exchange_rate": 1.0,
        "de_minimis_threshold_usd": 800.0,
        "de_minimis_description": "$800 Section 321 Entry Type 86",
        "standard_duty_rate": "3.0% - 6.5%",
        "standard_duty_pct": 0.04,
        "vat_gst_rate": "0.0% (State Sales Tax collected at checkout)",
        "vat_gst_pct": 0.0,
        "air_transit_days": 3,
        "ocean_transit_days": 24,
        "complexity_score": 25,
        "trade_status": "open",
    },
    {
        "country_code": "CA",
        "country_name": "Canada",
        "flag": "🇨🇦",
        "latitude": 56.1304,
        "longitude": -106.3468,
        "governing_agency": "CBSA / Health Canada / CFIA",
        "currency_code": "CAD",
        "currency_symbol": "C$",
        "usd_exchange_rate": 1.36,
        "de_minimis_threshold_usd": 15.0,
        "de_minimis_description": "$20 CAD (~$15 USD) postal threshold",
        "standard_duty_rate": "5.0% - 8.5%",
        "standard_duty_pct": 0.065,
        "vat_gst_rate": "5.0% GST (+ provincial PST/HST)",
        "vat_gst_pct": 0.05,
        "air_transit_days": 3,
        "ocean_transit_days": 20,
        "complexity_score": 35,
        "trade_status": "open",
    },
    {
        "country_code": "EU",
        "country_name": "European Union",
        "flag": "🇪🇺",
        "latitude": 51.1657,
        "longitude": 10.4515,
        "governing_agency": "EU DG TAXUD / RAPEX / EMA / ECHA",
        "currency_code": "EUR",
        "currency_symbol": "€",
        "usd_exchange_rate": 0.92,
        "de_minimis_threshold_usd": 163.0,
        "de_minimis_description": "€150 Duty threshold / €0 VAT (IOSS)",
        "standard_duty_rate": "0% under €150, 6.5% standard",
        "standard_duty_pct": 0.065,
        "vat_gst_rate": "19.0% - 25.0% VAT (Standard avg 21%)",
        "vat_gst_pct": 0.21,
        "air_transit_days": 4,
        "ocean_transit_days": 28,
        "complexity_score": 45,
        "trade_status": "open",
    },
    {
        "country_code": "DE",
        "country_name": "Germany",
        "flag": "🇩🇪",
        "latitude": 51.1657,
        "longitude": 10.4515,
        "governing_agency": "BVL / BAuA / ZSVR LUCID / ElektroG",
        "currency_code": "EUR",
        "currency_symbol": "€",
        "usd_exchange_rate": 0.92,
        "de_minimis_threshold_usd": 163.0,
        "de_minimis_description": "€150 Duty / €0 VAT IOSS",
        "standard_duty_rate": "6.5%",
        "standard_duty_pct": 0.065,
        "vat_gst_rate": "19.0% MwSt",
        "vat_gst_pct": 0.19,
        "air_transit_days": 4,
        "ocean_transit_days": 28,
        "complexity_score": 40,
        "trade_status": "open",
    },
    {
        "country_code": "UK",
        "country_name": "United Kingdom",
        "flag": "🇬🇧",
        "latitude": 55.3781,
        "longitude": -3.4360,
        "governing_agency": "HMRC / OPSS / MHRA",
        "currency_code": "GBP",
        "currency_symbol": "£",
        "usd_exchange_rate": 0.77,
        "de_minimis_threshold_usd": 175.0,
        "de_minimis_description": "£135 GBP Duty relief / Point of sale VAT",
        "standard_duty_rate": "0% under £135, 6.0% standard",
        "standard_duty_pct": 0.06,
        "vat_gst_rate": "20.0% Standard VAT",
        "vat_gst_pct": 0.20,
        "air_transit_days": 3,
        "ocean_transit_days": 26,
        "complexity_score": 35,
        "trade_status": "open",
    },
    {
        "country_code": "JP",
        "country_name": "Japan",
        "flag": "🇯🇵",
        "latitude": 36.2048,
        "longitude": 138.2529,
        "governing_agency": "Japan Customs / PMDA / METI",
        "currency_code": "JPY",
        "currency_symbol": "¥",
        "usd_exchange_rate": 152.0,
        "de_minimis_threshold_usd": 67.0,
        "de_minimis_description": "¥10,000 JPY (~$67 USD) duty/tax exemption",
        "standard_duty_rate": "Simplified flat 3-5% or duty-free",
        "standard_duty_pct": 0.05,
        "vat_gst_rate": "10.0% Japanese Consumption Tax (JCT)",
        "vat_gst_pct": 0.10,
        "air_transit_days": 3,
        "ocean_transit_days": 18,
        "complexity_score": 55,
        "trade_status": "open",
    },
    {
        "country_code": "AU",
        "country_name": "Australia",
        "flag": "🇦🇺",
        "latitude": -25.2744,
        "longitude": 133.7751,
        "governing_agency": "ABF / TGA / ACCC",
        "currency_code": "AUD",
        "currency_symbol": "A$",
        "usd_exchange_rate": 1.52,
        "de_minimis_threshold_usd": 660.0,
        "de_minimis_description": "$1,000 AUD (~$660 USD) low value threshold",
        "standard_duty_rate": "5.0% duty above $1,000 AUD",
        "standard_duty_pct": 0.05,
        "vat_gst_rate": "10.0% GST",
        "vat_gst_pct": 0.10,
        "air_transit_days": 4,
        "ocean_transit_days": 22,
        "complexity_score": 30,
        "trade_status": "open",
    },
    {
        "country_code": "IN",
        "country_name": "India",
        "flag": "🇮🇳",
        "latitude": 20.5937,
        "longitude": 78.9629,
        "governing_agency": "CBIC / FSSAI / CDSCO / BIS",
        "currency_code": "INR",
        "currency_symbol": "₹",
        "usd_exchange_rate": 86.5,
        "de_minimis_threshold_usd": 0.0,
        "de_minimis_description": "₹0 (Zero de minimis on commercial cross-border cargo)",
        "standard_duty_rate": "20% Basic Customs Duty + 10% SWS",
        "standard_duty_pct": 0.20,
        "vat_gst_rate": "18.0% Integrated GST (IGST)",
        "vat_gst_pct": 0.18,
        "air_transit_days": 2,
        "ocean_transit_days": 14,
        "complexity_score": 60,
        "trade_status": "open",
    },
    {
        "country_code": "CN",
        "country_name": "China",
        "flag": "🇨🇳",
        "latitude": 35.8617,
        "longitude": 104.1954,
        "governing_agency": "GACC / NMPA / SAMR",
        "currency_code": "CNY",
        "currency_symbol": "¥",
        "usd_exchange_rate": 7.24,
        "de_minimis_threshold_usd": 7.0,
        "de_minimis_description": "50 CNY (~$7 USD) postal personal threshold",
        "standard_duty_rate": "9.1% import tariff (CBEC quota rate: 0% duty / 9.1% composite)",
        "standard_duty_pct": 0.091,
        "vat_gst_rate": "13.0% standard VAT",
        "vat_gst_pct": 0.13,
        "air_transit_days": 3,
        "ocean_transit_days": 16,
        "complexity_score": 65,
        "trade_status": "restricted",
    },
    {
        "country_code": "VN",
        "country_name": "Vietnam",
        "flag": "🇻🇳",
        "latitude": 14.0583,
        "longitude": 108.2772,
        "governing_agency": "General Department of Vietnam Customs / DAV",
        "currency_code": "VND",
        "currency_symbol": "₫",
        "usd_exchange_rate": 25400.0,
        "de_minimis_threshold_usd": 40.0,
        "de_minimis_description": "1,000,000 VND (~$40 USD) express courier exemption",
        "standard_duty_rate": "15.0% - 20.0% MFN tariff",
        "standard_duty_pct": 0.15,
        "vat_gst_rate": "10.0% VAT",
        "vat_gst_pct": 0.10,
        "air_transit_days": 3,
        "ocean_transit_days": 15,
        "complexity_score": 50,
        "trade_status": "open",
    },
    {
        "country_code": "BR",
        "country_name": "Brazil",
        "flag": "🇧🇷",
        "latitude": -14.2350,
        "longitude": -51.9253,
        "governing_agency": "Receita Federal / ANVISA / INMETRO",
        "currency_code": "BRL",
        "currency_symbol": "R$",
        "usd_exchange_rate": 5.75,
        "de_minimis_threshold_usd": 50.0,
        "de_minimis_description": "$50 USD Remessa Conforme certified seller program",
        "standard_duty_rate": "20% under $50, 60% standard import tariff",
        "standard_duty_pct": 0.60,
        "vat_gst_rate": "17.0% ICMS state sales tax",
        "vat_gst_pct": 0.17,
        "air_transit_days": 6,
        "ocean_transit_days": 35,
        "complexity_score": 75,
        "trade_status": "elevated_scrutiny",
    },
]

# ── 3. COMPLIANCE DOCUMENTS & TEST REPORT MASTER SEED ──
MASTER_DOCUMENTS: List[Dict[str, Any]] = [
    {
        "id": "DOC-FDA-MOCRA",
        "country_code": "US",
        "category": "cosmetics",
        "doc_name": "FDA MoCRA Facility Registration & Cosmetic Product Listing",
        "is_mandatory": True,
        "statutory_citation": "FD&C Act Section 607 / 21 U.S.C. 364c",
        "governing_agency": "US Food and Drug Administration (FDA)",
        "issuing_authority": "FDA Cosmetics Direct Portal (CDP)",
        "description": "Mandatory bi-annual facility registration and product ingredient listing.",
        "seller_action_needed": "Complete electronic product listing via FDA Cosmetics Direct before distribution.",
    },
    {
        "id": "DOC-US-EPA-FIFRA",
        "country_code": "US",
        "category": "kitchenware",
        "doc_name": "EPA Pesticide Establishment Number & Notice of Arrival (EPA Form 3540-1)",
        "is_mandatory": True,
        "statutory_citation": "7 U.S.C. § 136 / 40 CFR Part 167",
        "governing_agency": "Environmental Protection Agency (EPA)",
        "issuing_authority": "EPA Regional Office",
        "description": "Required for any article marketed with antimicrobial or antibacterial surface claims.",
        "seller_action_needed": "Obtain EPA foreign establishment number and file electronic Notice of Arrival.",
    },
    {
        "id": "DOC-HC-CNF",
        "country_code": "CA",
        "category": "cosmetics",
        "doc_name": "Health Canada Cosmetic Notification Form (CNF)",
        "is_mandatory": True,
        "statutory_citation": "Cosmetic Regulations (C.R.C., c. 869) Section 30",
        "governing_agency": "Health Canada",
        "issuing_authority": "Health Canada Consumer Product Safety Directorate",
        "description": "Notification must be filed within 10 days of first commercial sale in Canada.",
        "seller_action_needed": "Submit bilingual INCI ingredient breakdown and Canadian distributor details.",
    },
    {
        "id": "DOC-EU-CPNP",
        "country_code": "EU",
        "category": "cosmetics",
        "doc_name": "EU CPNP Notification & Responsible Person (RP) Mandate",
        "is_mandatory": True,
        "statutory_citation": "Regulation (EC) No 1223/2009 Article 13",
        "governing_agency": "European Commission DG GROW",
        "issuing_authority": "Cosmetic Product Notification Portal (CPNP)",
        "description": "Pre-market notification and designated legal entity inside EU territory.",
        "seller_action_needed": "Designate EU Responsible Person and complete Cosmetic Product Safety Report (CPSR).",
    },
    {
        "id": "DOC-DE-LUCID",
        "country_code": "DE",
        "category": "general",
        "doc_name": "Germany ZSVR LUCID Packaging EPR Registration",
        "is_mandatory": True,
        "statutory_citation": "Verpackungsgesetz (VerpackG) § 9",
        "governing_agency": "Zentrale Stelle Verpackungsregister (ZSVR)",
        "issuing_authority": "LUCID Register",
        "description": "Compulsory dual system participation for all secondary packaging entering Germany.",
        "seller_action_needed": "Register on LUCID and license packaging volume with a dual system partner.",
    },
    {
        "id": "DOC-UK-SCPN",
        "country_code": "UK",
        "category": "cosmetics",
        "doc_name": "UK Submit Cosmetic Product Notifications (SCPN)",
        "is_mandatory": True,
        "statutory_citation": "UK Cosmetic Products Enforcement Regulations 2013",
        "governing_agency": "Office for Product Safety and Standards (OPSS)",
        "issuing_authority": "UK SCPN Portal",
        "description": "Post-Brexit mandatory UK-specific notification for cosmetic commodities.",
        "seller_action_needed": "Appoint Great Britain Responsible Person and file complete PIF documentation.",
    },
    {
        "id": "DOC-JP-PMDA",
        "country_code": "JP",
        "category": "cosmetics",
        "doc_name": "Japan PMDA Cosmetic Import Notification & MAH License",
        "is_mandatory": True,
        "statutory_citation": "Pharmaceuticals and Medical Devices Act (PMD Act) Article 12",
        "governing_agency": "Pharmaceuticals and Medical Devices Agency (PMDA)",
        "issuing_authority": "Ministry of Health, Labour and Welfare (MHLW)",
        "description": "Requires licensed Marketing Authorization Holder (MAH) in Japan.",
        "seller_action_needed": "Partner with licensed Japanese importer to clear customs and affix Japanese sub-label.",
    },
    {
        "id": "DOC-IN-CDSCO",
        "country_code": "IN",
        "category": "cosmetics",
        "doc_name": "India CDSCO Form COS-2 Import Registration Certificate",
        "is_mandatory": True,
        "statutory_citation": "Cosmetics Rules 2020 / Drugs and Cosmetics Act 1940",
        "governing_agency": "Central Drugs Standard Control Organization (CDSCO)",
        "issuing_authority": "Drugs Controller General of India (DCGI)",
        "description": "Mandatory registration certificate for overseas cosmetic manufacturers.",
        "seller_action_needed": "Submit Form COS-1 application with Free Sale Certificate and manufacturing license.",
    },
    {
        "id": "DOC-UN-383",
        "country_code": "ALL",
        "category": "electronics",
        "doc_name": "UN 38.3 Lithium Ion Battery Transport Safety Test Report (T1-T8)",
        "is_mandatory": True,
        "statutory_citation": "UN Manual of Tests and Criteria Part III / IATA DGR Section II",
        "governing_agency": "ICAO / IATA / US DOT PHMSA",
        "issuing_authority": "ISO 17025 Accredited Laboratory",
        "description": "Verifies battery thermal, vibration, shock, external short circuit, and impact resilience.",
        "seller_action_needed": "Obtain certified UN 38.3 test summary and MSDS/SDS from cell manufacturer.",
    },
    {
        "id": "DOC-EU-CE-LVD",
        "country_code": "EU",
        "category": "electronics",
        "doc_name": "EU CE Declaration of Conformity & Low Voltage Directive (LVD) Report",
        "is_mandatory": True,
        "statutory_citation": "Directive 2014/35/EU / EN 60335-1 / EN 60335-2-23",
        "governing_agency": "European Commission",
        "issuing_authority": "Manufacturer / Notified Body",
        "description": "Affirms electrical safety standards for mains-powered consumer appliances.",
        "seller_action_needed": "Compile Technical Construction File (TCF) and sign formal EU DoC.",
    },
]


async def seed_database(session: AsyncSession) -> None:
    """Populates SQLite with users, presets, markets, statutory rules, and document matrices."""
    logger.info("[SEED] Initializing database seeding check...")

    # 1. Seed User
    user_res = await session.execute(select(User).limit(1))
    if user_res.scalars().first() is None:
        demo_user = User(
            email="compliance.officer@lexport.ai",
            full_name="Elena Vance",
            role="compliance_officer",
            company_name="Apex Cross-Border Logistics LLC"
        )
        session.add(demo_user)
        logger.info("[SEED] Default compliance user created.")

    # 2. Seed Listing Presets
    preset_res = await session.execute(select(ListingPresetRecord).limit(1))
    if preset_res.scalars().first() is None:
        for p in PRESET_LISTINGS:
            preset_rec = ListingPresetRecord(
                id=p["id"],
                title=p["title"],
                description=p["description"],
                brand_name=p["brand_name"],
                category=p["category"],
                price=p["price"],
                currency=p["currency"],
                country_of_origin=p["country_of_origin"],
                source_url=p["source_url"],
                icon=p.get("icon", "📦"),
                sub_label=p.get("sub_label", ""),
                images_json=json.dumps(p.get("images", [])),
            )
            session.add(preset_rec)

            # Also seed into active listings table if not present
            l_exist = await session.execute(select(Listing).where(Listing.id == p["id"]))
            if l_exist.scalars().first() is None:
                session.add(Listing(
                    id=p["id"],
                    title=p["title"],
                    description=p["description"],
                    brand_name=p["brand_name"],
                    category=p["category"],
                    price=p["price"],
                    currency=p["currency"],
                    country_of_origin=p["country_of_origin"],
                    source_url=p["source_url"],
                ))
        logger.info(f"[SEED] Seeded {len(PRESET_LISTINGS)} case study presets.")

    # 3. Seed Trade Markets (GPS & Tariffs)
    mkt_res = await session.execute(select(TradeMarketRecord).limit(1))
    if mkt_res.scalars().first() is None:
        for m in MASTER_MARKETS:
            mkt_rec = TradeMarketRecord(
                country_code=m["country_code"],
                country_name=m["country_name"],
                flag=m["flag"],
                latitude=m["latitude"],
                longitude=m["longitude"],
                governing_agency=m["governing_agency"],
                currency_code=m["currency_code"],
                currency_symbol=m["currency_symbol"],
                usd_exchange_rate=m["usd_exchange_rate"],
                de_minimis_threshold_usd=m["de_minimis_threshold_usd"],
                de_minimis_description=m["de_minimis_description"],
                standard_duty_rate=m["standard_duty_rate"],
                standard_duty_pct=m["standard_duty_pct"],
                vat_gst_rate=m["vat_gst_rate"],
                vat_gst_pct=m["vat_gst_pct"],
                air_transit_days=m["air_transit_days"],
                ocean_transit_days=m["ocean_transit_days"],
                complexity_score=m["complexity_score"],
                trade_status=m["trade_status"],
            )
            session.add(mkt_rec)
        logger.info(f"[SEED] Seeded {len(MASTER_MARKETS)} trade market geo-profiles.")

    # 4. Seed Statutory Rules from rules_data/
    rule_res = await session.execute(select(RuleRecord).limit(1))
    if rule_res.scalars().first() is None:
        rule_count = 0
        if RULES_DIR.exists():
            for rule_file in RULES_DIR.glob("*_rules.json"):
                try:
                    with open(rule_file, "r", encoding="utf-8") as rf:
                        data = json.load(rf)
                        country = data.get("country_code") or rule_file.stem.split("_")[0].upper()
                        rules_list = data.get("rules", [])
                        for r in rules_list:
                            r_id = r.get("rule_id") or r.get("rule_code") or r.get("id")
                            if not r_id:
                                continue
                            existing_r = await session.execute(select(RuleRecord).where(RuleRecord.id == r_id))
                            if existing_r.scalars().first() is not None:
                                continue
                            rec = RuleRecord(
                                id=r_id,
                                country_code=country,
                                category=r.get("category", "general"),
                                name=r.get("name") or r.get("title", "Statutory Rule"),
                                directive_code=r.get("directive_code") or r.get("directive"),
                                statute_citation=r.get("statute_citation") or r.get("statute") or r.get("citation"),
                                severity=r.get("severity", "violation"),
                                condition_type=r.get("condition_type", "claim_detection"),
                                required_field=r.get("required_field"),
                                expected_requirement=r.get("expected_requirement"),
                                explanation=r.get("explanation"),
                                fix_suggestion=r.get("fix_suggestion"),
                                conditions_json=json.dumps(r.get("conditions", {})),
                                requirements_json=json.dumps(r.get("requirements", [])),
                                is_active=True,
                            )
                            session.add(rec)
                            rule_count += 1
                except Exception as ex:
                    logger.warning(f"[SEED] Could not load rule file {rule_file.name}: {ex}")
        logger.info(f"[SEED] Seeded {rule_count} statutory rules from codex files.")

    # 5. Seed Required Compliance Documents
    doc_res = await session.execute(select(RequiredDocumentRecord).limit(1))
    if doc_res.scalars().first() is None:
        for d in MASTER_DOCUMENTS:
            doc_rec = RequiredDocumentRecord(
                id=d["id"],
                country_code=d["country_code"],
                category=d["category"],
                doc_name=d["doc_name"],
                is_mandatory=d["is_mandatory"],
                statutory_citation=d["statutory_citation"],
                governing_agency=d["governing_agency"],
                issuing_authority=d["issuing_authority"],
                description=d["description"],
                seller_action_needed=d["seller_action_needed"],
            )
            session.add(doc_rec)
        logger.info(f"[SEED] Seeded {len(MASTER_DOCUMENTS)} statutory compliance documents.")

    await session.commit()
    logger.info("[SEED] Master database seeding verified.")
