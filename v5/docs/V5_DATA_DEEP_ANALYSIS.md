# V5 Data Files — Deep Analysis Report

**Date:** February 16, 2026  
**Analyst:** Automated deep scan of all V5 data files  
**Total data footprint:** ~44 MB across 13 JSON files + 1 CSV

---

## 1. Complete File Inventory

| # | File | Size | Records | Purpose |
|---|------|------|---------|---------|
| 1 | `sm_data.json` | 6.23 MB | 12,532 (workbench) | Supplier Marketplace dashboard data |
| 2 | `gsa_data.json` | 1.98 MB | 3,539 (workbench) | Global Spend Analysis dashboard data |
| 3 | `md_data.json` | 6.78 MB | 12,532 quotes + 3,539 POs | Materials & Disciplines dashboard data |
| 4 | `suppliers.json` | 3.12 MB | 2,189 suppliers | Enriched supplier master data |
| 5 | `purchase_orders.json` | 3.86 MB | 3,539 POs | Enriched PO source data |
| 6 | `quotations.json` | 21.98 MB | 12,136 quotations | Enriched quotation source data |
| 7 | `orders.json` | 0.05 MB | 210 orders | Client order records (distinct from POs) |
| 8 | `client_country_map.json` | 0.09 MB | 2,527 entries | Client name → country lookup |
| 9 | `dashboard_data.json` | 0.02 MB | N/A | Unified (but partially fabricated) dashboard config |
| 10 | `data_metadata.json` | 1.7 KB | N/A | Dataset metadata/provenance |
| 11 | `material_codes.json` | 8.9 KB | 30 materials | Material code reference data |
| 12 | `improvement_summary.json` | 5.2 KB | N/A | Data enrichment log |
| 13 | `location_enrichment_summary.json` | 452 B | N/A | Geocoding stats |
| 14 | `Order_LIST_Feb-12-2026.csv` | ~15 KB | 210 orders | Raw CSV from Microtrack |

---

## 2. Complete Data Schema Per File

### 2.1 `sm_data.json` — Supplier Marketplace

**Top-level keys:** `lastRefresh`, `summary`, `funnel`, `statusSummary`, `suppliers`, `entities`, `materialsByDiscipline`, `workbench`

| Key | Type | Details |
|-----|------|---------|
| `lastRefresh` | string | `"2026-01-30 18:03:52"` |
| `summary` | object | `totalQuotations` (12532), `totalPOs` (7697), `winRate` (97.7), `totalQuotationValueUSD` (3,598,785,628.58), `totalPOSpendUSD` (721,254,136.59), `totalClients` (2542), `totalEntities` (19) |
| `funnel` | object | `Quotation` (3851), `Waiting` (401), `Order` (7697), `Cancelled` (185) |
| `statusSummary` | array[4] | Fields: `Status`, `Count`, `TotalValueUSD` |
| `suppliers` | array[48] | Fields: `SupplierName`, `POCount`, `TotalSpendUSD` |
| `entities` | array[19] | Fields: `Entity`, `QuotationCount`, `TotalValueUSD` |
| `materialsByDiscipline` | array[12] | Fields: `MaterialCode`, `QuotationNumber`, `QuotationValueUSD` |
| `workbench` | array[12,532] | Fields: `id`, `QuotationNumber`, `QuotationType`, `Status`, `ProjectName`, `Description`, `MaterialCode`, `Material`, `Entity`, `Client`, `QuotationValue`, `Currency`, `Contact`, `Date` |

### 2.2 `gsa_data.json` — Global Spend Analysis

**Top-level keys:** `summary`, `annualTrend`, `monthlyTrend`, `supplierRankings`, `entityBreakdown`, `materialBreakdown`, `poTypeBreakdown`, `filters`, `workbench`

