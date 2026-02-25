# V8 Dashboard — Complete Data Export (CSV)

**Generated:** February 25, 2026  
**Source:** 17 JSON files from `v8/data/`  
**Total:** 77 CSV files  

---

## Data Sources Overview

The V8 dashboard loads **10 JSON files** at runtime (7 primary + 3 optional).  
An additional **7 files** are pipeline-only references used during data build.

| # | Source File | Size | Loaded by Dashboard | Tab(s) | Records |
|---|-----------|------|:---:|---------|---------|
| 1 | `sm_data.json` | 2.8 MB | YES | SM | 3,921 quotations |
| 2 | `gsa_data.json` | 2.9 MB | YES | GSA | 3,596 POs |
| 3 | `md_data.json` | 4.1 MB | YES | M&D | 3,921 quotations + 3,596 POs |
| 4 | `suppliers.json` | 3.2 MB | YES | SM, GSA, M&D | 2,189 suppliers |
| 5 | `purchase_orders.json` | 3.9 MB | YES | SM, M&D | 3,539 POs (raw) |
| 6 | `quotations.json` | 22.0 MB | YES | SM, M&D | 12,136 quotations (raw) |
| 7 | `dashboard_data.json` | 18 KB | YES | All | Config template |
| 8 | `client_country_map.json` | 38 KB | YES (optional) | SM | 1,098 mappings |
| 9 | `conversion_times.json` | 94 KB | YES (optional) | SM | 431 + 88 records |
| 10 | `change_orders.json` | 42 KB | YES (optional) | GSA | 191 groups |
| 11 | `material_codes.json` | 9 KB | NO (pipeline) | — | 30 codes |
| 12 | `entity_code_map.json` | 43 KB | NO (pipeline) | — | 1,970 mappings |
| 13 | `employees.json` | 3 KB | NO (pipeline) | — | 18 employees |
| 14 | `orders.json` | 50 KB | NO (pipeline) | — | 210 orders |
| 15 | `data_metadata.json` | 1 KB | NO (pipeline) | — | Build info |
| 16 | `improvement_summary.json` | 5 KB | NO (pipeline) | — | Quality log |
| 17 | `location_enrichment_summary.json` | 0.4 KB | NO (pipeline) | — | Geo summary |

---

## CSV Files & Where They Are Used

### 1. SM Tab — Supplier Marketplace (Blue #004578)

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `01_SM_Workbench_Quotations.csv` | 3,921 | 20 | SM main data — all filter/chart/KPI calculations | Each row = 1 RFQ quotation. Filtered by Entity, Status, Material, MaterialCode, Project, Supplier, Date range. `QuotationValue` used for spend calculations. |
| `01_SM_Summary.csv` | 7 | 2 | SM KPI cards (top row) | Pre-calculated: `totalRfq` (COUNT workbench), `totalQuotedValue` (SUM QuotationValue), `totalSuppliers` (COUNT DISTINCT Client), `totalEntities` (COUNT DISTINCT Entity), `poExportDate`, `rfqExportDate`, `totalValue` |
| `01_SM_Status_Summary.csv` | 4 | 3 | SM Status bar chart | `status`, `count`, `value` — aggregated by Quotation/Order/Waiting/Cancelled |
| `01_SM_Entities.csv` | 19 | 3 | SM Entity bar chart (frozen x-axis) | `name`, `count`, `value` — `count` = quotations per entity, `value` = SUM(QuotationValue) per entity |
| `01_SM_Materials_By_Discipline.csv` | 12 | 3 | SM Material Code breakdown | `name` (material code), `count`, `value` — grouped by consolidated material code |
| `01_SM_Suppliers_Ranking.csv` | 18 | 3 | SM Top 10 Suppliers list | `name`, `quotationCount`, `totalValue` — ranked by quotation count |
| `01_SM_Funnel.csv` | 1 | 2 | SM conversion funnel (if displayed) | `Stage` → `Value` pipeline conversion |
| `01_SM_Filter_*.csv` (6 files) | varies | 1 | SM filter dropdown options | Lists of unique values for each filter dropdown |

