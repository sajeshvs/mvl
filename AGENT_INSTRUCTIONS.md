# MVL Supply Chain Intel Hub — Agent Instructions

**Last Updated:** February 16, 2026  
**Current Version:** V6 (Modular Dashboard)  
**Previous Version:** V5 (Unified Dashboard — archived reference)

---

## 📁 Workspace Structure

```
mvl-powerbi-dashboards/
├── v6/                              # 🚀 CURRENT VERSION
│   ├── index.html                   # Single-page app with 3 tabs
│   ├── css/
│   │   └── styles.css               # Complete CSS with design tokens
│   ├── js/
│   │   ├── app.js                   # Entry point, tab switching, global events
│   │   ├── state.js                 # Centralized state + filter logic
│   │   ├── utils.js                 # Formatting, debounce, pagination helpers
│   │   ├── dataLoader.js            # Parallel data fetching, FX rate refresh
│   │   ├── tab-sm.js                # Supplier Marketplace tab controller
│   │   ├── tab-gsa.js               # Global Spend Analysis tab controller
│   │   ├── tab-md.js                # Materials & Disciplines tab controller
│   │   ├── charts-sm.js             # SM charts (entity, material, trend, etc.)
│   │   ├── charts-gsa.js            # GSA charts (spend trend, entity/project)
│   │   ├── charts-md.js             # M&D charts (discipline spend, distribution)
│   │   └── map.js                   # Leaflet supplier location map
│   ├── data/
│   │   ├── build_data.py            # Python data build pipeline
│   │   ├── dashboard.json           # Pre-calculated summary, filters, aggregations
│   │   ├── quotations.json          # 12,072 quotation records
│   │   ├── purchase_orders.json     # 3,522 PO records
│   │   ├── suppliers.json           # 2,189 supplier records
│   │   ├── employees.json           # 54 MVL employee records
│   │   └── client_country_map.json  # Client-to-country mapping
│   ├── assets/
│   │   └── mvl-logo.png             # MVL Group logo
│   └── docs/
│       ├── README.md                # V6 architecture documentation
│       └── DEVELOPMENT_NOTES.md     # Build notes and changelog
│
├── v5/                              # Previous version (reference only)
│   ├── index.html                   # Unified dashboard with 3 tabs
│   ├── shared/
│   │   ├── scripts.js               # Monolithic JavaScript (4,624 lines)
│   │   ├── styles.css               # Global CSS
│   │   └── images/                  # Logo and images
│   ├── data/                        # JSON data files (13 files, ~97MB)
│   └── docs/
│       ├── V5_COMPREHENSIVE_ANALYSIS.md  # V5 code analysis
│       └── V5_DATA_DEEP_ANALYSIS.md      # V5 data issues analysis
│
├── v3/                              # Legacy version (backup reference)
│
├── docs/                            # Documentation
│   ├── reference/                   # Original requirements & narratives
│   ├── AGENT_INSTRUCTIONS_*.md      # Domain-specific instructions
│   └── DATA_MAPPING_RULES.md
│
├── Data/                            # Source CSV files
│
├── .github/
│   └── copilot-instructions.md      # GitHub Copilot workspace instructions
│
├── AGENT_INSTRUCTIONS.md            # THIS FILE
└── README.md                        # Project overview
```

---

## 🌐 Live URLs

| Environment | URL |
|-------------|-----|
| **GitHub Pages (V6)** | https://sajeshvs.github.io/mvl-powerbi-dashboards/v6/ |
| **GitHub Pages (V5)** | https://sajeshvs.github.io/mvl/v5/ |
| **Local Development** | http://localhost:8080 |

### To Deploy V6:
```bash
cd mvl-powerbi-dashboards
git add -A
git commit -m "Update V6 dashboard"
git push origin main
```

---

## 📊 V6 Dashboard Tabs

