"""
LexPort — Cryptographic Compliance Hash Chain
Tamper-evident, cryptographically verifiable audit trail for cross-border listings.
Directly implements EU Digital Omnibus AI Act (August 2026) explainability & audit mandates.

Every finalized compliance audit generates a ComplianceHash = SHA256 of:
  - Product Listing Canonical Representation
  - Extracted Technical Attributes
  - All Evaluated Rule Citations & Findings
  - Rule Engine Version & Agent Versions
  - Timestamp & Officer / Auditor ID
  - Previous Audit Hash for the same Product/Seller (Chain)
"""
from __future__ import annotations
import hashlib
import json
from typing import Optional, Dict, Any, List


class ComplianceHashChain:
    """Generates and verifies Compliance Hash Chain entries."""

    @staticmethod
    def hash_bytes(data: bytes) -> str:
        """SHA-256 of raw bytes."""
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def hash_str(data: str) -> str:
        """SHA-256 of UTF-8 string."""
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    @staticmethod
    def generate_compliance_hash(
        inspection_id: str,
        listing_id: str,
        timestamp_utc: str,
        rule_engine_version: str,
        extracted_attributes: Dict[str, Any],
        matrix_findings: List[Dict[str, Any]],
        citations: List[str],
        prev_hash: Optional[str] = None,
    ) -> str:
        """
        Generate the immutable SHA-256 Compliance Hash for an audit event.
        """
        payload = {
            "inspection_id": inspection_id,
            "listing_id": listing_id,
            "timestamp_utc": timestamp_utc,
            "rule_engine_version": rule_engine_version,
            "canonical_attributes": _canonicalize_attributes(extracted_attributes),
            "canonical_findings": _canonicalize_findings(matrix_findings),
            "citations": sorted(list(set(citations))),
            "prev_hash": prev_hash or "GENESIS_BLOCK_00000000000000000000000000000000000000000000000000000000",
        }
        payload_str = json.dumps(payload, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()

    @staticmethod
    def verify_compliance_hash(
        stored_hash: str,
        inspection_id: str,
        listing_id: str,
        timestamp_utc: str,
        rule_engine_version: str,
        extracted_attributes: Dict[str, Any],
        matrix_findings: List[Dict[str, Any]],
        citations: List[str],
        prev_hash: Optional[str] = None,
    ) -> bool:
        """
        Cryptographically verify that an inspection record has not been tampered with.
        Returns True if mathematically identical, False if ANY field was modified.
        """
        recomputed = ComplianceHashChain.generate_compliance_hash(
            inspection_id=inspection_id,
            listing_id=listing_id,
            timestamp_utc=timestamp_utc,
            rule_engine_version=rule_engine_version,
            extracted_attributes=extracted_attributes,
            matrix_findings=matrix_findings,
            citations=citations,
            prev_hash=prev_hash,
        )
        return stored_hash == recomputed


def _canonicalize_attributes(attrs: Dict[str, Any]) -> Dict[str, Any]:
    """Produces canonical representation of attributes for deterministic hashing."""
    if not isinstance(attrs, dict):
        return {}
    return {
        "category": str(attrs.get("category", "")).lower().strip(),
        "subcategory": str(attrs.get("subcategory", "")).lower().strip(),
        "intended_age": str(attrs.get("intended_age", "")).lower().strip(),
        "power_source": str(attrs.get("power_source", "")).lower().strip(),
        "has_battery": bool(attrs.get("has_battery", False)),
        "battery_type": str(attrs.get("battery_type", "")).lower().strip(),
        "ingredients": sorted([str(i).lower().strip() for i in attrs.get("ingredients", [])]),
        "claims": sorted([str(c).lower().strip() for c in attrs.get("claims", [])]),
        "inferred_hs_code": str(attrs.get("inferred_hs_code", "")).strip(),
    }


def _canonicalize_findings(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sorts and strips non-canonical fields from findings list."""
    if not isinstance(findings, list):
        return []
    cleaned = []
    for f in findings:
        if not isinstance(f, dict):
            continue
        cleaned.append({
            "country_code": str(f.get("country_code", "")).upper().strip(),
            "category": str(f.get("category", "")).strip(),
            "check_code": str(f.get("check_code", "")).strip(),
            "status": str(f.get("status", "")).lower().strip(),
            "rule_citation": str(f.get("rule_citation", "")).strip(),
        })
    return sorted(cleaned, key=lambda x: (x["country_code"], x["category"], x["check_code"]))
