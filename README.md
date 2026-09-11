# LexPort — Agentic Compliance Co-Pilot for Cross-Border E-Commerce Sellers

> **PS13 Master Build** | *Google Antigravity Hackathon 2026*  
> **Core Concept:** Compliance failures occur because of a **language mismatch** between informal marketing claims and strict technical regulations. LexPort is the **impedance matcher** that translates informal marketing copy into formal regulatory parameters, checks them across multiple destination markets simultaneously, stress-tests them in an adversarial debate, and generates an immutable cryptographic audit trail.

---

## 🌟 Key Innovations & USPs

### 1. Three-Tier Trust Architecture (Zero False Green Checks)
* **Tier 1: Deterministic Rule Layer (Zero LLM, 100% Deterministic, Cites Exact Law)**  
  Handles stable facts: chemical concentration limits (e.g., hydrogen peroxide US 14% vs EU/UK 0.1%), banned ingredient lists, mandatory statutory field checklists (Country of Origin under 19 U.S.C. § 1304, EU Responsible Person under Article 4, Canada bilingual French/English under CPLA Section 6).
* **Tier 2: Grounded Reasoning Layer (Gemini-Powered with Mandatory Citation Discipline)**  
  Converts unstructured marketing text into formal technical parameters, infers HS-code classifications, detects Layer 1b cross-border classification mismatches, and orchestrates live adversarial debates.
* **Tier 3: Human Escalation Layer (Strict Non-Automation)**  
  Explicitly flags physical laboratory testing (CE/CPSC/ASTM F977), hazmat battery air freight (UN 38.3 test summaries), marketplace category ungating, and IP distribution rights as **Requires Human / Legal Review**. Never produces false-positive green checkmarks.

### 2. Simultaneous Multi-Market Compliance Matrix (Structural Differentiator)
* 5 destination markets evaluated in a single pass: **United States (US), European Union (EU), United Kingdom (UK), Canada (CA), and Japan (JP)**.
* Multi-country columns $\times$ 6 statutory check categories.
* Click any cell to view exact legal citations, extracted parameters, statutory requirements, and remediation actions.

### 3. Live Adversarial Regulatory Debate Room (Demo Centerpiece)
* Point-counterpoint debate between:
  * **Customs Inspector Agent**: Aggressive border enforcement officer seeking reasons to seize or detain goods.
  * **Seller Advocate Agent**: Defends commercial intent, explores statutory exemptions, and proposes lowest-friction compliant language.
  * **Consensus Arbiter**: Delivers final binding legal ruling and agreed remediation roadmap.
* Live interactive playback controls with turn-by-turn arguments and citations.

### 4. EU Digital Omnibus AI Act (August 2026) SHA-256 Hash Chain Audit Trail
* Every audit event calculates an immutable SHA-256 hash chaining:
  $$\text{ComplianceHash} = \text{SHA256}(\text{prev\_hash} + \text{inspection\_id} + \text{listing} + \text{attributes} + \text{findings} + \text{citations})$$
* Satisfies Article 13 (Transparency) and Article 14 (Human Oversight) of the EU AI Act.
* Interactive **Tamper Verifier Modal**: verify cryptographic mathematical proof in 1-click, or trigger simulated data tampering to watch the red **TAMPER DETECTED** alert fire.

### 5. Automated Compliant Rewrite & Side-by-Side Diff Engine
* Honest framing: Fixes unintentional seller overclaiming without teaching sellers to dodge legitimate safety rules.
* Substitutes unlawful disease cure and pesticide claims (e.g. *"cures arthritis"* $\rightarrow$ *"supports joint comfort and eases stiffness"*; *"kills 99.9% germs"* on boards $\rightarrow$ *"treated surface that resists odor and stain-causing bacteria on the board"* under EPA 40 CFR § 152.25).
* 1-Click **"Apply Compliant Fix & Re-Audit"** updates the listing and immediately shows matrix cells turning green.

