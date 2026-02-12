# Data Comparison: Old v3 vs New MVLSupplierIntelHub

## Overview

| Aspect | Old (v3) | New (MVLSupplierIntelHub) |
|--------|----------|---------------------------|
| **Location** | `v3/*/data.json` | `MVLSupplierIntelHub/MVL Supply Chain Intel Hub - Data/json/` |
| **Quotations** | 12,532 records | 12,136 records |
| **Purchase Orders** | 7,697 records | 3,539 records |
| **Suppliers** | N/A (embedded) | 2,189 records (standalone) |
| **Data Structure** | Flat, simple | Nested, enriched |
| **Data Quality** | Basic | Enhanced with validation |
| **Date** | Jan 30, 2026 | Feb 9, 2026 |

---

## KEY DIFFERENCES

### 1. DATA STRUCTURE

#### OLD (v3) - Flat Structure
```json
{
  "QuotationID": "Q-1192-F12093",
  "SupplierName": "ABC Corp",
  "Entity": "MVL Marine",
  "MaterialGroup": "Electrical",
  "QuotationValue": 6016.5,
  "Currency": "AED",
  "Status": "Order",
  "CreatedDate": "2022-10-19"
}
```

#### NEW - Nested Structure
```json
{
  "id": "QUOT-3001",
  "quotation_number": "Q-1192-F12093",
  "quotation_components": {
    "prefix": "Q",
    "batch": "1192",
    "code": "F12093"
  },
  "company": "FIRESTOP",
  "dates": {
    "quotation_date": "2022-10-19",
    "quotation_date_original": "19 Oct 2022",
    "valid_until": null
  },
  "client": {
    "name": "Al F.F.",
    "type": "external"
  },
  "project": {
    "name": "PARK INN#ATCON#JVT#000004",
    "project_code": "ATCON"
  },
  "details": {
    "description": "SUPPLY OF INSS1186",
    "material_category": "Firestop/ DC 315",
    "material_code": "Fire"
  },
  "financial": {
    "quoted_value": 6016.5,
    "currency": "AED"
  },
  "contact": {
    "mvl_contact": "Ajeesh J."
  },
  "outcome": {
    "status": "Order",
    "status_normalized": "won",
    "converted_to_po": true
  },
  "metadata": {
    "data_quality_score": 1.0
  }
}
```

### 2. NEW FIELDS ADDED

#### Quotations
| New Field | Purpose |
|-----------|---------|
| `quotation_components` | Parsed Q number (prefix, batch, code) |
| `client.type` | "internal" or "external" classification |
| `project.project_code` | Extracted from project name |
| `contact.mvl_contact` | Sales person name |
| `outcome.status_normalized` | "won", "lost", "pending" |
| `outcome.converted_to_po` | Boolean flag |
| `metadata.data_quality_score` | 0-1 quality rating |
| `source_file` | Original Excel file |

#### Purchase Orders
| New Field | Purpose |
|-----------|---------|
| `po_components` | Parsed PO number (prefix, series, category, sequence) |
| `dates.expected_delivery` | Estimated delivery date |
| `supplier.supplier_id` | Link to supplier record (SUP-XXXX) |
| `status` | "recent", "active", "aging", "old" |
| `category` | "Material", "Office", "Vehicle", "Equipment", "Service" |
| `project.project_code` | Extracted from description |
| `metadata.data_quality_score` | 0-1 quality rating |

#### Suppliers (NEW DATASET)
| Field | Purpose |
|-------|---------|
| `id` | Unique ID (SUP-XXXX) |
| `material_category` | 28 categories |
| `contact.first_name/last_name` | Parsed from full name |
| `contact.title` | Extracted job title |
| `address.country_iso3` | Standardized country code |
| `location.latitude/longitude` | Geocoded coordinates |
| `phone_validation` | Validated phone country |
| `rating.score` | 0-5 rating scale |
| `supplier_score` | 0-100 calculated score |
| `metadata.data_quality_score` | Completeness rating |

