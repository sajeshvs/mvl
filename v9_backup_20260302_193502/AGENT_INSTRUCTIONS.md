# MVL Supply Chain Intel Hub — V9 Agent Instructions

**Last Updated:** March 2, 2026  
**Current Version:** V9 (Tax Fields + Dynamic Excel Pipeline)  
**Previous Versions:** V8 (Dynamic Excel Pipeline), V7 (CSV Pipeline), V6 (Modular JS), V5 (Unified Dashboard)

---

## What's New in V9 (vs V8)

- **Tax fields** added to PO and Quotation data from new Excel source with Tax/Net Total columns
- **New data source:** `Full data of Quotations and POs with TAX fields/` — 6 XLS files (Feb 26, 2026 export)
- **GSA workbench table:** Added sortable "Tax (US$)" column
- **SM quotation table:** Added "TAX" column across all rendering paths
- **GSA "Total Spend" KPI:** Shows tax subtext (Tax: $1.7M)
- **SM "Quote Value" KPI:** Shows tax subtext (Tax: $1.6M)
- **Pipeline updates:** `load_po_xls_tax()` and `load_quotation_xls_tax()` functions read Tax/Net Total fields
- **Quotation corruption handling:** `xlrd` reads Quotation XLS with `ignore_workbook_corruption=True`
- **IQ filtering:** 8,256 IQ records excluded — RFQ-only (3,941 records)
- **Material chart display:** All 12 material codes shown in SM bar chart and M&D doughnut (no `.slice()` truncation)
- **Material count labels:** SM Material Distribution bar chart shows "N materials" at end of each bar via custom Chart.js plugin `materialCountLabels`
- **MATERIAL_RAW_COUNTS:** Constant mapping each code to its raw material count (Architectural:8, Fire:7, Services:5, etc.)
- **12-color palette:** `['#0066CC', '#3399FF', '#339933', '#66CC66', '#FF9900', '#FF6600', '#9966CC', '#CC6699', '#2B4257', '#06B6D4', '#EF4444', '#8B5CF6']`
- **CSV exports:** 52 CSV files in `v9/csv-exports/` covering all JSON data with tax fields
- **DOCX documentation:** `v9/docs/generate_docx.py` generates ~25+ page Word doc with 12 sections including Tax Data Processing
- **Technical documentation:** `v9/docs/MVL_Dashboard_Documentation.md` — ~1,000 lines, 13 sections

---

## Workspace Structure

```
mvl-powerbi-dashboards/
├── v9/                              # CURRENT VERSION (V9 — Tax Fields)
│   ├── index.html                   # Single-page app with 3 tabs (1,066 lines)
│   ├── AGENT_INSTRUCTIONS.md        # THIS FILE
│   ├── README.md                    # V9 architecture documentation
│   ├── REVIEW_RESPONSE.md           # 47 review questions — all resolved ✅
│   ├── NEW_DATA_ANALYSIS.md         # Feb 20 data analysis report
│   │
│   ├── shared/
│   │   ├── scripts.js               # All dashboard logic (~6,030 lines)
│   │   ├── styles.css               # Complete CSS with design tokens (~2,820 lines)
│   │   ├── images/                  # Logo and image assets
│   │   └── components/              # Component docs
│   │
│   ├── data/
│   │   ├── build_v8_data.py         # V9 Python pipeline — Tax fields + auto-detect Excel
│   │   ├── gsa_data.json            # GSA tab: 3,620 POs with tax + change orders
│   │   ├── sm_data.json             # SM tab: 3,941 RFQ quotations with tax
│   │   ├── md_data.json             # M&D tab: combined RFQs + POs with tax
│   │   ├── change_orders.json       # 193 CO groups with CO PO lines
│   │   ├── conversion_times.json    # RFQ→PO links, monthly averages
│   │   ├── client_country_map.json  # Client→country mapping (1,098 entries)
│   │   ├── build_client_country_map.py  # Country mapping pipeline
│   │   ├── employees.json           # MVL employee performance records
│   │   ├── data_metadata.json       # Build metadata, source files, dates
│   │   ├── suppliers.json           # Supplier details (2,189 entries)
│   │   └── entity_code_map.json     # Entity code to name mapping
│   │
│   ├── Full data of Quotations and POs with TAX fields/  # NEW: Tax source data
│   │   ├── PO_List_Feb-26-2026 (1).xls           # 3,637 POs (9 columns with Tax/Net Total)
│   │   ├── Quotation_Report_Feb-26-2026.xls       # Quotation fragment 1 (16 cols with Tax)
│   │   ├── Quotation_Report_Feb-26-2026 (1).xls   # Fragment 2
│   │   ├── Quotation_Report_Feb-26-2026 (2).xls   # Fragment 3
│   │   ├── Quotation_Report_Feb-26-2026 (3).xls   # Fragment 4
│   │   └── Quotation_Report_Feb-26-2026 (4).xls   # Fragment 5
│   │
│   ├── Re_ Main order XLS and.../   # Legacy source Excel files (V8 fallback)
│   ├── csv-exports/                 # 52 CSV exports of all JSON data
│   │   ├── export_all_csv.py        # CSV export script — regenerates all 52 CSVs
│   │   ├── README.md                # CSV export index and descriptions
│   │   └── *.csv                    # 52 CSV files (GSA, SM, M&D, CO, Conversion, Suppliers)
│   └── docs/                        # Documentation
│       ├── generate_docx.py         # DOCX generator (~1,530 lines, 12 sections with Tax)
│       ├── MVL_Dashboard_Documentation.docx  # Generated Word doc (~25+ pages)
│       ├── MVL_Dashboard_Documentation.md    # Technical doc (~1,000 lines, 13 sections)
│       └── *.md                     # Other historical docs
│
├── v8/                              # Previous version (no Tax fields)
├── v8_backup_20260226_pre_tax_update/  # V8 backup before V9 work
├── archive_backups/                 # Old backups (v8_backup_20260225, etc.)
│
├── .github/
│   └── copilot-instructions.md      # GitHub Copilot workspace instructions
│
├── AGENT_INSTRUCTIONS.md            # Root-level agent instructions (V8)
└── README.md                        # Project overview
```

