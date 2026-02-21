# MVL Supply Chain Intel Hub — Agent Instructions

**Last Updated:** February 21, 2026  
**Current Version:** V8 (Excel-based Pipeline with Change Orders)  
**Previous Versions:** V7 (CSV Pipeline), V6 (Modular JS), V5 (Unified Dashboard)

---

## Workspace Structure

```
mvl-powerbi-dashboards/
├── v8/                              # CURRENT VERSION
│   ├── index.html                   # Single-page app with 3 tabs
│   ├── shared/
│   │   ├── scripts.js               # All dashboard logic (~5,545 lines)
│   │   ├── styles.css               # Complete CSS with design tokens
│   │   ├── images/                  # Logo and image assets
│   │   └── components/              # Component docs
│   ├── data/
│   │   ├── build_v8_data.py         # Python pipeline (1,118 lines) — reads Excel via xlrd
│   │   ├── gsa_data.json            # GSA tab: 3,596 POs with change orders (2,894 KB)
│   │   ├── sm_data.json             # SM tab: 3,946 RFQ quotations (2,889 KB)
│   │   ├── md_data.json             # M&D tab: combined RFQs + POs (4,248 KB)
│   │   ├── change_orders.json       # 191 CO groups, 268 CO PO lines (42 KB)
│   │   ├── conversion_times.json    # 441 RFQ→PO links, monthly averages (97 KB)
│   │   ├── employees.json           # MVL employee performance records
│   │   ├── data_metadata.json       # Build metadata, source files, dates
│   │   ├── entity_code_map.json     # Entity code to name mapping
│   │   ├── build_v8_data_old.py     # Old pipeline (preserved)
│   │   └── backup_old_Feb12/        # Pre-change data backup
│   ├── Re_ Main order XLS and.../   # Source Excel files (Feb 20, 2026 export)
│   │   ├── PO_List_Feb-20-2026.xls          # 3,613 PO records
│   │   ├── Quotation_Report_Feb-20-2026.xls # Fragment 1 (Q1-3000)
│   │   ├── Quotation_Report_...(1).xls      # Fragment 2 (Q3001-6000)
│   │   ├── Quotation_Report_...(2).xls      # Fragment 3 (Q6001-9000)
│   │   ├── Quotation_Report_...(3).xls      # Fragment 4 (Q9001-12000)
│   │   └── Quotation_Report_...(4).xls      # Fragment 5 (Q12001-12215)
│   ├── Material and Material Codes.csv       # Official material reference (30 → 12)
│   ├── REVIEW_RESPONSE.md           # 47 review questions status (31✅, 12⚠️, 4❌)
│   ├── NEW_DATA_ANALYSIS.md         # Feb 20 data analysis report
│   ├── README.md                    # V8 architecture documentation
│   └── docs/                        # Historical documentation
│
├── v8-backup/                       # Complete V8 pre-change backup
├── v7/                              # Previous version (CSV pipeline)
├── v6/                              # Modular ES6 version (reference)
├── v5/                              # Legacy unified dashboard
│
├── .github/
│   └── copilot-instructions.md      # GitHub Copilot workspace instructions
│
├── AGENT_INSTRUCTIONS.md            # THIS FILE
└── README.md                        # Project overview
```

---

## Live URLs

| Environment | URL |
|-------------|-----|
| **GitHub Pages (V8)** | https://sajeshvs.github.io/mvl/v8 |
| **Local Development** | http://localhost:8080 |

### Repositories

| Repository | Remote | Purpose |
|-----------|--------|---------|
| `sajeshvs/mvl-powerbi-dashboards` | origin | Private development workspace |
| `sajeshvs/mvl` | mvl | Public GitHub Pages deployment |

### To Deploy V8:
```bash
cd mvl-powerbi-dashboards
git add -A
git commit -m "v8: <description>"
git push origin main
git push mvl main
```

---

## V8 Dashboard Tabs

