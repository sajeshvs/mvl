# MVL Supply Chain Intel Hub — V6

## Overview

V6 is a complete rebuild of the MVL Supply Chain Intelligence Dashboard, replacing the monolithic V5 codebase with a modular, maintainable, and data-accurate architecture.

### Key Improvements over V5

| Area | V5 | V6 |
|------|----|----|
| **Architecture** | Single 4,624-line `scripts.js` | 11 modular ES6 files (~2,800 lines total) |
| **Data Pipeline** | 13 JSON files, 97MB, 3-4x duplication | Python build pipeline, 6 clean JSON files, ~15MB |
| **Data Accuracy** | Fabricated metrics, mislabeled fields, "Cancled" typo | Cleaned, normalized, deduplicated data |
| **Employees vs Suppliers** | Employees listed as "suppliers" | Properly separated into distinct datasets |
| **State Management** | 15+ global variables | Centralized `state.js` module |
| **Filtering** | Inconsistent, some filters broken | Unified filter system per tab with search |
| **Charts** | Mixed Chart.js v3/v4 patterns | Consistent Chart.js 4.4.1 with proper lifecycle |

---

## Architecture

```
v6/
├── index.html              # Single-page app (3 tabs)
├── css/
│   └── styles.css          # Complete CSS with design tokens
├── js/
│   ├── app.js              # Entry point, tab switching, global events
│   ├── state.js            # Centralized state + filter logic
│   ├── utils.js            # Formatting, debounce, pagination helpers
│   ├── dataLoader.js       # Parallel data fetching, FX rate refresh
│   ├── tab-sm.js           # Supplier Marketplace tab controller
│   ├── tab-gsa.js          # Global Spend Analysis tab controller
│   ├── tab-md.js           # Materials & Disciplines tab controller
│   ├── charts-sm.js        # SM charts (entity, material, trend, status, etc.)
│   ├── charts-gsa.js       # GSA charts (spend trend, entity/project/supplier)
│   ├── charts-md.js        # M&D charts (discipline spend, distribution, tables)
│   └── map.js              # Leaflet supplier location map
├── data/
│   ├── build_data.py       # Python data build pipeline
│   ├── dashboard.json      # Pre-calculated summary, filters, aggregations
│   ├── quotations.json     # 12,072 quotation records
│   ├── purchase_orders.json # 3,522 PO records
│   ├── suppliers.json      # 2,189 supplier records
│   ├── employees.json      # 54 MVL employee records
│   └── client_country_map.json # Client-to-country mapping
├── assets/
│   └── mvl-logo.png        # MVL Group logo
└── docs/
    └── README.md           # This file
```

---

## Tabs

### 1. Supplier Marketplace (SM) — Theme: Blue `#004578`
- **KPIs**: Total Quotations, Orders, Win Rate, Values, Clients, Entities, Employees, Conversion Rate
- **Charts**: Entity Comparison (bar), Status Breakdown (HTML bars), Top Suppliers (ranked list), Material Distribution (bar/pie/doughnut/radar), Employee Performance (ranked list), Conversion Rate by Entity (horizontal bar), Supplier Map (Leaflet), Monthly Trend (line)
- **Tables**: Approved Materials, Workbench (quotation detail), Supplier List
- **Filters**: Entity, Project, Status, Material, Discipline, Search

### 2. Global Spend Analysis (GSA) — Theme: Orange `#d96f3c`
- **KPIs**: Total POs, Total Spend, Change Orders, CO Amount, Active Suppliers, Entities
- **Charts**: Annual Spend Trend (stacked bar + running total line), Entity Spend, Project Spend, Top 10 Suppliers, Bottom 10 Suppliers
- **Tables**: PO Details with sorting and pagination
- **Filters**: Entity, Supplier, Project, Material, Discipline, PO Type, Year, Date Range, Search

### 3. Materials & Disciplines (M&D) — Theme: Dark Blue `#0f3d5e`
- **KPIs**: Disciplines, Total Quoted, Total Ordered, Active Suppliers, Projects, Conversion Rate
- **Charts**: Discipline Spend Quoted vs Actual (grouped bar), Material Distribution (doughnut), Supplier Profile Card
- **Tables**: Supplier Overview, Approved Materials, PO Details
- **Filters**: Discipline, Entity, Project, Supplier, Material, Year, Date Range, Search