---

## Live URLs

| Environment | URL |
|-------------|-----|
| **GitHub Pages (V9)** | https://sajeshvs.github.io/mvl/v9 |
| **GitHub Pages (V8)** | https://sajeshvs.github.io/mvl/v8 |
| **Local Development** | http://localhost:8090 |

### Repositories

| Repository | Remote | Purpose |
|-----------|--------|---------|
| `sajeshvs/mvl-powerbi-dashboards` | origin | Private development workspace |
| `sajeshvs/mvl` | mvl | Public GitHub Pages deployment |

### To Deploy V9:
```bash
cd mvl-powerbi-dashboards
git add v9/
git commit -m "v9: <description>"
git push origin main
git push mvl main
```

---

## V9 Dashboard Tabs

### Tab 1: Supplier Marketplace (SM) — `#004578`
- **Data Source:** `sm_data.json` (3,941 RFQ quotations)
- **KPIs (7):** RFQ Count, Quote Value (+ Tax subtext), PO Count, PO Value, Win Rate, Change Orders, CO Value
- **Table Columns (7):** QUOTATION, STATUS, MATERIAL, PROJECT, VALUE, **TAX**, CONTACT
- **Charts:** Status Breakdown, Entity Comparison, Top 10 Suppliers, Material Distribution, Employee Performance, Supplier Map (Leaflet), Monthly Trend, Quotation-to-PO Time
- **Filters:** Entity, Project, Supplier, Status, Material, Material Code — all with SearchableSelect
- **Tax Data:** 872 quotations with tax ($1.58M total)

### Tab 2: Global Spend Analysis (GSA) — `#d96f3c`
- **Data Source:** `gsa_data.json` (3,620 POs, $414.3M total spend)
- **KPIs (6):** Total POs, Total Spend (+ Tax subtext), Change Orders, CO Amount, Suppliers (2,189 master), Entities
- **Table Columns (9):** PO No., Type, Order ID, Project, PO Date, Supplier, Material, PO Value (US$), **Tax (US$)**
- **Charts:** Annual Spend Trend, Spend by Entity, Spend by Projects, Top/Bottom 10 Suppliers
- **Filters:** Entity, Supplier, Project, Material, Material Code, PO Type, Year, Date Range, Search
- **Tax Data:** 870 POs with tax ($1.69M total)

### Tab 3: Materials & Disciplines (M&D) — `#0f3d5e`
- **Data Source:** `md_data.json` (3,941 quotations + 3,620 POs)
- **KPIs (5):** Materials, Material Codes, Total Material Spend, Total Material Code Spend, Active Projects
- **Charts:** Total Spend by Material Code, Material Distribution, Supplier Profile Card
- **Filters:** Material Code, Material, Entity, Project, Supplier, Year, Date Range, Search
- **Tax Data:** `taxUSD` and `netTotalUSD` fields present in both PO and quotation records

---

## V9 Data Stats