### Tab 1: Supplier Marketplace (SM)
- **Theme:** Blue `#004578`
- **Tab ID:** `supplier-marketplace`
- **Panel ID:** `tab-supplier-marketplace`
- **Data Source:** `sm_data.json`
- **Records:** 3,946 RFQ-only quotations (IQ records removed)
- **Key Fields:** QuotationNumber, orderId, mainOrderId, isRevision, revisionLetter, material, materialCode, Entity, Status, Client
- **KPIs (7):** RFQ Count, Quote Value, PO Count, PO Value, Win Rate (94.3%), Change Orders, CO Value
- **Charts:** Status Breakdown (clickable bars), Entity Comparison (clickable), Top 10 Suppliers (ranked list), Material Distribution, Employee Performance (sort toggle), Supplier Map (Leaflet), Monthly Trend (line), Quotation-to-PO Time
- **Tables:** Supplier List, Marketplace Workbench (paginated, sortable)
- **Filters:** Entity, Project, Supplier, Status, Material — all with SearchableSelect + instant filtering
- **Special:** Clear button, search with feedback indicator, normalizeCountry() for map

### Tab 2: Global Spend Analysis (GSA)
- **Theme:** Orange `#d96f3c`  
- **Tab ID:** `global-spend`
- **Panel ID:** `tab-global-spend`
- **Data Source:** `gsa_data.json`, `change_orders.json`
- **Records:** 3,596 POs (3,287 Base + 309 Change Orders)
- **Key Fields:** poNumber, orderId, mainOrderId, isChangeOrder, poType ("Base PO"/"Change Order"), changeOrderGroup, material, materialCode, entity, supplier, valueUSD
- **KPIs (6):** Total POs (3,596), Total Spend ($147.84M), Change Orders (309), CO Amount ($30.04M), Suppliers (1,103), Entities (18)
- **KPI Subtexts:** CO groups count (191), CO % of total spend (20.3%)
- **Charts:** Annual Spend Trend (stacked bar), Spend by Entity (top 8, clickable), Spend by Projects (top 8, clickable), Top 10 Suppliers (clickable → supplier card), Bottom 10 Suppliers (clickable → supplier card)
- **Tables:** PO Details with Order ID column, CO type badges (Base/CO), group indicators ("2 of 3"), sorting, pagination
- **Filters:** Entity, Supplier, Project, Material, PO Type (Base/CO), Year, Date Range, Search — all instant + SearchableSelect

### Tab 3: Materials & Disciplines (M&D)
- **Theme:** Dark Blue `#0f3d5e`
- **Tab ID:** `materials-disciplines`
- **Panel ID:** `tab-materials-disciplines`
- **Data Source:** `md_data.json`
- **Records:** 3,946 RFQs + 3,596 POs
- **Key Fields:** material, materialCode (12 codes), entity, supplier, project
- **KPIs (5):** Materials (33), Material Codes (12), Total Material Spend, Total Material Code Spend, Active Projects + supplier count
- **Charts:** Total Spend by Material Code (grouped bar: Quoted vs Ordered), Material Distribution (doughnut, clickable), Supplier Profile Card
- **Tables:** Supplier Overview (paginated, filtered), Approved Materials, PO/Material Details
- **Filters:** Material Code, Material, Entity, Project, Supplier, Year, Date Range, Search — all with Clear button

---

## V8 Architecture

### Single-File JavaScript (scripts.js ~5,545 lines)

Unlike V6's modular ES6 architecture, V8 uses a single `scripts.js` file with all logic:

```
scripts.js
├── Global Variables & State (L1-50)
├── Data Loading (L51-300)          — loadAllData(), FX rates
├── Tab Switching (L301-400)        — switchTab(), bottom tabs
├── SM Tab (L400-2900)              — filters, KPIs, charts, workbench, map
├── GSA Tab (L2900-4200)            — filters, KPIs, charts, PO table, CO badges
├── M&D Tab (L4200-5400)            — filters, KPIs, charts, supplier overview
├── SearchableSelect (L5400-5600)   — Reusable type-ahead dropdown component
└── Initialization (L5600+)         — DOMContentLoaded, window functions
```

### Key Functions by Tab

**SM Tab:**
- `initFilters()` — Populate all SM dropdowns (sorted, from sm_data.json)
- `applyFilters()` → `updateAll()` — Filter + render entire SM tab
- `clearSMFilters()` — Reset all SM filters
- `filterByStatus(status)` — Click status bar → cross-filter
- `updateSupplierProfile(name)` — Populate supplier profile card
- `renderEntityChartCanvas()` — Entity chart with onClick
- `renderTrendChartLine()` — Monthly trend chart
- `normalizeCountry()` — Global country name normalization