### Tab 1: Supplier Marketplace (SM)
- **Theme:** Blue `#004578`
- **Tab ID:** `supplier-marketplace`
- **Panel ID:** `tab-supplier-marketplace`
- **Data Sources:** `quotations.json`, `employees.json`, `dashboard.json`
- **Records:** 12,072 quotations, 54 employees
- **KPIs (9):** Total Quotations, Total Orders, Win Rate, Quotation Value, Order Value, Clients, Entities, Employees, Conversion Rate
- **Charts:** Entity Comparison (horizontal bar, toggleable quote/spend), Status Breakdown (HTML bars), Top Suppliers (ranked list), Material Distribution (bar/pie/doughnut/radar toggleable), Employee Performance (ranked list), Conversion Rate by Entity (horizontal bar), Monthly Trend (line), Supplier Map (Leaflet)
- **Tables:** Approved Materials, Marketplace Workbench (quotation detail), Supplier List
- **Filters:** Entity, Project, Status, Material, Discipline, Search
- **Controller:** `tab-sm.js` → `charts-sm.js`, `map.js`

### Tab 2: Global Spend Analysis (GSA)
- **Theme:** Orange `#d96f3c`
- **Tab ID:** `global-spend-analysis`
- **Panel ID:** `tab-global-spend-analysis`
- **Data Sources:** `purchase_orders.json`, `dashboard.json`
- **Records:** 3,522 POs
- **KPIs (6):** Total POs, Total Spend, Change Orders, CO Amount, Active Suppliers, Entities
- **Charts:** Annual Spend Trend (stacked bar + running total line), Entity Spend (horizontal bar), Project Spend (horizontal bar), Top 10 Suppliers (horizontal bar), Bottom 10 Suppliers (horizontal bar)
- **Tables:** PO Details with sorting and pagination
- **Filters:** Entity, Supplier, Project, Material, Discipline, PO Type, Year, Date Range, Search
- **Controller:** `tab-gsa.js` → `charts-gsa.js`

### Tab 3: Materials & Disciplines (M&D)
- **Theme:** Dark Blue `#0f3d5e`
- **Tab ID:** `materials-disciplines`
- **Panel ID:** `tab-materials-disciplines`
- **Data Sources:** `purchase_orders.json`, `quotations.json`, `suppliers.json`, `dashboard.json`
- **Records:** 3,522 POs + 12,072 quotations
- **KPIs (6):** Disciplines, Total Quoted, Total Ordered, Active Suppliers, Projects, Conversion Rate
- **Charts:** Discipline Spend Quoted vs Actual (grouped bar), Material Distribution (doughnut), Supplier Profile Card
- **Tables:** Supplier Overview, Approved Materials, PO Details
- **Filters:** Discipline, Entity, Project, Supplier, Material, Year, Date Range, Search
- **Controller:** `tab-md.js` → `charts-md.js`

---

## 🏗️ V6 Architecture

### Module Dependency Graph
```
index.html
  └── app.js (entry point)
        ├── state.js (shared state, filters, pagination)
        ├── utils.js (formatting, debounce, DOM helpers)
        ├── dataLoader.js (fetch all data, FX rates)
        ├── tab-sm.js → charts-sm.js, map.js
        ├── tab-gsa.js → charts-gsa.js
        └── tab-md.js → charts-md.js
```

### State Management (state.js)
```javascript
state = {
  dashboard: null,          // dashboard.json (summary, filters, aggregations)
  quotations: [],           // quotations.json records
  purchaseOrders: [],       // purchase_orders.json records
  suppliers: [],            // suppliers.json records
  employees: [],            // employees.json records
  clientCountryMap: {},     // client_country_map.json
  fxRates: { USD: 1, AED: 3.6725, ... },
  activeTab: 'supplier-marketplace',
  filters: {
    sm:  { entity, project, supplier, status, material, discipline, search },
    gsa: { entity, supplier, project, material, discipline, poType, year, dateFrom, dateTo, search },
    md:  { entity, supplier, project, material, discipline, year, dateFrom, dateTo, search }
  },
  pagination: {
    sm:  { page, pageSize: 25 },
    gsa: { page, pageSize: 25, sortField: 'poDate', sortDir: 'desc' },
    md:  { page, pageSize: 25 }
  },
  charts: {},               // Chart.js instances by ID
  initialized: { sm: false, gsa: false, md: false },
  selectedSupplier: null
}
```

