# MVL Supply Chain Intel Hub — Agent Instructions

**Last Updated:** February 21, 2026  
**Current Version:** V8 (Dynamic Excel Pipeline with Change Orders)  
**Previous Versions:** V7 (CSV Pipeline), V6 (Modular JS), V5 (Unified Dashboard)

---

## Workspace Structure

```
mvl-powerbi-dashboards/
├── v8/                              # CURRENT VERSION
│   ├── index.html                   # Single-page app with 3 tabs (1,047 lines)
│   ├── shared/
│   │   ├── scripts.js               # All dashboard logic (~5,470 lines)
│   │   ├── styles.css               # Complete CSS with design tokens
│   │   ├── images/                  # Logo and image assets
│   │   └── components/              # Component docs
│   ├── data/
│   │   ├── build_v8_data.py         # Dynamic Python pipeline — auto-detects Excel files, header-based column lookup
│   │   ├── gsa_data.json            # GSA tab: POs with change orders
│   │   ├── sm_data.json             # SM tab: RFQ quotations
│   │   ├── md_data.json             # M&D tab: combined RFQs + POs
│   │   ├── change_orders.json       # CO groups with CO PO lines
│   │   ├── conversion_times.json    # RFQ→PO links, monthly averages
│   │   ├── employees.json           # MVL employee performance records
│   │   ├── data_metadata.json       # Build metadata, source files, dates
│   │   ├── entity_code_map.json     # Entity code to name mapping
│   │   ├── build_v8_data_old.py     # Old pipeline (preserved)
│   │   └── backup_old_Feb12/        # Pre-change data backup
│   ├── Re_ Main order XLS and.../   # Source Excel files (auto-detected by pipeline)
│   │   ├── PO_List_*.xls                    # PO records (auto-detected via glob)
│   │   ├── Quotation_Report_Feb-20-2026.xls # Fragment 1 (Q1-3000)
│   │   ├── Quotation_Report_...(1).xls      # Fragment 2 (Q3001-6000)
│   │   ├── Quotation_Report_...(2).xls      # Fragment 3 (Q6001-9000)
│   │   ├── Quotation_Report_...(3).xls      # Fragment 4 (Q9001-12000)
│   │   └── Quotation_Report_...(4).xls      # Fragment 5 (Q12001-12215)
│   ├── Material and Material Codes.csv       # Official material reference (30 → 12)
│   ├── REVIEW_RESPONSE.md           # 47 review questions — all resolved ✅
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
- **Records:** RFQ-only quotations (IQ records auto-filtered by pipeline)
- **Key Fields:** QuotationNumber, orderId, mainOrderId, isRevision, revisionLetter, Material, materialCode, Entity, Status, Client
- **KPIs (7):** RFQ Count, Quote Value, PO Count, PO Value, Win Rate, Change Orders, CO Value
- **Charts:** Status Breakdown (clickable bars), Entity Comparison (Canvas chart, clickable), Top 10 Suppliers (ranked list), Material Distribution (bar/pie/line/radar toggle), Employee Performance (sort toggle), Supplier Map (Leaflet), Monthly Trend (line with year labels), Quotation-to-PO Time
- **Tables:** Supplier List (paginated), Quotation Details (paginated, sortable)
- **Filters:** Entity, Project, Supplier, Status, Material, Material Code — all with SearchableSelect + instant filtering
- **Special:** Clear button, search with feedback indicator, `normalizeCountry()` for map

### Tab 2: Global Spend Analysis (GSA)
- **Theme:** Orange `#d96f3c`  
- **Tab ID:** `global-spend`
- **Panel ID:** `tab-global-spend`
- **Data Source:** `gsa_data.json`, `change_orders.json`
- **Records:** POs (Base + Change Orders, computed dynamically)
- **Key Fields:** poNumber, orderId, mainOrderId, isChangeOrder, poType ("Base PO"/"Change Order"), changeOrderGroup, material, materialCode, entity, supplier, valueUSD
- **KPIs (6):** Total POs, Total Spend, Change Orders, CO Amount, Suppliers, Entities
- **KPI Subtexts:** CO groups count, CO % of total spend
- **Charts:** Annual Spend Trend (stacked bar), Spend by Entity (top 8, clickable), Spend by Projects (top 8, clickable), Top 10 Suppliers (unique HSL colors, clickable → supplier card), Bottom 10 Suppliers (unique HSL colors, clickable → supplier card)
- **Tables:** PO Details with Order ID column, CO type badges (Base/CO), group indicators ("2 of 3"), sorting, pagination
- **Filters:** Entity, Supplier, Project, Material, Material Code, PO Type (Base/CO), Year, Date Range, Search — all instant + SearchableSelect
- **Special:** Search feedback indicator, `generateUniqueColors()` for dynamic chart colors

