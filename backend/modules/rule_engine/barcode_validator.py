"""
LexPort — GS1 Barcode Modulo-10 Validator & ISO 7000 Handling Mark Analyzer
Provides automated verification of:
1. GS1 GTIN / UPC-A / EAN-13 / EAN-8 barcodes using standard GS1 Modulo-10 checksum algorithm.
2. GS1 country prefix identification (e.g., 000-139 US/CA, 400-440 DE, 500-509 UK, 690-699 CN, 890 IN).
3. ISO 7000 standard graphical symbols for packaging handling (Fragile, Keep Dry, This Way Up, Mobius Loop, Triman).
"""
from __future__ import annotations
import re
from typing import Optional, List, Dict, Tuple
from backend.core.models import BarcodeAnalysisResult, ISOSymbolItem


class BarcodeValidator:
    """
    Validates GS1 barcode symbologies (UPC-A, EAN-13, EAN-8) via Modulo-10 checksum
    and identifies country prefix allocations.
    """

    # GS1 Prefix to Country Mapping (Official GS1 General Specifications Section 1.4)
    GS1_PREFIX_MAP: List[Tuple[int, int, str]] = [
        (0, 19, "United States / Canada"),
        (30, 39, "United States (National Drug Code)"),
        (60, 139, "United States / Canada"),
        (300, 379, "France & Monaco"),
        (380, 380, "Bulgaria"),
        (383, 383, "Slovenia"),
        (385, 385, "Croatia"),
        (400, 440, "Germany"),
        (450, 459, "Japan"),
        (460, 469, "Russia"),
        (471, 471, "Taiwan"),
        (479, 479, "Sri Lanka"),
        (489, 489, "Hong Kong"),
        (490, 499, "Japan"),
        (500, 509, "United Kingdom"),
        (520, 521, "Greece"),
        (535, 535, "Malta"),
        (539, 539, "Ireland"),
        (540, 549, "Belgium & Luxembourg"),
        (560, 560, "Portugal"),
        (570, 579, "Denmark"),
        (590, 590, "Poland"),
        (600, 601, "South Africa"),
        (640, 649, "Finland"),
        (690, 699, "China"),
        (700, 709, "Norway"),
        (729, 729, "Israel"),
        (730, 739, "Sweden"),
        (754, 755, "Canada"),
        (760, 769, "Switzerland & Liechtenstein"),
        (779, 779, "Argentina"),
        (789, 790, "Brazil"),
        (800, 839, "Italy, San Marino, Vatican City"),
        (840, 849, "Spain"),
        (850, 850, "Cuba"),
        (868, 869, "Turkey"),
        (870, 879, "Netherlands"),
        (880, 880, "South Korea"),
        (885, 885, "Thailand"),
        (888, 888, "Singapore"),
        (890, 890, "India"),
        (893, 893, "Vietnam"),
        (900, 919, "Austria"),
        (930, 939, "Australia"),
        (940, 949, "New Zealand"),
        (955, 955, "Malaysia"),
        (958, 958, "Macau"),
    ]

    # ISO 7000 Standard Packaging Marks
    ISO_MARKS_DEFINITIONS: Dict[str, Dict[str, str]] = {
        "ISO-7000-0621": {
            "name": "Fragile, Handle with Care",
            "keywords": ["fragile", "handle with care", "glass", "breakable", "delicate", "dropper"],
            "statutory_requirement": "Mandatory under ASTM D5276 / ISO 2248 drop-test packaging guidelines for glass containers and delicate instrumentation."
        },
        "ISO-7000-0623": {
            "name": "This Way Up",
            "keywords": ["this way up", "arrows up", "upright", "keep upright", "liquid", "bottle", "leakage", "essential oil"],
            "statutory_requirement": "Mandatory under 49 CFR § 173.25(a)(4) and IATA DGR 7.2.4.4 for combination packagings containing liquid hazardous materials or cosmetics."
        },
        "ISO-7000-0626": {
            "name": "Keep Away from Rain / Keep Dry",
            "keywords": ["keep dry", "rain", "moisture", "umbrella", "water sensitive", "dry place", "hygroscopic"],
            "statutory_requirement": "Mandatory under ISO 780 for moisture-sensitive electronics, powders, and anhydrous formulations."
        },
        "ISO-7000-0628": {
            "name": "Keep Away from Sunlight / Protect from Heat",
            "keywords": ["keep away from sunlight", "protect from heat", "sunlight", "uv sensitive", "cool dry place", "retinol", "serum"],
            "statutory_requirement": "Recommended under USP <659> Packaging and Storage Requirements for photosensitive active ingredients and pharmaceuticals."
        },
        "ISO-7000-0632": {
            "name": "Temperature Limits / Storage Temperature",
            "keywords": ["store below", "temperature limit", "storage temperature", "refrigerate", "cold chain", "do not freeze", "celsius"],
            "statutory_requirement": "Mandatory for temperature-sensitive OTC topical formulations and biologics under 21 CFR § 211.142."
        },
        "ISO-7000-1135": {
            "name": "Recycling / Mobius Loop",
            "keywords": ["recycle", "mobius loop", "recyclable", "pet 1", "hdpe 2", "polypropylene", "eco-friendly"],
            "statutory_requirement": "Mandatory material identification marking under EU Directive 94/62/EC on Packaging and Packaging Waste (Decision 97/129/EC)."
        },
        "FR-TRIMAN": {
            "name": "Triman Logo + Info-tri",
            "keywords": ["triman", "info-tri", "sorting info", "france recycle", "consigne de tri", "bac de tri"],
            "statutory_requirement": "Mandatory in France under Decree No. 2014-1577 and AGEC Law (Code de l'environnement Art. L541-9-3). Non-compliance triggers €15,000 fine."
        },
        "EU-WEEE-SYMBOL": {
            "name": "Crossed-out Wheeled Bin",
            "keywords": ["weee", "crossed out wheelie bin", "electronic waste", "do not dispose in trash", "battery disposal"],
            "statutory_requirement": "Mandatory in EU and UK under WEEE Directive 2012/19/EU and EN 50419 for electrical and electronic equipment."
        }
    }

    @classmethod
    def calculate_gs1_check_digit(cls, digits: str) -> int:
        """
        Calculates GS1 standard Modulo-10 check digit for a string of digits (without the check digit).
        Algorithm:
        Starting from the rightmost digit of the payload (excluding check digit):
        - Multiply alternating digits by 3 and 1.
        - Sum all products.
        - Check digit = (10 - (sum % 10)) % 10.
        """
        reversed_digits = digits[::-1]
        total = 0
        for i, char in enumerate(reversed_digits):
            weight = 3 if i % 2 == 0 else 1
            total += int(char) * weight
        return (10 - (total % 10)) % 10

    @classmethod
    def lookup_gs1_country(cls, digits: str) -> Optional[str]:
        """
        Looks up country of GS1 prefix registration from initial 2 to 3 digits.
        """
        if len(digits) < 3:
            return None
        
        # Check 3-digit prefix
        prefix_3 = int(digits[:3])
        for start, end, country in cls.GS1_PREFIX_MAP:
            if start <= prefix_3 <= end:
                return country

        # Check 2-digit prefix
        prefix_2 = int(digits[:2])
        for start, end, country in cls.GS1_PREFIX_MAP:
            if start <= prefix_2 <= end:
                return country

        return "International / Unassigned GS1 Prefix"

    def validate_barcode(self, raw_barcode: Optional[str]) -> BarcodeAnalysisResult:
        """
        Validates raw barcode string against GS1 Modulo-10 checksum standard.
        Supports UPC-A (12 digits), EAN-13 (13 digits), and EAN-8 (8 digits).
        """
        if not raw_barcode or not str(raw_barcode).strip():
            return BarcodeAnalysisResult(
                raw_barcode=None,
                barcode_type="NOT_PROVIDED",
                is_valid_gs1=False,
                gs1_check_digit=None,
                country_of_registration=None,
                warning_message="No barcode supplied. E-commerce platforms (Amazon, Walmart, eBay) mandate valid GS1-registered UPC/EAN barcodes for catalog listing."
            )

        # Clean barcode string (remove spaces and hyphens only)
        stripped = str(raw_barcode).strip()
        clean_code = re.sub(r"[\s\-]", "", stripped)

        if not clean_code.isdigit():
            return BarcodeAnalysisResult(
                raw_barcode=raw_barcode,
                barcode_type="NON_NUMERIC",
                is_valid_gs1=False,
                gs1_check_digit=None,
                country_of_registration=None,
                warning_message=f"Barcode contains non-numeric characters: '{raw_barcode}'. GS1 barcodes must be purely numeric."
            )

        length = len(clean_code)

        if length not in [8, 12, 13, 14]:
            return BarcodeAnalysisResult(
                raw_barcode=raw_barcode,
                barcode_type="INVALID_LENGTH",
                is_valid_gs1=False,
                gs1_check_digit=None,
                country_of_registration=None,
                warning_message=f"Invalid barcode length ({length} digits). Recognized GS1 standards are UPC-A (12 digits), EAN-13 (13 digits), or EAN-8 (8 digits)."
            )

        payload = clean_code[:-1]
        provided_check = int(clean_code[-1])
        calculated_check = self.calculate_gs1_check_digit(payload)

        # Determine type
        type_name = "UPC-A" if length == 12 else ("EAN-13" if length == 13 else ("EAN-8" if length == 8 else "GTIN-14"))

        # Lookup country
        country = self.lookup_gs1_country(clean_code)

        is_valid = (provided_check == calculated_check)

        if is_valid:
            warning = None
        else:
            warning = (
                f"GS1 Checksum Failure! For payload '{payload}', expected Modulo-10 check digit is {calculated_check}, "
                f"but provided check digit is {provided_check}. Barcode will fail customs optical sorting and Amazon FBA receipt."
            )

        return BarcodeAnalysisResult(
            raw_barcode=clean_code,
            barcode_type=type_name if is_valid else "INVALID_CHECKSUM",
            is_valid_gs1=is_valid,
            gs1_check_digit=calculated_check,
            country_of_registration=country,
            warning_message=warning
        )

    def detect_iso_symbols(
        self,
        text: str = "",
        detected_marks: Optional[List[str]] = None,
        category: str = ""
    ) -> List[ISOSymbolItem]:
        """
        Cross-references text, OCR detected marks, and product category against ISO 7000 standard marks.
        Returns detected and recommended ISO symbols with statutory requirements.
        """
        detected_marks = detected_marks or []
        text_lower = (text or "").lower()
        cat_lower = (category or "").lower()

        results: List[ISOSymbolItem] = []
        already_added = set()

        # 1. Process explicit marks detected by OCR
        for mark in detected_marks:
            mark_upper = mark.upper()
            matched_code = None
            if "RECYCLING" in mark_upper or "MOBIOUS" in mark_upper:
                matched_code = "ISO-7000-1135"
            elif "WEEE" in mark_upper:
                matched_code = "EU-WEEE-SYMBOL"
            elif "FRAGILE" in mark_upper:
                matched_code = "ISO-7000-0621"
            elif "UP" in mark_upper or "ARROW" in mark_upper:
                matched_code = "ISO-7000-0623"
            elif "RAIN" in mark_upper or "DRY" in mark_upper:
                matched_code = "ISO-7000-0626"
            elif "SUN" in mark_upper or "HEAT" in mark_upper:
                matched_code = "ISO-7000-0628"
            elif "TRIMAN" in mark_upper:
                matched_code = "FR-TRIMAN"

            if matched_code and matched_code not in already_added and matched_code in self.ISO_MARKS_DEFINITIONS:
                def_data = self.ISO_MARKS_DEFINITIONS[matched_code]
                results.append(ISOSymbolItem(
                    symbol_code=matched_code,
                    symbol_name=def_data["name"],
                    status="detected",
                    statutory_requirement=def_data["statutory_requirement"]
                ))
                already_added.add(matched_code)

        # 2. Textual & Category Pattern Matching for Recommended / Mandatory Symbols
        for code, def_data in self.ISO_MARKS_DEFINITIONS.items():
            if code in already_added:
                continue

            # Check keywords in text
            keyword_hit = any(kw in text_lower for kw in def_data["keywords"])

            # Check category heuristics
            category_hit = False
            if code == "ISO-7000-0623" and ("cosmetic" in cat_lower or "cream" in text_lower or "serum" in text_lower or "oil" in text_lower):
                category_hit = True
            elif code == "ISO-7000-0621" and ("glass" in text_lower or "dropper" in text_lower or "fragile" in text_lower):
                category_hit = True
            elif code == "ISO-7000-0628" and ("serum" in text_lower or "retinol" in text_lower or "vitamin c" in text_lower or "sunlight" in text_lower):
                category_hit = True
            elif code == "EU-WEEE-SYMBOL" and ("electronic" in cat_lower or "earbud" in text_lower or "battery" in text_lower or "audio" in cat_lower):
                category_hit = True
            elif code == "ISO-7000-1135":
                # Recycling is universally recommended on modern packaging
                category_hit = True

            if keyword_hit or category_hit:
                status = "mandatory" if (code in ["ISO-7000-0623", "EU-WEEE-SYMBOL", "FR-TRIMAN"] and (keyword_hit or category_hit)) else "recommended"
                results.append(ISOSymbolItem(
                    symbol_code=code,
                    symbol_name=def_data["name"],
                    status=status,
                    statutory_requirement=def_data["statutory_requirement"]
                ))
                already_added.add(code)

        return results