### Key Exported Functions

**app.js:** Entry point — tab switching, global event delegation, keyboard shortcuts  
**state.js:** `setFilter()`, `clearFilters()`, `getFilteredQuotations()`, `getFilteredPOs()`, `getFilteredMdPOs()`, `getFilteredMdQuotations()`, `destroyChart()`, `setChart()`, `paginate()`  
**utils.js:** `convertToUSD()`, `formatCurrency()`, `formatNumber()`, `formatPercent()`, `formatDate()`, `debounce()`, `getStatusBadge()`, `generatePaginationHTML()`, `truncateText()`  
**dataLoader.js:** `loadAllData()`, `refreshFxRates()`, `getDataStats()`  
**tab-sm.js:** `initSupplierMarketplace()`, `applySMFilters()`, `clearSMFilters()`, `renderSMTab()`  
**tab-gsa.js:** `initGlobalSpendAnalysis()`, `applyGSAFilters()`, `clearGSAFilters()`, `renderGSATab()`  
**tab-md.js:** `initMaterialsDisciplines()`, `applyMdFilters()`, `clearMdFilters()`, `renderMdTab()`

### Custom Events
| Event | Target | Detail | Purpose |
|-------|--------|--------|---------|
| `fxRatesUpdated` | document | — | FX rates refreshed from API |
| `chartTypeChanged` | window | `{ target, type }` | Chart toggle button clicked |
| `chartFilterApplied` | window | `{ type, value }` | GSA chart bar clicked |
| `supplierSelected` | element (bubbles) | `{ name }` | Top Suppliers list item clicked |
| `bottomTabChanged` | window | `{ type }` | SM bottom tab switching |

---

## 📦 V6 Data Files Reference

### Quotation Record Fields
```javascript
{
  quotationNumber, quotationType, status, entity, client, projectName,
  description, materialCode, material, discipline, value, currency, valueUSD,
  contact, date, year, month, yearMonth, statusNormalized, convertedToPO,
  linkedPONumber, daysToResponse, daysToClose, clientType
}
```

### Purchase Order Record Fields
```javascript
{
  poNumber, poDate, poDateOriginal, poName, supplier, value, currency, valueUSD,
  poType, isChangeOrder, entity, entityCode, project, material, discipline,
  year, month, yearMonth, expectedDelivery, actualDelivery, supplierId,
  supplierMatched, dataQualityScore, category
}
```

### Dashboard.json Structure
```javascript
{
  version, buildDate,
  summary: { totalQuotations, totalOrders, winRate, totalQuotationValueUSD, totalOrderValueUSD,
             totalClients, totalEntities, totalEmployees, totalPOs, totalPOSpendUSD,
             basePOCount, basePOValueUSD, changeOrderCount, changeOrderValueUSD,
             changeOrderRatio, avgPOValueUSD, activeSupplierCount, totalSupplierCount, totalProjects },
  filters: { entities, disciplines, materials, statuses, clients, contacts, projects,
             suppliers, poTypes, years, currencies, countries },
  aggregations: { statusSummary, entityBreakdown, disciplineBreakdown, supplierRankings,
                  annualTrend, monthlyTrend, quotationTrend, projectBreakdown, materialBreakdown }
}
```

### Quotation Trend Item (aggregations.quotationTrend)
```javascript
{ yearMonth: '2012-06', quotes: 2, orders: 2, cancelled: 0, quoteValueUSD: 117874.4, orderValueUSD: 117874.4 }
```

---

## 🔄 Data Rebuild

```bash
cd v6/data
python build_data.py
```

The pipeline reads V5 raw data from `../../v5/data/`, deduplicates, normalizes, and outputs clean V6 JSON files.

**What it fixes:**
- Deduplicates records across overlapping V5 data files
- Normalizes "Cancled" → "Cancelled"
- Separates employees from suppliers into `employees.json`
- Consolidates 29+ disciplines to 7 categories
- Removes blank supplier records
- Pre-computes dashboard KPIs, filter options, and aggregations

---

## 🎨 Design Guidelines