### 3. DATA ENHANCEMENTS

| Enhancement | Description |
|-------------|-------------|
| **Email Validation** | 156 emails cleaned |
| **Phone Standardization** | 788 phones reformatted to international |
| **Contact Parsing** | 1,957 names parsed into first/last |
| **Supplier Scoring** | All 2,189 suppliers scored 0-100 |
| **PO Status** | All 3,539 POs categorized by age |
| **Category Detection** | 2,704 POs auto-categorized |
| **Project Extraction** | 846 project codes extracted |
| **Supplier Linking** | 98.9% POs linked to suppliers |

### 4. SALES PERFORMANCE METRICS (NEW)

Contact-level win rate tracking:
```json
"contact_performance": {
  "Islam S.": {
    "total_quotes": 907,
    "won": 467,
    "win_rate": 51.5,
    "total_value": 55,250,050.93,
    "won_value": 6,754,119.82
  }
}
```

---

## WHAT NEEDS TO UPDATE

### 1. SharePoint Lists (MT_*)

**Current Lists:**
- MT_Quotations (flat schema)
- MT_PurchaseOrders (flat schema)
- MT_Suppliers (basic)
- MT_Entities
- MT_Disciplines
- MT_MaterialGroups
- MT_Summary
- MT_SpendByMonth

**Required Changes:**
1. Add new columns to MT_Quotations:
   - `ClientType` (Choice: internal/external)
   - `ProjectCode` (Text)
   - `MVLContact` (Text)
   - `StatusNormalized` (Choice: won/lost/pending)
   - `DataQualityScore` (Number)

2. Add new columns to MT_PurchaseOrders:
   - `SupplierId` (Text - lookup to MT_Suppliers)
   - `POStatus` (Choice: recent/active/aging/old)
   - `POCategory` (Choice: Material/Office/Vehicle/Equipment/Service)
   - `ExpectedDelivery` (Date)
   - `ProjectCode` (Text)

3. Update MT_Suppliers:
   - `SupplierId` (Text - SUP-XXXX)
   - `ContactFirstName` (Text)
   - `ContactLastName` (Text)
   - `ContactTitle` (Text)
   - `CountryISO3` (Text)
   - `SupplierScore` (Number 0-100)
   - `PhoneValidated` (Boolean)

### 2. SPFx Models (TypeScript Interfaces)

Update `src/models/index.ts`:

```typescript
// Enhanced Quotation Interface
export interface IQuotation {
  Id: number;
  QuotationNumber: string;
  QuotationPrefix?: string;
  QuotationBatch?: string;
  QuotationCode?: string;
  Company?: string;
  ClientName: string;
  ClientType?: 'internal' | 'external';
  ProjectName?: string;
  ProjectCode?: string;
  MaterialCategory?: string;
  MaterialCode?: string;
  QuotationValue: number;
  Currency: string;
  Status: string;
  StatusNormalized?: 'won' | 'lost' | 'pending';
  ConvertedToPO?: boolean;
  MVLContact?: string;
  QuotationDate: string;
  DataQualityScore?: number;
}

// Enhanced Purchase Order Interface
export interface IPurchaseOrder {
  Id: number;
  PONumber: string;
  POPrefix?: string;
  POSeries?: string;
  POCategory?: string;
  SupplierName: string;
  SupplierId?: string;
  Description?: string;
  POValue: number;
  Currency: string;
  PODate: string;
  ExpectedDelivery?: string;
  POStatus?: 'recent' | 'active' | 'aging' | 'old';
  Category?: 'Material' | 'Office' | 'Vehicle' | 'Equipment' | 'Service';
  ProjectCode?: string;
  DataQualityScore?: number;
}

// New Supplier Interface
export interface ISupplier {
  Id: number;
  SupplierId: string;
  SupplierName: string;
  MaterialCategory: string;
  ContactFirstName?: string;
  ContactLastName?: string;
  ContactTitle?: string;
  Email?: string;
  Phone?: string;
  Country?: string;
  CountryISO3?: string;
  Rating: number;
  SupplierScore: number;
  TotalQuotes?: number;
  TotalOrders?: number;
  TotalSpend?: number;
}
```

