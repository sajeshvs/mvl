# V5 Dashboard — Comprehensive Analysis Report

_Generated from full codebase review of all source files, data files, and documentation_

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Data Organization Issues](#2-data-organization-issues)
3. [Filter & Tab Connection Issues](#3-filter--tab-connection-issues)
4. [Code Quality Issues](#4-code-quality-issues)
5. [Design Assessment](#5-design-assessment)
6. [Previous Agent Chat Insights](#6-previous-agent-chat-insights)
7. [Specific Recommendations for V6](#7-specific-recommendations-for-v6)
8. [Data Field Mappings](#8-data-field-mappings)
9. [Architecture Recommendations](#9-architecture-recommendations)

---

## 1. Executive Summary

The V5 dashboard is a **single-page HTML/JS/CSS application** with 3 tabs:

- **Tab 1 — Supplier Marketplace** (SM): Fully functional with real data, filters, and interactive charts
- **Tab 2 — Global Spend Analysis** (GSA): Fully built with working charts, filters, pagination, and PO table
- **Tab 3 — Materials & Disciplines** (M&D): Fully built with discipline charts, supplier profiles, and filtered tables

### Key Stats

| Metric            | Value                                  |
| ----------------- | -------------------------------------- |
| `index.html`      | 1,003 lines                            |
| `scripts.js`      | 4,624 lines (monolithic)               |
| `styles.css`      | 2,359 lines                            |
| Data files loaded | 7+ JSON files (~1.2M+ lines total)     |
| Libraries         | Chart.js (CDN), Leaflet.js 1.9.4 (CDN) |
| Build system      | None (vanilla JS, no bundler)          |
| Module system     | None (all globals)                     |

### Critical Issues Found

1. **Dual data pipeline** — 6 redundant JSON files with overlapping data and complex reconciliation logic
2. **`smData.suppliers` field mislabeled** — Contains MVL employee names, NOT actual supplier companies
3. **CO Count/Value KPIs are wrong** — Mirror PO Count/Value instead of showing actual change orders
4. **28 disciplines not consolidated** — Business requires 10, `md_data.json` still has 28
5. **Quotation-to-PO time uses random data** — `Math.random()` generates fake conversion times
6. **4,624-line monolithic script** — No modules, no separation of concerns, untestable
7. **Filters only affect Tab 1** — Tab 2 and Tab 3 have completely separate filter systems
8. **Approved Materials table uses hardcoded data** — Not sourced from real supplier-material relationships

---

## 2. Data Organization Issues

### 2.1 Dual Data Pipeline (Critical)

V5 loads **two sets of overlapping data** simultaneously:

| Layer               | Files                                                                                              | Origin                    | Purpose                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------- |
| Pre-aggregated (v3) | `sm_data.json` (200K lines), `gsa_data.json` (62K lines), `md_data.json` (226K lines)              | Python scripts from v3/v4 | Pre-calculated KPIs, charts, workbench rows              |
| Raw enriched        | `suppliers.json` (121K lines), `purchase_orders.json` (148K lines), `quotations.json` (822K lines) | Excel → JSON pipeline     | Enriched source records with geocoding, phone validation |

**Impact:** The `enrichDashboardWithRealData()` function (lines 260-760 of scripts.js) has two code paths:

```
if (smData exists) → use pre-aggregated data
else → fall back to raw quotations/POs/suppliers
```

This creates:

- **Data inconsistency** — Pre-aggregated totals don't always match raw record sums
- **Double memory usage** — Browser loads ~1.4M lines of JSON simultaneously
- **Maintenance burden** — Any data change requires updating both pipelines
- **Confusion about source of truth** — Which numbers are "correct"?

### 2.2 smData.suppliers Field Mislabeled (Critical)

In `sm_data.json`, the `suppliers` array contains **MVL employee/contact names** (e.g., "Lince M.", "Marman I.", blank " ") — NOT actual supplier company names. The field name `SupplierName` in the data is misleading.

Evidence from scripts.js lines 1304-1310:

```javascript
// Get actual supplier company names from gsaData (not smData.suppliers which are employees)
let supplierNames = ['All Suppliers'];
if (gsaData?.filters?.suppliers) {
    supplierNames = ['All Suppliers', ...gsaData.filters.suppliers...];
}
```

The code works around this by pulling supplier names from `gsaData.filters.suppliers` instead, but charts like "Top Suppliers" initially render employee names when `smData` is the primary source.

### 2.3 CO Count/Value Shows Same as PO Count/Value (Critical)

In the SM tab's KPI row, CO Count and CO Value display the same values as PO Count and PO Value:

```javascript
// scripts.js line ~1523
document.getElementById("kpiCoCount").textContent = orderCount.toLocaleString();
document.getElementById("kpiCoValue").textContent =
  formatCurrencyShort(totalPOValue);
```

**Root cause:** The code doesn't distinguish between base POs and change orders. The `smData.workbench` records have a `Status` field (Order/Quotation/Waiting/Cancelled) but no `poType` field. Only the GSA tab's `gsaData.workbench` has a `poType` field that separates "Base PO" from "Change Order."

### 2.4 Discipline Count Mismatch

`md_data.json` contains **28 disciplines** (e.g., Valves, Pumps, Motors, Cables, etc.), but the business requirement in `DATA_MAPPING_RULES.md` specifies only **10 consolidated disciplines** per the material code system. The consolidation mapping was never applied.

### 2.5 Quotation-to-PO Time Uses Fake Data

The "Quotation to PO Time" chart generates random conversion times:

```javascript
// scripts.js line ~1860
monthlyData[month].totalDays += Math.floor(Math.random() * 15) + 5;
```

The raw data has quotation dates but not corresponding PO dates linked to the same RFQ number, so actual conversion time cannot be calculated. The initial load also uses hardcoded data (lines 695-710).

### 2.6 Approved Materials Table is Hardcoded

The "Approved Materials" table in the SM tab (lines 712-758 of scripts.js) uses a static array of 5 suppliers with hardcoded materials, specs, and lead times (e.g., "Rastra Bhusan Construction" → "Steel Rebar" / ASTM-A615-GR60 / 14 days). This data is not sourced from any actual supplier-material approval process.

### 2.7 Supplier Locations are Partially Hardcoded

The initial `supplierLocations` array (lines 760-770) uses hardcoded lat/lng coordinates for 9 suppliers. When filters are applied, the code dynamically builds locations from `clientCountryMap.json` and the `countryCoords` lookup (lines 2420-2510), which is a comprehensive 40+ country coordinate mapping. The two approaches produce different map visualizations.

### 2.8 Data File Size Concerns

| File                 | Lines      | Size (est.) | Load Impact  |
| -------------------- | ---------- | ----------- | ------------ |
| quotations.json      | 822,217    | ~50 MB      | Heavy        |
| md_data.json         | 225,812    | ~15 MB      | Heavy        |
| sm_data.json         | 200,955    | ~12 MB      | Heavy        |
| purchase_orders.json | 148,425    | ~9 MB       | Moderate     |
| suppliers.json       | 121,235    | ~7 MB       | Moderate     |
| gsa_data.json        | 62,017     | ~4 MB       | Moderate     |
| **Total**            | **~1.58M** | **~97 MB**  | **Critical** |

All files are loaded in parallel via `fetch()` on page load. On slow connections, this creates significant wait times with no loading indicator.

---

## 3. Filter & Tab Connection Issues

### 3.1 Three Independent Filter Systems

Each tab has its **own completely isolated filter system**:

| Tab         | Filter IDs                                                                                                              | State Variable   | Apply Function      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------- |
| SM (Tab 1)  | `filterEntity`, `filterProject`, `filterSupplier`, `filterStatus`, `filterMaterial`                                     | `currentFilters` | `applyFilters()`    |
| GSA (Tab 2) | `gsaFilterEntity`, `gsaFilterSupplier`, `gsaFilterProject`, `gsaFilterMaterial`, `gsaFilterDiscipline`, `gsaFilterYear` | `gsaState`       | `applyGSAFilters()` |
| M&D (Tab 3) | `filterMdMaterial`, `filterMdDiscipline`, `filterMdEntity`, `filterMdProject`, `filterMdSupplier`, `filterMdYear`       | `mdState`        | `applyMdFilters()`  |

**Impact:** Selecting "MVL Kuwait" in the SM tab does NOT carry over when switching to the GSA tab. Users must re-apply filters on each tab.

### 3.2 SM Tab Filter Affects Multiple Visualizations

When a filter is applied on Tab 1, the `applyFilters()` function (lines 1470-1890) re-renders **10 components**:

1. KPI cards (7 values)
2. Status chart
3. Entity comparison chart
4. Top Suppliers list
5. Material Distribution chart
6. Supplier Location map
7. Supplier profile card
8. Employee list
9. Quotation-to-PO Time chart
10. Bottom workbench table

This is comprehensive but all done in a single ~420-line function with no abstraction.

### 3.3 GSA Tab Has Chart Click Filtering

The GSA tab implements **click-to-filter** on chart bars (Entity, Project, and Supplier charts). Clicking a bar:

1. Filters `gsaState.filteredData` directly
2. Updates KPIs, table, and other charts
3. Syncs the corresponding dropdown

This is a well-implemented pattern but is unique to Tab 2 — Tabs 1 and 3 don't have chart click filtering.

### 3.4 Tab 2 & 3 Initialize on First Switch

Tabs 2 and 3 are initialized lazily — `initGlobalSpendAnalysis()` and `initMaterialsDisciplines()` are called only when the tab is first clicked via `switchTab()`. This means:

- Charts are not pre-rendered (good for performance)
- But navigation feels slower on first click (bad for UX)
- No loading indicator during initialization

### 3.5 Entity Names Inconsistent Across Tabs

The SM tab entities come from `smData.entities[].Entity` (e.g., "MVL Abu Dhabi", "MVL Kuwait")
The GSA tab entities come from `gsaData.filters.entities` or `gsaData.entityBreakdown[].name`
The M&D tab entities come from `mdData.filters.entities`

These may not be identical lists depending on which source records each pre-aggregated file was built from.

---

## 4. Code Quality Issues

### 4.1 Monolithic Script File

`scripts.js` is **4,624 lines** in a single file with no modules, no imports, no separation:

| Section                      | Lines     | Description                                               |
| ---------------------------- | --------- | --------------------------------------------------------- |
| Global variables & FX rates  | 1-125     | 15+ global variables, currency conversion                 |
| Data loading                 | 126-260   | `loadAllData()`, parallel fetches                         |
| Data enrichment              | 260-760   | `enrichDashboardWithRealData()` — 500 lines               |
| Navigation & bottom tabs     | 760-1100  | Tab switching, pagination, table rendering                |
| Filters (SM Tab 1)           | 1100-1990 | `initFilters()`, `applyFilters()` — 890 lines             |
| Render functions (SM)        | 1990-2800 | Status chart, entity chart, top suppliers, map, utilities |
| Chart toggle & Canvas charts | 2800-2900 | Entity/Material Chart.js rendering                        |
| GSA Tab 2                    | 2900-3600 | Complete GSA init, filters, charts, table, pagination     |
| M&D Tab 3                    | 3600-4600 | Complete M&D init, filters, charts, tables, pagination    |
| Debug exports                | 4600-4624 | `window.dashboardData`, `window.selectedSupplier`         |

### 4.2 Excessive Global State

15+ global variables at module scope:

```javascript
let dashboardData = null;
let suppliersData = null;
let purchaseOrdersData = null;
let quotationsData = null;
let gsaData = null;
let smData = null;
let mdData = null;
let clientCountryMap = {};
let trendChartInstance = null;
let quotationTimeChartInstance = null;
let entityChartInstance = null;
let materialChartInstance = null;
let supplierMap = null;
let selectedSupplier = null;
let currentEntityView = "quote";
let currentMaterialChartType = "bar";
// Plus: bottomTableState, currentFilters, gsaState, mdState
```

### 4.3 Duplicate Logic

Several patterns are repeated 2-3 times across tabs:

| Pattern                      | Occurrences | Locations                                                     |
| ---------------------------- | ----------- | ------------------------------------------------------------- |
| Filter application logic     | 3x          | `applyFilters()`, `applyGSAFilters()`, `applyMdFilters()`     |
| Table pagination             | 3x          | Bottom tabs, GSA table, M&D PO table                          |
| Chart destruction/recreation | 8x          | Every Chart.js instance check + destroy + create              |
| FX conversion in loops       | 10+         | Every value aggregation recalculates `convertToUSD()`         |
| Supplier spend aggregation   | 4x          | SM filter, GSA supplier charts, GSA table, M&D supplier table |
| Country name normalization   | 2x          | `normalizeCountry()` function + `countryCoords` duplicates    |

### 4.4 Missing Error Handling

- `fetch()` calls in `loadAllData()` have no error UI — failures are caught but only logged to console
- Chart rendering functions don't validate data shapes before accessing properties
- `selectSupplierByName()` uses `s.name.replace(/'/g, "\\'")` inline which can still break on names with other special characters
- No graceful degradation when JSON files are missing or malformed

### 4.5 Performance Issues

- **No virtualization** — Bottom tables render all rows into DOM then paginate
- **Map recreation** — `supplierMap.remove()` + full re-initialization on every filter change
- **Chart recreation** — All Chart.js instances are destroyed and recreated on filter change (no `.update()`)
- **No debounce on filter dropdowns** — Only the search input has debounce; dropdown changes trigger immediate full re-render
- **Inline onclick handlers** — `onclick="goToBottomPage(${i})"` generates inline handlers for each page number

### 4.6 Code Style Issues

- Mix of `var`, `let`, `const` (mostly `let` and `const`, good)
- Inconsistent string quoting (single/double/template literals)
- Console.log with emoji prefixes throughout (`📋`, `🗺️`, `📊`, `✅`, `⚠️`) — useful for debugging but should be stripped in production
- Several functions are defined twice: `truncateText()` appears at both line 1280 and line 3560
- Legacy redirect functions: `generateSupplierListRows()` and `generateWorkbenchRows()` just call their paginated versions

### 4.7 Inline Styles and HTML Generation

Charts, tables, and UI elements are built via template literal string concatenation:

```javascript
container.innerHTML = data
  .map(
    (item) => `
    <div class="rank-item" onclick="selectSupplier(${item.rank - 1})" style="cursor:pointer">
        <div class="rank-circle ${getRankClass(item.rank)}">${item.rank}</div>
        ...
    </div>
`,
  )
  .join("");
```

This pattern is used extensively (~30 places) and creates:

- XSS vulnerability risk (supplier names injected directly into HTML)
- Difficulty testing individual components
- No event delegation (handlers created per-row)

---

## 5. Design Assessment

### 5.1 Strengths

| Aspect                      | Assessment                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **CSS Variables**           | Excellent — 50+ variables providing consistent theming (`--accent-blue`, `--border-light`, `--font-size-md`, etc.) |
| **Responsive Design**       | Good — 3 breakpoints (1400px, 1200px, 900px for SM; 1200px, 768px for GSA/M&D)                                     |
| **Color System**            | Well-defined status colors (green/blue/yellow/red/gray) and chart palette                                          |
| **Typography**              | Consistent Segoe UI font stack with size scale from 10px to 24px                                                   |
| **Card-Based Layout**       | Professional look with shadow, border-radius, hover effects                                                        |
| **Interactive Elements**    | Hover states on all clickable elements, smooth transitions (0.2-0.3s)                                              |
| **Tab-Specific Styling**    | Each tab has purpose-built CSS classes (`gsa-kpi-card`, `md-chart-card`)                                           |
| **FX Rate Display**         | Inline currency rates in header with live refresh — useful feature                                                 |
| **Scrollbar Customization** | Webkit scrollbar styling for consistent cross-browser look                                                         |
| **Chart Library**           | Chart.js with proper config: tooltips, responsive, currency formatting                                             |

### 5.2 Weaknesses

| Aspect                  | Issue                                                                       |
| ----------------------- | --------------------------------------------------------------------------- |
| **No loading state**    | Page shows nothing until all ~97MB of JSON loads                            |
| **No skeleton screens** | Empty containers until data renders                                         |
| **Tab 2/3 flash**       | Content appears instantly without transition when tab switches              |
| **KPI card overflow**   | Large currency values (e.g., "$3,609.76M") can overflow on narrow viewports |
| **Map height fixed**    | `#supplierMap { height: 280px }` — not adaptive to content                  |
| **Legend readability**  | Material Distribution legend at `font-size: 9px` is difficult to read       |
| **Color accessibility** | Status colors (green/yellow/red) not tested for color-blind users           |
| **Mobile layout gaps**  | Below 900px, 7 KPI cards in 3 columns leaves orphaned cards                 |
| **Print styles**        | No `@media print` rules                                                     |
| **Dark mode**           | Not supported despite CSS variables being setup for it                      |

### 5.3 Layout Comparison with Wireframes

The reference wireframes (in `docs/reference/`) define specific layouts. V5 implementation differs in:

- **SM Tab**: Wireframe shows a Funnel visualization (Quotation → Waiting → Order → Cancelled) — V5 uses horizontal status bars instead
- **GSA Tab**: Wireframe shows Annual Spend Trend with stacked bars + running total line — V5 implements this correctly
- **M&D Tab**: Wireframe shows Discipline Spend with Quoted vs Actual grouped bars — V5 implements this correctly
- **Map**: Wireframe shows country-level heat map circles — V5 implements circle markers with color intensity (close match)

---

## 6. Previous Agent Chat Insights

From `docs/CHATLOG_V5_DASHBOARD_PROGRESS.md` and related documentation, key insights from previous development sessions:

### 6.1 Known Issues Documented by Previous Agents

1. **Win Rate calculation** — Should be: `(Orders / Total Quotations) × 100`. Current data shows 97.7% which seems inflated because "unknown" status (4,439 records) are not counted
2. **Quotation values inflate totals** — The same quotation can have multiple revisions, and all are summed instead of using the latest revision only
3. **Entity names need standardization** — Some entities appear as "MVL USA JV LLC" vs "MVL USA, INC" which may be the same entity
4. **clientCountryMap mapping** — Client abbreviations like "Al F.F." mapping to countries is fragile and may have incorrect mappings
5. **Data freshness** — Last data export was Feb 12, 2026; no automated refresh pipeline exists

### 6.2 Architecture Decisions Made

1. **Single file approach** — Previous agent chose monolithic `scripts.js` for "simplicity" and to avoid build tooling
2. **Pre-aggregated data** — Python scripts were used to pre-calculate aggregations because browser-side processing of raw data was too slow
3. **Lazy tab initialization** — Tabs 2/3 only initialize when clicked, reducing initial load impact
4. **FX rate integration** — External API `open.er-api.com` used for live rates with fallback to hardcoded rates

### 6.3 Abandoned Features

From earlier versions (v2, v3, v4) that were partially carried forward:

- SPFx web part for SharePoint integration (abandoned — in `mvl-supply-intel-hub-spfx/`)
- PHP backend for data processing (abandoned — in `archive/old-php/`)
- Power BI automation (abandoned — see `archive/old-powerbi-files/`)
- Separate HTML pages per dashboard (abandoned in v5 in favor of single-page tabs)

---

## 7. Specific Recommendations for V6

### 7.1 Critical Fixes (Must Have)

#### R1: Eliminate Dual Data Pipeline

**Problem:** 6 JSON files with overlapping data
**Solution:** Create a single `dashboard_data_v6.json` with all pre-aggregated data for all 3 tabs. Remove `suppliers.json`, `purchase_orders.json`, `quotations.json` from browser load — use them only in Python preprocessing.

**Target structure:**

```json
{
  "metadata": { "generated": "ISO date", "version": "6.0" },
  "shared": {
    "entities": [...],
    "suppliers": [...],
    "fxRates": {...}
  },
  "supplierMarketplace": {
    "kpis": {...},
    "statusFunnel": [...],
    "topSuppliers": [...],
    "entityComparison": [...],
    "materialDistribution": [...],
    "employeePerformance": [...],
    "supplierLocations": [...],
    "monthlyTrend": [...],
    "approvedMaterials": [...],
    "workbench": [...]
  },
  "globalSpendAnalysis": {
    "kpis": {...},
    "annualTrend": [...],
    "entityBreakdown": [...],
    "projectBreakdown": [...],
    "supplierRankings": {...},
    "workbench": [...]
  },
  "materialsDisciplines": {
    "kpis": {...},
    "disciplines": [...],
    "supplierOverview": [...],
    "approvedMaterials": [...],
    "poDetails": [...]
  }
}
```

**Estimated data reduction:** From ~97 MB to ~5-10 MB (10-20x reduction)

#### R2: Fix CO Count/Value KPIs

**Solution:** In the preprocessing pipeline, distinguish base POs from change orders using the RFQ/PO numbering system documented in `v5/data/README.md`:

- Order type `1` = Main PO (Base)
- Order type `2+` = Change Order

```
RFPO-7139-V4359-1  →  Base PO
RFPO-7139-V4359-2  →  Change Order
```

#### R3: Consolidate 28 Disciplines to 10

Apply the consolidation mapping from `DATA_MAPPING_RULES.md` in the preprocessing step. Map 28 source disciplines to 10 business categories:

1. Mechanical
2. Electrical
3. Civil/Structural
4. Fire Protection
5. Instrumentation
6. Building Materials
7. HVAC
8. Piping
9. Services
10. Various/General

#### R4: Fix Supplier Name Confusion

Ensure the "suppliers" concept consistently means **supplier companies** (from `suppliers.json`) — never MVL employee/contact names. The `Contact` field in quotation records should be clearly labeled as "MVL Contact" or "Procurement Officer."

#### R5: Calculate Real Quotation-to-PO Time

Link quotations to POs via the RFQ→RFPO numbering system:

```
RFQ-7139-V4359-1  →  RFPO-7139-V4359-1
```

Calculate actual days between quotation date and PO date. Remove `Math.random()` entirely.

### 7.2 Architecture Improvements (Should Have)

#### R6: Modularize JavaScript

Split `scripts.js` into logical modules:

```
v6/shared/js/
├── app.js              # Entry point, initialization
├── data-loader.js      # Data fetching, caching
├── fx-rates.js         # Currency conversion
├── filters.js          # Shared filter system
├── charts/
│   ├── chart-base.js   # Chart.js wrapper with destroy/update
│   ├── status-chart.js
│   ├── entity-chart.js
│   ├── trend-chart.js
│   └── map-chart.js
├── tabs/
│   ├── supplier-marketplace.js
│   ├── global-spend.js
│   └── materials-disciplines.js
└── utils/
    ├── formatters.js   # Currency, number, date formatting
    ├── dom-helpers.js  # Table rendering, pagination
    └── country-data.js # Country coordinates, normalization
```

Use ES modules (`import`/`export`) with `<script type="module">` — no build step required.

#### R7: Unified Filter System

Create a shared filter state that persists across tabs:

```javascript
class FilterState {
  constructor() {
    this.entity = null;
    this.supplier = null;
    this.project = null;
    this.material = null;
    this.year = null;
    this.dateRange = { from: null, to: null };
    this.listeners = [];
  }

  set(key, value) {
    this[key] = value;
    this.notify();
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.getActive()));
  }
}
```

When switching tabs, the active filters are applied to the new tab's data.

#### R8: Use Chart.js `.update()` Instead of Destroy/Recreate

```javascript
// Instead of:
if (chartInstance) {
  chartInstance.destroy();
}
chartInstance = new Chart(ctx, config);

// Use:
if (chartInstance) {
  chartInstance.data = newData;
  chartInstance.update();
} else {
  chartInstance = new Chart(ctx, config);
}
```

This avoids canvas flicker and is significantly faster.

#### R9: Add Loading States

```html
<div class="loading-overlay" id="loadingOverlay">
  <div class="loading-spinner"></div>
  <div class="loading-text">Loading dashboard data...</div>
  <div class="loading-progress" id="loadingProgress">0 / 1 files</div>
</div>
```

Show progress as each data file loads.

### 7.3 Data Quality Improvements (Nice to Have)

#### R10: Implement Data Validation in Preprocessing

Add validation checks in the Python preprocessing pipeline:

- Remove duplicate quotations (same RFQ number, keep latest revision)
- Validate entity names against master list
- Verify supplier names against `suppliers.json` master
- Flag records with missing/invalid currencies
- Check PO amounts against reasonable ranges

#### R11: Add Data Freshness Indicator

Show the data generation timestamp prominently:

```html
<div class="data-freshness">
  Data as of <span id="dataTimestamp">Feb 12, 2026</span>
  <span class="freshness-badge stale">14 days old</span>
</div>
```

#### R12: Implement Client-Side Caching

Use `localStorage` or `IndexedDB` to cache the dashboard JSON:

```javascript
async function loadData() {
  const cached = localStorage.getItem("dashboard_v6");
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return data; // Use cache if < 24 hours old
    }
  }
  const data = await fetch("data/dashboard_data_v6.json").then((r) => r.json());
  localStorage.setItem(
    "dashboard_v6",
    JSON.stringify({ data, timestamp: Date.now() }),
  );
  return data;
}
```

---

## 8. Data Field Mappings

### 8.1 SM Tab Workbench Fields (smData.workbench)

| Field             | Type   | Example                                         | Maps To                         |
| ----------------- | ------ | ----------------------------------------------- | ------------------------------- |
| `QuotationNumber` | string | "RFQ-7139-V4359-1"                              | Quotation ID                    |
| `Entity`          | string | "MVL Abu Dhabi"                                 | Business entity                 |
| `ProjectName`     | string | "WMJ-0123 Camp Upgrade"                         | Project                         |
| `Description`     | string | "Supply of valves"                              | Item description                |
| `Contact`         | string | "Lince M."                                      | **MVL employee** (NOT supplier) |
| `Client`          | string | "Al Futtaim"                                    | **Supplier/Client**             |
| `Status`          | string | "Order" / "Quotation" / "Waiting" / "Cancelled" | Pipeline status                 |
| `Date`            | string | "15 Oct 2024"                                   | Quotation date                  |
| `QuotationValue`  | number | 125000                                          | Value in original currency      |
| `Currency`        | string | "KWD"                                           | Original currency               |
| `MaterialCode`    | string | "V4359"                                         | Material code                   |

### 8.2 GSA Workbench Fields (gsaData.workbench)

| Field       | Type   | Example                      | Maps To                 |
| ----------- | ------ | ---------------------------- | ----------------------- |
| `poNumber`  | string | "RFPO-7139-V4359-1"          | PO Number               |
| `poType`    | string | "Base PO" / "Change Order"   | PO type                 |
| `entity`    | string | "MVL Kuwait"                 | Business entity         |
| `project`   | string | "Camp Arifjan Upgrade"       | Project name            |
| `supplier`  | string | "Rastra Bhusan Construction" | Supplier company        |
| `material`  | string | "Valves"                     | Material category       |
| `poDate`    | string | "2024-10-15"                 | PO date (ISO)           |
| `yearMonth` | string | "2024-10"                    | Year-month key          |
| `year`      | number | 2024                         | Year                    |
| `value`     | number | 125000                       | Original currency value |
| `valueUSD`  | number | 410000                       | Converted USD value     |
| `currency`  | string | "KWD"                        | Original currency       |

### 8.3 M&D Data Fields (mdData)

| Section             | Fields                                                                                              | Notes                     |
| ------------------- | --------------------------------------------------------------------------------------------------- | ------------------------- |
| `summary`           | `disciplineCount`, `totalOrdered`, `totalQuoted`, `conversionRate`, `supplierCount`                 | Pre-calculated KPIs       |
| `disciplines[]`     | `name`, `quotedValue`, `orderedValue`, `quotedCount`, `orderedCount`                                | 28 disciplines            |
| `filters`           | `disciplines[]`, `entities[]`, `projects[]`, `suppliers[]`                                          | Filter dropdown options   |
| `quotations[]`      | `number`, `date`, `entity`, `material`, `discipline`, `supplier`, `quotedValue`, `value`, `amount`  | Quotation records for M&D |
| `pos[]`             | `poDate`, `entity`, `material`, `discipline`, `supplier`, `value`, `amountValue`, `year`, `project` | PO records for M&D        |
| `entityBreakdown[]` | `name`, `poCount`, `valueUSD`                                                                       | Entity-level aggregation  |

### 8.4 Suppliers.json Record Structure

```json
{
  "id": "SUP-001",
  "legacy_no": "12345",
  "name": "Rastra Bhusan Construction",
  "material_category": "Building Materials",
  "contact": {
    "primary_contact": "John Smith",
    "email": "john@rastra.com",
    "phone": "+977-1-4567890",
    "first_name": "John",
    "last_name": "Smith"
  },
  "address": {
    "country_standardized": "Nepal",
    "country_iso3": "NPL"
  },
  "location": {
    "latitude": 27.7172,
    "longitude": 85.324,
    "quality_score": 0.85
  },
  "phone_validation": {
    "phone_country": "Nepal"
  },
  "rating": {
    "score": 4.2
  }
}
```

### 8.5 RFQ/PO Numbering System

```
RFQ-{sequence}-{material_letter}{material_number}-{version}
RFPO-{sequence}-{material_letter}{material_number}-{order_type}

Material Letters:
A = Architectural    C = Chemicals      E = Electrical
F = Fire             L = Logistics      M = Mechanical
O = Office Assets    P = Protection     R = Rental
S = Services         T = Tools          V = Various

Order Type:
1 = Base PO          2+ = Change Order
```

---

## 9. Architecture Recommendations

### 9.1 Proposed V6 Architecture

```
v6/
├── index.html                    # Shell with tab containers
├── data/
│   └── dashboard_data_v6.json    # Single pre-aggregated file (~5-10 MB)
├── preprocessing/
│   ├── build_dashboard_data.py   # Consolidation pipeline
│   ├── validate_data.py          # Data quality checks
│   └── config.yml                # Mapping rules, consolidation tables
├── shared/
│   ├── css/
│   │   ├── variables.css         # CSS custom properties
│   │   ├── layout.css            # Grid, flex layouts
│   │   ├── components.css        # Cards, badges, pagination
│   │   └── tabs/
│   │       ├── sm.css            # SM-specific styles
│   │       ├── gsa.css           # GSA-specific styles
│   │       └── md.css            # M&D-specific styles
│   ├── js/
│   │   ├── app.js                # Module entry point
│   │   ├── state.js              # Centralized state management
│   │   ├── data-loader.js        # Fetch + cache + validation
│   │   ├── filters.js            # Unified cross-tab filter system
│   │   ├── charts.js             # Chart.js abstraction layer
│   │   ├── tables.js             # Table rendering with virtual scroll
│   │   ├── map.js                # Leaflet map management
│   │   ├── fx-rates.js           # Currency conversion
│   │   ├── formatters.js         # Number/currency/date formatting
│   │   └── tabs/
│   │       ├── sm-tab.js         # Supplier Marketplace tab
│   │       ├── gsa-tab.js        # Global Spend Analysis tab
│   │       └── md-tab.js         # Materials & Disciplines tab
│   └── images/
│       └── logo.png
└── docs/
    └── V6_DEVELOPMENT.md
```

### 9.2 State Management Pattern

```javascript
// state.js
export const state = {
  data: null,
  filters: {
    entity: null,
    supplier: null,
    project: null,
    material: null,
    discipline: null,
    year: null,
    dateFrom: null,
    dateTo: null,
    search: "",
  },
  activeTab: "supplier-marketplace",
  fxRates: {
    /* ... */
  },
  _subscribers: new Map(),

  subscribe(key, callback) {
    if (!this._subscribers.has(key)) this._subscribers.set(key, []);
    this._subscribers.get(key).push(callback);
  },

  setFilter(key, value) {
    this.filters[key] = value;
    this._notify("filters");
  },

  _notify(key) {
    (this._subscribers.get(key) || []).forEach((cb) => cb(this));
  },
};
```

### 9.3 Chart Abstraction

```javascript
// charts.js
export class ManagedChart {
  constructor(canvasId, type, options = {}) {
    this.canvasId = canvasId;
    this.instance = null;
    this.type = type;
    this.options = options;
  }

  render(data) {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;

    if (this.instance) {
      this.instance.data = this._buildData(data);
      this.instance.update("active");
    } else {
      this.instance = new Chart(canvas.getContext("2d"), {
        type: this.type,
        data: this._buildData(data),
        options: this._buildOptions(),
      });
    }
  }

  destroy() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }
}
```

### 9.4 Security Improvements

1. **XSS Prevention** — Use `textContent` instead of template literal HTML injection for user data
2. **Sanitize supplier names** — Names currently injected directly into `onclick` handlers
3. **CSP Headers** — Add Content Security Policy if deployed to a server
4. **Remove console.log** — Strip emoji-prefixed debug logging in production

### 9.5 Deployment Recommendations

| Aspect       | Current                           | Recommended                             |
| ------------ | --------------------------------- | --------------------------------------- |
| Hosting      | GitHub Pages / Python http.server | Azure Static Web Apps or SharePoint     |
| Build        | None                              | Optional: simple concat + minify script |
| Data refresh | Manual CSV → JSON                 | Scheduled Python pipeline (weekly)      |
| Monitoring   | Console.log                       | Application Insights or similar         |
| Versioning   | Git commits                       | Semantic versioning (v6.0.0, v6.1.0)    |

---

## Appendix A: File Inventory

| File                              | Lines   | Purpose                    |
| --------------------------------- | ------- | -------------------------- |
| `v5/index.html`                   | 1,003   | Main dashboard HTML        |
| `v5/shared/scripts.js`            | 4,624   | All JavaScript logic       |
| `v5/shared/styles.css`            | 2,359   | All CSS styles             |
| `v5/data/sm_data.json`            | 200,955 | SM pre-aggregated data     |
| `v5/data/gsa_data.json`           | 62,017  | GSA pre-aggregated data    |
| `v5/data/md_data.json`            | 225,812 | M&D pre-aggregated data    |
| `v5/data/suppliers.json`          | 121,235 | Enriched supplier master   |
| `v5/data/purchase_orders.json`    | 148,425 | Enriched PO records        |
| `v5/data/quotations.json`         | 822,217 | Enriched quotation records |
| `v5/data/orders.json`             | 1,683   | Client orders (ORD-XXXX)   |
| `v5/data/client_country_map.json` | 2,529   | Client → country mapping   |
| `v5/data/dashboard_data.json`     | ~5,000  | Base dashboard data        |
| `v5/data/data_metadata.json`      | ~200    | Data quality metadata      |
| `v5/data/material_codes.json`     | ~300    | Material code reference    |

## Appendix B: Function Index (scripts.js)

| Function                              | Line  | Tab    | Purpose                              |
| ------------------------------------- | ----- | ------ | ------------------------------------ |
| `convertToUSD()`                      | ~40   | Shared | Currency conversion using fxRates    |
| `refreshFxRates()`                    | ~60   | Shared | Fetch live FX rates from API         |
| `loadAllData()`                       | ~130  | Shared | Parallel fetch of all JSON files     |
| `enrichDashboardWithRealData()`       | ~260  | SM     | Build dashboardData from sm/gsa data |
| `initNavigationTabs()`                | ~780  | Shared | Tab click handlers                   |
| `switchTab()`                         | ~795  | Shared | Show/hide tab content, lazy init     |
| `initBottomTabs()`                    | ~835  | SM     | Bottom table tab switching           |
| `renderBottomTable()`                 | ~925  | SM     | Workbench/Supplier list table        |
| `generateSupplierListRowsPaginated()` | ~1010 | SM     | Paginated supplier table rows        |
| `generateWorkbenchRowsPaginated()`    | ~1150 | SM     | Paginated workbench rows             |
| `initFilters()`                       | ~1290 | SM     | Populate SM filter dropdowns         |
| `applyFilters()`                      | ~1470 | SM     | Apply all SM filters (420 lines)     |
| `renderSupplierMarketplace()`         | ~1990 | SM     | Initial SM tab render                |
| `renderStatusChart()`                 | ~2000 | SM     | Status bar chart                     |
| `renderTopSuppliers()`                | ~2050 | SM     | Ranked supplier list                 |
| `selectSupplier()`                    | ~2100 | SM     | Supplier profile display             |
| `renderApprovedMaterials()`           | ~2150 | SM     | Approved materials table             |
| `renderEmployeeList()`                | ~2230 | SM     | Employee ranking list                |
| `renderTrendChartLine()`              | ~2260 | SM     | Monthly trend Chart.js line          |
| `renderQuotationTimeChart()`          | ~2380 | SM     | RFQ-to-PO time bar chart             |
| `renderSupplierMapFromLocations()`    | ~2530 | SM     | Leaflet map from locations           |
| `renderSupplierMapFiltered()`         | ~2620 | SM     | Leaflet map from supplier/PO data    |
| `renderEntityChartCanvas()`           | ~2750 | SM     | Entity comparison Chart.js bar       |
| `renderMaterialChartCanvas()`         | ~2800 | SM     | Material distribution multi-type     |
| `initGlobalSpendAnalysis()`           | ~2920 | GSA    | GSA tab initialization               |
| `populateGSAFilters()`                | ~2950 | GSA    | GSA filter dropdowns                 |
| `updateGSAKPIs()`                     | ~3020 | GSA    | GSA KPI card values                  |
| `createGSASpendTrendChart()`          | ~3070 | GSA    | Annual spend trend stacked bar       |
| `createGSAEntityChart()`              | ~3160 | GSA    | Entity breakdown bar chart           |
| `createGSAProjectChart()`             | ~3240 | GSA    | Project breakdown bar chart          |
| `createGSASupplierCharts()`           | ~3330 | GSA    | Top/bottom supplier charts           |
| `updateGSATable()`                    | ~3530 | GSA    | PO details table with sorting        |
| `applyGSAFilters()`                   | ~3750 | GSA    | GSA filter application               |
| `clearGSAFilters()`                   | ~3810 | GSA    | GSA filter reset                     |
| `initMaterialsDisciplines()`          | ~3850 | M&D    | M&D tab initialization               |
| `initMdFilters()`                     | ~3900 | M&D    | M&D filter dropdowns                 |
| `applyMdFilters()`                    | ~3990 | M&D    | M&D filter application               |
| `updateMdKPIs()`                      | ~4210 | M&D    | M&D KPI card values                  |
| `createDisciplineSpendChart()`        | ~4350 | M&D    | Discipline quoted vs actual          |
| `createMaterialDistributionChart()`   | ~4430 | M&D    | Doughnut chart                       |
| `updateMdPoTable()`                   | ~4530 | M&D    | M&D PO details table                 |

---

_Report generated from complete analysis of v5/ directory, all documentation in docs/, and reference materials._
_Total files analyzed: 30+_
_Total lines of code reviewed: ~8,000 (HTML + JS + CSS)_
_Total data files examined: 10 JSON files + 1 CSV_
