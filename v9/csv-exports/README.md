# MVL Dashboard — CSV Data Exports
> Auto-generated 2026-02-26 12:24

This folder contains CSV exports of **every JSON data file** used by the MVL Supply Chain Intel Hub v8 dashboard.
Each CSV is a flattened, analyst-friendly view of the underlying data with all nested objects expanded.

---

## Source → Dashboard Tab Mapping

| Source JSON | Dashboard Tab | Description |
|-------------|--------------|-------------|
| `gsa_data.json` | **Global Spend Analysis** (Orange tab) | All Purchase Orders with spend, entities, materials, change orders |
| `sm_data.json` | **Supplier Marketplace** (Blue tab) | RFQ Quotations with status, clients, contacts |
| `md_data.json` | **Materials & Disciplines** (Dark Blue tab) | Combined RFQs + POs by material/discipline |
| `change_orders.json` | GSA → Change Orders section | Change order groups and PO linkages |
| `conversion_times.json` | SM → Conversion analysis | RFQ-to-PO conversion days |
| `suppliers.json` | All tabs → Supplier profiles | Master supplier list (2,189 suppliers) |
| `client_country_map.json` | SM → Map / Geo analysis | Client name → Country mapping (1,098 entries) |

---

## CSV File Index

### 📊 GSA — Global Spend Analysis (Tab 2)

| # | File | Records | Description |
|---|------|---------|-------------|
| 01 | `01_GSA_PO_Workbench.csv` | ~3,746 | **Main PO list** — every purchase order with values, entities, materials, CO status |
| 02 | `02_GSA_Summary.csv` | 1 | Aggregate KPIs: total spend, PO count, supplier count, CO stats |
| 03 | `03_GSA_Supplier_Rankings_Top.csv` | ~10 | Top suppliers by USD spend with PO breakdown |
| 04 | `04_GSA_Supplier_Rankings_Bottom.csv` | ~10 | Lowest-spend suppliers |
| 05 | `05_GSA_Entity_Breakdown.csv` | ~18 | Spend per MVL entity (MACRO, VENTURES, etc.) |
| 06 | `06_GSA_Material_Breakdown.csv` | ~12 | Spend per material category |
| 07 | `07_GSA_Annual_Trend.csv` | ~14 | Year-by-year spend trend (base vs change order) |
| 08 | `08_GSA_Monthly_Trend.csv` | ~100+ | Month-by-month PO count and value |
| 09 | `09_GSA_PO_Type_Breakdown.csv` | 2 | Base PO vs Change Order summary |
| 10 | `10_GSA_Change_Order_Details.csv` | ~192 | CO groups: order ID, PO count, total value, linked POs |
| 11 | `11_GSA_Change_Order_Monthly.csv` | ~50+ | Monthly change order trend |
| 12 | `12_GSA_Filter_*.csv` | varies | Pre-computed filter option lists (entities, suppliers, materials, etc.) |

### 🔵 SM — Supplier Marketplace (Tab 1)

| # | File | Records | Description |
|---|------|---------|-------------|
| 13 | `13_SM_Quotation_Workbench.csv` | ~3,921 | **Main quotation list** — every RFQ with status, client, value |
| 14 | `14_SM_Summary.csv` | 1 | Aggregate KPIs: total quotations, POs, win rate, revision counts |
| 15 | `15_SM_Status_Summary.csv` | ~5 | Quotation status distribution (Order, Quotation, etc.) |
| 16 | `16_SM_Entity_Breakdown.csv` | ~27 | Quotation count and value per entity |
| 17 | `17_SM_Materials_By_Discipline.csv` | ~12 | Quotation count and value per material code |
| 18 | `18_SM_Contacts_Buyers.csv` | varies | MVL contact/buyer performance (PO count, spend) |
| 19 | `19_SM_Funnel.csv` | ~1 | Sales funnel: quotations still in "Quotation" status |
| 20 | `20_SM_Filter_*.csv` | varies | Pre-computed filter option lists |

### 🔷 M&D — Materials & Disciplines (Tab 3)

| # | File | Records | Description |
|---|------|---------|-------------|
| 21 | `21_MD_Quotations.csv` | ~3,921 | RFQ records for M&D view (value in USD) |
| 22 | `22_MD_Purchase_Orders.csv` | ~3,746 | PO records for M&D view (value in USD) |
| 23 | `23_MD_Summary.csv` | 1 | Aggregates: material/discipline counts, total quoted vs ordered |
| 24 | `24_MD_Discipline_Breakdown.csv` | ~12 | Per-discipline quoted/ordered values and counts |
| 25 | `25_MD_Entity_Breakdown.csv` | ~27 | Per-entity quoted/ordered values |
| 26 | `26_MD_Trend.csv` | ~100+ | Time-series trend data |
| 27 | `27_MD_Filter_*.csv` | varies | Pre-computed filter option lists |