### 2. GSA Tab — Global Spend Analysis (Orange #d96f3c)

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `02_GSA_Workbench_POs.csv` | 3,596 | 23 | GSA main data — all filter/chart/KPI calculations | Each row = 1 PO. Key fields: `poNumber`, `supplier`, `entity`, `material`, `materialCode`, `valueUSD` (converted), `poType` (Base PO/Change Order), `changeOrderTotal`, `poVersion` |
| `02_GSA_Summary.csv` | 9 | 2 | GSA KPI cards | `totalPOs`, `totalSpendUSD` (SUM valueUSD), `changeOrders` (COUNT where poType=CO), `changeOrderValue` (SUM valueUSD where CO), `activeSuppliers` (DISTINCT), `activeEntities` (DISTINCT), `coGroups`, `changeOrderPercentage` (coValue/totalSpend×100) |
| `02_GSA_Supplier_Rankings_Top.csv` | 20 | 5 | GSA Top Suppliers chart | `name`, `valueUSD` (SUM), `poCount`, `basePOs`, `changeOrders` — sorted DESC by valueUSD |
| `02_GSA_Supplier_Rankings_Bottom.csv` | 10 | 3 | GSA Bottom Suppliers chart | `name`, `valueUSD`, `poCount` — sorted ASC by valueUSD |
| `02_GSA_Entity_Breakdown.csv` | 19 | 5 | GSA Spend by Entity chart | `name`, `valueUSD`, `poCount`, `basePOs`, `changeOrders` — SUM(valueUSD) per entity |
| `02_GSA_Material_Breakdown.csv` | 30 | 3 | GSA Material analysis | `name`, `valueUSD`, `poCount` — SUM(valueUSD) per material |
| `02_GSA_Annual_Trend.csv` | 15 | 6 | GSA historical analysis | `year`, `count`, `value`, `valueUSD`, `basePOs`, `changeOrders` — annual aggregation |
| `02_GSA_Monthly_Trend.csv` | 157 | 3 | GSA Monthly Spend Trend chart (stacked bar + line) | `yearMonth`, `value`, `count` — Base amount as bar (#FF8C00), CO as stacked gold (#FFD700), running total as line (#0066CC) |
| `02_GSA_PO_Type_Breakdown.csv` | 2 | 3 | GSA Base vs CO split | `poType`, `count`, `valueUSD` — basePO vs changeOrder |
| `02_GSA_Change_Order_Details.csv` | 191 | 5 | GSA CO table & badges | `orderId`, `mainOrderId`, `poCount`, `totalValueUSD`, `poNumbers` (semicolon-separated). CO badge: `-1`=Base (green), `-2`+=CO (red), group indicator (gold) |
| `02_GSA_Change_Order_Monthly.csv` | 92 | 3 | GSA CO trend | `yearMonth`, `count`, `valueUSD` — monthly CO aggregation |
| `02_GSA_Filter_*.csv` (6 files) | varies | 1 | GSA filter dropdown options | Unique values: entities (19), suppliers (1104), materials (30), materialCodes (12), poTypes (2), years (15) |

### 3. M&D Tab — Materials & Disciplines (Dark Blue #0f3d5e)

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `03_MD_Quotations.csv` | 3,921 | 15 | M&D quotation side — charts, KPIs, filters | Each row = 1 RFQ. `quotedValue` used for "Quoted" spend in Discipline chart |
| `03_MD_POs.csv` | 3,596 | 15 | M&D PO side — PO table, Discipline chart "Ordered" | Each row = 1 PO. `value` used for "Ordered" spend |
| `03_MD_Summary.csv` | 8 | 2 | M&D KPI cards | `materialCount` (30), `materialCodeCount` (12), `totalOrdered` (SUM PO values), `totalQuoted` (SUM quotation values), `projectCount`, `supplierCount`. **Conversion %** = `(totalOrdered / totalQuoted) × 100` |
| `03_MD_Disciplines.csv` | 12 | 7 | M&D Discipline Spend chart (stacked bar) | `name`, `orderedValue`, `quotedValue`, `orderedCount`, `quotedCount`, `orderedUSD`, `quotedUSD` — stacked: Quoted (#9CB3C9) + Ordered (#2B4257) |
| `03_MD_Entity_Breakdown.csv` | 28 | 5 | M&D Entity analysis | `name`, `orderedValue`, `quotedValue`, `orderedCount`, `quotedCount` |
| `03_MD_Trend.csv` | 157 | 5 | M&D monthly trend | `yearMonth`, `orderedValue`, `quotedValue`, `orderedCount`, `quotedCount` |
| `03_MD_Filter_*.csv` (6 files) | varies | 1 | M&D filter dropdown options | entities (19), materialCodes (12), materials (33), disciplines (12), projects (200), suppliers (1103) |

### 4. Suppliers Database (Cross-Tab)

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `04_Suppliers.csv` | 2,189 | 38 | SM supplier table + map, GSA supplier card, M&D supplier table + profile | Flattened from 6 nested objects. Key fields: `name`, `address_country_standardized` (→ `normalizeCountry()`), `contact_email`, `contact_phone`, `rating_score`, `location_latitude/longitude` (map pins), `supplier_score` |
| `04_Suppliers_Metadata.csv` | 8 | 2 | Build info | `total_suppliers`, `geocoded_count`, etc. |

### 5. Purchase Orders — Raw Detail (Cross-Tab)

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `05_Purchase_Orders.csv` | 3,539 | 29 | SM (enrichDashboardWithRealData for KPIs), M&D (PO linking) | Flattened from 5 nested objects. Key fields: `po_number`, `po_date`, `project_name`, `supplier_name`, `total_amount`, `currency`, `usd_equivalent`. Used to compute Total PO Spend KPI |
| `05_Purchase_Orders_Metadata.csv` | 10 | 2 | Build info | Source files, export date, record counts |

### 6. Quotations — Raw Detail (Cross-Tab)

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `06_Quotations_Full.csv` | 12,136 | 46 | SM (supplier profile enrichment, quotation details), M&D (quotation data) | Flattened from 9 nested objects. Includes ALL quotation types (RFQ + IQ). `status_normalized` for win/loss. `quoted_value` + `currency` for spend. `converted_to_po` + `po_number` for conversion tracking. `days_to_response` / `days_to_close` for metrics |
| `06_Quotations_Metadata.csv` | 10 | 2 | Build info | Source files, totals |

### 7. Dashboard Config Template

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `07_Dashboard_Summary_KPIs.csv` | 9 | 2 | Initial KPI values before real data loads | Template values (overridden by enrichDashboardWithRealData) |
| `07_Dashboard_SM_*.csv` (8 files) | varies | varies | SM chart initial configs | Pre-built chart data for: statusChart, entityComparison, topSuppliers, materialDistribution, responsibleEmployees, quotationToPOTime, monthlyTrend, supplierLocations |
| `07_Dashboard_Filter_*.csv` (5 files) | varies | 1 | Initial filter options | Overridden by real data filters |

### 8. Client Country Map (SM Map)

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `08_Client_Country_Map.csv` | 1,098 | 2 | SM tab Leaflet map rendering | `Client` → `Country`. Built by `build_client_country_map.py` using 4-source priority: address → phone_validation → phone_prefix → email_tld → entity fallback. Used in `applyFilters()` to build `countrySpend` map data |

### 9. RFQ→PO Conversion Times (SM Chart)

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `09_Conversion_Times_Records.csv` | 431 | 6 | SM Quotation-to-PO Time chart data | `daysToConvert` = `poDate - quotationDate` (in days). Linked by `orderId` matching between quotations and POs. Only quotations with matching POs are included |
| `09_Conversion_Times_Monthly_Avg.csv` | 88 | 3 | SM Quotation-to-PO Time chart (bar chart) | `month`, `avgDays` (AVG daysToConvert per month), `count` (linked POs that month). Displayed as bar chart with `Xd` labels on bars |
| `09_Conversion_Times_Summary.csv` | 2 | 2 | SM KPI reference | `totalLinked` (431 RFQ→PO links), `avgDays` (overall average conversion days) |

### 10. Change Orders (GSA Tab)

| CSV File | Records | Columns | Where Used | Calculation / Purpose |
|----------|:-------:|:-------:|------------|----------------------|
| `10_Change_Orders_Details.csv` | 191 | 5 | GSA CO groups analysis | CO detection: PO suffix `-1`=Base, `-2`+=Change Order. `poCount`=POs in group, `totalValueUSD`=SUM(valueUSD) for group |
| `10_Change_Orders_Summary.csv` | 3 | 2 | GSA CO KPIs | `totalGroups` (191), `totalChangeOrderPOs`, `totalChangeOrderValue` |

### 11-17. Pipeline Reference Data (Not loaded by dashboard)

| CSV File | Records | Columns | Purpose |
|----------|:-------:|:-------:|---------|
| `11_Material_Codes.csv` | 30 | 6 | Material code → letter prefix mapping for RFQ/PO numbering. Used by `build_v8_data.py` to assign `materialCode` |
| `12_Entity_Code_Map.csv` | 1,970 | 2 | Entity code (e.g. "V4359") → Entity name (e.g. "MVL Nepal"). Used by pipeline to resolve entity names from PO codes |
| `13_Employees.csv` | 18 | 6 | Employee performance: `name`, `quotationCount`, `orderCount`, `winRate`, `totalQuotedUSD`, `totalOrderedUSD`. Used by pipeline to build `responsibleEmployees` chart data |
| `14_Orders.csv` | 210 | 6 | Client order list: `Order Number`, `Order Date`, `Client Name`, `Supply of`, `Destination`. Used by pipeline for project/order linking |
| `15_Data_Metadata.csv` | 15 | 3 | Build metadata: source files, export dates, record counts per dataset |
| `16_Improvement_Summary.csv` | 9 | 4 | Data quality improvement log from enrichment pipeline (geocoding, phone validation, etc.) |
| `17_Location_Enrichment_Summary.csv` | 17 | 3 | Supplier geocoding results: total suppliers, geocoded count, valid phones, top countries |

---

## Key Calculations Reference

### SM Tab KPIs
| KPI | Formula | Source |
|-----|---------|--------|
| Total RFQs | `COUNT(sm_data.workbench)` | `01_SM_Workbench_Quotations.csv` |
| Total Quoted Value | `SUM(QuotationValue)` after USD conversion | `01_SM_Workbench_Quotations.csv` |
| Total Suppliers | `COUNT(DISTINCT Client)` | `01_SM_Workbench_Quotations.csv` |
| Total Entities | `COUNT(DISTINCT Entity)` | `01_SM_Workbench_Quotations.csv` |
| Avg Conversion Days | `AVG(daysToConvert)` | `09_Conversion_Times_Records.csv` |

### GSA Tab KPIs
| KPI | Formula | Source |
|-----|---------|--------|
| Total POs | `COUNT(gsa_data.workbench)` | `02_GSA_Workbench_POs.csv` |
| Total Spend | `SUM(valueUSD)` | `02_GSA_Workbench_POs.csv` |
| Change Orders | `COUNT(WHERE poType='Change Order')` | `02_GSA_Workbench_POs.csv` |
| CO Amount | `SUM(valueUSD WHERE poType='Change Order')` | `02_GSA_Workbench_POs.csv` |
| CO % of Spend | `(CO Amount / Total Spend) × 100` | Calculated |
| CO Groups | `COUNT(DISTINCT orderId WHERE changeOrderTotal > 1)` | `02_GSA_Workbench_POs.csv` |
| Active Suppliers | `COUNT(DISTINCT supplier)` | `02_GSA_Workbench_POs.csv` |
| Active Entities | `COUNT(DISTINCT entity)` | `02_GSA_Workbench_POs.csv` |

### M&D Tab KPIs
| KPI | Formula | Source |
|-----|---------|--------|
| Materials | `COUNT(DISTINCT material)` from quotations + POs | `03_MD_Quotations.csv` + `03_MD_POs.csv` |
| Material Codes | `COUNT(DISTINCT materialCode)` | `03_MD_Summary.csv` |
| Total Material Spend | `SUM(PO value)` after USD conversion | `03_MD_POs.csv` |
| Conversion % | `(totalOrdered / totalQuoted) × 100` | `03_MD_Summary.csv` |
| Active Projects | `COUNT(DISTINCT project)` from PO data | `03_MD_POs.csv` |
| Supplier Count | `COUNT(DISTINCT supplier)` from PO data | `03_MD_POs.csv` |

### Currency Conversion
All USD conversions use `convertToUSD(value, currency)` with FX rates defined in `scripts.js`:
- AED → USD: ÷ 3.6725
- EUR → USD: × 1.08
- GBP → USD: × 1.27
- SAR → USD: ÷ 3.75
- NPR → USD: ÷ 133.5
- INR → USD: ÷ 83.0
- (and more)

### Country Normalization
`normalizeCountry()` function (~150 entries) standardizes raw country values:
- "Dubai", "Abu Dhabi", "Sharjah", "uae", "U.A.E." → **"United Arab Emirates"**
- "KSA", "Riyadh", "Dammam" → **"Saudi Arabia"**
- "Türkiye", "TURKEY", "Istanbul" → **"Turkey"**
- US state names → **"United States"**
- UK city names → **"United Kingdom"**
- "---", "..." (garbage) → **"United Arab Emirates"** (default)

---

## How to Re-export

```bash
cd v8/data/export_csv
python export_all_data.py
```

This reads all 17 JSON files from `v8/data/` and regenerates all 77 CSVs.