### Color Themes
| Tab | Primary | Secondary | CSS Attribute |
|-----|---------|-----------|---------------|
| SM | #004578 | #0064a3 | `data-theme="sm"` |
| GSA | #d96f3c | #e8824a | `data-theme="gsa"` |
| M&D | #0f3d5e | #1a5a8a | `data-theme="md"` |

### Status Colors
- **Order/Completed:** Green `#2ecc71`
- **Quotation/Open:** Blue `#3498db`
- **Waiting/Pending:** Orange `#f39c12`
- **Cancelled:** Red `#e74c3c`
- **Closed/Unknown:** Gray `#95a5a6`

### Typography
- Font Family: `'Segoe UI', system-ui, sans-serif`
- KPI Values: 1.6rem - 2rem, bold
- Table Text: 0.8rem - 0.85rem

### Currency Conversion (Default FX Rates)
AED=3.6725, SAR=3.75, KWD=0.3077, QAR=3.64, NPR=133.5, EUR=0.92, GBP=0.79, INR=83, JPY=149.5, BHD=0.376, OMR=0.385

---

## 📋 Common Development Tasks

### 1. Add a New Chart
1. Add `<canvas id="newChart">` in `v6/index.html`
2. Create render function in appropriate charts module (e.g., `charts-sm.js`)
3. Export the function and import it in the tab controller
4. Call the function from the tab's `render*Tab()` method
5. Use `destroyChart('chartId')` before recreating

### 2. Add a New Filter
1. Add `<select id="filterName">` in `v6/index.html`
2. Add filter field to `state.filters.<tab>` in `state.js`
3. Add filter logic to `getFiltered*()` in `state.js`
4. Populate dropdown in tab controller's `populate*Filters()` function
5. Wire up change event in `attach*FilterHandlers()`

### 3. Add a New KPI Card
1. Add KPI card HTML with `id="tabKpiName"` in `v6/index.html`
2. Compute value in tab controller's `render*Tab()` method
3. Call `setText('tabKpiName', formatCurrency(value))`

### 4. Update Data
1. Place updated source files in `v5/data/`
2. Run `python v6/data/build_data.py` to regenerate V6 data
3. Verify dashboard renders correctly at http://localhost:8080

### 5. Local Development
```bash
cd v6
python -m http.server 8080
# Open http://localhost:8080
```

### Keyboard Shortcuts
- `Ctrl+1` — Supplier Marketplace
- `Ctrl+2` — Global Spend Analysis
- `Ctrl+3` — Materials & Disciplines

---

## ⚠️ Critical Implementation Notes

1. **ES Modules:** All JS files use `import`/`export` — must be served via HTTP server (not `file://` protocol)
2. **Chart Lifecycle:** Always call `destroyChart(id)` before recreating a chart to prevent memory leaks
3. **Filter Events:** Dropdown changes auto-apply filters; search uses 300ms debounce
4. **Apply Buttons:** Use `window.applySMFilters()` etc. because `onclick` handlers need window scope in ES modules
5. **Tab Panel IDs:** HTML panels use `id="tab-<tabId>"` prefix; nav buttons use `data-tab="<tabId>"`
6. **Data Attributes:** Chart toggles use `data-chart-target` and `data-chart-type`; bottom tabs use `data-bottom-tab`
7. **FX Rates:** Fetched from `open.er-api.com`; falls back to hardcoded defaults if API unreachable
8. **Lazy Init:** Tabs only initialize on first visit — `state.initialized.<tab>` prevents duplicate init
9. **No Build Tools:** Pure vanilla JS — no webpack, no npm, no transpilation required
10. **Data JSON Structure:** All data files wrap records in `{ "records": [...] }` except `dashboard.json` and `client_country_map.json`

---

## 🔗 Related Repositories

| Repository | Purpose |
|------------|---------|
| `sajeshvs/mvl-powerbi-dashboards` | Main development workspace |
| `sajeshvs/mvl` | GitHub Pages deployment |

---

## 📞 Contact

**Project Owner:** Sajesh  
**Email:** sajesh.admin@mvlgroupusa.onmicrosoft.com