**GSA Tab:**
- `initGSAFilters()` — Populate GSA dropdowns + wire change listeners
- `applyGSAFilters()` — Filter POs + rebuild all GSA components
- `clearGSAFilters()` — Reset all GSA filters
- `updateGSAKPIs(data)` — Compute & display 6 KPIs + CO subtexts
- `updateGSATable(data)` — Render PO table with Order ID, CO badges, sorting
- `createGSASpendTrendChart()` — Annual spend trend
- `updateGSASupplierCard(name)` — Supplier details card
- `sortGSATable(field)` — Multi-field sorting including order_id

**M&D Tab:**
- `initMdFilters()` — Populate M&D dropdowns (materialCodes + materials separate)
- `applyMdFilters()` — Filter + render M&D tab
- `clearMdFilters()` — Reset all M&D filters
- `updateMdKPIs()` — Materials (33), Material Codes (12), spend, projects
- `updateMdSupplierProfile(supplier)` — With object property guards
- `createDisciplineSpendChartFiltered()` — Material Code spend chart ("Ordered" label)

**Shared:**
- `SearchableSelect` class (L5414) — Type-ahead wrapper for `<select>` elements
- `initSearchableSelects()` (L5520) — Applies to 12+ dropdowns across all tabs
- `formatCurrency()`, `formatCurrencyShort()` — Currency formatting
- `debounce()` — Input debouncing (300ms)

---

## V8 Data Files Reference

### Purchase Order Record Fields (gsa_data.json)
```javascript
{
  poNumber, poDate, poName, supplier, originalValue, currency,
  mainOrderId, orderId, entityCode, entity, material, materialCode,
  poVersion, isChangeOrder, year, month, yearMonth,
  valueUSD, poSpendUSD, poType, // "Base PO" or "Change Order"
  changeOrderGroup, changeOrderTotal, project
}
```

### Quotation Record Fields (sm_data.json)
```javascript
{
  QuotationNumber, QuotationType, // always "RFQ" in V8
  Status, ProjectName, Description, Material, materialCode,
  Entity, Client, QuotationValue, Currency,
  Contact, Date, mainOrderId, orderId,
  isRevision, revisionLetter, baseNumber // letter suffix tracking
}
```

### Change Order Group (change_orders.json)
```javascript
{
  orderId, mainOrderId, basePO, totalPOs, totalValueUSD,
  pos: [{ poNumber, poDate, supplier, value, currency, version }]
}
```

### Summary Fields (gsa_data.json → summary)
```javascript
{
  totalSpendUSD: 147840010.12,
  totalPOs: 3596,
  basePOs: 3287,
  changeOrders: 309,
  changeOrderValue: 30036794.2,
  basePOValue: 117803215.93,
  supplierCount: 1103,
  entityCount: 18,
  changeOrderGroups: 191
}
```

### Filter Arrays
```javascript
// gsa_data.json → filters
{
  entities: 19,        // including (Blank)
  suppliers: 1104,
  materials: 30,       // raw material names from Excel
  materialCodes: 12,   // Architectural, Chemicals, Electrical, etc.
  poTypes: 2,          // "Base PO", "Change Order"
  years: 15,           // 2012-2026
  currencies: 12
}

// sm_data.json → filters  
{
  entities: 19,
  statuses: 4,         // Order, Quotation, Waiting, Cancelled
  contacts: 18,
  materials: 27,       // RFQ-only materials
  materialCodes: 12,
  currencies: 12
}

// md_data.json → filters
{
  entities: 19,
  materialCodes: 12,
  materials: 33,       // combined from PO + RFQ
  disciplines: 12,     // alias for materialCodes
  projects: 200,
  suppliers: 1103
}
```

---

## Data Rebuild

```bash
cd v8/data
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" build_v8_data.py
```

The pipeline reads Excel .xls files from `../Re_ Main order XLS and Export feature ready for use/`, processes them with `xlrd`, and outputs JSON files.

