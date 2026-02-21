# V8 — MVL Supply Chain Intel Hub

> **Live:** [https://sajeshvs.github.io/mvl/v8](https://sajeshvs.github.io/mvl/v8)  
> **Data Source:** Feb 20, 2026 Excel export (PO List + Quotation Reports)  
> **Stack:** HTML + CSS + Vanilla JS + Chart.js + Leaflet.js 1.9.4  
> **Architecture:** Single-page app, monolithic `scripts.js` (~5,545 lines)

---

## What's New in V8

- **Excel-based data pipeline** — `build_v8_data.py` reads `.xls` files via `xlrd`, replaces API-based approach
- **Change Order tracking** — 309 COs in 191 groups with CO/Base badges in GSA tab
- **Order ID linkage** — RFQ→PO traceability via shared Order ID (441 linked records)
- **Conversion time analytics** — Monthly average RFQ→PO conversion days
- **Quotation revisions** — 219 letter-suffix revisions tracked in SM tab
- **Unified data model** — `mainOrderId`, `orderId`, `isChangeOrder`, `changeOrderNumber` fields across all tabs

---

## Folder Structure

```
v8/
├── index.html                  # Single-page app (3 tabs)
├── README.md                   # This file
├── NEW_DATA_ANALYSIS.md        # Feb 20 data analysis report
├── REVIEW_RESPONSE.md          # Stakeholder review (47 questions)
│
├── shared/
│   ├── scripts.js              # All dashboard logic (~5,545 lines)
│   └── styles.css              # Complete CSS with design tokens
│
├── data/
│   ├── build_v8_data.py        # Python pipeline (1,118 lines)
│   ├── sm_data.json            # 3,946 RFQ quotations
│   ├── gsa_data.json           # 3,596 POs with change order data
│   ├── md_data.json            # Combined RFQs + POs for M&D
│   ├── change_orders.json      # 191 CO groups with details
│   ├── conversion_times.json   # 441 RFQ→PO links, monthly averages
│   └── data_metadata.json      # Build timestamp and source info
│
├── Re_ Main order XLS and Export feature ready for use/
│   ├── PO_List_Feb-20-2026.xls           # 3,613 POs
│   ├── Quotation_Report_Feb-20-2026.xls  # Quotations batch 1
│   ├── Quotation_Report_Feb-20-2026 (1).xls
│   ├── Quotation_Report_Feb-20-2026 (2).xls
│   ├── Quotation_Report_Feb-20-2026 (3).xls
│   └── Quotation_Report_Feb-20-2026 (4).xls
│
└── libs/                       # Chart.js, Leaflet.js (vendored)
```

---

## Dashboard Tabs

### 1. Supplier Marketplace (SM) — `#004578`
- **Data:** 3,946 RFQ quotations from `sm_data.json`
- **Charts:** Status distribution, material breakdown, entity comparison, monthly trends
- **Features:** Win rate analysis (94.3%), revision tracking (219), supplier table with pagination
- **Filters:** Entity, Material, Material Code, Status, Date Range

### 2. Global Spend Analysis (GSA) — `#d96f3c`
- **Data:** 3,596 POs ($147.84M total spend) from `gsa_data.json`
- **Charts:** Spend by entity, material, supplier, monthly trends
- **Features:** Change order section (309 COs / $30.04M), CO/Base badges, group indicators
- **Filters:** Entity, Material, Material Code, Supplier, Date Range

### 3. Materials & Disciplines (M&D) — `#0f3d5e`
- **Data:** Combined RFQs + POs from `md_data.json`
- **Charts:** Material code heatmap, RFQ→PO conversion rates (56.7%), conversion time trends
- **Features:** 12 material codes, 33 materials, 1,103 suppliers, 27 entities
- **Filters:** Material Code, Material, Entity, Supplier

---

## Data Stats

| Dataset | Records | Key Metric |
|---------|---------|------------|
| SM (RFQs) | 3,946 | 94.3% win rate |
| GSA (POs) | 3,596 | $147.84M total spend |
| Change Orders | 309 in 191 groups | $30.04M CO value |
| Conversions | 441 linked | Monthly avg days |
| M&D | 12 material codes | 56.7% conversion rate |

---

## Data Rebuild

```bash
cd v8/data
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" build_v8_data.py
```

Reads all `.xls` files from the source folder and outputs 5 JSON data files + metadata.

---

## Key Technical Details

- **No build tools** — served as static files, no npm/webpack
- **No ES6 modules** — all logic in single `scripts.js` (not modular)
- **SearchableSelect** — custom dropdown component for filters with 10+ options
- **Chart lifecycle** — `destroyChart(id)` before recreating Chart.js instances
- **Currency formatting** — `formatCurrency()` and `formatCurrencyShort()` utilities
- **Responsive** — CSS Grid/Flexbox layout, mobile-friendly cards

---

## Documentation

| File | Purpose |
|------|---------|
| [AGENT_INSTRUCTIONS.md](../AGENT_INSTRUCTIONS.md) | Full architecture guide, field schemas, function map |
| [REVIEW_RESPONSE.md](REVIEW_RESPONSE.md) | 47 stakeholder review questions with status |
| [NEW_DATA_ANALYSIS.md](NEW_DATA_ANALYSIS.md) | Feb 20 data analysis and findings |
| [copilot-instructions.md](../.github/copilot-instructions.md) | GitHub Copilot workspace context |

---

*V8 — February 2026*