| Key | Type | Details |
|-----|------|---------|
| `summary` | object | `totalSpendUSD` (397,424,108.02), `totalPOs` (3539), `basePOs` (3224), `changeOrders` (315), `basePOValue`, `changeOrderValue`, `supplierCount` (1093), `projectCount` (98), `entityCount` (21), `avgPOValue` (112,298.42), `changeOrderRatio` (8.9) |
| `annualTrend` | array[15] | Fields: `year`, `baseValue`, `changeValue`, `totalValue`, `poCount`, `supplierCount` |
| `monthlyTrend` | array[25] | Fields: `yearMonth`, `value`, `count` |
| `supplierRankings` | object | `top` and `bottom` sub-arrays |
| `entityBreakdown` | array[21] | Fields: `name`, `valueUSD`, `poCount`, `baseValue`, `changeValue` |
| `materialBreakdown` | array[14] | Fields: `name`, `valueUSD`, `poCount` |
| `poTypeBreakdown` | object | `basePO`, `changeOrder` with count/value |
| `filters` | object | `entities` (21), `suppliers` (1093), `materials` (14), `years` (15), `currencies` (12), `poTypes` (2) |
| `workbench` | array[3,539] | Fields: `poNumber`, `poDate`, `poName`, `supplier`, `originalValue`, `currency`, `valueUSD`, `poType`, `entity`, `entityCode`, `project`, `material`, `year`, `month`, `yearMonth` |

### 2.3 `md_data.json` — Materials & Disciplines

**Top-level keys:** `summary`, `disciplines`, `entityBreakdown`, `trend`, `filters`, `quotations`, `pos`

| Key | Type | Details |
|-----|------|---------|
| `summary` | object | `disciplineCount` (28), `totalQuoted` (3,005,970,302.07), `totalOrdered` (397,424,108.02), `supplierCount` (1092), `projectCount` (98), `entityCount` (27), `conversionRate` (13.2) |
| `disciplines` | array[28] | Fields: `name`, `quotedValue`, `orderedValue`, `quotedCount`, `orderedCount`, `supplierCount`, `projectCount` |
| `entityBreakdown` | array[27] | Fields: `name`, `quotedValue`, `orderedValue`, `poCount`, `quoteCount` |
| `trend` | array[0] | **EMPTY — no trend data** |
| `filters` | object | `entities`, `disciplines`, `projects`, `suppliers` |
| `quotations` | array[12,532] | Fields: `number`, `baseNumber`, `entity`, `project`, `material`, `discipline`, `supplier`, `quotedValue`, `currency`, `status`, `type`, `date` |
| `pos` | array[3,539] | Fields: `poNumber`, `poDate`, `poName`, `supplier`, `entity`, `project`, `material`, `discipline`, `value`, `currency`, `year`, `month` |

### 2.4 `suppliers.json` — Supplier Master

**Top-level keys:** `metadata`, `suppliers`

Each supplier record (2,189 total):
| Field | Type | Sub-fields |
|-------|------|------------|
| `id` | string | e.g., `"SUP-0001"` |
| `legacy_no` | int | Original row number |
| `name` | string | Full company name |
| `material_category` | string | e.g., `"Subcontract"` |
| `contact` | object | `primary_contact`, `email`, `phone`, `fax`, `first_name`, `last_name`, `title` |
| `address` | object | `full_address`, `street`, `city`, `country`, `country_iso3`, `country_iso2`, `country_standardized` |
| `location` | object | `latitude`, `longitude`, `formatted_address`, `quality`, `quality_score` |
| `phone_validation` | object | `phone_country`, `phone_country_code`, `is_valid`, `matches_address` |
| `identifiers` | object | `trn_number`, `tax_id` |
| `rating` | object | `score` (0-5), `scale`, `last_updated` |
| `status` | string | `"active"` |
| `metadata` | object | `created_date`, `last_updated`, `data_quality_score`, `missing_fields` |
| `supplier_score` | float | 0-100 composite score |

### 2.5 `purchase_orders.json` — PO Source Data

**Top-level keys:** `metadata`, `purchase_orders`