### 🔄 Change Orders

| # | File | Records | Description |
|---|------|---------|-------------|
| 28 | `28_CO_Summary.csv` | 1 | Total CO groups, PO count, value |
| 29 | `29_CO_Group_Details.csv` | ~192 | Each CO group with linked PO numbers (semicolon-separated) |
| 30 | `30_CO_Expanded_POs.csv` | ~450+ | **Expanded**: one row per PO in each CO group for easy filtering |

### ⏱️ Conversion Times

| # | File | Records | Description |
|---|------|---------|-------------|
| 31 | `31_Conversion_Summary.csv` | 1 | Total linked RFQ→PO pairs, average conversion days |
| 32 | `32_Conversion_Records.csv` | ~180 | Individual RFQ→PO links with conversion days |
| 33 | `33_Conversion_Monthly_Average.csv` | ~50+ | Monthly average conversion days |

### 👥 Suppliers (Master List)

| # | File | Records | Description |
|---|------|---------|-------------|
| 34 | `34_Supplier_Metadata.csv` | 1 | Source file info, extraction date, improvement stats |
| 35 | `35_Supplier_Master_List.csv` | ~2,189 | **Fully flattened** supplier data: contact, address, location, phone validation, rating, quality score |

### 🌍 Client → Country Mapping

| # | File | Records | Description |
|---|------|---------|-------------|
| 36 | `36_Client_Country_Map.csv` | ~1,098 | Client abbreviation → Country name |

---

## Key Field Definitions & Calculations

### Currency Conversion
All `valueUSD` / `poSpendUSD` / `quotedValue` (in M&D) fields are converted to USD using these FX rates:
| Currency | Rate (1 USD = X) |
|----------|-----------------|
| USD | 1.0 |
| AED | 3.6725 |
| SAR | 3.75 |
| QAR | 3.64 |
| KWD | 0.307 |
| OMR | 0.385 |
| BHD | 0.376 |
| EUR | 0.92 |
| EURO | 0.92 |
| GBP | 0.79 |
| INR | 83.0 |
| PKR | 278 |
| EGP | 30.9 |
| JOD | 0.709 |
| LKR | 320 |
| NPR | 133.5 |
| JPY | 149.5 |
| ZAR | 18.5 |
| SGD | 1.34 |

**Formula:** `valueUSD = originalValue / FX_RATE`

### Change Order Classification (3-Tier Logic)
PO numbers follow pattern: `PREFIX-NUMBER_ENTITY-REVISION`

| Tier | Rule | poType | isChangeOrder |
|------|------|--------|---------------|
| **Standard CO** | PO/RFPO prefix, revision 2–6 | `"Change Order"` | `true` |
| **Independent** | PO/RFPO prefix, revision ≥ 7 | `"Base PO"` | `false` |
| **Standalone** | Any other prefix (RFQ, RFCE, etc.) | `"Base PO"` | `false` |

- `poVersion`: The revision number parsed from the PO number suffix
- `changeOrderGroup`: How many POs share the same base group key
- `changeOrderTotal`: Total POs in the group (base + change orders)
- `orderId`: Base group key (PO number without revision suffix)

### Entity Code → Entity Name Mapping
`entityCode` (e.g., "E6831") is parsed from PO number and mapped to entity name (e.g., "MACRO") via a 29-entry mapping table in the pipeline.

### Supplier Count
- `supplierCount`: Total from `suppliers.json` master list (2,189) — represents all known suppliers
- `activeSupplierCount`: Unique suppliers appearing in actual PO data (1,133) — suppliers with at least one PO

### SM Win Rate
`winRate = (totalPOs / totalQuotations) × 100`

### Conversion Days
`daysToConvert = poDate - quotationDate` (in calendar days, matched by orderId)

### Material vs Material Code
- `material`: Specific material name (e.g., "Bare Copper Grounding Cable") — 30+ unique names
- `materialCode`: Broader category (e.g., "Electrical") — 12 categories

---

## How to Regenerate
```bash
cd v8/csv-exports
python export_all_csv.py
```

Or with specific Python path:
```bash
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" export_all_csv.py
```
