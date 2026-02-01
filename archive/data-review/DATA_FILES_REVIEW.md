# Data Files Review & Analysis - COMPLETE

**Review Date:** 30 January 2026  
**Source Folder:** `Re_ Quotation, PO and Expediting Modules Enhancement - Microtrack`  
**Status:** ✅ All files converted to CSV and analyzed

---

## 📊 Data Summary

| Dataset | File(s) | Rows | Columns |
|---------|---------|------|---------|
| Suppliers/Clients | 1 CSV | 2,542 | 11 |
| Purchase Orders | 1 CSV | 3,539 | 7 |
| Quotations | 5 CSVs | 12,532 | 14 |
| **TOTAL** | **7 CSVs** | **18,613** | - |

---

## 📁 File Structure

```
Re_ Quotation, PO and Expediting Modules Enhancement - Microtrack/
│
├── MVL_Clients_List_Jan-23-2026.csv       ✅ 2,542 rows
├── PO_List_Jan-23-2026.csv                ✅ 3,539 rows
│
└── Quotation Reports/
    ├── material.png                        📷 Screenshot - Microtrack Material UI
    ├── Quotation_Report_Jan-28-2026.csv    ✅ 3,011 rows
    ├── Quotation_Report_Jan-28-2026 (1).csv ✅ 3,008 rows
    ├── Quotation_Report_Jan-28-2026 (2).csv ✅ 3,009 rows
    ├── Quotation_Report_Jan-28-2026 (3).csv ✅ 3,006 rows
    └── Quotation_Report_Jan-28-2026 (4).csv ✅ 498 rows
```

---

## 📋 Column Definitions

### 1. MVL_Clients_List (Suppliers/Clients Directory)
**Rows:** 2,542 | **Maps to:** `DimSupplierClient`

| # | Column | Description | Data Quality Notes |
|---|--------|-------------|-------------------|
| 1 | No | Row number | Sequential |
| 2 | Type | Partner type | Many NULL - needs attention |
| 3 | Name | Company/Organization name | Primary identifier |
| 4 | Company | Company name (often NULL) | Redundant with Name? |
| 5 | Contact Name | Contact person | Some missing |
| 6 | Email | Email address | Available for most |
| 7 | Cc | CC email | Mostly NULL |
| 8 | Phone | Phone number | Various formats |
| 9 | Position | Job title | Mostly NULL |
| 10 | Address | Physical address | Multi-line, needs cleaning |
| 11 | TRN No | Tax Registration Number | Mostly NULL |

**Sample Types Observed:** (from raw data extraction)
- MICRON, MACRO, MVL Abu Dhabi, DEFENSE, MV LLC, Applicator, Client
- Includes suppliers from: UAE, USA, Afghanistan, Saudi Arabia, Qatar, etc.

---

### 2. PO_List (Purchase Orders)
**Rows:** 3,539 | **Maps to:** `FactPOTable`

| # | Column | Description | Example | Data Quality |
|---|--------|-------------|---------|--------------|
| 1 | No | Row number | 1, 2, 3... | Sequential |
| 2 | PO number | PO identifier | RFPO-5829-M4004-1 | ✅ Clean format |
| 3 | Po Date | PO placement date | 23 Jan 2026 | DD MMM YYYY format |
| 4 | PO Name | Description/Purpose | PO for AIR PAVEMENT... | Full text |
| 5 | Supplier | Supplier name | WECARE MACHINERY... | Needs linking to Clients |
| 6 | Total | PO value | 42000.00 | Numeric as text |
| 7 | Cur. | Currency | AED, USD | Text |

**PO Number Pattern Analysis:**
```
RFPO-5829-M4004-1
│    │    │ │    │
│    │    │ │    └── Order Type: 1=Base, 2=Change
│    │    │ └─────── Sequence: 4004
│    │    └───────── Material Code: M=Mechanical
│    └────────────── Project/Reference: 5829
└─────────────────── Prefix: RFPO (PO from RFQ)
```

---

### 3. Quotation_Report (Quotations)
**Rows:** 12,532 (across 5 files) | **Maps to:** `FactQuotationHeader`

| # | Column | Description | Example | Data Quality |
|---|--------|-------------|---------|--------------|
| 1 | No | Row number | 1, 2, 3... | Sequential |
| 2 | Number | Quote number | RFQ-5829-E6823 | ✅ Clean format |
| 3 | Company | Entity/Business unit | MACRO | MVL entity codes |
| 4 | Date | Quote date | 27 Jan 2026 | DD MMM YYYY format |
| 5 | Type | Quote type | RFQ, IQ | IQ=Internal, RFQ=External |
| 6 | Client | Client/Requestor | Andrea T.S. | Short names |
| 7 | Project Name | Project description | ORD-5829 UAE-123R... | Full project info |
| 8 | Description | Item description | Free Issued - Internal... | Detailed text |
| 9 | Material | Material type name | Electrical | From mapping |
| 10 | Material Code | Material category | Electrical, Mechanical | Letter code category |
| 11 | Quo. Value | Quote value | 4095 | Numeric |
| 12 | Cur. | Currency | AED, USD | Text |
| 13 | MVL Contact | Internal contact | Marman I. | Short name |
| 14 | Status | Quote status | Waiting, Order | Key field |

