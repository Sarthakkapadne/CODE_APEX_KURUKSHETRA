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


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="seller")  # seller, compliance_officer, admin
    company_name = Column(String(255), default="Cross-Border Global Seller")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
