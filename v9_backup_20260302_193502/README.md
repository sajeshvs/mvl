# V9 — MVL Supply Chain Intel Hub

> **Live:** [https://sajeshvs.github.io/mvl/v9](https://sajeshvs.github.io/mvl/v9)  
> **Data Source:** Feb 26, 2026 Excel export (PO List + Quotation Reports — with Tax fields)  
> **Stack:** HTML + CSS + Vanilla JS + Chart.js + Leaflet.js 1.9.4  
> **Architecture:** Single-page app, monolithic `scripts.js` (~5,990 lines)

---

## What's New in V9

- **Tax fields** — PO and Quotation data now include Tax and Net Total from new Excel source
- **GSA workbench table** — Added sortable "Tax (US$)" column
- **SM quotation table** — Added "TAX" column
- **GSA "Total Spend" KPI** — Shows tax subtext: Tax: $1.7M
- **SM "Quote Value" KPI** — Shows tax subtext: Tax: $1.6M
- **New data source** — `Full data of Quotations and POs with TAX fields/` (6 XLS files, Feb 26 2026)
- **Quotation corruption handling** — `xlrd` with `ignore_workbook_corruption=True`
- **3-tier Change Order logic** — PO/RFPO revision 2-6 = CO, >6 = Independent, non-PO/RFPO = Standalone
- **Supplier count from master list** — 2,189 suppliers from `suppliers.json`

---

## Folder Structure

```
v9/
├── index.html                  # Single-page app (3 tabs, 1,066 lines)
├── AGENT_INSTRUCTIONS.md       # Comprehensive development instructions
├── README.md                   # This file
├── REVIEW_RESPONSE.md          # Stakeholder review (47 questions ✅)
├── NEW_DATA_ANALYSIS.md        # Data analysis report
│
├── shared/
│   ├── scripts.js              # All dashboard logic (~5,990 lines)
│   ├── styles.css              # Complete CSS with design tokens (~2,820 lines)
│   └── images/                 # Logo and image assets
│
├── data/
│   ├── build_v8_data.py        # V9 Python pipeline (Tax + auto-detect Excel)
│   ├── sm_data.json            # 3,941 RFQ quotations (with Tax)
│   ├── gsa_data.json           # 3,620 POs (with Tax + change orders)
│   ├── md_data.json            # Combined RFQs + POs (with Tax)
│   ├── change_orders.json      # 193 CO groups with details
│   ├── conversion_times.json   # 183 RFQ→PO links, monthly averages
│   ├── client_country_map.json # Client→country mapping (1,098 entries)
│   ├── suppliers.json          # 2,189 supplier details
│   ├── employees.json          # 18 MVL employees
│   └── data_metadata.json      # Build metadata and source info
│
├── Full data of Quotations and POs with TAX fields/  # NEW: Tax source
│   ├── PO_List_Feb-26-2026 (1).xls           # 3,637 POs (9 cols incl. Tax)
│   ├── Quotation_Report_Feb-26-2026.xls       # Quotation fragment 1-5
│   └── Quotation_Report_Feb-26-2026 (1-4).xls # (16 cols incl. Tax)
│
├── Re_ Main order XLS and.../  # Legacy source (V8 fallback)
├── csv-exports/                # 52 CSV exports of all JSON data
└── docs/                       # Historical documentation
```

---

## Dashboard Tabs

### 1. Supplier Marketplace (SM) — `#004578`
- **Data:** 3,941 RFQ quotations from `sm_data.json`
- **Table:** 7 columns — QUOTATION, STATUS, MATERIAL, PROJECT, VALUE, **TAX**, CONTACT
- **KPIs:** RFQ Count, Quote Value (+Tax subtext), PO Count, PO Value, Win Rate, COs, CO Value
- **Tax:** 872 quotations with tax, $1.58M total
- **Features:** Win rate (91.7%), revision tracking (219), supplier map, entity comparison
- **Filters:** Entity, Material, Material Code, Status, Supplier, Project

### 2. Global Spend Analysis (GSA) — `#d96f3c`
- **Data:** 3,620 POs ($414.3M total spend) from `gsa_data.json`
- **Table:** 9 columns — PO No., Type, Order ID, Project, PO Date, Supplier, Material, PO Value, **Tax (US$)**
- **KPIs:** Total POs, Total Spend (+Tax subtext), COs, CO Amount, Suppliers (2,189), Entities
- **Tax:** 870 POs with tax, $1.69M total
- **Features:** 297 COs in 193 groups ($12.0M), CO/Base badges, annual spend trends
- **Filters:** Entity, Material, Material Code, Supplier, PO Type, Year, Date Range

### 3. Materials & Disciplines (M&D) — `#0f3d5e`
- **Data:** Combined RFQs + POs from `md_data.json`
- **KPIs:** 33 Materials, 12 Material Codes, Spend, Active Projects
- **Tax:** `taxUSD` and `netTotalUSD` fields present in PO and quotation records
- **Features:** Material code spend comparison, supplier profiles, material distribution

---

## Data Stats

| Dataset | Records | Key Metric |
|---------|---------|------------|
| SM (RFQs) | 3,941 | 91.7% win rate |
| GSA (POs) | 3,620 | $414.3M total spend |
| Base POs | 3,323 | $373.2M value |
| Change Orders | 297 in 193 groups | $12.0M CO value |
| **POs with Tax** | **870** | **$1.69M total tax** |
| **Quotations with Tax** | **872** | **$1.58M total tax** |
| Conversions | 183 linked | 29.1 avg days |
| Suppliers (master) | 2,189 | From suppliers.json |
| Active Suppliers | 1,104 | In PO data |
| Entities | 18 | Active in data |
| Employees | 18 | MVL contacts |

---

## Data Rebuild

```bash
cd v9/data
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" build_v8_data.py
```

The pipeline reads XLS files from `Full data of Quotations and POs with TAX fields/` (preferred) or falls back to legacy source folders. Outputs 7 JSON files + metadata.

**Key pipeline features:**
- Auto-detects PO file via `glob.glob('PO_List_*.xls')`
- Reads Tax/Net Total columns from new XLS format
- Handles Quotation XLS corruption with `ignore_workbook_corruption=True`
- Filters RFQ-only (removes 8,256 IQ records)
- 3-tier change order detection (PO/RFPO revision-based)
- Converts currencies to USD with embedded FX rates
- Normalizes "Cancled" → "Cancelled", blanks → `(Blank)`

---

## Local Development

```bash
cd v9
python -m http.server 8090
# Open http://localhost:8090
```

---

## Deployment

```bash
cd mvl-powerbi-dashboards
git add v9/
git commit -m "v9: <description>"
git push origin main
git push mvl main
```

---

## Technical Notes

- **Python:** System Python 3.12 (`C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe`)
- **No Build Tools:** Pure vanilla JS, no npm/webpack
- **Cache-busting:** `?v=20260226a` on CSS/JS references
- **FX Rates:** Embedded in pipeline; live rates from `open.er-api.com` in browser
- See `AGENT_INSTRUCTIONS.md` for comprehensive architecture docs, field schemas, and development guides

---

*Updated: February 26, 2026*