**Quote Number Pattern Analysis:**
```
RFQ-5829-E6823
│   │    │ │
│   │    │ └─── Sequence: 6823
│   │    └───── Material Code: E=Electrical
│   └────────── Project/Reference: 5829
└────────────── Type: RFQ or IQ (or Q for old format)
```

**Status Values:**
- `Quotation` - Initial state
- `Waiting` - Awaiting response
- `Order` - Converted to PO (Won)
- `Cancelled` - Cancelled/Lost

---

## 🔗 Data Relationships

### Linking Keys

```
QUOTATION                          PURCHASE ORDER
─────────────────────              ─────────────────────
RFQ-5829-E6823                     
    └── 5829-E6823 ──────────────► RFPO-5829-E6823-1 (Base)
                                   RFPO-5829-E6823-2 (Change)
```

### Entity Mapping (Company Column)
| Code | Entity |
|------|--------|
| MACRO | MVL MACRO |
| MICRON | MVL MICRON |
| MVL Abu Dhabi | MVL Abu Dhabi |
| MV LLC | MV LLC |
| DEFENSE | Defense Division |

---

## 📷 material.png - Screenshot Reference

**Content:** Screenshot from Microtrack system showing the Material management UI
**Purpose:** Reference for how materials are categorized in the source system
**Action:** Visual reference only - data mapping already documented in DATA_MAPPING_RULES.md

---

## 🔄 Data Transformation Requirements

### 1. Quotations → FactQuotationHeader
| Source Column | Target Column | Transformation |
|---------------|---------------|----------------|
| Number | QuotationNumber | Direct |
| Number | QuotationType | Extract prefix (RFQ/IQ) |
| Company | EntityKey | Map to DimEntity |
| Client | PartnerKey | Link to DimSupplierClient |
| Date | QuotationDateKey | Convert to YYYYMMDD |
| Material Code | MaterialKey | Map to DimMaterial |
| Status | QuotationStatusKey | Map to DimQuotationStatus |
| Quo. Value | QuotationValue | Convert to numeric |
| Cur. | CurrencyKey | Map to DimCurrency |
| Quo. Value | QuotationValueUSD | Apply FX conversion |
| Number | LinkingKey | Extract middle portion |

### 2. PO_List → FactPOTable
| Source Column | Target Column | Transformation |
|---------------|---------------|----------------|
| PO number | PONumber | Direct |
| PO number | POTypeKey | Extract last digit (1=Base, 2=Change) |
| PO number | SourceQuotationKey | Link via pattern matching |
| Po Date | POPlacementDateKey | Convert to YYYYMMDD |
| Supplier | PartnerKey | Link to DimSupplierClient |
| Total | POHeaderValue | Convert to numeric |
| Cur. | CurrencyKey | Map to DimCurrency |
| Total | POHeaderValueUSD | Apply FX conversion |
| PO number | MaterialKey | Extract letter code |

### 3. MVL_Clients_List → DimSupplierClient
| Source Column | Target Column | Transformation |
|---------------|---------------|----------------|
| No | PartnerKey | Use as key |
| Type | PartnerType | Clean and standardize |
| Name | PartnerName | Direct |
| Email | Email | Direct |
| Phone | Phone | Clean format |
| Address | Address | Clean multi-line |

---

## ⚠️ Data Quality Issues Identified

### High Priority
| Issue | Dataset | Count/Impact | Remediation |
|-------|---------|--------------|-------------|
| NULL Type values | Clients | Many rows | Derive from other fields or default |
| Currency as text | All | All rows | Convert to code |
| Date format | All | All rows | Parse "DD MMM YYYY" |
| Supplier name matching | POs | All rows | Fuzzy match to Clients list |

### Medium Priority
| Issue | Dataset | Count/Impact | Remediation |
|-------|---------|--------------|-------------|
| Multi-line Address | Clients | Many | Replace newlines |
| HTML entities in text | Quotes | Some | Decode &ndash; etc. |
| Short client names | Quotes | All | Full name lookup |
| Phone format varies | Clients | All | Standardize format |

### Low Priority
| Issue | Dataset | Count/Impact | Remediation |
|-------|---------|--------------|-------------|
| TRN mostly NULL | Clients | Most rows | Leave as is |
| Position mostly NULL | Clients | Most rows | Leave as is |
| Cc email mostly NULL | Clients | Most rows | Leave as is |

---

## 📊 Quick Statistics

### Quotations by Status (estimated from samples)
- Waiting - pending response
- Order - converted to PO
- Quotation - initial state
- Cancelled - lost/cancelled

### PO Types (from number pattern)
- **-1 suffix:** Base Orders
- **-2 suffix:** Change Orders

### Currencies Used
- AED (UAE Dirham)
- USD (US Dollar)
- EUR (likely present)

---

## ✅ Next Steps

1. **Merge Quotation Files** - Combine 5 CSVs into single dataset
2. **Create Dimension Tables** - Build DimDate, DimEntity, DimMaterial, etc.
3. **Clean and Transform** - Apply transformations listed above
4. **Generate Linking Keys** - Create keys to link Quotes ↔ POs
5. **Build JSON Files** - Create data.json for each HTML dashboard
6. **Test Integration** - Load JSON into HTML templates

---

*Analysis complete. Ready for data transformation phase.*