**What it does:**
- Reads PO data (3,613 rows) and 5 quotation fragments (12,215 rows total)
- Auto-detects and skips title rows in quotation fragments
- Filters to RFQ-only quotations (removes IQ records)
- Extracts Main Order ID and Order ID from explicit Excel columns
- Detects change orders via PO suffix analysis (-1 = Base, -2+ = CO)
- Detects quotation revisions via letter suffixes (A-P)
- Links RFQ→PO via shared Order ID (441 links found)
- Converts currencies to USD using hardcoded FX rates
- Handles blanks with `(Blank)` placeholder for filter visibility
- Normalizes "Cancled" → "Cancelled"
- Generates 7 output JSON files

---

## Design Guidelines

### Color Themes
| Tab | Primary | CSS |
|-----|---------|-----|
| SM | #004578 | Blue header/chart accents |
| GSA | #d96f3c | Orange KPI top borders |
| M&D | #0f3d5e | Dark blue accents |

### Status Colors
- **Order:** Green `#4CAF50` / `#2ecc71`
- **Quotation:** Blue `#2196F3` / `#3498db`
- **Waiting:** Yellow `#FFC107` / `#f39c12`
- **Cancelled:** Red `#F44336` / `#e74c3c`
- **Closed:** Gray `#9E9E9E` / `#95a5a6`

### Change Order Badge Colors
- **CO Type Badge:** Red `#e74c3c` (for Change Orders)
- **Base Type Badge:** Green `#2ecc71` (for Base POs)
- **CO Group Badge:** Gold `#f39c12` background (group indicators like "2 of 3")

### Typography
- Font: `'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif`
- KPI Values: 26px, bold
- Table: 11-12px

---

## Common Development Tasks

### 1. Update Data from New Excel Export
1. Place new .xls files in `v8/Re_ Main order XLS and Export feature ready for use/`
2. Update filenames in `build_v8_data.py` if changed
3. Run: `python build_v8_data.py`
4. Verify JSON output files generated
5. Start HTTP server: `python -m http.server 8080`
6. Test dashboard at http://localhost:8080

### 2. Add a New KPI
1. Add HTML card in `index.html` within the appropriate tab
2. Add computation in `updateXXKPIs()` function in `scripts.js`
3. Use `formatCurrency()` or `formatNumber()` for display

### 3. Add a Filter
1. Add `<select>` in `index.html`
2. Populate in `initFilters()` / `initGSAFilters()` / `initMdFilters()`
3. Wire `change` event listener
4. Add filter logic in `applyFilters()` / `applyGSAFilters()` / `applyMdFilters()`

### 4. Local Development
```bash
cd v8
python -m http.server 8080
# Open http://localhost:8080
```

---

## Critical Implementation Notes

1. **Single JS File:** V8 uses monolithic `scripts.js` (~5,545 lines), not modular ES6
2. **No Build Tools:** Pure vanilla JS — no webpack, npm, or transpilation
3. **Excel Source:** Data from .xls files (not .xlsx), requires `xlrd` Python package
4. **RFQ Only:** V8 filters out IQ records — only RFQ quotations displayed (3,946 of 12,215)
5. **Change Orders:** Tracked via PO suffix (-1=Base, -2+=CO) and Order ID grouping
6. **Quotation Revisions:** Letter suffixes (A-P) track re-quotes — different Order IDs per revision
7. **Blank Handling:** Empty values displayed as `(Blank)` in filters for visibility
8. **Python:** System Python 3.12 at `C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe` (venv broken — use full path)
9. **FX Rates:** Hardcoded in pipeline; live rates fetched in browser from `open.er-api.com`
10. **SearchableSelect:** Applied to all dropdowns ≥10 options; keyboard navigable

---

## Review Status

47 stakeholder review questions tracked in `v8/REVIEW_RESPONSE.md`:
- **31 Resolved** (Clear buttons, SearchableSelect, filters, data pipeline, supplier profiles, etc.)
- **12 Partial** (trend chart labels, badge contrast, material distribution chart refinement)
- **4 Remaining** (Approved Materials placeholder, GSA Workbench toggle, GSA search feedback, badge contrast)

See `v8/REVIEW_RESPONSE.md` for detailed status per question.

---

*Updated: February 21, 2026*