### Tab 3: Materials & Disciplines (M&D)
- **Theme:** Dark Blue `#0f3d5e`
- **Tab ID:** `materials-disciplines`
- **Panel ID:** `tab-materials-disciplines`
- **Data Source:** `md_data.json`
- **Records:** RFQs + POs (combined, computed dynamically)
- **Key Fields:** material, materialCode (12 codes), entity, supplier, project
- **KPIs (5):** Materials, Material Codes, Total Material Spend, Total Material Code Spend, Active Projects + supplier count
- **Charts:** Total Spend by Material Code (grouped bar: Quoted vs Ordered), Material Distribution (doughnut, clickable), Supplier Profile Card
- **Tables:** Supplier Overview (paginated, sortable, filtered), Approved Materials (Coming Soon), PO/Material Details (paginated)
- **Filters:** Material Code, Material, Entity, Project, Supplier, Year, Date Range, Search — all with Clear button

---

## V8 Architecture

### Single-File JavaScript (scripts.js ~5,470 lines)

Unlike V6's modular ES6 architecture, V8 uses a single `scripts.js` file with all logic:

```
scripts.js
├── Global Variables & State (L1-50)
├── FX Rates & Conversion (L50-170)     — convertToUSD(), refreshFxRates(), refreshAllTabsWithNewRates()
├── Initialization (L170-200)           — DOMContentLoaded, loadAllData()
├── Data Loading (L200-600)             — loadAllData(), enrichDashboardWithRealData(), getFallbackData() (zero-based fallback)
├── Navigation & Tab Switching (L600-850) — initNavigationTabs(), switchTab(), initBottomTabs()
├── Bottom Tables (L850-1320)           — renderBottomTable(), pagination, supplier list, workbench
├── SM Filters (L1320-1550)             — initFilters(), currentFilters, applyFilters()
├── SM Rendering (L1550-2100)           — renderSupplierMarketplace(), KPIs, status, material distribution
├── SM Top Suppliers & Map (L2100-2900) — renderTopSuppliers(), Leaflet map, supplier profile, employee list
├── SM Charts (L2900-3100)              — renderEntityChartCanvas(), renderTrendChartLine(), quotation-to-PO time
├── GSA Tab (L3100-4200)                — initGlobalSpendAnalysis(), filters, KPIs, charts, PO table, CO badges
├── GSA/SM Clear Functions (L4200-4260) — clearGSAFilters(), clearSMFilters(), clearMdFilters()
├── M&D Tab (L4260-5400)               — initMaterialsDisciplines(), filters, KPIs, charts, supplier overview
├── SearchableSelect (L5400-5555)       — Reusable type-ahead dropdown component
└── Exports (L5555)                     — window.dashboardData, window.selectedSupplier
```

### Key Functions by Tab

**SM Tab:**
- `initFilters()` — Populate all SM dropdowns (sorted, from sm_data.json); includes Material + Material Code
- `applyFilters()` → `updateAll()` — Filter + render entire SM tab
- `clearSMFilters()` — Reset all SM filters including materialCode
- `filterByStatus(status)` — Click status bar → cross-filter
- `updateSupplierProfile(name)` — Populate supplier profile card
- `renderEntityChartCanvas()` — Entity chart with onClick cross-filter
- `renderTrendChartLine()` — Monthly trend chart with year labels
- `normalizeCountry()` — Global country name normalization

**GSA Tab:**
- `initGlobalSpendAnalysis()` — Main GSA init function (populates filters, renders all charts)
- `applyGSAFilters()` — Filter POs + rebuild all GSA components + search feedback
- `clearGSAFilters()` — Reset all GSA filters including materialCode
- `updateGSAKPIs(data)` — Compute & display 6 KPIs + CO subtexts
- `updateGSATable(data)` — Render PO table with Order ID, CO badges, sorting
- `createGSASpendTrendChart()` — Annual spend trend
- `createGSASupplierCharts()` — Top 10 + Bottom 10 with `generateUniqueColors()`
- `updateGSASupplierCard(name)` — Supplier details card
- `sortGSATable(field)` — Multi-field sorting including order_id

**M&D Tab:**
- `initMaterialsDisciplines()` — Main M&D init
- `initMdFilters()` — Populate M&D dropdowns (materialCodes + materials separate)
- `applyMdFilters()` — Filter + render M&D tab
- `clearMdFilters()` — Reset all M&D filters
- `updateMdKPIs()` — Materials (33), Material Codes (12), spend, projects
- `updateMdSupplierProfile(supplier)` — With typeof object property guards for rating
- `createDisciplineSpendChartFiltered()` — Material Code spend chart ("Ordered" label)
- `createMaterialDistributionChart()` — Doughnut chart using material names

