"""
LexPort — SQLAlchemy Database Models
Stores listings, inspections, compliance matrix entries, and the immutable audit hash chain.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def utc_now() -> datetime:
    """Returns naive UTC timestamp compatible with both SQLite and PostgreSQL without timezone mismatch."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="seller")  # seller, compliance_officer, admin
    company_name = Column(String(255), default="Cross-Border Global Seller")
    created_at = Column(DateTime, default=utc_now)


class Listing(Base):
    __tablename__ = "listings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    brand_name = Column(String(255), default="Generic Brand")
    category = Column(String(100), default="cosmetics")
    price = Column(Float, default=29.99)
    currency = Column(String(10), default="USD")
    country_of_origin = Column(String(100), default="India")
    source_url = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    inspections = relationship("Inspection", back_populates="listing", cascade="all, delete-orphan")


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String(36), ForeignKey("listings.id"), nullable=False)
    timestamp_utc = Column(String(50), nullable=False)
    rule_engine_version = Column(String(50), default="LexPort-Rules-v2026.1")
    compliance_hash = Column(String(64), nullable=False)
    prev_hash = Column(String(64), default="GENESIS")
    overall_verdict = Column(String(50), nullable=False)  # COMPLIANT, REMEDIATION_REQUIRED, IMPORT_PROHIBITED, ESCALATION_REQUIRED
    destination_markets = Column(Text, default="[\"US\", \"EU\", \"UK\", \"CA\", \"JP\"]")
    extracted_attributes_json = Column(Text, default="{}")
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    listing = relationship("Listing", back_populates="inspections")
    results = relationship("ComplianceResultRecord", back_populates="inspection", cascade="all, delete-orphan")


class ComplianceResultRecord(Base):
    __tablename__ = "compliance_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), ForeignKey("inspections.id"), nullable=False)
    country_code = Column(String(10), nullable=False)
    category = Column(String(100), nullable=False)
    check_code = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)  # pass, warning, violation, escalation
    trust_tier = Column(String(50), default="Tier 1 Deterministic")
    rule_citation = Column(String(255), nullable=True)
    extracted_value = Column(Text, nullable=True)
    expected_requirement = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    fix_suggestion = Column(Text, nullable=True)

    inspection = relationship("Inspection", back_populates="results")


class AuditHashBlock(Base):
    __tablename__ = "audit_hash_chain"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String(36), nullable=False)
    block_index = Column(Integer, default=1)
    compliance_hash = Column(String(64), nullable=False, unique=True)
    prev_hash = Column(String(64), nullable=False)
    payload_canonical = Column(Text, nullable=False)
    timestamp_utc = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=utc_now)


class RuleRecord(Base):
    __tablename__ = "rules"

    id = Column(String(50), primary_key=True)  # rule_id / check_code
    country_code = Column(String(10), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    directive_code = Column(String(255), nullable=True)
    statute_citation = Column(String(255), nullable=True)
    severity = Column(String(50), default="violation")
    condition_type = Column(String(100), default="claim_detection")
    required_field = Column(String(100), nullable=True)
    expected_requirement = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    fix_suggestion = Column(Text, nullable=True)
    conditions_json = Column(Text, default="{}")
    requirements_json = Column(Text, default="[]")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)


class TradeMarketRecord(Base):
    __tablename__ = "trade_markets"

    country_code = Column(String(10), primary_key=True)
    country_name = Column(String(100), nullable=False)
    flag = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    governing_agency = Column(String(255), nullable=False)
    currency_code = Column(String(10), default="USD")
    currency_symbol = Column(String(10), default="$")
    usd_exchange_rate = Column(Float, default=1.0)
    de_minimis_threshold_usd = Column(Float, default=800.0)
    de_minimis_description = Column(String(255), default="$800 Section 321")
    standard_duty_rate = Column(String(100), default="3-6%")
    standard_duty_pct = Column(Float, default=0.04)
    vat_gst_rate = Column(String(100), default="0%")
    vat_gst_pct = Column(Float, default=0.0)
    air_transit_days = Column(Integer, default=3)
    ocean_transit_days = Column(Integer, default=24)
    complexity_score = Column(Integer, default=50)
    trade_status = Column(String(50), default="open")
    created_at = Column(DateTime, default=utc_now)


class RequiredDocumentRecord(Base):
    __tablename__ = "required_documents"

    id = Column(String(50), primary_key=True)
    country_code = Column(String(10), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    doc_name = Column(String(255), nullable=False)
    is_mandatory = Column(Boolean, default=True)
    statutory_citation = Column(String(255), nullable=True)
    governing_agency = Column(String(255), nullable=True)
    issuing_authority = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    seller_action_needed = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class ListingPresetRecord(Base):
    __tablename__ = "listing_presets"

    id = Column(String(100), primary_key=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    brand_name = Column(String(255), default="Generic Brand")
    category = Column(String(100), default="cosmetics")
    price = Column(Float, default=29.99)
    currency = Column(String(10), default="USD")
    country_of_origin = Column(String(100), default="India")
    source_url = Column(String(1000), nullable=True)
    icon = Column(String(20), default="📦")
    sub_label = Column(String(255), nullable=True)
    images_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=utc_now)
