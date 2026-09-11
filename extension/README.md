# LexPort — Live Cross-Border Compliance Chrome Extension (Manifest V3)

> **Subsystem**: `extension/`  
> **Lead Role**: Person 4 (Chrome Extension & Ground-Truth Benchmark Proof Lead)  
> **Backend Dependency**: FastAPI server running on `http://127.0.0.1:8000`  
> **Web Cockpit**: Next.js running on `http://localhost:3000`

---

## 1. How It Works: The Seller Pre-Flight Workflow

The LexPort Chrome Extension is built specifically for **cross-border e-commerce exporters**:
1. **Authentication & Pairing**:
   - The extension authenticates with the LexPort backend API using an enterprise seller token (`SELLER-APEX-9842`).
   - The seller's export origin country (e.g. 🇮🇳 India, 🇻🇳 Vietnam) and default target markets (🇺🇸 US, 🇪🇺 EU, 🇬🇧 UK, 🇨🇦 CA, 🇯🇵 JP) are automatically paired with every audit.
2. **Open ANY Product on Amazon**:
   - Whether on a **live Amazon Product Detail Page** (`amazon.com/dp/...`, `amazon.in/dp/...`, `amazon.co.uk/dp/...`, etc.) or in **Amazon Seller Central** (`sellercentral.amazon.com/abis/listing/edit`):
   - The extension immediately activates, displaying the floating **"🛡️ LexPort Audit"** badge.
3. **1-Click Full System Audit**:
   - Scraping extracts the real title, bullet points, price, ASIN, packaging table, and Amazon `#important-information` ingredients.
   - The audit runs through the 12-step Multi-Agent Pipeline on FastAPI in under 1 second.
   - The slide-out drawer displays the **Customs Seizure Radar**, simulated **CBP Form 29 Notice of Action**, **Statutory Citations**, and **Mandatory Document Checklist**.
4. **Live In-Page DOM Replacement**:
   - Click **"⚡ Replace in Amazon Page"**: The unapproved disease claims and non-compliant bullets are replaced *live* on the Amazon DOM right in front of your eyes with verified, green-badged compliant copy!
   - In Seller Central, it auto-fills the listing form textareas directly!
5. **Deep Link to Full Web Cockpit**:
   - Click **"🚀 Open Full Audit in Web Dashboard"** at the bottom of the drawer to view the complete inspection dossier, cryptographic SHA-256 Merkle chain block explorer, and interactive Leaflet world map on `http://localhost:3000`.

---

## 2. Quick Installation Guide (1 Minute)

1. Open **Google Chrome** (or Microsoft Edge / Brave / Arc).
2. Navigate to `chrome://extensions/` in your address bar.
3. Toggle on **"Developer mode"** in the top-right corner.
4. Click **"Load unpacked"** in the top-left toolbar.
5. Select the `extension/` folder inside this repository (`d:\KURUKSHETRA HACKATHON\extension`).
6. You will see **"LexPort — Live Cross-Border Compliance Co-Pilot"** active with its green shield icon.

---

## 3. Instant Local Verification (Offline / Judge Demo)

You do **not** need an active Amazon seller account to test the extension:

1. Double-click or open [`extension/test_harness/mock_amazon_pdp.html`](mock_amazon_pdp.html) in your browser.
2. Notice the floating **"🛡️ LexPort Audit"** pill appear in the top-right corner of the Amazon product detail page.
3. Click the pill to slide open the **LexPort Interactive Compliance Drawer**.
4. The system will audit the listing against US (FDA MoCRA), EU (Regulation 1223/2009), UK, Canada, and Japan trade laws.
5. Watch the following live results populate:
   - **Authenticated Seller Ribbon**: `🏢 Apex Global Direct (Verified Exporter) | Origin: 🇮🇳 India`.
   - **Seizure Risk Radar**: 78% Seizure Risk with estimated financial exposure ($4,950).
   - **Simulated CBP Form 29**: Notice of Action citing 21 U.S.C. § 352 (Unapproved Medical Cure).
   - **Word-Level Claims Scrubbed**: Replaces unapproved claims (*"miraculous cure"*, *"eliminates eczema"*, *"100% organic"*) with legally compliant copy.
   - **Mindblowing Live Demo Action**: Click **"⚡ Replace in Amazon Page"** under the *1-Click Fix* tab to watch the Amazon bullet points update live on the webpage with compliant, green-badged copy!
   - **Benchmark Proof**: Click the *Benchmark Proof* tab to see the live 50-item ground-truth accuracy stats (100% accuracy, 1.000 F1).
   - **Web Cockpit Deep Link**: Click **"🚀 Open Full Audit in Web Dashboard"** to jump into the full Next.js cockpit at `http://localhost:3000`.

---

## 4. Live Marketplace Testing (Amazon, Walmart, Shopify)

When browsing real marketplace pages:
- **Amazon**: Any Amazon domain (`.com`, `.in`, `.co.uk`, `.de`, `.ca`, `.co.jp`).
- **Amazon Seller Central**: Listing editor forms.
- **Walmart**: Product pages.
- **Shopify Stores**: Any direct-to-consumer store powered by Shopify.

The content script automatically extracts:
- Product Title (`#productTitle` or `#item_name`)
- 5 Bullet Points (`#feature-bullets ul li span.a-list-item` or Seller Central textareas)
- Price & ASIN
- Ingredients & Safety Statements (`#important-information`)
- Packaging Specifications Table (Ingredients, UPC barcode, weight)

---

## 5. Architectural File Index

| File | Purpose |
|---|---|
| `manifest.json` | Manifest V3 specification with host permissions and content scripts. |
| `background/service-worker.js` | Async communications broker, seller authentication state, and FastAPI integration. |
| `content/scraper.js` | Marketplace DOM scraper, floating pill injection, and slide-out audit drawer logic. |
| `content/styles.css` | Scoped modern glassmorphic styling preventing host page CSS collisions. |
| `popup/popup.html` & `popup.js` | Toolbar popup with backend health check, seller profile, country selectors, and benchmark metrics. |
| `icons/` | 16x16, 48x48, 128x128 PNG branded shield icons. |
| `test_harness/mock_amazon_pdp.html` | Realistic Amazon product detail page with `#important-information` for instant judge demonstrations. |