### 3. SharePointService.ts

Update data mapping in `SharePointService.ts`:
- Handle new nested fields when writing to SharePoint
- Flatten JSON structure for SharePoint compatibility
- Add methods for new analytics

### 4. Dashboard Components

Update visualizations to use new fields:
- **Supplier Marketplace:** Add MVL Contact filter, show win rates
- **Global Spend:** Add PO category breakdown, aging analysis
- **New Dashboard:** Supplier performance with scores

### 5. Data Loading Script

Create new script: `load_improved_data.py`
```python
# Load from MVLSupplierIntelHub/json/*.json
# Flatten nested structure for SharePoint
# Update MT_* lists with new schema
```

---

## MIGRATION STEPS

1. **Backup Current Data**
   ```powershell
   python scripts/backup_sharepoint_data.py
   ```

2. **Update SharePoint List Schemas**
   - Add new columns to each list
   - Don't delete existing data

3. **Create Data Transformation Script**
   - Read from `MVLSupplierIntelHub/json/*_improved.json`
   - Flatten nested structures
   - Map to SharePoint columns

4. **Load New Data**
   ```powershell
   python scripts/load_improved_data.py
   ```

5. **Update SPFx Models**
   - Add new interfaces
   - Update existing interfaces

6. **Update SPFx Components**
   - Add new filters/visualizations
   - Use new data fields

7. **Rebuild & Deploy SPFx**
   ```powershell
   gulp bundle --ship
   gulp package-solution --ship
   ```

---

## FILE LOCATIONS

### Old Data (v3)
```
g:\Rita\mvl-powerbi-dashboards\v3\
├── supplier-marketplace\data.json     # 12,532 quotes
├── global-spend-analysis\data.json    # 7,697 POs
└── disciplines-consolidated\data.json # 28 disciplines
```

### New Data (MVLSupplierIntelHub)
```
g:\Rita\mvl-powerbi-dashboards\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data\json\
├── suppliers_improved.json            # 2,189 suppliers
├── purchase_orders_improved.json      # 3,539 POs
├── quotations_improved.json           # 12,136 quotes
├── metadata.json                      # Dataset metadata
└── improvement_summary.json           # Enhancement stats
```

### Source Excel Files
```
g:\Rita\mvl-powerbi-dashboards\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data\
├── MVL_Suppliers_List_ENRICHED.xlsx
├── MVL_Suppliers_List_Feb-05-2026.xlsx
├── PO_List_Jan-23-2026.xlsx
└── Quotation Reports\
    ├── Quotation_Report_Jan-28-2026.xlsx
    ├── Quotation_Report_Jan-28-2026 (1).xlsx
    ├── Quotation_Report_Jan-28-2026 (2).xlsx
    ├── Quotation_Report_Jan-28-2026 (3).xlsx
    └── Quotation_Report_Jan-28-2026 (4).xlsx
```

---

## SUMMARY

| Component | Action Required |
|-----------|-----------------|
| **SharePoint Lists** | Add new columns, don't delete existing |
| **Data Load Script** | Create new script for improved JSON |
| **SPFx Models** | Update TypeScript interfaces |
| **SPFx Components** | Add new visualizations for enhanced data |
| **v3 HTML** | Optionally update with new data structure |

**Key Benefits of New Data:**
- ✅ Supplier scoring (0-100) for performance tracking
- ✅ Sales performance by contact (win rates)
- ✅ PO aging analysis (recent/active/aging/old)
- ✅ Auto-categorization (Material/Office/Vehicle/etc.)
- ✅ Project code extraction for project-level reporting
- ✅ Data quality metrics for monitoring
- ✅ Supplier-PO linkage for supply chain analytics