Each PO record (3,539 total):
| Field | Type | Sub-fields |
|-------|------|------------|
| `id` | string | e.g., `"PO-0001"` |
| `legacy_no` | int | |
| `po_number` | string | e.g., `"RFPO-5829-M4004-1"` |
| `po_components` | object | `prefix`, `series`, `category`, `sequence` |
| `dates` | object | `po_date`, `po_date_original`, `created_date`, `approved_date`, `expected_delivery`, `actual_delivery` |
| `description` | string | |
| `project` | object | `project_code`, `project_name` |
| `supplier` | object | `name`, `supplier_id`, `matched` |
| `financial` | object | `total_amount`, `currency`, `usd_equivalent`, `exchange_rate` |
| `status` | string | `"recent"` / `"active"` / `"aging"` / `"old"` |
| `metadata` | object | `has_supplier`, `supplier_linked`, `data_quality_score`, `missing_fields` |
| `category` | string | `"Material"` / `"Office"` / `"Vehicle"` / `"Equipment"` / `"Service"` |

### 2.6 `quotations.json` — Quotation Source Data (Largest file: 22 MB)

**Top-level keys:** `metadata`, `quotations`

Each quotation record (12,136 total):
| Field | Type | Sub-fields |
|-------|------|------------|
| `id` | string | e.g., `"QUOT-0001"` |
| `series_number` | int | |
| `quotation_number` | string | e.g., `"Q-1192-F12093"` |
| `quotation_components` | object | `prefix`, `batch`, `code` |
| `company` | string | MVL entity name |
| `dates` | object | `quotation_date`, `quotation_date_original`, `created_date`, `sent_date`, `valid_until`, `response_date` |
| `type` | string | Short type code |
| `type_full` | string | Full type description |
| `client` | object | `name`, `client_id`, `type` (internal/external) |
| `project` | object | `name`, `project_code`, `project_category` |
| `details` | object | `description`, `material_category`, `material_code`, `quantity`, `unit` |
| `financial` | object | `quoted_value`, `currency`, `usd_equivalent`, `actual_po_value`, `variance` |
| `contact` | object | `mvl_contact`, `client_contact` |
| `outcome` | object | `status`, `status_normalized`, `converted_to_po`, `po_number`, `reason_lost`, `competitor`, `follow_up_date` |
| `metrics` | object | `days_to_response`, `days_to_close`, `success_probability` |
| `source_file` | string | Original Excel file name |
| `metadata` | object | `data_quality_score`, `missing_fields` |

### 2.7 `orders.json` — Client Orders

Simple flat array (210 records):
| Field | Example |
|-------|---------|
| `No` | `"1"` |
| `Order Number` | `"ORD-8473"` |
| `Order Date` | `"Feb 19, 2026"` |
| `Client Name` | `"Us A."` |
| `Supply of` | `"WMJ0159893"` |
| `Destination` | `"US"` |

### 2.8 `client_country_map.json`

Simple key-value object (2,527 entries):
```json
{ "Al F.F.": "United Arab Emirates", "Rimal I.S.": "United Arab Emirates", ... }
```

### 2.9 `dashboard_data.json` — Unified Dashboard Config

**Top-level keys:** `_version`, `_lastRefresh`, `_note`, `summary`, `filters`, `supplierMarketplace`, `globalSpendAnalysis`, `materialsAndDisciplines`

- `summary`: KPI summaries (rfqCount, quoteValue, poCount, poValue, winRate, etc.)
- `filters`: entity/project/supplier/status/material filter options
- `supplierMarketplace`: `statusChart`, `entityComparison`, `topSuppliers`, `materialDistribution`, `responsibleEmployees`, `quotationToPOTime`, `monthlyTrend`, `approvedMaterials`, `supplierLocations`
- `globalSpendAnalysis`: **`"_status": "pending"`** — empty placeholder
- `materialsAndDisciplines`: **`"_status": "pending"`** — empty placeholder

### 2.10 `material_codes.json`

**Top-level keys:** `_documentation`, `materials`, `material_code_letters`, `letter_to_material_code`