| Dataset | Records | Key Metric |
|---------|---------|------------|
| SM (RFQs) | 3,941 | 91.7% win rate |
| GSA (POs) | 3,620 | $414.3M total spend |
| Base POs | 3,323 | $373.2M value |
| Change Orders | 297 in 193 groups | $12.0M CO value |
| POs with Tax | 870 | $1.69M total tax |
| Quotations with Tax | 872 | $1.58M total tax |
| Conversions | 183 linked | 29.1 avg days |
| M&D Materials | 33 raw, 12 codes | Combined RFQ+PO |
| Suppliers (master) | 2,189 | From suppliers.json |
| Active Suppliers | 1,104 | In PO data |
| Entities | 18 | Active in data |

---

## V9 Tax Field Reference

### PO Record Fields (gsa_data.json)
```javascript
{
  poNumber, poDate, poName, supplier, originalValue,
  tax,           // Tax in original currency
  netTotal,      // Net Total in original currency
  currency,
  mainOrderId, orderId, entityCode, entity, material, materialCode,
  poVersion, isChangeOrder, year, month, yearMonth,
  valueUSD, poSpendUSD,
  taxUSD,        // NEW: Tax converted to USD
  netTotalUSD,   // NEW: Net Total converted to USD
  poType, changeOrderGroup, changeOrderTotal, project
}
```

### Quotation Record Fields (sm_data.json)
```javascript
{
  QuotationNumber, QuotationType, // always "RFQ"
  Status, ProjectName, Description, Material, materialCode,
  Entity, Client,
  QuotationValue,
  Tax,           // NEW: Tax in original currency (null if no tax)
  NetTotal,      // NEW: Net Total in original currency (null if no tax)
  Currency,
  Contact, Date, mainOrderId, orderId,
  isRevision, revisionLetter, baseNumber
}
```

### M&D Record Fields (md_data.json)
```javascript
// Quotation records
{ material, materialCode, entity, supplier, project, quotedValue, currency,
  taxUSD, netTotalUSD }  // NEW

// PO records
{ material, materialCode, entity, supplier, project, value, currency,
  taxUSD, netTotalUSD }  // NEW
```

### Summary Fields (gsa_data.json → summary)
```javascript
{
  totalSpendUSD, totalPOs, basePOs, changeOrders, changeOrderValue,
  basePOValue, supplierCount, activeSupplierCount, entityCount, changeOrderGroups,
  totalTaxUSD,       // NEW: $1,689,813.50
  totalNetSpendUSD,  // NEW: Total net spend (value + tax)
  posWithTax         // NEW: 870 POs with tax > 0
}
```

### Summary Fields (sm_data.json → summary)
```javascript
{
  totalQuotations, totalPOs, winRate, totalQuotationValueUSD, totalPOSpendUSD,
  revisionCount, revisionLetters,
  totalQuotationTaxUSD,  // NEW: $1,578,990.39
  totalQuotationNetUSD,  // NEW: Total net value
  quotationsWithTax      // NEW: 872 quotations with tax > 0
}
```

---

## V9 Architecture

### Single-File JavaScript (scripts.js ~6,030 lines)

```
scripts.js
├── Global Variables & State (L1-50)
├── FX Rates & Conversion (L50-170)     — convertToUSD(), refreshFxRates()
├── Initialization (L170-200)           — DOMContentLoaded, loadAllData()
├── Data Loading (L200-600)             — loadAllData(), enrichDashboardWithRealData()
├── Navigation & Tab Switching (L600-850)
├── Bottom Tables (L850-1320)           — renderBottomTable() with TAX column header
├── SM Filters (L1320-1550)             — initFilters(), applyFilters() with tax subtexts
├── SM Rendering (L1550-2100)           — updateKPIs() with tax, table rows with tax column
├── SM Top Suppliers & Map (L2100-2900) — renderTopSuppliers(), Leaflet map
├── SM Charts (L2900-3300)              — renderEntityChartCanvas(), renderTrendChartLine()
├── Material Chart (L3290-3400)         — MATERIAL_RAW_COUNTS, renderMaterialChartCanvas() with materialCountLabels plugin
├── Country Normalization (L3400)       — normalizeCountry() (~150 entries)
├── GSA Tab (L3500-4800)                — updateGSAKPIs() with tax subtext, table with tax column
├── GSA/SM Clear Functions (L4800-4860)
├── M&D Tab (L4860-5700)               — M&D with taxUSD/netTotalUSD in records
├── SearchableSelect (L5700-5890)       — Reusable type-ahead dropdown component
└── Exports (L5890-6028)
```

### Key Tax-Related Functions

