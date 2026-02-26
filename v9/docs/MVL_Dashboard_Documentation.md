# MVL Supply Chain Intelligence Hub — V8 Dashboard Documentation

> **Version:** V8 &nbsp;|&nbsp; **Last Updated:** February 2026 &nbsp;|&nbsp; **Live URL:** [https://sajeshvs.github.io/mvl/v8/](https://sajeshvs.github.io/mvl/v8/)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Pipeline](#3-data-pipeline)
4. [Currency Conversion](#4-currency-conversion)
5. [Change Order Classification Logic](#5-change-order-classification-logic)
6. [Tab 1 — Supplier Marketplace (SM)](#6-tab-1--supplier-marketplace-sm)
7. [Tab 2 — Global Spend Analysis (GSA)](#7-tab-2--global-spend-analysis-gsa)
8. [Tab 3 — Materials & Disciplines (M&D)](#8-tab-3--materials--disciplines-md)
9. [Data File Reference](#9-data-file-reference)
10. [Material Code Classification](#10-material-code-classification)
11. [Country Normalization](#11-country-normalization)
12. [Appendix — Entity Code Map](#12-appendix--entity-code-map)

---

## 1. Executive Summary

The **MVL Supply Chain Intelligence Hub** is a browser-based, three-tab analytics dashboard that provides end-to-end visibility into procurement operations — from initial Request for Quotation (RFQ) through Purchase Order (PO) execution and Change Order (CO) tracking.

### Dashboard Tabs at a Glance

| Tab | Theme Color | Focus Area | Primary Data |
|-----|-------------|------------|--------------|
| **Supplier Marketplace** | Blue `#004578` | RFQ pipeline, quotation tracking, supplier discovery | Quotation records (RFQs) |
| **Global Spend Analysis** | Orange `#d96f3c` | PO spend, change orders, entity & project analysis | Purchase Orders |
| **Materials & Disciplines** | Dark Blue `#0f3d5e` | Material categorization, discipline spend, conversion rates | Combined RFQs + POs |

### Key Metrics Summary

| Metric | Value | Source |
|--------|-------|--------|
| Total RFQ Records | 3,921 | Quotation Excel export |
| Total Purchase Orders | 3,746 | PO CSV export |
| Total PO Spend (USD) | ~$481M | Converted via FX rates |
| Change Orders | 296 (192 groups) | PO/RFPO rev 2–6 |
| Master Supplier Count | 2,189 | suppliers.json |
| Active Suppliers (in POs) | 1,133 | Derived from PO data |
| Material Categories | 12 | Code-based classification |
| Raw Materials | 33 | Distinct material names |

---

## 2. Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | HTML5, CSS3, Vanilla JavaScript | Single-page application |
| Charts | Chart.js 4.x | Bar, line, doughnut, radar charts |
| Maps | Leaflet.js 1.9.4 | Interactive supplier location map |
| Data Pipeline | Python 3.12 | Excel/CSV → JSON transformation |
| Hosting | GitHub Pages | Static file deployment |

### File Structure

```
v8/
├── index.html                    # Single-page app (3 tabs)
├── shared/
│   ├── scripts.js                # All dashboard logic (~5,928 lines)
│   └── styles.css                # Complete CSS with design tokens
├── data/
│   ├── build_v8_data.py          # Python pipeline (~1,508 lines)
│   ├── sm_data.json              # Supplier Marketplace data
│   ├── gsa_data.json             # Global Spend Analysis data
│   ├── md_data.json              # Materials & Disciplines data
│   ├── suppliers.json            # Master supplier directory (2,189)
│   ├── change_orders.json        # CO group details
│   ├── conversion_times.json     # RFQ→PO linkage & timing
│   ├── client_country_map.json   # Client→Country mapping (1,098)
│   ├── entity_code_map.json      # Entity code→name lookup
│   └── data_metadata.json        # Build metadata
└── Data-New/
    └── PO_List_Feb-25-2026.csv   # Source PO data (3,770 rows)
```

### Data Flow Diagram

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                     SOURCE DATA FILES                           │
 │  PO_List_Feb-25-2026.csv    Quotation_List_*.xls                │
 │  (3,770 rows, 7 cols)       (RFQ records with full details)     │
 └───────────────┬──────────────────────────┬──────────────────────┘
                 │                          │
                 ▼                          ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                  build_v8_data.py (9 Steps)                     │
 │                                                                  │
 │  [1/9] Load data files (CSV/XLS auto-detect)                    │
 │  [2/9] Filter quotations (RFQ only, dedup)                      │
 │  [3/9] Deduplicate POs, convert currencies                      │
 │  [4/9] Calculate change orders (3-tier logic)                   │
 │  [5/9] Enrich POs via quotation linkage                         │
 │  [6/9] Build SM data (quotation stats, employees)               │
 │  [7/9] Build GSA data (spend, rankings, CO values)              │
 │  [8/9] Build M&D data (materials + disciplines)                 │
 │  [9/9] Build conversion times, save all JSON                    │
 └───────────────┬──────────────────────────────────────────────────┘
                 │
                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │              7 OUTPUT JSON FILES                                 │
 │  sm_data.json │ gsa_data.json │ md_data.json │ employees.json   │
 │  conversion_times.json │ change_orders.json │ data_metadata.json│
 └───────────────┬──────────────────────────────────────────────────┘
                 │
                 ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │             BROWSER (scripts.js)                                │
 │                                                                  │
 │  loadAllData() → Fetches all JSON files in parallel              │
 │       ↓                                                          │
 │  enrichDashboardWithRealData() → Maps data into dashboardData    │
 │       ↓                                                          │
 │  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐        │
 │  │  SM Tab   │  │   GSA Tab    │  │     M&D Tab        │        │
 │  │ initSM()  │  │ initGSA()   │  │ initMD()           │        │
 │  └──────────┘  └──────────────┘  └────────────────────┘        │
 └──────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Pipeline

### Pipeline Overview (`build_v8_data.py`)

The Python pipeline is the **single source of truth** for all dashboard data. It runs in 9 sequential stages:

### Stage 1 — Loading Data Files

| Source | Format | Rows | Columns | Detection |
|--------|--------|------|---------|-----------|
| PO List | CSV (auto-detected from `Data-New/PO_List_*.csv`) | 3,770 | 7: No, PO number, Po Date, PO Name, Supplier, Total, Cur. | `glob.glob('PO_List_*.csv')` |
| Quotation List | XLS (from `Re_ Main order XLS...` folder) | 3,921+ | 20+ cols via `xlrd` | `glob.glob('Quotation_List_*.xls')` |

**Fallback**: If no CSV found, attempts legacy `PO_List_*.xls` via `xlrd`.

### Stage 2 — Filtering Quotations

- Keeps only **RFQ records** (filters out Internal Quotations / IQ)
- Deduplicates by quotation number
- Removes records with empty/null essential fields
- Result: **3,921 clean quotation records**

### Stage 3 — Deduplicating POs

- Removes duplicate PO numbers (24 duplicates found)
- Converts all monetary values to USD via `FX_RATES`
- Cleans supplier names (blanks → "Unspecified Supplier")
- Result: **3,746 unique POs**

### Stage 4 — Change Order Calculation

See [Section 5: Change Order Classification Logic](#5-change-order-classification-logic) for the full 3-tier system.

**Results:**

| Classification | Count | Description |
|---------------|-------|-------------|
| Base PO (rev 1) | 3,342 | First version of PO/RFPO |
| Change Order (rev 2–6) | 296 | Grouped in 192 CO groups |
| Independent Standalone (rev 7+) | 12 | High-revision POs treated as new |
| Other-prefix Standalone | 96 | SPO, RFSPO, Fresh PO, etc. |

### Stage 5 — Enriching POs via Quotation Linkage

- Matches POs to quotations by `orderId` / quotation number segments
- Fills in: `material`, `materialCode`, `project`, `entity` from matched quotation
- **180 successful Q→PO links** with average **29.5 days** conversion time

### Stages 6–8 — Building Tab-Specific Data

Each tab gets its own JSON with pre-calculated summaries, aggregations, and filter option lists. Details in respective tab sections below.

### Stage 9 — Saving Output

Generates 7 JSON files + build metadata with timestamps and record counts.

---

## 4. Currency Conversion

### Exchange Rates (19 currencies)

| Currency | Rate (per 1 USD) | Notes |
|----------|-------------------|-------|
| USD | 1.0000 | Base currency |
| AED | 3.6725 | UAE Dirham |
| SAR | 3.7500 | Saudi Riyal |
| EUR / EURO | 0.9200 | Euro (both codes mapped) |
| GBP | 0.7900 | British Pound |
| INR | 83.0000 | Indian Rupee |
| KWD | 0.3077 | Kuwaiti Dinar |
| QAR | 3.6400 | Qatari Riyal |
| BHD | 0.3760 | Bahraini Dinar |
| OMR | 0.3850 | Omani Rial |
| NPR | 133.5000 | Nepalese Rupee |
| JPY | 149.5000 | Japanese Yen |
| ZAR | 18.5000 | South African Rand |
| SGD | 1.3400 | Singapore Dollar |
| PKR | 278.0000 | Pakistani Rupee |
| EGP | 30.9000 | Egyptian Pound |
| JOD | 0.7090 | Jordanian Dinar |
| LKR | 320.0000 | Sri Lankan Rupee |

### Conversion Formula

```
USD Value = Original Amount ÷ Exchange Rate
```

**PO-specific overrides**: NPR and JPY are treated as **1:1 with USD** for PO values (these appear to be data-entry artifacts where USD values were entered under NPR/JPY currencies).

### Frontend Implementation

```javascript
function convertToUSD(amount, currency) {
    if (!amount || !currency) return amount || 0;
    const rate = fxRates[currency.toUpperCase()];
    return rate ? amount / rate : amount;
}
```

---

## 5. Change Order Classification Logic

### PO Number Structure

```
 PO-1234-M4004-3
 ──┬ ──┬── ──┬── ┬
   │   │     │   └─ Revision Number
   │   │     └───── Entity Code (maps to entity name)
   │   └─────────── Sequential Number
   └─────────────── Prefix (PO, RFPO, SPO, RFSPO, etc.)
```

### 3-Tier Classification Rules

```
                    ┌─────────────────────────┐
                    │     PO Number Input      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Prefix = PO or RFPO?  │
                    └────┬──────────────┬─────┘
                     YES │              │ NO
                         ▼              ▼
              ┌──────────────┐  ┌──────────────────┐
              │ Check Rev #  │  │ Always Standalone │
              └──┬───┬───┬───┘  │ (SPO, RFSPO,     │
                 │   │   │      │  Fresh PO, etc.)  │
        Rev=1    │   │   │ Rev≥7└──────────────────┘
                 ▼   │   ▼
         ┌────────┐  │  ┌──────────────┐
         │Base PO │  │  │ Independent  │
         │        │  │  │ Standalone   │
         └────────┘  │  └──────────────┘
                     │
              Rev 2–6│
                     ▼
              ┌──────────────┐
              │ Change Order │
              │ (grouped w/  │
              │  base PO)    │
              └──────────────┘
```

| Tier | Prefix | Revision | Classification | Grouping |
|------|--------|----------|---------------|----------|
| **1** | PO / RFPO | 1 | Base PO | Shared `baseGroupKey` |
| **2** | PO / RFPO | 2–6 | Change Order | Shared `baseGroupKey` with rev 1 |
| **3** | PO / RFPO | 7+ | Independent Standalone | Own `baseGroupKey` (self) |
| **4** | All others | Any | Standalone | Own `baseGroupKey` (self) |

### CO Value Calculation (Incremental Deduction)

Change Order values represent the **incremental cost difference**, not the absolute PO value:

| Scenario | CO Value Formula |
|----------|-----------------|
| First CO in group (or orphan) | Full CO amount |
| Same value as previous version | $0 (count only) |
| Non-consecutive revision gap | Full CO amount |
| Normal consecutive revision | CO amount − Previous version amount |

---

## 6. Tab 1 — Supplier Marketplace (SM)

> **Theme:** Blue (`#004578`) &nbsp;|&nbsp; **Data Source:** `sm_data.json` &nbsp;|&nbsp; **Focus:** RFQ pipeline and supplier discovery

### 6.1 Data Source

| File | Variable | Content |
|------|----------|---------|
| `sm_data.json` | `smData` | Quotation workbench, status/entity/material summaries, MVL employee records, filter lists |
| `gsa_data.json` | `gsaData` | PO counts, CO counts/values, supplier rankings, entity spend (for PO-related KPIs) |
| `suppliers.json` | `suppliersData` | Master supplier directory — name, contact, email, phone, rating, address, country |
| `conversion_times.json` | `_conversionTimes` | RFQ→PO monthly conversion averages |
| `client_country_map.json` | `clientCountryMap` | Client name → country mapping (1,098 entries) |

### 6.2 Filters (10 controls)

| # | Filter | HTML ID | Options Source | Matches Field |
|---|--------|---------|---------------|---------------|
| 1 | Entity | `filterEntity` | `smData.entities[].Entity` | `q.Entity` |
| 2 | Project | `filterProject` | `smData.workbench[].ProjectName` (2+ quotations) | `q.ProjectName` |
| 3 | Supplier | `filterSupplier` | `gsaData.filters.suppliers` (vendor companies) | `q.Client` |
| 4 | Status | `filterStatus` | Hardcoded: Order, Quotation, Waiting, Cancelled, Closed | `q.Status` |
| 5 | Material | `filterMaterial` | `smData.filters.materials` (30 names) | `q.Material` |
| 6 | Material Code | `filterMaterialCode` | `smData.filters.materialCodes` (12 categories) | `q.materialCode` |
| 7 | Date From | `filterDateFrom` | User-selected | `q.Date >= fromDate` |
| 8 | Date To | `filterDateTo` | User-selected | `q.Date <= toDate` |
| 9 | Search | `searchInput` | Free text | Searches: QuotationNumber, Entity, ProjectName, Description, Client |
| 10 | Clear All | Button | — | Resets all filters, calls `applyFilters()` |

**Filter Pipeline**: `applyFilters()` filters `smData.workbench[]` array, then updates ALL visual components from the filtered result set.

### 6.3 KPI Cards (7 metrics)

| # | KPI Title | HTML ID | Formula | Refilters? |
|---|-----------|---------|---------|------------|
| 1 | **Request for Quotation** | `kpiRfqCount` | `COUNT(smData.workbench)` | Yes — shows filtered count |
| 2 | **Quote Value** | `kpiQuoteValue` | `SUM(convertToUSD(q.QuotationValue, q.Currency))` | Yes — re-summed from filtered set |
| 3 | **Total Purchase Orders** | `kpiPoCount` | `COUNT(non_spo_pos)` from pipeline | **No** — pre-calculated total |
| 4 | **PO Values** | `kpiPoValue` | `SUM(po.poSpendUSD)` for non-SPO POs | **No** — pre-calculated total |
| 5 | **Win Rate** | `kpiWinRate` | `totalPOs / totalQuotations × 100` | Yes — recalculated from filtered |
| 6 | **Change Orders** | `kpiCoCount` | `COUNT(gsaData WHERE poType = "Change Order")` | **No** — from GSA data |
| 7 | **CO Value** | `kpiCoValue` | Incremental deduction logic (see Section 5) | **No** — from GSA data |

> **Note:** KPIs 3, 4, 6, 7 are sourced from PO/GSA data and remain constant regardless of SM quotation filters. Only KPIs 1, 2, 5 respond to filter changes.

### 6.4 Charts and Visualizations

#### 6.4.1 Status Chart

| Property | Detail |
|----------|--------|
| **Type** | Custom HTML bar list (not Chart.js) |
| **Container** | `statusChart` |
| **Data** | `smData.statusSummary[]` — `{Status, Count, TotalValueUSD}` |
| **Colors** | Order: Green `#4CAF50`, Quotation: Blue `#2196F3`, Waiting: Yellow `#FFC107`, Cancelled: Red `#F44336`, Closed: Gray `#9E9E9E` |
| **Interaction** | Click bar → filters by that status |
| **Sub-KPIs** | Conversion Rate (`conversionRate`), Open Quotes (`openQuotes` = Quotation + Waiting) |

#### 6.4.2 Entity Comparison Chart

| Property | Detail |
|----------|--------|
| **Type** | Chart.js horizontal bar (`indexAxis: 'y'`) |
| **Canvas** | `entityChartCanvas` (scrollable) + `entityAxisCanvas` (frozen x-axis) |
| **Toggle** | "By Quote" (quotation value) / "By PO Spend" (entity spend from GSA) |
| **Data — Quote View** | `smData.entities[].TotalValueUSD` |
| **Data — Spend View** | `gsaData.entityBreakdown[].valueUSD` |
| **Interaction** | Click bar → filters by entity |
| **Bar Height** | Dynamic: 28px per entity, min 180px |

#### 6.4.3 Top 10 Suppliers by Spend

| Property | Detail |
|----------|--------|
| **Type** | Custom HTML ranked list with proportional bars |
| **Container** | `topSuppliers` |
| **Data** | `gsaData.supplierRankings.top[]` (first 10) |
| **Display** | Gold/silver/bronze rank circles, bar width proportional to spend |
| **Interaction** | Click row → updates Supplier Profile, sets Supplier filter |

#### 6.4.4 Location of Suppliers Map

| Property | Detail |
|----------|--------|
| **Type** | Leaflet.js interactive map with CartoDB tiles |
| **Container** | `supplierMap` |
| **Unfiltered Data** | `suppliersData.suppliers[]` grouped by country |
| **Filtered Data** | Quotations grouped by country via `clientCountryMap` + `entityCountryMap` fallback |
| **Country Resolution** | `clientCountryMap` (1,098 entries) → entity fallback (29 mappings) → `normalizeCountry()` (~150 entries) |
| **Markers** | `L.circleMarker` with radius 8–25px, 5-color intensity scale (green→red) |
| **Popup** | Country name, quotation count, total value, top 5 clients |

#### 6.4.5 Material Distribution Chart

| Property | Detail |
|----------|--------|
| **Type** | Chart.js — switchable between Bar, Pie, Line, Radar |
| **Canvas** | `materialChartCanvas` |
| **Toggle** | 4 buttons: Bar (default), Pie, Line, Radar |
| **Data** | `smData.materialsByDiscipline[]` (top 8 by value) |
| **Fields** | `{material: MaterialCode, value: QuotationValueUSD, count}` |
| **Interaction** | Click bar/segment → filters by material |

#### 6.4.6 Quotation to PO Time

| Property | Detail |
|----------|--------|
| **Type** | Chart.js vertical bar chart |
| **Canvas** | `quotationTimeChart` |
| **Data** | `conversion_times.json → monthlyAverage[]` — `{month, avgDays, count}` |
| **Labels** | `Nd` (days) above each bar |
| **Tooltip** | `X days (Y POs)` |
| **Filter** | Date-range filtered by month (YYYY-MM comparison) |

#### 6.4.7 Submit & Order Quantity Trend

| Property | Detail |
|----------|--------|
| **Type** | Chart.js multi-line (3 datasets) |
| **Canvas** | `trendChart` |
| **Datasets** | Quotes (blue `#0066CC`), Orders (green `#339933`), COs (orange `#FF9900`) |
| **Quotes** | Counted from quotation `submission_date` by month |
| **Orders** | Counted from PO `po_date` by month |
| **COs** | Counted from GSA workbench where `poType = "Change Order"` by month |
| **Filter** | **Not refiltered** — rendered once at initial load |

### 6.5 Supplier Profile Card

| Field | HTML ID | Data Source |
|-------|---------|-------------|
| Avatar | `supplierAvatar` | First character of name |
| Name | `supplierName` | Selected supplier name |
| Location | `supplierLocation` | `suppliersData` → `normalizeCountry(address.country_standardized)` |
| Contact | `supplierContact` | `suppliersData` → `contact.primary_contact` |
| Email | `supplierEmail` | `suppliersData` → `contact.email` |
| Phone | `supplierPhone` | `suppliersData` → `contact.phone` |
| Rating | `supplierRating` | `suppliersData` → `rating.score` → rendered as ★/☆ |

**Trigger**: Clicking a supplier in Top 10 list, Supplier List table, or selecting from Supplier filter.

### 6.6 Responsible MVL Employee

| Property | Detail |
|----------|--------|
| **Container** | `employeeList` |
| **Data** | `smData.suppliers[]` — these are **MVL procurement contacts**, not vendor companies |
| **Fields** | `{rank, name, poCount, totalSpend}` |
| **Sort Toggle** | "By Spend" / "By Count" |
| **Display** | Ranked list with gold/silver/bronze circles |

### 6.7 Bottom Tables

#### Quotation Details Table (default tab)

| Column | Field | Format |
|--------|-------|--------|
| Quotation | `q.QuotationNumber` | Text |
| Status | `q.Status` | Color badge |
| Material | `q.Material || q.materialCode` | Text |
| Project | `q.ProjectName` | Text |
| Value | `convertToUSD(q.QuotationValue, q.Currency)` | Currency |
| Contact | `q.Contact` | Text |

Pagination: Default 50 rows/page (options: 25, 50, 100, 200).

#### Supplier List Table

| Column | Field | Source |
|--------|-------|--------|
| Supplier Name | `s.name` | `suppliers.json` |
| Contact | `s.contact.primary_contact` | `suppliers.json` |
| Email | `s.contact.email` | `suppliers.json` |
| Phone | `s.contact.phone` | `suppliers.json` |
| Country | `normalizeCountry(s.address.country_standardized)` | `suppliers.json` |
| Category | `s.material_category` | `suppliers.json` |

---

## 7. Tab 2 — Global Spend Analysis (GSA)

> **Theme:** Orange (`#d96f3c`) &nbsp;|&nbsp; **Data Source:** `gsa_data.json` &nbsp;|&nbsp; **Focus:** PO spend analysis and change order tracking

### 7.1 Data Source

| File | Variable | Content |
|------|----------|---------|
| `gsa_data.json` | `gsaData` | PO workbench (3,746 records), spend summary, supplier rankings, entity/material breakdown, monthly trends, CO details |
| `suppliers.json` | `suppliersData` | Supplier details for supplier card |

### 7.2 Filters (10 controls)

| # | Filter | HTML ID | Options Source | Matches Field |
|---|--------|---------|---------------|---------------|
| 1 | Entity | `gsaFilterEntity` | `gsaData.filters.entities` | `po.entity` |
| 2 | Supplier | `gsaFilterSupplier` | `gsaData.filters.suppliers` | `po.supplier` |
| 3 | Project | `gsaFilterProject` | Derived unique `po.project` values | `po.project` |
| 4 | Material | `gsaFilterMaterial` | `gsaData.filters.materials` | `po.material` |
| 5 | Material Code | `gsaFilterMaterialCode` | `gsaData.filters.materialCodes` | `po.materialCode` |
| 6 | PO Type | `gsaFilterDiscipline` | `gsaData.filters.poTypes` (Base PO, Change Order) | `po.poType` |
| 7 | Year | `gsaFilterYear` | `gsaData.filters.years` | `po.year` |
| 8 | Date From | `gsaFilterFrom` | Date input | `po.poDate >= fromDate` |
| 9 | Date To | `gsaFilterTo` | Date input | `po.poDate <= toDate` |
| 10 | Search | `gsaSearchInput` | Free text | Searches: poNumber, poName, project, supplier, material, materialCode, entity, orderId |

All filters auto-apply on change with debounced search (300ms).

### 7.3 KPI Cards (6 metrics)

| # | KPI Title | HTML ID | Unfiltered Source | Filtered Calculation |
|---|-----------|---------|-------------------|---------------------|
| 1 | **Total No. of Purchase Orders** | `gsaKpiPoCount` | `gsaData.summary.totalPOs` | `filteredPOs.length` |
| 2 | **Total Spend** | `gsaKpiTotalSpend` | `gsaData.summary.totalSpendUSD` | `SUM(convertToUSD(po.valueUSD, po.currency))` |
| 3 | **Total No. of Change Orders** | `gsaKpiCoCount` | `gsaData.summary.changeOrders` | `COUNT(po WHERE poType="Change Order")` |
| 4 | **Total Amount of Change Orders** | `gsaKpiCoAmount` | `gsaData.summary.changeOrderValue` | `SUM(convertToUSD(co.valueUSD, co.currency))` |
| 5 | **No. of Suppliers** | `gsaKpiActiveSuppliers` | `gsaData.summary.supplierCount` (2,189 from master list) | `COUNT(DISTINCT po.supplier)` |
| 6 | **No. of Entities** | `gsaKpiActiveEntities` | `gsaData.summary.entityCount` | `COUNT(DISTINCT po.entity)` |

**Sub-labels:**
- KPI 3 shows `gsaKpiCoGroups`: "N groups" — count of unique CO groups
- KPI 4 shows `gsaKpiCoPct`: "X% of total spend" — `(CO Value / Total Spend) × 100`

### 7.4 Charts and Visualizations

#### 7.4.1 Annual Spend Trend (Stacked Bar + Line)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js stacked bar + line combo |
| **Canvas** | `gsaSpendTrendChart` |
| **Dataset 1** | "Base Spend" — bar, orange `#FF8C00`, left Y-axis (stacked) |
| **Dataset 2** | "Change Orders" — bar, gold `#FFD700`, left Y-axis (stacked) |
| **Dataset 3** | "Running Total" — line, blue `#0066CC`, right Y-axis |
| **Labels** | "MMM YY" format (last 12 months) |
| **Data Source (unfiltered)** | `gsaData.monthlyTrend[]` — `{yearMonth, value, count}` |
| **Data Source (filtered)** | Grouped from `filteredData` by `po.yearMonth`, split by `po.poType` |
| **Running Total** | Cumulative sum of base + change per month |

#### 7.4.2 Spend by Entity (Horizontal Bar)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js horizontal bar |
| **Canvas** | `gsaEntityChart` |
| **Subtitle** | "Top 8 Entities by PO Value" |
| **Data (unfiltered)** | `gsaData.entityBreakdown[]` — `.name`, `.valueUSD` (top 8, excluding "Unknown") |
| **Data (filtered)** | Grouped from `filteredData` by `po.entity`, sum `po.valueUSD`, top 8 |
| **Interaction** | Click bar → cross-filters to that entity |

#### 7.4.3 Spend by Projects (Horizontal Bar)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js horizontal bar |
| **Canvas** | `gsaProjectChart` |
| **Subtitle** | "Top 8 Projects by PO Value" |
| **Data** | Always calculated from `filteredData` by `po.project`, top 8 |
| **Interaction** | Click bar → cross-filters to that project |

#### 7.4.4 Top Suppliers (Horizontal Bar)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js horizontal bar |
| **Canvas** | `gsaTopSuppliersChart` |
| **Subtitle** | "Top 10 Suppliers by Spend" |
| **Data (unfiltered)** | `gsaData.supplierRankings.top[]` |
| **Data (filtered)** | Grouped from `filteredData` by `po.supplier`, top 10 |
| **Interaction** | Click bar → updates supplier card + cross-filters |

#### 7.4.5 Most Inactive Suppliers (Horizontal Bar)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js horizontal bar |
| **Canvas** | `gsaBottomSuppliersChart` |
| **Subtitle** | "Bottom 10 Suppliers by Spend" |
| **Data** | Same aggregation as Top Suppliers, sorted ascending, bottom 10 |
| **Interaction** | Click bar → updates supplier card + cross-filters |

### 7.5 Supplier Details Card

| Field | HTML ID | Data Source |
|-------|---------|-------------|
| Name | `gsaSupplierName` | Selected supplier |
| Location | `gsaSupplierLocation` | `suppliersData` → `normalizeCountry()` |
| Stars | `gsaSupplierStars` | `suppliersData` → `rating.score` |
| Rating | `gsaSupplierRating` | `rating.toFixed(2) + "/5"` |
| Email | `gsaSupplierEmail` | `suppliersData` → `contact.email` |
| Contact | `gsaSupplierContact` | `suppliersData` → `contact.primary_contact` |

**Fallback** (supplier not in `suppliersData`): Shows entity from first PO, PO count + total spend, default 4-star rating.

### 7.6 PO Details Table

| Column | Sort Key | Field | Format |
|--------|----------|-------|--------|
| PO No. | `po_no` | `po.poNumber` | Link |
| Type | `type` | `po.poType` | Badge: "CO" (red) / "Base" (green) + "N of M" group badge |
| Order ID | `order_id` | `po.orderId` | Integer sort |
| Project | `project` | `po.project` | Truncated to 40 chars |
| PO Date | `po_date` | `po.poDate` | Date sort |
| Supplier | `supplier` | `po.supplier` | Text |
| Material | `material` | `po.material` | Text |
| PO Value (US$) | `po_value` | `convertToUSD(po.valueUSD, po.currency)` | Currency |

Pagination: 25/50/100 rows per page. Default sort: PO Date descending.

### 7.7 Cross-Filter Behavior

| Click Target | What Happens |
|-------------|--------------|
| Entity bar | Filters all components to that entity |
| Project bar | Filters all components to that project |
| Top/Bottom supplier bar | Updates supplier card + filters to that supplier |
| Trend bar | Console log only (no cross-filter) |

### 7.8 PO Record Schema

Each PO in `gsaData.workbench[]` contains:

| Field | Type | Description |
|-------|------|-------------|
| `poNumber` | string | Full PO number (e.g., "PO-1234-M4004-1") |
| `poDate` | string | "DD MMM YYYY" format |
| `poName` | string | PO description |
| `supplier` | string | Cleaned supplier name |
| `originalValue` | float | Raw value in original currency |
| `currency` | string | Original currency code |
| `valueUSD` | float | USD-converted value |
| `entity` | string | Entity name (from entity code map) |
| `entityCode` | string | 3rd segment of PO number |
| `material` | string | Material name (from quotation linkage) |
| `materialCode` | string | One of 12 categories |
| `poVersion` | int | Revision number |
| `poType` | string | "Base PO" or "Change Order" |
| `isChangeOrder` | bool | CO flag |
| `changeOrderGroup` | int | POs in same group |
| `changeOrderTotal` | int | Used for CO badge ("N of M") |
| `orderId` | string | Base group key |
| `year` | int | Year from PO date |
| `yearMonth` | string | "YYYY-MM" format |
| `project` | string | Project name |

---

## 8. Tab 3 — Materials & Disciplines (M&D)

> **Theme:** Dark Blue (`#0f3d5e`) &nbsp;|&nbsp; **Data Source:** `md_data.json` &nbsp;|&nbsp; **Focus:** Material categorization, discipline spend, and RFQ-to-PO conversion analysis

### 8.1 Data Source

| File | Variable | Content |
|------|----------|---------|
| `md_data.json` | `mdData` | Combined quotations + POs, discipline breakdown, entity breakdown, trend, filter lists |
| `suppliers.json` | `suppliersData` | Supplier details for profile card and table |

### 8.2 Filters (8 controls + search)

| # | Filter | HTML ID | Options Source | Matches |
|---|--------|---------|---------------|---------|
| 1 | Material Code | `filterMdDiscipline` | `mdData.filters.materialCodes` | `po.materialCode / q.materialCode` |
| 2 | Material | `filterMdMaterial` | `mdData.filters.materials` | `po.material / q.material` |
| 3 | Entity | `filterMdEntity` | `mdData.filters.entities` | `po.entity / q.entity` |
| 4 | Project | `filterMdProject` | `mdData.filters.projects` (max 200) | `po.project / q.project` |
| 5 | Supplier | `filterMdSupplier` | `mdData.filters.suppliers` | `po.supplier / q.supplier` |
| 6 | Year | `filterMdYear` | Derived from PO years | `po.year` |
| 7 | Date From | `filterMdFrom` | Date input | `poDate / q.date >= fromDate` |
| 8 | Date To | `filterMdTo` | Date input | `poDate / q.date <= toDate` |
| 9 | Search | `mdSearchInput` | Free text (debounced 300ms) | Searches multiple fields |

**Important**: M&D filters apply to **both POs and quotations** simultaneously.

### 8.3 KPI Cards (5 metrics)

| # | KPI Title | HTML ID | Unfiltered Formula | Filtered Formula |
|---|-----------|---------|-------------------|------------------|
| 1 | **Materials** | `kpiMdMaterials` | `mdData.summary.materialCount` — unique raw material names (excl. Blank) | `DISTINCT(po.material + q.material)` count |
| 2 | **Material Codes** | `kpiMdDisciplines` | `mdData.summary.materialCodeCount` — unique consolidated codes | `DISTINCT(po.materialCode + q.materialCode)` count |
| 3 | **Total Material Spend** | `kpiMdMaterialSpend` | `mdData.summary.totalOrdered` — sum of all PO values in USD | `SUM(po.value)` from filtered POs |
| 4 | **Total Material Code Spend** | `kpiMdDisciplineSpend` | Same as #3 (`totalOrdered`) | Same as #3 |
| 5 | **Active Projects** | `kpiMdActiveProjects` | `mdData.summary.projectCount` — unique projects from POs | `DISTINCT(po.project)` count |

**Sub-labels:**
- KPIs 3 and 4 show conversion %: `(totalOrdered / totalQuoted × 100)%`
- KPI 5 shows supplier count: `mdData.summary.supplierCount` (2,189 from master list)

### 8.4 Charts

#### 8.4.1 Total Spend by Material Code (Grouped Bar Chart)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js horizontal grouped bar |
| **Canvas** | `disciplineSpendChart` |
| **Subtitle** | "Quoted vs Ordered spend comparison" |
| **Dataset 1** | "Quoted" — color `#9CB3C9` — from `discipline.quotedValue` |
| **Dataset 2** | "Ordered" — color `#2B4257` — from `discipline.orderedValue` |
| **Data (unfiltered)** | `mdData.disciplines[]` — pre-aggregated by materialCode (top 12) |
| **Data (filtered)** | Aggregated from filtered POs + quotations by materialCode |
| **Axes** | Y-axis: `formatCurrencyShort()`, X-axis: material code names (45° rotation) |

#### 8.4.2 Material Distribution (Doughnut Chart)

| Property | Detail |
|----------|--------|
| **Type** | Chart.js doughnut |
| **Canvas** | `materialDistributionChart` |
| **Subtitle** | "By spend percentage" |
| **Cutout** | 55% |
| **Data (unfiltered)** | `mdData.disciplines[]` (top 10 by orderedValue) |
| **Data (filtered)** | Aggregated from filtered POs by `po.material`, top 10 |
| **Colors (unfiltered)** | 10 named colors: `#2B4257, #3B82F6, #60A5FA, #06B6D4, #10B981, #F59E0B, #EF4444, #1E3A5F, #8B5CF6, #22C55E` |
| **Interaction** | Click slice → filters by that material |

### 8.5 Supplier Profile Card

| Field | HTML ID | Source |
|-------|---------|--------|
| Name | `mdSupplierName` | `supplier.name` |
| Location | `mdSupplierLocation` | `normalizeCountry()` on address data |
| Stars | `mdSupplierStars` | `rating.score` → ⭐/☆ |
| Rating | `mdSupplierRatingVal` | `rating.toFixed(2) + "/5"` |
| Email | `mdSupplierEmail` | `supplier.contact.email` |
| Contact | `mdSupplierContact` | `supplier.contact.primary_contact` |

**Trigger**: Clicking supplier name in Supplier Overview table, or selecting from Supplier filter.

### 8.6 Supplier Overview Table

| Column | Sort | Field |
|--------|------|-------|
| Supplier Name ↕ | `name` | `supplier.name` (clickable link → profile) |
| Location ↕ | `country` | `normalizeCountry(address.country_standardized)` |
| Rating ↕ | `rating` | `⭐ rating.toFixed(1)` |
| Email | — | `contact.email` |
| Contact | — | `contact.primary_contact` |

**Data (unfiltered)**: All suppliers from `suppliersData.suppliers[]`.
**Data (filtered)**: Unique suppliers from filtered POs, enriched via `suppliersData` lookup.
**Pagination**: 10/25/50 per page with search, page navigation buttons.

### 8.7 PO/Material Details Table

| Column | Field | Format |
|--------|-------|--------|
| PO Number | `po.poNumber` | Text |
| PO Date | `po.poDate` | Text |
| Material | `po.material` | Text |
| Material Code | `po.materialCode` | Text |
| PO Value (USD) | `convertToUSD(po.value, po.currency)` | `formatCurrencyShort()` |
| Currency | `po.currency` | Text |
| Project | `po.project` | Truncated 40 chars |

**Pagination**: 20 rows/page with prev/next navigation.

### 8.8 Approved Materials

> **Status**: 🚧 Coming Soon — placeholder in current UI. JS functions exist but the HTML tbody is hidden by the "Coming Soon" overlay.

---

## 9. Data File Reference

### Files Generated by Pipeline (7 files)

| File | Records | Key Fields |
|------|---------|------------|
| **sm_data.json** | 3,921 quotations | `.summary`, `.workbench[]`, `.statusSummary[]`, `.entities[]`, `.materialsByDiscipline[]`, `.suppliers[]` (employees), `.filters`, `.funnel` |
| **gsa_data.json** | 3,746 POs | `.summary`, `.workbench[]`, `.supplierRankings`, `.entityBreakdown[]`, `.materialBreakdown[]`, `.monthlyTrend[]`, `.poTypeBreakdown`, `.changeOrderDetails[]`, `.filters` |
| **md_data.json** | 3,921 Q + 3,746 PO | `.summary`, `.quotations[]`, `.pos[]`, `.disciplines[]`, `.entityBreakdown[]`, `.trend[]`, `.filters` |
| **employees.json** | ~50 employees | Employee quotation/order counts, win rates, spend values |
| **conversion_times.json** | 180 links | `.monthlyAverage[]`, `.totalLinked`, `.averageDays` |
| **change_orders.json** | 192 groups | `.totalGroups`, `.totalCOPOs`, `.totalCOValue`, `.groups[]` |
| **data_metadata.json** | 1 record | Build date, source files, record counts |

### Pre-existing Reference Files (3 files)

| File | Entries | Purpose |
|------|---------|---------|
| **suppliers.json** | 2,189 suppliers | Master supplier directory with contact, address, rating, material category |
| **client_country_map.json** | 1,098 entries | Client name → country mapping (4-source priority) |
| **entity_code_map.json** | ~20 entries | Entity code → entity name lookup |

---

## 10. Material Code Classification

The pipeline classifies **~35 raw material names** into **12 standardized material categories**:

| Material Code | Raw Materials |
|---------------|---------------|
| **Architectural** | Sandwich Panel, Accessories/Connection for Sandwich Panel, Steel Coil, Doors, Windows, Fit Out Project, Paints, Sanitary and Toilet Accessories |
| **Chemicals** | Polyurethane Foam, Chemicals |
| **Electrical** | Electrical |
| **Fire** | Firestop/DC 315, Firestop, Fire, Fire Alarm, Fire Fighting, Fire Suppression, Fire Protection |
| **Logistics** | Transportation, Discount, MHE, Logistics |
| **Mechanical** | Machine/Equipments, Mechanical Items |
| **Office Assets** | Computer Peripherals |
| **Protection** | PPE |
| **Rental** | Rental |
| **Services** | Design, Construction, LSA - Life Support Area, Subcontract, Services |
| **Tools** | Tools |
| **Various** | Containers, Building Materials, Graco Spares, Misc., General |

### PO-Based Material Detection

When material info isn't available from quotation linkage, the pipeline infers material from the **PO entity code prefix letter**:

| Prefix Letter | Material |
|---------------|----------|
| A | Architectural |
| C | Chemicals |
| E | Electrical |
| F | Fire |
| L | Logistics |
| M | Mechanical |
| O | Office Assets |
| P | Protection |
| R | Rental |
| S | Services |
| T | Tools |
| V | Various |

---

## 11. Country Normalization

### Multi-Source Country Resolution

The client→country mapping uses a **4-source priority system**:

| Priority | Source | Description |
|----------|--------|-------------|
| 1 | Address | Physical address country field |
| 2 | Phone Validation | Country from validated phone number |
| 3 | Phone Prefix | Country inferred from phone number prefix |
| 4 | Email TLD | Country from email domain extension |

**Entity-based fallback**: For clients not in the country map, 29 entity→country mappings provide defaults:

| Entity | Default Country |
|--------|----------------|
| MVL INDUSTRIAL SOLUTIONS | UAE |
| MVL VENTURES LLC | UAE |
| MVL ENERGY | UAE |
| MVL SOLUTIONS | UAE |
| CENTRICO | UAE |
| MVL INDUSTRIAL EST | Saudi Arabia |
| MVL ARABIA | Saudi Arabia |
| *(and 22 more...)* | *(various)* |

### normalizeCountry()

The frontend `normalizeCountry()` function standardizes ~150 country name variants:

- "United Arab Emirates" / "UAE" / "U.A.E." / "Uae" → "United Arab Emirates"
- "Kingdom of Saudi Arabia" / "KSA" / "Saudi" → "Saudi Arabia"
- "USA" / "United States of America" / "US" → "United States"
- *(~150 total mappings)*

---

## 12. Appendix — Entity Code Map

Entity codes are extracted from the 3rd segment of PO numbers and mapped to full entity names:

```
PO-1234-M4004-1
         ^^^^^
         Entity Code → "MVL VENTURES LLC"
```

The `entity_code_map.json` file contains ~20 mappings. Unknown codes are labeled "Unknown Entity".

---

## Formatting Reference

### Currency Display

| Context | Function | Example |
|---------|----------|---------|
| KPI cards | `formatCurrencyShort()` | $478.6M, $12.1K, $1.2B |
| Table cells | `formatCurrency()` | $1.2M, $478.6K, $12 |
| Number only | `formatNumber()` | 3,746 |

### Status Badge Colors

| Status | Color | Hex |
|--------|-------|-----|
| Order | Green | `#2ecc71` |
| Quotation | Blue | `#3498db` |
| Waiting | Orange | `#f39c12` |
| Cancelled | Red | `#e74c3c` |
| Closed | Gray | `#95a5a6` |

### Change Order Badges

| Badge | Color | Meaning |
|-------|-------|---------|
| CO | Red `#e74c3c` | Change Order |
| Base | Green `#2ecc71` | Base PO |
| N of M | Gold `#f39c12` | Group indicator (e.g., "2 of 3") |

---

*Document generated from codebase analysis of `v8/shared/scripts.js` (~5,928 lines), `v8/data/build_v8_data.py` (~1,508 lines), and `v8/index.html` (~1,063 lines).*