---

## Data Build Pipeline

The `data/build_data.py` script reads raw V5 data files and produces clean V6 data:

```bash
cd v6/data
python build_data.py
```

### What it does:
1. **Reads**: V5 JSON files (`sm_data.json`, `gsa_data.json`, `md_data.json`, `purchase_orders.json`, `quotations.json`, `suppliers.json`)
2. **Deduplicates**: Removes duplicate records across overlapping datasets
3. **Normalizes**: Consistent field names (camelCase), status normalization ("Cancled" → "Cancelled")
4. **Separates**: Employees extracted from supplier data into their own dataset
5. **Consolidates**: Disciplines reduced from 29+ to 7 clean categories
6. **Pre-computes**: Dashboard summary KPIs, filter options, trend data, supplier rankings
7. **Outputs**: 6 clean JSON files ready for the dashboard

### Output Statistics:
- 12,072 quotations (deduplicated)
- 3,522 purchase orders
- 2,189 suppliers
- 54 employees
- 28 entities
- 7 consolidated disciplines

---

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| HTML5 | — | Structure |
| CSS3 | — | Styling with custom properties |
| ES6 Modules | — | JavaScript architecture |
| Chart.js | 4.4.1 | Charts (CDN) |
| Leaflet.js | 1.9.4 | Interactive map (CDN) |
| Python | 3.x | Data build pipeline |

**No build tools required.** The dashboard runs as static files served by any web server.

---

## Development

### Local Development
```bash
cd v6
python -m http.server 8080
# Open http://localhost:8080
```

### Keyboard Shortcuts
- `Ctrl+1` — Switch to Supplier Marketplace
- `Ctrl+2` — Switch to Global Spend Analysis
- `Ctrl+3` — Switch to Materials & Disciplines

---

## Deployment

Push to GitHub and enable GitHub Pages:
- **Repository**: `sajeshvs/mvl-powerbi-dashboards`
- **URL**: `https://sajeshvs.github.io/mvl-powerbi-dashboards/v6/`

---

## Data Quality Fixes (V5 → V6)

| Issue | V5 Problem | V6 Fix |
|-------|-----------|--------|
| Blank supplier | $503.8M (70% of spend) attributed to blank name | Filtered out or assigned "Unknown" |
| "Cancled" typo | 185 records with misspelled status | Normalized to "Cancelled" |
| Mislabeled employees | MVL staff shown as "suppliers" | Separated into `employees.json` |
| Fabricated metrics | `dashboard_data.json` with fake numbers | All metrics computed from real data |
| Duplicate records | Same data stored 3-4x across files | Deduplicated by quotation/PO number |
| Random conversion times | `Math.random()` used for Q→PO time | Computed from actual date differences |
| CO = PO values | Change order values mirrored PO values | Properly tracked with `isChangeOrder` flag |

---

## Module Reference

### state.js
- `state` — Central application state object
- `setFilter(tab, field, value)` — Set a filter value
- `clearFilters(tab)` — Clear all filters for a tab
- `getFilteredQuotations()` — Get SM-filtered quotations
- `getFilteredPOs()` — Get GSA-filtered purchase orders
- `getFilteredMdPOs()` — Get M&D-filtered purchase orders
- `getFilteredMdQuotations()` — Get M&D-filtered quotations
- `destroyChart(chartId)` / `setChart(chartId, instance)` — Chart lifecycle
- `paginate(items, tab)` — Pagination helper

### utils.js
- `convertToUSD(amount, currency)` — Currency conversion
- `formatCurrency(value)` — Smart currency formatting ($1.2M, $503K, etc.)
- `formatNumber(num)` — Number with commas
- `formatPercent(num)` — Percentage with 1 decimal
- `formatDate(isoStr)` — Human-readable date
- `debounce(func, wait)` — Debounce function
- `getStatusBadge(status)` — Colored status badge HTML
- `generatePaginationHTML(pagination)` — Pagination controls HTML
- `truncateText(text, maxLen)` — Text truncation with ellipsis

### dataLoader.js
- `loadAllData()` — Parallel fetch of all 6 data files
- `refreshFxRates()` — Live FX rate update from API
- `getDataStats()` — Current data statistics