- `materials`: array[30] — each with `id`, `material_name`, `material_code`, `code_letter`, `code_range_start`, `code_range_end`
- `material_code_letters`: letter lookup by category
- `letter_to_material_code`: reverse lookup (letter → category)

### 2.11 `data_metadata.json`

Dataset provenance tracking: source files, record counts, improvements applied, data quality scores.

### 2.12 `Order_LIST_Feb-12-2026.csv`

**210 rows, 6 columns:**

| Column | Example |
|--------|---------|
| `No` | `1` |
| `Order Number` | `ORD-8473` |
| `Order Date` | `Feb 19, 2026` |
| `Client Name` | `Us A.` |
| `Supply of` | `WMJ0159893` |
| `Destination` | `US` |

---

## 3. Data Redundancy Map

### 3.1 Quotation Data — TRIPLE STORED

| Source | Records | Structure | Used By |
|--------|---------|-----------|---------|
| `quotations.json` | 12,136 | Deeply nested (18 top-level fields, ~50 total) | Source of truth |
| `sm_data.json` → `workbench` | 12,532 | Flat (14 fields) | Supplier Marketplace dashboard |
| `md_data.json` → `quotations` | 12,532 | Flat (12 fields) | Disciplines dashboard |

**Record count mismatch:** `quotations.json` has 12,136 records but `sm_data.json` and `md_data.json` both have 12,532. The extra 396 records in sm/md have **empty fields** (no QuotationNumber, no Entity, QuotationValue=0). These appear to be padding/summary rows leaked from Excel.

**Quotation numbers overlap:** All 12,072 unique quotation numbers in `sm_data` are identical to those in `quotations.json`. 

### 3.2 Purchase Order Data — TRIPLE STORED

| Source | Records | Structure | Used By |
|--------|---------|-----------|---------|
| `purchase_orders.json` | 3,539 | Deeply nested (12 top-level fields, ~30 total) | Source of truth |
| `gsa_data.json` → `workbench` | 3,539 | Flat (15 fields) | Global Spend dashboard |
| `md_data.json` → `pos` | 3,539 | Flat (12 fields) | Disciplines dashboard |

**PO number overlap:** All 3,522 unique PO numbers appear in both `gsa_data` and `md_data` — 100% identical.

### 3.3 Supplier Data — QUADRUPLE STORED

| Source | Details |
|--------|---------|
| `suppliers.json` | 2,189 full supplier records (master) |
| `sm_data.json` → `suppliers` | 48 aggregated supplier summaries |
| `gsa_data.json` → `supplierRankings` | Top/bottom supplier rankings |
| `dashboard_data.json` → `topSuppliers` | 10 top suppliers (with fabricated round numbers) |
| `client_country_map.json` | 2,527 client→country mappings |

### 3.4 Entity/Material Aggregations — TRIPLE STORED

Summary/aggregation data for entities and materials exists independently in `sm_data.json`, `gsa_data.json`, `md_data.json`, and `dashboard_data.json` — each calculated separately with potential for drift.

### 3.5 Orders — DOUBLE STORED

| Source | Records |
|--------|---------|
| `orders.json` | 210 records |
| `Order_LIST_Feb-12-2026.csv` | 210 records (identical data) |

The JSON is a direct conversion of the CSV.

---

## 4. Field Naming Inconsistencies

### 4.1 Same Concept, Different Names