### 6. Trade Economics Advisor (Tax / Duty / De Minimis Comparator)
* Reframes compliance from purely defensive into a strategic expansion asset.
* Compares de minimis duty-free caps: **US ($800) vs UK (£135) vs EU (€0 / IOSS) vs Japan (¥10,000) vs Canada ($20 CAD)**.
* Ranks destination markets by entry ease (#1 Easiest to #5 Highest Friction).

### 7. Regulatory Change Simulator & Real-Time Broadcast
* Live interactive switches to simulate emergency regulatory shocks:
  * *US EPA Emergency Antimicrobial Enforcement Guidance*
  * *EU SCCS 0.05% Hydrogen Peroxide Concentration Cap*
  * *Health Canada Schedule 2 Broadening (Infant Rockers & Bouncers Ban)*
* Watch previously-green cells flip red across the matrix live during judging demos!

### 8. Official PDF Compliance Dossier (ReportLab) & NL-to-SQL Copilot
* 1-Click export of the official **Cross-Border Regulatory Compliance Dossier** complete with SHA-256 cryptographic seal, country matrix tables, cited statutes, and remediation plan.
* Built-in natural language query assistant answering analytical questions with dynamic Recharts bar, pie, and line graphs.

---

## 📁 Documented Real-World Case Study Presets

| Preset | Product Name | Legal Conflict & Failure Pattern | Outcome / Remediation |
|---|---|---|---|
| **Preset 1** | **Ayurvedic Joint Healing Cream** | Claims *"cures arthritis permanently"*. Violates US FDA 21 U.S.C. § 321(g) (Unapproved New Drug); Camphor 5% violates Canada Hotlist 3% limit. | Auto-rewrites to *"soothes tired joints"*; flags Canadian French bilingual label requirement. |
| **Preset 2** | **Infant Baby Walker with Wheels** | Fully legal in US (ASTM F977) & UK (BS EN 1273); **CRIMINAL BAN** in Canada under CCPSA Schedule 2 (CAD $100k fine). | Geofence exclude Canada; escalate US/UK to Tier 3 accredited laboratory CPC testing. |
| **Preset 3** | **Antimicrobial Bamboo Cutting Board** | Claims *"kills 99.9% bacteria & germs"*. Regulated as household article in UK/EU, but classified as **PESTICIDE** under US EPA FIFRA (40 CFR § 152). | Auto-rewrites to EPA Treated Article wording; avoids pesticide registration trap. |
| **Preset 4** | **Infant Sleep Positioner & Wedge** | Marketed internationally as nursery sleep aid; **FEDERALLY BANNED** in US under Safe Sleep for Babies Act (CPSC / FDA recall). | US import prohibition enforced; delisting advisory. |
| **Preset 5** | **Heated Thermal Eye Wand** | Rechargeable lithium-ion battery device. CE / FCC / RoHS applicable. | Tier 3 Escalation: Flags UN 38.3 battery test summary and CE Technical File documentation. |

---

## 🚀 Quick Start Guide

### Prerequisites
* Python 3.10+ (installed at `py -3.10`)
* Node.js v18+ & npm
* Google Gemini API Key (configured in `backend/.env`)

### Launching the Application
You can launch both backend and frontend with a single command:

```cmd
run_all.bat
```

Or launch individually:

#### 1. Backend API (FastAPI)
```cmd
start_backend.bat
```
* API Server: `http://127.0.0.1:8000`
* Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

#### 2. Web Frontend (Next.js 14)
```cmd
start_frontend.bat
```
* Dashboard URL: `http://localhost:3000`

---

## 🧪 Automated Test Suite

LexPort includes unit tests and end-to-end integration tests:

```cmd
# Run all deterministic rule and hash chain unit tests
py -3.10 -m pytest backend/tests/ -v

# Run full end-to-end multi-agent pipeline integration test
py -3.10 -m backend.tests.test_pipeline
```

---

## 🎤 Hackathon Showcase / 3-Minute Demo Script

1. **The Problem Hook (30s)**:
   - Select **Preset 1 (Ayurvedic Herbal Cream)**.
   - Explain: *"Sellers write informal marketing copy like 'cures arthritis'. Regulators regulate formal drug classifications. Watch what happens when this is audited across 5 markets simultaneously."*
2. **The Compliance Matrix (45s)**:
   - Click **Run Multi-Agent Compliance Audit**.
   - Show the 5-market matrix: US and Canada flag critical violations (`US-CLAIM-01`, `CA-ING-01`), while UK shows warning.
   - Click a red cell: show the exact statutory citation (`21 U.S.C. § 321(g)`) and the **Three-Tier Trust Level**.
3. **Adversarial Debate Room (45s)**:
   - Switch to the **Adversarial Debate Room** tab.
   - Watch the **Customs Inspector Agent** and **Seller Advocate Agent** argue over the disease claims and border admissibility, ending in an agreed consensus.
4. **Auto-Rewrite & Diff Fixer (30s)**:
   - Switch to **Compliant Rewrite & Diffs**.
   - Show the side-by-side comparison: *"cures arthritis"* replaced with *"supports joint comfort"*.
   - Click **Apply Compliant Fix & Re-Audit**: watch the matrix instantly re-evaluate and cells turn green!
5. **EU AI Act Hash Verifier & Trade Economics (30s)**:
   - Open the **EU AI Act Cryptographic Verifier**: click **Simulate Tamper** to show instant mathematical proof of data modification.
   - Switch to **Trade Economics Advisor**: show how the US $800 de minimis makes it Rank #1 to enter first vs Canada ($20 CAD).
   - Click **Export Dossier (PDF)** to show the generated compliance report.

---

## ⚖️ Pre-Built Judge-Defense Q&A

* **Q: Why multi-agent debate instead of one flat LLM call?**  
  *A: Compliance is inherently adversarial. Separating "find reasons to reject" (Inspector) from "find ways to fix" (Advocate) eliminates single-prompt confirmation bias and surfaces edge cases like packaging mandates that a flat prompt ignores.*
* **Q: Where does your rule knowledge come from — regulations change constantly?**  
  *A: Hybrid architecture: stable, well-documented facts (CE/CPSC standards, concentration limits, banned words) live in our deterministic rule engine that cites exact clauses with zero LLM hallucination. Dynamic updates are handled by our grounded reasoning layer and regulatory change broadcaster.*
* **Q: How is this different from Zonos, Salsify, or ChatGPT?**  
  *A: Zonos handles HS codes and taxes, not listing text or claims. Salsify does listing quality, not law. ChatGPT is ungrounded and hallucinates citations. LexPort is the only platform unifying destination-country text compliance + multi-market matrix + cryptographic audit trail.*
* **Q: Isn't the auto-rewrite just teaching sellers to dodge regulation?**  
  *A: No. It only corrects claims-level overclaiming (substituting disease cures with compliant structure/function language). Safety certifications, baby walker bans, and hazmat shipping are strictly escalated to human review — never auto-resolved.*

---

## 🔮 Future Scope & Enterprise Roadmap

While the core MVP and complete end-to-end multi-agent co-pilot are fully operational today, the following modules are slated for the post-hackathon enterprise roadmap:

1. **Automated Customs Broker EDI Integration**:
   - Direct integration with CBP ACE (Automated Commercial Environment) and EU UCC CDS (Customs Decisions System) for pre-cleared electronic entry filing.
2. **Enterprise ERP & Marketplace Bi-Directional Webhooks**:
   - Real-time catalog compliance synchronization across SAP, Oracle NetSuite, and multi-channel feed managers (ChannelAdvisor, Sellbrite).
   - Automated listing pause triggers when a high-severity regulatory shock broadcast is received.
3. **Expanded Multi-Language Regulatory Dictionaries**:
   - Extending the Rosetta Stone packaging OCR engine to support direct dual-language packaging generation for Spanish (COFEPRIS), Arabic (SFDA), and Korean (MFDS).
4. **Supply Chain Traceability & Chain of Custody**:
   - Integration with GS1 Digital Link 2D Barcodes and physical RFID batch passports for full farm-to-border tracking of organic and botanicals.

---

**Built with ❤️ for Kurukshetra Hackathon 2026**