**Shared:**
- `SearchableSelect` class — Type-ahead wrapper for `<select>` elements
- `initSearchableSelects()` — Applies to 16 dropdowns across all tabs (including filterMdProject, gsaFilterDiscipline)
- `formatCurrency()`, `formatCurrencyShort()` — Currency formatting
- `convertToUSD(amount, currency)` — FX conversion using live or hardcoded rates
- `debounce()` — Input debouncing (300ms)
- `generateUniqueColors(count, sat, light)` — Dynamic HSL color generation for charts

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
// All values computed dynamically from data—never hardcoded
{
  totalSpendUSD,
  totalPOs,
  basePOs,
  changeOrders,
  changeOrderValue,
  basePOValue,
  supplierCount,
  entityCount,
  changeOrderGroups
}
```

### Filter Arrays
```javascript
// gsa_data.json → filters
{
  entities: 19,        // including (Blank)
  suppliers: 1104,
  materials: 30,       // raw material names from Excel
  materialCodes: 12,   // Architectural, Chemicals, Electrical, Fire, Logistics, Mechanical,
                       // Office Assets, Protection, Rental, Services, Tools, Various
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

**Dynamic Architecture (V8.1):**
- **PO file auto-detection:** Uses `glob.glob('PO_List_*.xls')` to find the PO file — no hardcoded filename
- **Export date extraction:** Parses date from PO filename via regex (e.g., `PO_List_Feb-20-2026.xls` → `2026-02-20`)
- **Header-based column lookup:** `find_column()` searches headers case-insensitively with exact-then-partial matching; `build_column_map()` maps field names to column indices with positional fallback
- **Unmapped data logging:** Tracks `_unmapped_materials` and `_unknown_currencies` sets, warns at pipeline end
- **No count truncation:** Change order details saved in full (no `[:50]` limit)
- **Dynamic metadata:** `exportDate` and `sourceFiles.po` populated from detected filename

**What it does:**
- Reads PO data and quotation fragments (auto-detected, any count)
- Auto-detects and skips title rows in quotation fragments
- Filters to RFQ-only quotations (removes IQ records)
- Extracts Main Order ID and Order ID from explicit Excel columns
- Detects change orders via PO suffix analysis (-1 = Base, -2+ = CO)
- Detects quotation revisions via letter suffixes (A-P)
- Links RFQ→PO via shared Order ID (441 links found)
- Converts currencies to USD using embedded FX rates (logs unknown currencies)
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
- **Waiting:** Yellow `#FFC107` / `#f39c12` — text: `#332200` (>7:1 WCAG contrast)
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
2. **No filename changes needed** — pipeline auto-detects `PO_List_*.xls`
3. Run: `python build_v8_data.py`
4. Verify JSON output files generated
5. Check console for unmapped materials or unknown currency warnings
6. Start HTTP server: `python -m http.server 8080`
7. Test dashboard at http://localhost:8080

### 2. Add a New KPI
1. Add HTML card in `index.html` within the appropriate tab
2. Add computation in `updateXXKPIs()` function in `scripts.js`
3. Use `formatCurrency()` or `formatNumber()` for display

### 3. Add a Filter
1. Add `<select>` in `index.html`
2. Populate in `initFilters()` / `initGlobalSpendAnalysis()` / `initMdFilters()`
3. Wire `change` event listener
4. Add filter logic in `applyFilters()` / `applyGSAFilters()` / `applyMdFilters()`
5. Add to `clearSMFilters()` / `clearGSAFilters()` / `clearMdFilters()`
6. Add to `initSearchableSelects()` if dropdown has 10+ options

### 4. Local Development
```bash
cd v8
python -m http.server 8080
# Open http://localhost:8080
```

---

## Critical Implementation Notes

1. **Single JS File:** V8 uses monolithic `scripts.js` (~5,470 lines), not modular ES6
2. **No Build Tools:** Pure vanilla JS — no webpack, npm, or transpilation
3. **Excel Source:** Data from .xls files (not .xlsx), requires `xlrd` Python package
4. **RFQ Only:** V8 filters out IQ records — only RFQ quotations displayed
5. **Change Orders:** Tracked via PO suffix (-1=Base, -2+=CO) and Order ID grouping
6. **Quotation Revisions:** Letter suffixes (A-P) track re-quotes — different Order IDs per revision
7. **Blank Handling:** Empty values displayed as `(Blank)` in filters for visibility
8. **Python:** System Python 3.12 at `C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe` (venv broken — use full path)
9. **FX Rates:** Embedded in pipeline (logs unknown currencies); live rates fetched in browser from `open.er-api.com`
10. **SearchableSelect:** Applied to 16 dropdowns across all tabs; keyboard navigable
11. **Dead Code Cleaned:** Legacy HTML-based entity chart and wrapper functions removed
12. **Rating Guard:** `updateMdSupplierProfile()` handles rating as object (`{score: 4.5}`) or number
13. **Dynamic Pipeline:** PO file auto-detected via `glob.glob('PO_List_*.xls')` — no hardcoded filenames
14. **Header-Based Columns:** Pipeline uses `find_column()` + `build_column_map()` for column lookup with positional fallback
15. **Zero Fallbacks:** `getFallbackData()` returns zeros/empty arrays — never shows stale snapshot data
16. **No Hardcoded Counts:** All KPI examples in code use generic phrasing, not snapshot numbers

---

## Review Status

All 47 stakeholder review questions fully resolved ✅  
See `v8/REVIEW_RESPONSE.md` for the complete question-by-question breakdown with implementation details.

---

*Updated: February 21, 2026*