| Concept | `sm_data` | `gsa_data` | `md_data` | `purchase_orders.json` | `quotations.json` | `orders.json` |
|---------|-----------|------------|-----------|----------------------|-------------------|---------------|
| **PO Number** | — | `poNumber` | `poNumber` | `po_number` | — | `Order Number` |
| **Quotation Number** | `QuotationNumber` | — | `number` | — | `quotation_number` | — |
| **Supplier/Contact** | `Contact` ⚠️ | `supplier` | `supplier` | `supplier.name` | `contact.mvl_contact` | — |
| **Entity** | `Entity` | `entity` | `entity` | — | `company` | — |
| **Value (USD)** | `QuotationValue` | `valueUSD` / `originalValue` | `value` | `financial.total_amount` | `financial.quoted_value` | — |
| **Date** | `Date` | `poDate` | `poDate` | `dates.po_date` | `dates.quotation_date` | `Order Date` |
| **Material** | `MaterialCode` + `Material` | `material` | `material` + `discipline` | `category` | `details.material_category` + `details.material_code` | — |
| **Status** | `Status` | `poType` | `status` | `status` | `outcome.status` | — |
| **Project** | `ProjectName` | `project` | `project` | `project.project_name` | `project.name` | `Supply of` |

### 4.2 Casing Inconsistencies

- **PascalCase** in `sm_data.json`: `QuotationNumber`, `QuotationType`, `MaterialCode`, `TotalValueUSD`
- **camelCase** in `gsa_data.json`: `poNumber`, `poDate`, `valueUSD`, `entityCode`
- **snake_case** in `purchase_orders.json` / `quotations.json`: `po_number`, `quotation_date`, `material_category`
- **Space-separated** in `orders.json`: `Order Number`, `Order Date`, `Client Name`

### 4.3 Semantic Confusion

| Field | Actual Meaning | Misleading Name |
|-------|----------------|-----------------|
| `sm_data.workbench.Contact` | MVL employee who handled the quotation | Sounds like client contact |
| `sm_data.suppliers.SupplierName` | Also MVL employee name, NOT actual supplier company | Sounds like company |
| `gsa_data.summary.totalPOs` | Unique PO records (3,539) | Same label as sm_data's `totalPOs` (7,697) which counts won quotations |
| `sm_data.summary.totalPOs` | Won quotations count (7,697) | Should be `totalWonQuotations` |
| `dashboard_data.summary.poCount` | 7,697 (won quotations, not POs) | Misleading |
| `md_data.summary.conversionRate` | 13.2% | vs sm_data `winRate` 97.7% — completely different metrics |

---

## 5. Data Quality Issues

### 5.1 Critical Issues

| Issue | Severity | Details |
|-------|----------|---------|
| **Fabricated dashboard data** | 🔴 CRITICAL | `dashboard_data.json` entity values are round numbers (1,800,000,000; 800,000,000; etc.) that don't match real data. Actual Yamauchi Gumi value: 1,861,623,661.20 vs dashboard: 1,800,000,000 |
| **Fabricated supplier locations** | 🔴 CRITICAL | `dashboard_data.json` → `supplierLocations` contains invented suppliers like "US Supplier Corp", "Diego Garcia Logistics", "Qatar Construction LLC" that don't exist in real data |
| **Fabricated monthly trends** | 🔴 CRITICAL | `dashboard_data.json` → `monthlyTrend` has perfectly fabricated numbers (850, 920, 1050...) not from real data |
| **Fabricated quotation-to-PO time** | 🔴 CRITICAL | `dashboard_data.json` → `quotationToPOTime` (12, 15, 10 days per month) is entirely made up |
| **Fabricated approved materials** | 🔴 CRITICAL | spec codes like "ASTM-A615-GR60", "ACI-318-21" are plausible but invented |
| **Contact ↔ Currency data leak** | 🔴 CRITICAL | 16 records in `sm_data.workbench` have currency values in the `Contact` field (e.g., `"2,146,477.00(JPY)"`, `"1,660,000.03(USD)"`) — data shifted from wrong columns |
| **398 empty workbench records** | 🟡 HIGH | Records with no QuotationNumber, no Entity, QuotationValue=0 — summary rows from Excel leaked into dataset |
| **"Cancled" typo** | 🟡 HIGH | `quotations.json` has status `"Cancled"` instead of `"Cancelled"` (185 records) |
| **Blank top supplier** | 🔴 CRITICAL | `sm_data.suppliers[0]` has `SupplierName: " "` with $503.8M spend (70% of all spend!) — this is the "Admin" or unassigned bucket |
| **Win rate confusion** | 🟡 HIGH | `sm_data.summary.winRate` = 97.7% (won quotations / total excluding "Quotation" status). `md_data.summary.conversionRate` = 13.2%. Both claim to measure conversion but use different denominators |

