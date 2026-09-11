"""
LexPort — Mandatory Document & License Determination Matrix
Determines the comprehensive, legally mandated pre-market documentation, permits,
and laboratory test certificates required for cross-border e-commerce sellers
by jurisdiction (US, EU, UK, CA, JP) and product category.
"""
from __future__ import annotations
from typing import List, Optional
from backend.core.models import RequiredDocumentItem


class DocumentMatrixEngine:
    """
    Evaluates listing parameters (category, target markets, battery presence, raw text)
    and returns statutory document checklists required for customs clearance and platform gating.
    """

    def determine_required_documents(
        self,
        category: str,
        target_markets: List[str],
        has_battery: bool = False,
        raw_text: str = ""
    ) -> List[RequiredDocumentItem]:
        category_lower = (category or "").lower()
        text_lower = (raw_text or "").lower()
        target_markets = target_markets or ["US", "EU", "UK", "CA", "JP"]

        # Infer category traits if generic
        is_cosmetics = any(k in category_lower or k in text_lower for k in [
            "cosmetic", "skincare", "cream", "serum", "lotion", "soap", "shampoo",
            "perfume", "fragrance", "lipstick", "makeup", "beauty", "salve", "balm"
        ])
        is_electronics = any(k in category_lower or k in text_lower for k in [
            "electronic", "earbud", "headphone", "audio", "charger", "gadget",
            "bluetooth", "wireless", "cable", "device", "smartwatch", "speaker"
        ])
        is_toy = any(k in category_lower or k in text_lower for k in [
            "toy", "baby", "infant", "toddler", "children", "child", "puzzle", "doll"
        ])
        is_food_contact = any(k in category_lower or k in text_lower for k in [
            "kitchen", "cookware", "cutting board", "bottle", "tumbler", "mug",
            "utensil", "plate", "food contact", "silicone mold", "lunch box"
        ])
        contains_battery = (
            has_battery or
            any(k in text_lower for k in ["battery", "mah", "lithium", "rechargeable", "18650", "polymer"])
        )

        documents: List[RequiredDocumentItem] = []

        # -------------------------------------------------------------------
        # 1. HAZMAT / LITHIUM BATTERY DOCUMENTATION (Applies across all markets)
        # -------------------------------------------------------------------
        if contains_battery:
            documents.append(RequiredDocumentItem(
                doc_code="GLOBAL-DOC-UN383",
                doc_name="UN 38.3 Lithium Battery Test Summary (T1-T8 Reports)",
                issuing_authority="ISO/IEC 17025 Accredited Battery Testing Laboratory",
                country_code="ALL",
                category="Hazmat / Battery Safety",
                is_mandatory=True,
                statutory_citation="UN Manual of Tests and Criteria Part III, Sub-section 38.3",
                seller_action_needed="Obtain official UN 38.3 test summary confirming cells passed altitude simulation, thermal test, vibration, shock, and short-circuit tests.",
                seller_status="pending_upload"
            ))
            documents.append(RequiredDocumentItem(
                doc_code="GLOBAL-DOC-DGD",
                doc_name="Dangerous Goods Declaration & Battery Transport Mark",
                issuing_authority="IATA / International Maritime Organization (IMO)",
                country_code="ALL",
                category="Hazmat / Transport Compliance",
                is_mandatory=True,
                statutory_citation="IATA Dangerous Goods Regulations (DGR) Packing Instruction 966/967 / 49 CFR § 173.185",
                seller_action_needed="Affix UN 3481 / UN 3091 handling mark with sender phone number on master shipping carton.",
                seller_status="pending_upload"
            ))
            documents.append(RequiredDocumentItem(
                doc_code="GLOBAL-DOC-SDS",
                doc_name="Safety Data Sheet (16 GHS Sections SDS)",
                issuing_authority="Cell Manufacturer / OSHA / ECHA Compliant Chemical Assessor",
                country_code="ALL",
                category="Hazmat / Chemical Safety",
                is_mandatory=True,
                statutory_citation="29 CFR § 1910.1200 / Regulation (EC) No 1907/2006 (REACH Annex II)",
                seller_action_needed="Provide standard 16-section SDS detailing battery chemical composition, flammability rating, and emergency response procedures.",
                seller_status="pending_upload"
            ))

        # -------------------------------------------------------------------
        # 2. COSMETICS & PERSONAL CARE DOCUMENTATION
        # -------------------------------------------------------------------
        if is_cosmetics:
            if "US" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="US-DOC-MOCRA",
                    doc_name="FDA MoCRA Facility Registration & Product Ingredient Listing",
                    issuing_authority="U.S. Food and Drug Administration (FDA)",
                    country_code="US",
                    category="Cosmetics Regulatory",
                    is_mandatory=True,
                    statutory_citation="FD&C Act § 607 (21 U.S.C. 364c) / Modernization of Cosmetics Regulation Act of 2022",
                    seller_action_needed="Register foreign manufacturing facility FEI and submit cosmetic product listing via FDA Cosmetics Direct portal prior to distribution.",
                    seller_status="pending_upload"
                ))
            if "EU" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="EU-DOC-CPSR",
                    doc_name="Cosmetic Product Safety Report (CPSR Annex I Part A & B)",
                    issuing_authority="EU Qualified Safety Assessor (European Certified Toxicologist)",
                    country_code="EU",
                    category="Cosmetics Safety Assessment",
                    is_mandatory=True,
                    statutory_citation="Regulation (EC) No 1223/2009 Article 10 & Annex I",
                    seller_action_needed="Complete CPSR Part A (toxicological profile, microbiological specifications) and Part B signed by European qualified safety assessor.",
                    seller_status="pending_upload"
                ))
                documents.append(RequiredDocumentItem(
                    doc_code="EU-DOC-CPNP",
                    doc_name="EU Responsible Person (RP) Agreement & CPNP Notification Dossier",
                    issuing_authority="European Commission DG GROW / CPNP Portal",
                    country_code="EU",
                    category="Cosmetics Notification",
                    is_mandatory=True,
                    statutory_citation="Regulation (EC) No 1223/2009 Articles 4 & 13",
                    seller_action_needed="Designate legal entity established in EU territory as Responsible Person and upload product formula to CPNP.",
                    seller_status="pending_upload"
                ))
            if "UK" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="UK-DOC-SCPN",
                    doc_name="UK SCPN Portal Notification & UK Responsible Person Mandate",
                    issuing_authority="UK Office for Product Safety and Standards (OPSS)",
                    country_code="UK",
                    category="Cosmetics Regulatory",
                    is_mandatory=True,
                    statutory_citation="Product Safety and Metrology etc. (Amendment etc.) (EU Exit) Regulations 2019",
                    seller_action_needed="Submit formulation details to Submit Cosmetic Product Notifications (SCPN) service and list UK legal representative address.",
                    seller_status="pending_upload"
                ))
            if "CA" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="CA-DOC-CNF",
                    doc_name="Health Canada Cosmetic Notification Form (CNF)",
                    issuing_authority="Health Canada Consumer Product Safety Directorate",
                    country_code="CA",
                    category="Cosmetics Regulatory",
                    is_mandatory=True,
                    statutory_citation="Cosmetic Regulations (C.R.C., c. 869) Section 30",
                    seller_action_needed="Submit online CNF within 10 days of first sale in Canada with quantitative exact ingredient percentages.",
                    seller_status="pending_upload"
                ))
            if "JP" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="JP-DOC-PMDA",
                    doc_name="PMDA Foreign Manufacturer Accreditation & Marketing Notification",
                    issuing_authority="Pharmaceuticals and Medical Devices Agency (PMDA) / MHLW",
                    country_code="JP",
                    category="Cosmetics Clearance",
                    is_mandatory=True,
                    statutory_citation="Pharmaceutical and Medical Devices Act (PMD Act) Art. 13-3",
                    seller_action_needed="Partner with licensed Japanese Marketing Authorization Holder (MAH) for pre-import ingredient clearance and Japanese labeling.",
                    seller_status="pending_upload"
                ))

        # -------------------------------------------------------------------
        # 3. CONSUMER ELECTRONICS & WIRELESS DEVICES
        # -------------------------------------------------------------------
        if is_electronics:
            if "US" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="US-DOC-FCC",
                    doc_name="FCC Supplier's Declaration of Conformity (SDoC) / FCC ID Grant",
                    issuing_authority="Federal Communications Commission (FCC) / Telecommunication Certification Body",
                    country_code="US",
                    category="Electromagnetic Compatibility (EMC)",
                    is_mandatory=True,
                    statutory_citation="47 CFR Part 15 Subpart B / § 2.906",
                    seller_action_needed="Provide FCC Part 15 EMC lab test report and formal SDoC compliance statement or FCC Grant of Equipment Authorization.",
                    seller_status="pending_upload"
                ))
            if "EU" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="EU-DOC-CE",
                    doc_name="EU Declaration of Conformity (CE DoC - EMC & Radio Equipment)",
                    issuing_authority="Manufacturer Self-Declaration / EU Notified Body",
                    country_code="EU",
                    category="Product Safety / CE Marking",
                    is_mandatory=True,
                    statutory_citation="Directives 2014/30/EU (EMC) & 2014/53/EU (RED)",
                    seller_action_needed="Compile Technical Construction File with harmonized EN 55032/EN 55035 test reports and sign EU DoC.",
                    seller_status="pending_upload"
                ))
                documents.append(RequiredDocumentItem(
                    doc_code="EU-DOC-ROHS",
                    doc_name="RoHS 3 Certificate of Compliance (10 Hazardous Substances)",
                    issuing_authority="Accredited Material Testing Laboratory",
                    country_code="EU",
                    category="Environmental / Chemical Restrictions",
                    is_mandatory=True,
                    statutory_citation="Directive 2011/65/EU as amended by Directive (EU) 2015/863",
                    seller_action_needed="Provide testing verification proving Lead, Mercury, Cadmium, Hexavalent Chromium, PBB, PBDE, and 4 Phthalates comply with limits.",
                    seller_status="pending_upload"
                ))
                documents.append(RequiredDocumentItem(
                    doc_code="EU-DOC-WEEE",
                    doc_name="WEEE Registration & EPR Extended Producer Responsibility ID",
                    issuing_authority="National Environmental Registry (e.g., stiftung ear Germany, SYDEREP France)",
                    country_code="EU",
                    category="E-Waste Recycling",
                    is_mandatory=True,
                    statutory_citation="Directive 2012/19/EU / National EPR Waste Codes",
                    seller_action_needed="Register brand in target country e-waste registries and affix crossed-out wheelie bin symbol.",
                    seller_status="pending_upload"
                ))
            if "UK" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="UK-DOC-UKCA",
                    doc_name="UKCA Declaration of Conformity & UK RoHS Dossier",
                    issuing_authority="UK Approved Body / Manufacturer Declaration",
                    country_code="UK",
                    category="Product Safety / UKCA",
                    is_mandatory=True,
                    statutory_citation="Electromagnetic Compatibility Regulations 2016 (S.I. 2016/1091)",
                    seller_action_needed="Issue UKCA Declaration of Conformity citing UK designated standards.",
                    seller_status="pending_upload"
                ))
            if "JP" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="JP-DOC-PSE",
                    doc_name="Japan PSE Circle / Diamond Mark & MIC Giteki Certification",
                    issuing_authority="Ministry of Economy, Trade and Industry (METI) / MIC Registered Body",
                    country_code="JP",
                    category="Electrical Safety & Radio Law",
                    is_mandatory=True,
                    statutory_citation="Electrical Appliance and Material Safety Act (DENAN) & Radio Law Art. 38-6",
                    seller_action_needed="Complete technical criteria testing for power adapters/circuits and affix Circular PSE and TELEC Giteki mark.",
                    seller_status="pending_upload"
                ))
            if "CA" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="CA-DOC-ISED",
                    doc_name="ISED Technical Acceptance Certificate (TAC) & IC ID",
                    issuing_authority="Innovation, Science and Economic Development Canada (ISED)",
                    country_code="CA",
                    category="Wireless Spectrum & EMC",
                    is_mandatory=True,
                    statutory_citation="ICES-003 Issue 7 / RSS-247 Issue 2",
                    seller_action_needed="Register device under Canadian Representative and list product on ISED Radio Equipment List (REL).",
                    seller_status="pending_upload"
                ))

        # -------------------------------------------------------------------
        # 4. KITCHENWARE & FOOD CONTACT MATERIALS (FCM)
        # -------------------------------------------------------------------
        if is_food_contact:
            if "US" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="US-DOC-FDA-FCS",
                    doc_name="FDA Food Contact Substance (FCS) Migration Certificate",
                    issuing_authority="Accredited Food Contact Laboratory",
                    country_code="US",
                    category="Food Contact Safety",
                    is_mandatory=True,
                    statutory_citation="21 CFR § 174 - 178 (Indirect Food Additives: Polymers & Adjuvants)",
                    seller_action_needed="Conduct FDA extractive migration testing with food-simulating solvents (water, heptane, 8% alcohol) ensuring non-toxicity.",
                    seller_status="pending_upload"
                ))
            if "EU" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="EU-DOC-FCM",
                    doc_name="EU FCM Declaration of Compliance (DoC) & Migration Test",
                    issuing_authority="Accredited Chemical Testing Laboratory",
                    country_code="EU",
                    category="Food Contact Safety",
                    is_mandatory=True,
                    statutory_citation="Regulation (EC) No 1935/2004 & Regulation (EU) No 10/2011",
                    seller_action_needed="Draft Declaration of Compliance stating overall migration limits (OML < 10 mg/dm²) and affix Glass & Fork symbol.",
                    seller_status="pending_upload"
                ))
            if "CA" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="CA-DOC-HC-FCM",
                    doc_name="Health Canada Food Packaging Safety Clearance / LONO",
                    issuing_authority="Health Canada Bureau of Chemical Safety",
                    country_code="CA",
                    category="Food Contact Materials",
                    is_mandatory=True,
                    statutory_citation="Food and Drugs Act (R.S.C., 1985, c. F-27) Division 23",
                    seller_action_needed="Confirm chemical non-reactivity under Division 23 or request Letter of No Objection (LONO) from Health Canada.",
                    seller_status="pending_upload"
                ))

        # -------------------------------------------------------------------
        # 5. CHILDREN'S PRODUCTS & TOYS
        # -------------------------------------------------------------------
        if is_toy:
            if "US" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="US-DOC-CPC",
                    doc_name="Children's Product Certificate (CPC) & ASTM F963 Test Report",
                    issuing_authority="CPSC-Accepted Third-Party Laboratory",
                    country_code="US",
                    category="Children's Product Safety",
                    is_mandatory=True,
                    statutory_citation="Consumer Product Safety Improvement Act (CPSIA) § 102 / 16 CFR Part 1110 / ASTM F963-23",
                    seller_action_needed="Issue formal CPC signed by manufacturer based on passing test reports from CPSC-accepted lab for lead, phthalates, and small parts.",
                    seller_status="pending_upload"
                ))
            if "EU" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="EU-DOC-TOY-CE",
                    doc_name="EC Declaration of Conformity for Toys (EN 71-1, 2, 3 Test Reports)",
                    issuing_authority="European Notified Body / Certified Toy Laboratory",
                    country_code="EU",
                    category="Toy Safety Directive",
                    is_mandatory=True,
                    statutory_citation="Directive 2009/48/EC (Toy Safety) / Harmonized Standards EN 71",
                    seller_action_needed="Perform mechanical, physical, flammability, and heavy element migration tests according to EN 71 series and apply CE mark.",
                    seller_status="pending_upload"
                ))
            if "CA" in target_markets:
                documents.append(RequiredDocumentItem(
                    doc_code="CA-DOC-CCPSA-TOY",
                    doc_name="CCPSA Toy Safety Compliance Audit & Bilingual Warning Declarations",
                    issuing_authority="Accredited Testing Laboratory / Health Canada",
                    country_code="CA",
                    category="Toy Safety Regulations",
                    is_mandatory=True,
                    statutory_citation="Canada Consumer Product Safety Act (CCPSA) Toys Regulations (SOR/2011-17)",
                    seller_action_needed="Submit drop test and choking hazard assessments with mandatory English and Canadian French warning statements.",
                    seller_status="pending_upload"
                ))

        # -------------------------------------------------------------------
        # 6. UNIVERSAL BASELINE CUSTOMS ENTRY PACK (All products)
        # -------------------------------------------------------------------
        documents.append(RequiredDocumentItem(
            doc_code="GLOBAL-DOC-COMMERCIAL-INVOICE",
            doc_name="Commercial Customs Invoice with Standardized 6-Digit HS Code",
            issuing_authority="Exporter / Customs Broker",
            country_code="ALL",
            category="Customs Clearance",
            is_mandatory=True,
            statutory_citation="WCO Harmonized System Convention / 19 U.S.C. § 1481 / Union Customs Code Art. 145",
            seller_action_needed="Provide itemized invoice declaring correct HS sub-heading, currency, unit value, country of origin, and consignee details.",
            seller_status="pending_upload"
        ))

        return documents