**GSA Tab:**
- `updateGSAKPIs()` — Both summary and filtered branches update `gsaKpiTaxSubtext` element
- `updateGSATable()` — Renders `taxUSD` column with `formatCurrency(taxUSD)`, shows `-` if zero
- `sortGSATable('tax')` — Sort by `taxUSD` field

**SM Tab:**
- `updateKPIs()` — Sets `kpiQuoteTaxSubtext` from `summary.totalQuotationTaxUSD`
- `applyFilters()` — Both smData and quotationsData paths compute tax subtotals for `kpiQuoteTaxSubtext`
- All 3 table rendering paths — smData rows, quotationsData rows, updateWorkbenchTable — include Tax column

**HTML Elements (index.html):**
- `#kpiQuoteTaxSubtext` — SM Quote Value KPI tax subtext (line 135)
- `#gsaKpiTaxSubtext` — GSA Total Spend KPI tax subtext (line 562)
- SM table TAX header (line 445)
- GSA table Tax (US$) header with sort (line 728)

### Material Chart Features (V9)

**All 12 Material Codes Displayed:**
- SM Material Distribution bar chart: shows all 12 codes (no `.slice()` truncation)
- M&D Discipline Spend doughnut: shows all 12 codes (no `.slice()` truncation)
- 12-color palette: `['#0066CC', '#3399FF', '#339933', '#66CC66', '#FF9900', '#FF6600', '#9966CC', '#CC6699', '#2B4257', '#06B6D4', '#EF4444', '#8B5CF6']`

**Material Count Labels (Custom Chart.js Plugin):**
- Plugin name: `materialCountLabels` (registered via `afterDatasetsDraw` lifecycle hook)
- Displays "N materials" at end of each bar showing raw material count per code
- `MATERIAL_RAW_COUNTS` constant: `{Architectural:8, Chemicals:2, Electrical:1, Fire:7, Logistics:4, Mechanical:2, 'Office Assets':1, Protection:1, Rental:1, Services:5, Tools:1, Various:5}`
- Dynamic canvas height: 32px per bar for consistent spacing
- Right padding: 70px so labels don't get clipped

---

## CSV Exports (52 Files)

- Location: `v9/csv-exports/`
- Script: `export_all_csv.py` — reads all JSON data files and generates 52 CSVs
- README: `csv-exports/README.md` — index of all 52 CSV files with descriptions
- Includes tax fields (taxUSD, netTotalUSD, Tax, NetTotal) in relevant CSVs
- Categories: GSA (12), SM (8), M&D (7), CO (3), Conversion (3), Suppliers (2), Filters (17)

### Regenerating CSVs
```bash
cd v9/csv-exports
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" export_all_csv.py
```

---

## DOCX Documentation

- Generator: `v9/docs/generate_docx.py` (~1,530 lines)
- Output: `v9/docs/MVL_Dashboard_Documentation.docx` (~25+ pages)
- Dependencies: `python-docx`, `matplotlib`
- 12 sections: Executive Summary, Architecture, Pipeline, Currency, Change Orders, **Tax Data Processing (V9 New)**, SM Tab, GSA Tab, M&D Tab, Data File Reference, Material Codes, Country Normalization
- Includes embedded matplotlib chart images, styled tables, formatted KPI references
- Tax content: Section 6 (Tax Data Processing), tax KPI rows in SM/GSA sections, Tax columns in table descriptions

### Technical Documentation (Markdown)
- File: `v9/docs/MVL_Dashboard_Documentation.md` (~1,000 lines, 13 sections)
- Covers all dashboard features, data schemas, filter logic, chart configurations

### Regenerating DOCX
```bash
cd v9/docs
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" generate_docx.py
```

---

## V9 Data Pipeline (build_v8_data.py)

### Source Priority
1. **TAX_DIR** (preferred): `Full data of Quotations and POs with TAX fields/`
   - PO file: 9 columns (No, PO number, Po Date, PO Name, Supplier, Total, **Tax**, **Net Total**, Cur.)
   - Quotation files: 16 columns (includes **Tax**, **Net Total**)
   - Uses `ignore_workbook_corruption=True` for Quotation XLS files
2. **CSV fallback**: `Data-New/` directory
3. **Legacy XLS fallback**: `Re_ Main order XLS.../` directory

### Pipeline Functions (New in V9)
- `load_po_xls_tax(filepath)` — Reads 9-column PO XLS with Tax/Net Total fields
- `load_quotation_xls_tax(directory)` — Reads all Quotation XLS fragments with Tax/Net Total, handles corruption

### Running the Pipeline
```bash
cd v9/data
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" build_v8_data.py
```