### 5.2 Data Completeness Issues

| Issue | Count | Details |
|-------|-------|---------|
| POs with empty supplier name | 45 | In `gsa_data.workbench` |
| POs with "Unknown" entity | 92 | In `gsa_data.workbench` |
| POs with discipline "General" (catchall) | 330 | In `md_data.pos` |
| Quotations with `status = None` | 2 | In `quotations.json` |
| Quotations with `currency = None` | 1 | In `quotations.json` |
| Invalid currency: `"Avg. :"` | 1 | In `quotations.json` — summary row |
| `KD` vs `KWD` inconsistency | 1 | Should be standardized to `KWD` |
| `md_data.trend` array | 0 items | **Completely empty** — no trend data generated |
| `dashboard_data.globalSpendAnalysis` | pending | **Empty placeholder** |
| `dashboard_data.materialsAndDisciplines` | pending | **Empty placeholder** |
| Supplier geocoding | Only 20 of 2,189 | 99.1% of suppliers have no lat/lng coordinates |
| Location quality | 1,046 "low", 1,132 "medium", 11 "high" | Most supplier locations are poor quality |
| `"Dubai"` as country | 33 suppliers | Should be `"United Arab Emirates"` |

### 5.3 Value Discrepancies

| Metric | `sm_data` | `gsa_data` | `md_data` | `dashboard_data` |
|--------|-----------|------------|-----------|-------------------|
| Total PO Spend (USD) | 721,254,136.59 | 397,424,108.02 | 397,424,108.02 | 721,300,000 |
| Total POs | 7,697 (won quotes) | 3,539 (actual POs) | 3,539 (actual POs) | 7,697 |
| Total Quotation Value | 3,598,785,628.58 | — | 3,005,970,302.07 | 3,600,000,000 |
| Total Suppliers | — | 1,093 | 1,092 | — |
| Total Entities | 19 | 21 | 27 | 8 |

The massive discrepancy in "totalPOs" (7,697 vs 3,539) exists because `sm_data` counts *won quotations* as POs, while `gsa_data` and `purchase_orders.json` count actual PO records. Similarly, the $721M vs $397M spend discrepancy is because sm_data's PO spend sums won quotation values (which include multi-currency conversions differently).

---

## 6. Missing Data

| What's Missing | Impact | Source Available? |
|----------------|--------|-------------------|
| **RFQ-to-PO linkage** | Cannot trace which quotation became which PO | Yes — linking key is in the document number (e.g., `RFQ-7139-V4359-1` → `RFPO-7139-V4359-1`) but not systematically linked |
| **Change order details** | CO data exists in POs but no separate tracking | Derivable from PO number suffix (>1 = change order) |
| **Delivery tracking** | Only 178 of 3,539 POs have estimated delivery dates | Not in source data |
| **Payment/invoice data** | No payment status or invoice tracking | Not available |
| **Supplier performance history** | No historical rating changes | Only current rating stored |
| **Currency exchange rates** | No rate table; USD equivalents exist but rates aren't stored | Implied in data |
| **Project hierarchy** | Projects exist as flat text, no parent/child relationship | Not available |
| **Geographic data for clients** | `client_country_map.json` exists but not linked to quotations/POs | Available to join |
| **Trend data** | `md_data.trend` is empty (0 items) | Needs to be computed |
| **Document attachments** | No links to PDFs, drawings, specs | Not in source data |

---

## 7. Recommendations for V6 Data Model

### 7.1 Eliminate Redundancy — Single Source of Truth

**Current state:** Same data is stored 3-4 times in different formats/shapes.

**Proposed V6 architecture:**

```
v6/data/
├── core/                          # Source of truth (normalized)
│   ├── quotations.json            # 12,136 records (enriched)
│   ├── purchase_orders.json       # 3,539 records (enriched)
│   ├── suppliers.json             # 2,189 records (enriched)
│   ├── orders.json                # 210 client orders
│   └── reference/
│       ├── material_codes.json    # 30 material code definitions
│       ├── entities.json          # Entity master list
│       ├── currencies.json        # Currency codes + exchange rates
│       └── countries.json         # Country standardization table
│
├── computed/                      # Dashboard-ready aggregations (auto-generated)
│   ├── sm_aggregations.json       # Supplier Marketplace summaries
│   ├── gsa_aggregations.json      # Global Spend summaries
│   ├── md_aggregations.json       # Materials/Disciplines summaries
│   └── kpi_summary.json           # Unified KPI card data
│
└── config/
    ├── filters.json               # Available filter options
    └── dashboard_config.json      # Layout & color preferences only
```

### 7.2 Unified Data Model (TypeScript Interfaces)

```typescript
// ===== CORE ENTITIES =====

interface Quotation {
  id: string;                      // "QUOT-0001"
  quotation_number: string;        // "RFQ-7139-V4359-1"
  series_number: number;
  
  // Parsed components
  prefix: string;                  // "RFQ"
  project_ref: string;             // "7139"
  material_letter: string;         // "V"
  sequence: string;                // "4359"
  version: number;                 // 1
  linking_key: string;             // "7139-V4359" (links to PO)
  
  // Relationships
  entity_code: string;             // FK to Entity
  supplier_id: string | null;      // FK to Supplier (if won)
  client_name: string;
  client_country: string | null;
  mvl_contact: string;             // Employee who handled it
  
  // Details
  project_name: string;
  project_code: string | null;
  description: string;
  material_category: string;       // "Firestop/ DC 315"
  material_code: string;           // "Fire"
  discipline: string;              // Computed from material_code
  
  // Financial
  quoted_value: number;
  currency: string;                // ISO 4217 (AED, USD, EUR, etc.)
  usd_equivalent: number | null;
  
  // Dates
  quotation_date: string;          // ISO 8601
  
  // Outcome
  status: 'won' | 'lost' | 'pending' | 'cancelled' | 'waiting';
  converted_to_po: boolean;
  linked_po_number: string | null;
  
  // Quality
  data_quality_score: number;      // 0-1
}

interface PurchaseOrder {
  id: string;                      // "PO-0001"
  po_number: string;               // "RFPO-5829-M4004-1"
  
  // Parsed components
  prefix: string;                  // "RFPO"
  project_ref: string;             // "5829"
  material_letter: string;         // "M"
  sequence: string;                // "4004"
  order_type: number;              // 1=base, 2+=change order
  linking_key: string;             // "5829-M4004"
  is_change_order: boolean;
  
  // Relationships
  entity_code: string;
  supplier_id: string | null;      // FK to Supplier
  supplier_name: string;
  linked_quotation_id: string | null;  // FK to Quotation via linking_key
  
  // Details
  description: string;
  project_name: string;
  project_code: string | null;
  material_code: string;
  discipline: string;
  category: string;                // "Material" | "Office" | "Vehicle" | "Equipment" | "Service"
  
  // Financial
  total_amount: number;
  currency: string;
  usd_equivalent: number;
  
  // Dates
  po_date: string;                 // ISO 8601
  expected_delivery: string | null;
  
  // Status
  age_status: 'recent' | 'active' | 'aging' | 'old';
  
  // Quality
  data_quality_score: number;
}

interface Supplier {
  id: string;                      // "SUP-0001"
  name: string;
  material_category: string;
  
  // Contact
  primary_contact: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  
  // Location
  country: string | null;          // Standardized name
  country_iso3: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Metrics
  rating: number;                  // 0-5
  supplier_score: number;          // 0-100
  
  // Computed (from PO/Quotation joins)
  total_po_count: number;
  total_spend_usd: number;
  total_quote_count: number;
  win_rate: number;
  
  status: 'active' | 'inactive';
  data_quality_score: number;
}

interface ClientOrder {
  id: string;
  order_number: string;            // "ORD-8473"
  order_date: string;              // ISO 8601
  client_name: string;
  description: string;             // "Supply of" field
  destination: string;
  country: string | null;          // Computed from destination + client_country_map
}

// ===== COMPUTED AGGREGATIONS =====

interface DashboardKPIs {
  total_quotations: number;        // 12,136 (actual unique quotes)
  total_quotation_value_usd: number;
  total_purchase_orders: number;   // 3,539 (actual POs)
  total_po_spend_usd: number;     // From POs, not won quotations
  base_po_count: number;
  change_order_count: number;
  win_rate: number;                // Won / (Won + Lost + Cancelled)
  conversion_rate: number;         // POs / Total Quotations
  active_suppliers: number;
  total_entities: number;
  last_refresh: string;
}
```