### Pipeline Output
```
V9 DATA PIPELINE COMPLETE
SM (Quotations):  3,941 RFQ records
GSA (POs):        3,620 PO records
  Base POs:       3,323
  Change Orders:  297 (193 groups)
  POs with Tax:   870
  Total Tax (USD): $1,689,813.50
M&D Quotations:   3,941
M&D POs:          3,620
Employees:        18
Conversions:      183 linked
Revisions:        219 quotation revisions
Tax data:         YES
```

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

### Change Order Badge Colors
- **CO Type Badge:** Red `#e74c3c`
- **Base Type Badge:** Green `#2ecc71`
- **CO Group Badge:** Gold `#f39c12`

### Typography
- Font: `'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif`
- KPI Values: 26px, bold

### Layout & Appearance Preferences
> **IMPORTANT:** When the user says "width" or "reduce width", they mean **vertical height** — NOT horizontal width.

- SM 3-column grid: `1fr 1fr 1fr` — never change proportions
- Bottom row cards: `flex: 1` + `max-height: 380px`
- Cache-busting: `?v=20260226a`

---

## Common Development Tasks

### 1. Update Data from New Excel Export
1. Place new .xls files in `v9/Full data of Quotations and POs with TAX fields/`
2. Pipeline auto-detects PO file (`PO_List_*.xls`) and quotation fragments
3. Run: `& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" build_v8_data.py`
4. Verify JSON output files — check tax stats in console
5. Start server: `python -m http.server 8090`
6. Test at http://localhost:8090

### 2. Add a New KPI
1. Add HTML card in `index.html` within the appropriate tab's KPI row
2. Add computation in `updateGSAKPIs()` / `applyFilters()` / `updateMdKPIsFiltered()`
3. Use `formatCurrency()` or `formatCurrencyShort()` for display

### 3. Add a Filter
1. Add `<select>` in `index.html`
2. Populate in `initFilters()` / `initGlobalSpendAnalysis()` / `initMdFilters()`
3. Wire `change` event listener
4. Add logic in `applyFilters()` / `applyGSAFilters()` / `applyMdFilters()`
5. Add to clear function: `clearSMFilters()` / `clearGSAFilters()` / `clearMdFilters()`
6. Add to `initSearchableSelects()` if dropdown has 10+ options

### 4. Local Development
```bash
cd v9
python -m http.server 8090
# Open http://localhost:8090
```

---

## Critical Implementation Notes

1. **Single JS File:** V9 uses monolithic `scripts.js` (~6,030 lines), not modular ES6
2. **No Build Tools:** Pure vanilla JS — no webpack, npm, or transpilation
3. **Tax Source:** New XLS files with Tax/Net Total columns in `Full data of Quotations and POs with TAX fields/`
4. **Quotation XLS Corruption:** Files require `ignore_workbook_corruption=True` for `xlrd` to open
5. **RFQ Only:** IQ records (8,256) excluded — only RFQ quotations displayed (3,941)
6. **Change Orders:** 3-tier logic: PO/RFPO prefix + revision 2-6 = CO, >6 = Independent, non-PO/RFPO = Standalone
7. **Tax Display:** Tax shown as subtexts on KPI cards and as table columns — no new KPI cards added
8. **Python:** System Python 3.12 at `C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe`
9. **FX Rates:** Embedded in pipeline; live rates fetched in browser from `open.er-api.com`
10. **Supplier Count:** 2,189 from master `suppliers.json` (not PO-derived count)
11. **Country Normalization:** `normalizeCountry()` (~150 entries) applied across all 3 tabs
12. **SearchableSelect:** Applied to 16 dropdowns across all tabs; keyboard navigable
13. **Cache-busting:** CSS/JS referenced with `?v=20260226a` query string
14. **Backward Compatibility:** Pipeline falls back to non-tax data sources if TAX_DIR not found

---

## Filter Arrays (V9)

```javascript
// gsa_data.json → filters
{ entities: 18, suppliers: 1104, materials: 30, materialCodes: 12,
  poTypes: 2, years: 15, currencies: 12 }

// sm_data.json → filters
{ entities: 19, statuses: 4, contacts: 18, materials: 27,
  materialCodes: 12, currencies: 12 }

// md_data.json → filters
{ entities: 19, materialCodes: 12, materials: 33, projects: ~200,
  suppliers: ~1100 }
```

---

## Review Status

All 47 stakeholder review questions fully resolved ✅  
See `v9/REVIEW_RESPONSE.md` for the complete question-by-question breakdown.

---

*Updated: March 2, 2026*