### 7.3 Key Changes from V5

1. **Consolidate "Contact" vs "Supplier"**: In V5, `sm_data.suppliers.SupplierName` is actually MVL employee names, not supplier companies. Rename to `mvl_contact` everywhere.

2. **Fix PO count semantics**: Clearly separate "won quotations" (7,697) from "actual PO records" (3,539). Never call won quotations "POs".

3. **Standardize field naming**: Use `snake_case` everywhere. No more PascalCase/camelCase mix.

4. **Add linking keys**: The `linking_key` field (e.g., `7139-V4359`) enables RFQ↔PO joins without scanning.

5. **Remove fabricated data**: Delete all round-number placeholder data from `dashboard_data.json`. Compute aggregations from real data.

6. **Fix status values**: Normalize `"Cancled"` → `"cancelled"`, use lowercase enum values consistently.

7. **Fix currency codes**: `"EURO"` → `"EUR"` (ISO 4217), `"KD"` → `"KWD"`, remove `"Avg. :"`.

8. **Separate computation layer**: Dashboard-ready aggregations should be computed files generated from core data, not hand-maintained JSON.

9. **Add data lineage**: Each computed file should reference which core files and transform generated it.

10. **Country standardization**: Fix `"Dubai"` → `"United Arab Emirates"`, ensure all countries use ISO 3166 names.

### 7.4 Build Pipeline

```
[Excel/CSV Sources] 
    → extract.py (parse, clean, validate)
    → core/*.json (normalized source of truth)
    → compute_aggregations.py (summarize for dashboards)
    → computed/*.json (dashboard-ready, never hand-edited)
    → HTML dashboards load from computed/*.json
```

---

## 8. Summary of Critical Findings

| # | Finding | Priority |
|---|---------|----------|
| 1 | **`dashboard_data.json` contains fabricated data** — round numbers, invented suppliers, fake metrics | 🔴 P0 |
| 2 | **Same data stored 3-4 times** in different formats, causing drift and inconsistency | 🔴 P0 |
| 3 | **"PO count" means two different things** — 7,697 (won quotes) vs 3,539 (actual POs) depending on file | 🔴 P0 |
| 4 | **16 records have currency data in Contact field** — column shift from source | 🟡 P1 |
| 5 | **398 empty/padding records** in sm_data and md_data workbenches | 🟡 P1 |
| 6 | **Top "supplier" has blank name with $503.8M** — 70% of all spend is unattributed | 🔴 P0 |
| 7 | **Status typo "Cancled"** propagated through quotations.json | 🟡 P1 |
| 8 | **Field naming chaos** — 4 different conventions (PascalCase, camelCase, snake_case, space-separated) | 🟡 P1 |
| 9 | **md_data.trend is empty** — no trend data computed | 🟡 P1 |
| 10 | **Only 20 of 2,189 suppliers geocoded** (0.9%) | 🟢 P2 |
| 11 | **No RFQ→PO systematic linkage** despite linking key being derivable | 🟡 P1 |
| 12 | **Two dashboard sections marked "pending"** (GSA, M&D in dashboard_data.json) | 🟡 P1 |
