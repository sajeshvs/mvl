# MVL Supply Chain Intel Hub - Data Analysis & JSON Conversion Plan

## 📊 Executive Summary

Analyzed three datasets for MVL Supply Chain Intelligence Hub:
- **MVL Supplier List**: 2,189 suppliers with 13 fields
- **PO List**: 3,539 purchase orders with 7 fields
- **Quotation Reports**: ~12,176 total quotations across 5 files with 14 fields each

---

## 1. MVL SUPPLIER LIST ANALYSIS

### 📋 Current Structure
| Column | Filled | Missing | Quality Issue |
|--------|--------|---------|---------------|
| No | 100% | 0% | ✓ Good |
| Material | 99.0% | 1.0% | ✓ Good |
| Name | 100% | 0% | ✓ Good |
| Contact Name | 89.4% | 10.6% | ⚠️ Some missing |
| Email | 87.0% | 13.0% | ⚠️ Some missing |
| Phone | 99.0% | 1.0% | ✓ Good |
| Fax_Number | 23.3% | 76.7% | ❌ Mostly empty (legacy field) |
| Address | 67.3% | 32.7% | ⚠️ Significant missing |
| Street | 31.7% | 68.3% | ❌ Mostly empty |
| City | 69.8% | 30.2% | ⚠️ Significant missing |
| Country | 77.1% | 22.9% | ⚠️ Some missing |
| TRN No | 4.9% | 95.1% | ❌ Mostly empty (tax registration) |
| Rating | 100% | 0% | ✓ Good |

### 🔍 Key Findings

**Material Categories (28 types):**
- Building Materials: 618 suppliers (28.2%)
- Subcontract: 606 suppliers (27.7%)
- Electrical: 151 suppliers (6.9%)
- Misc.: 139 suppliers (6.4%)
- Mechanical Items: 126 suppliers (5.8%)

**Geographic Distribution:**
- UAE/United Arab Emirates: 591 suppliers (inconsistent naming)
- Afghanistan: 158 suppliers
- USA: 119 suppliers
- Qatar: 77 suppliers
- Nepal: 73 suppliers

**Rating Distribution:**
- 90.5% (1,980) suppliers have 0.0 rating (unrated/new)
- 6.9% (150) suppliers have 3.0 rating
- Only 12 suppliers (0.5%) have ratings above 3.0

### ⚠️ Data Quality Issues

1. **Country Name Inconsistency**: UAE, United Arab Emirates, U.A.E., CHINA, China
2. **Material Category Overlap**: "Misc." category too broad
3. **Address Fields Fragmentation**: Address, Street, City split inconsistently
4. **Unrated Suppliers**: 90.5% have default 0.0 rating
5. **Legacy Fields**: Fax_Number (76.7% empty), TRN No (95.1% empty)
6. **Missing Contact Info**: 13% missing emails, 10.6% missing contact names

### 💡 Improvement Recommendations

1. **Standardize Country Names**: Normalize to ISO country codes or standard names
2. **Consolidate Address**: Merge Address, Street, City into structured address object
3. **Enhance Material Categories**: Break down "Misc." into specific sub-categories
4. **Rating System**: Implement actual rating mechanism or remove default 0.0
5. **Contact Validation**: Validate and encourage complete contact information
6. **Remove/Archive Legacy**: Consider removing Fax_Number, making TRN No optional
7. **Add Metadata**: Created date, last updated, active status
8. **Unique Identifiers**: Add UUID for each supplier (in addition to sequential No)

---

## 2. PO LIST ANALYSIS

### 📋 Current Structure
| Column | Filled | Missing | Data Type |
|--------|--------|---------|-----------|
| No | 100% | 0% | Integer |
| PO number | 100% | 0% | String (format: RFPO-####-X####-#) |
| Po Date | 100% | 0% | String (needs parsing) |
| PO Name | 100% | 0% | String (description) |
| Supplier | 98.7% | 1.3% | String |
| Total | 100% | 0% | Float |
| Cur. | 100% | 0% | String (AED, USD, etc.) |

### 🔍 Key Findings

**Sample PO Numbers Format:**
- RFPO-5829-M4004-1
- RFPO-1569-O121-1
- RFPO-5532-M4050-2

**Date Format:** "23 Jan 2026", "22 Jan 2026" (human-readable but not ISO)

**Currencies:** AED, USD (potentially more)

**Total POs:** 3,539 purchase orders

### ⚠️ Data Quality Issues

1. **Date Format**: Not ISO 8601 standard (not sortable/queryable)
2. **Missing Supplier**: 45 POs (1.3%) have no supplier assigned
3. **No PO Status**: No indication of PO status (pending, approved, completed, cancelled)
4. **No Line Items**: Only total amount, no item-level detail
5. **No Project Link**: PO Name contains project info but not structured
6. **Currency Handling**: No exchange rates or standardization
7. **No Metadata**: Creation date, approval date, delivery date missing

### 💡 Improvement Recommendations

1. **Standardize Dates**: Convert to ISO 8601 format (YYYY-MM-DD)
2. **Add PO Status**: pending, approved, in_progress, completed, cancelled
3. **Extract Project ID**: Parse project code from PO Name or add separate field
4. **Link to Supplier**: Make supplier ID reference to Supplier List
5. **Add Metadata**: created_date, approved_date, expected_delivery_date, actual_delivery_date
6. **Currency Object**: Include exchange_rate and base_currency_amount
7. **PO Components**: Break down PO number into parts (prefix, series, category, sequence)
8. **Line Items**: Consider separating PO header from line items (if available)
9. **Add Categories**: PO category/type based on material or project
10. **Validation**: Ensure all POs have supplier (fix 45 missing)

---

## 3. QUOTATION REPORTS ANALYSIS

### 📋 Current Structure

**5 Files with similar structure:**
- Quotation_Report_Jan-28-2026.xlsx: 3,012 rows
- Quotation_Report_Jan-28-2026 (1).xlsx: 3,009 rows
- Quotation_Report_Jan-28-2026 (2).xlsx: 3,010 rows
- Quotation_Report_Jan-28-2026 (3).xlsx: 3,007 rows
- Quotation_Report_Jan-28-2026 (4).xlsx: 138 rows

**Total Quotations: ~12,176** (with header row in each file = ~9,171 actual quotes)

### Columns (After Header Row):
1. No (Series Number)
2. Number (Quotation Number: Q-####-X#####)
3. Company (Quotation sender company)
4. Date
5. Type (IQ = Internal Quote?, etc.)
6. Client
7. Project Name
8. Description
9. Material
10. Material Code
11. Quo. Value (Quotation Value)
12. Cur. (Currency)
13. MVL Contact
14. Status (Order, Lost, etc.)

### 🔍 Key Findings

**Quotation Number Format:**
- Q-1192-F12093
- Q-1192-F12072A

**Series Numbers:** 3001-3012 (sequential across files)

**Types:** IQ (Internal Quotation?)

**Status Values:** Order, Lost (potentially more)

**Header Row Issue:** First row contains column names, not in standard Excel header position

### ⚠️ Data Quality Issues

1. **Header Row Problem**: Column names in first data row, not in Excel header
2. **Unnamed Columns**: Excel shows "Unnamed: 1", "Unnamed: 2", etc.
3. **File Fragmentation**: 5 separate files with overlapping series numbers
4. **Inconsistent Structure**: File 4 has only 138 rows vs ~3,000 in others
5. **Date Format**: Needs standardization
6. **No Outcome Tracking**: Won/Lost amounts, reasons
7. **Series Number Logic**: Unclear why series numbers are 3001+ (may indicate filtering)
8. **Material Code**: No apparent link to standard material codes
9. **Company Field**: Unclear if it's MVL company or external
10. **No Follow-up Data**: No conversion to PO tracking

### 💡 Improvement Recommendations

1. **Fix Headers**: Skip first row and use actual column names in import
2. **Merge Files**: Combine all 5 files into single dataset based on series number
3. **Deduplicate**: Check for duplicate quotations across files
4. **Standardize Dates**: Convert to ISO 8601
5. **Expand Status**: won, lost, pending, expired, converted_to_po
6. **Link to PO**: Add po_number field for converted quotations
7. **Add Win/Loss Tracking**: 
   - reason_lost
   - competitor_won
   - actual_po_value vs quoted_value
8. **Quotation Validity**: Add valid_until date
9. **Stage Tracking**: draft, sent, under_review, revised, final
10. **Client Link**: Reference to client/supplier database
11. **Material Alignment**: Link Material Code to standard material catalog
12. **Response Metrics**: days_to_respond, response_received_date
13. **Profitability**: Add cost vs quote tracking
14. **Series Logic**: Clarify series numbering system (may need to extract full history)

---

## 🎯 JSON CONVERSION PLAN

### Overall Strategy

Convert three datasets into **three separate JSON files** with possibility to link via IDs:

1. **suppliers.json** - Master supplier directory
2. **purchase_orders.json** - All PO records
3. **quotations.json** - Combined quotation data from all 5 files

### JSON Schema Designs

#### 1. SUPPLIERS.JSON Structure

```json
{
  "metadata": {
    "source_file": "MVL_Suppliers_List_Feb-05-2026.xlsx",
    "extraction_date": "2026-02-09",
    "total_records": 2189,
    "version": "1.0"
  },
  "suppliers": [
    {
      "id": "SUP-0001",  // Generated UUID or formatted ID
      "legacy_no": 1,
      "name": "(ATC) Asr Taqa Contracting",
      "material_category": "Subcontract",
      "contact": {
        "primary_contact": "Iftikar Raza",
        "email": "iftikhar@asrtaqa.com",
        "phone": "+966592924344",
        "fax": null
      },
      "address": {
        "full_address": null,
        "street": null,
        "city": null,
        "country": "SAU",  // Standardized ISO code
        "country_name": "Saudi Arabia"
      },
      "identifiers": {
        "trn_number": null,
        "tax_id": null
      },
      "rating": {
        "score": 3.0,
        "scale": "0-5",
        "last_updated": null
      },
      "status": "active",  // active, inactive, suspended
      "metadata": {
        "created_date": null,
        "last_updated": "2026-02-05",
        "data_quality_score": 0.65,  // Based on completeness
        "missing_fields": ["address", "trn_number"]
      }
    }
  ]
}
```

**Improvements Applied:**
- Standardized country codes (ISO 3166-1 alpha-3)
- Structured contact and address objects
- Generated unique IDs
- Added status and metadata tracking
- Calculated data quality score
- Nullable fields for missing data

#### 2. PURCHASE_ORDERS.JSON Structure

```json
{
  "metadata": {
    "source_file": "PO_List_Jan-23-2026.xlsx",
    "extraction_date": "2026-02-09",
    "total_records": 3539,
    "version": "1.0",
    "currencies": ["AED", "USD"],
    "date_range": {
      "earliest": "2026-01-01",
      "latest": "2026-01-23"
    }
  },
  "purchase_orders": [
    {
      "id": "PO-0001",  // Generated sequential ID
      "legacy_no": 1,
      "po_number": "RFPO-5829-M4004-1",
      "po_components": {
        "prefix": "RFPO",
        "series": "5829",
        "category": "M4004",
        "sequence": "1"
      },
      "dates": {
        "po_date": "2026-01-23",  // ISO 8601
        "po_date_original": "23 Jan 2026",
        "created_date": null,
        "approved_date": null,
        "expected_delivery": null
      },
      "description": "PO for AIR PAVEMENT - Portable Diesel Air Compressor – Model KDP-5/7 - WC/SQ/12891",
      "project": {
        "project_code": null,  // Extract if pattern found
        "project_name": null
      },
      "supplier": {
        "name": "WECARE MACHINERY TRADING – Sole Proprietorship LLC",
        "supplier_id": null  // Link to suppliers.json if match found
      },
      "financial": {
        "total_amount": 42000.00,
        "currency": "AED",
        "currency_symbol": "د.إ",
        "usd_equivalent": null,  // Can be calculated
        "exchange_rate": null
      },
      "status": "unknown",  // pending, approved, completed, cancelled
      "metadata": {
        "has_supplier": true,
        "data_quality_score": 0.71,
        "missing_fields": ["status", "delivery_date", "supplier_id"]
      }
    }
  ]
}
```

**Improvements Applied:**
- ISO 8601 date format
- Parsed PO number components
- Structured financial data
- Added status field
- Project information extraction ready
- Supplier linkage prepared
- Original date preserved for reference

#### 3. QUOTATIONS.JSON Structure

```json
{
  "metadata": {
    "source_files": [
      "Quotation_Report_Jan-28-2026.xlsx",
      "Quotation_Report_Jan-28-2026 (1).xlsx",
      "Quotation_Report_Jan-28-2026 (2).xlsx",
      "Quotation_Report_Jan-28-2026 (3).xlsx",
      "Quotation_Report_Jan-28-2026 (4).xlsx"
    ],
    "extraction_date": "2026-02-09",
    "total_records": 9171,  // After removing headers and deduplication
    "version": "1.0",
    "series_range": {
      "start": 3001,
      "end": 12176
    }
  },
  "quotations": [
    {
      "id": "QUOT-3001",  // Based on series number
      "series_number": 3001,
      "quotation_number": "Q-1192-F12093",
      "quotation_components": {
        "prefix": "Q",
        "batch": "1192",
        "code": "F12093"
      },
      "company": "FIRESTOP",
      "dates": {
        "quotation_date": "2022-10-19",  // ISO 8601
        "quotation_date_original": "19 Oct 2022",
        "created_date": null,
        "sent_date": null,
        "valid_until": null,
        "response_date": null
      },
      "type": "IQ",  // Internal Quotation
      "type_full": "Internal Quotation",
      "client": {
        "name": "Al F.F.",
        "client_id": null,
        "type": null  // internal, external
      },
      "project": {
        "name": "PARK INN#ATCON#JVT#000004",
        "project_code": "000004",
        "project_category": null
      },
      "details": {
        "description": "SUPPLY OF INSS1186, INSS1440",
        "material_category": "Firestop/ DC 315",
        "material_code": "Fire",
        "quantity": null,
        "unit": null
      },
      "financial": {
        "quoted_value": 6016.5,
        "currency": "AED",
        "currency_symbol": "د.إ",
        "usd_equivalent": null,
        "actual_po_value": null,
        "variance": null
      },
      "contact": {
        "mvl_contact": "Ajeesh J.",
        "client_contact": null
      },
      "outcome": {
        "status": "Order",  // Order, Lost, Pending, Expired
        "status_normalized": "won",  // won, lost, pending, expired, converted
        "converted_to_po": true,
        "po_number": null,  // Link to purchase_orders.json
        "reason_lost": null,
        "competitor": null,
        "follow_up_date": null
      },
      "metrics": {
        "days_to_response": null,
        "days_to_close": null,
        "success_probability": null
      },
      "source_file": "Quotation_Report_Jan-28-2026 (1).xlsx",
      "metadata": {
        "data_quality_score": 0.68,
        "missing_fields": ["valid_until", "po_number", "quantity"]
      }
    }
  ]
}
```

**Improvements Applied:**
- Combined all 5 files into single dataset
- Parsed quotation number components
- ISO 8601 date formatting
- Normalized status values
- Added outcome tracking structure
- PO linkage capability
- Extracted project codes
- Added metrics framework
- Source file tracking

---

## 🔗 DATA LINKAGE STRATEGY

### 1. Supplier → Purchase Order
- **Link Field**: `supplier.name` (fuzzy matching needed)
- **Improvement**: Add `supplier_id` to PO data after matching
- **Challenge**: Supplier names may vary slightly

### 2. Quotation → Purchase Order
- **Link Field**: Quotation `outcome.status` = "Order" + project/description matching
- **Improvement**: Add `po_number` to quotations when converted
- **Challenge**: No direct link currently exists

### 3. Quotation → Supplier
- **Link Field**: `client.name` may correspond to suppliers
- **Improvement**: Determine if client is internal or references supplier
- **Challenge**: Client vs Supplier distinction unclear

---

## 📈 DATA QUALITY IMPROVEMENTS SUMMARY

### Priority 1 (Critical)
1. ✅ Standardize date formats → ISO 8601
2. ✅ Fix quotation headers → Skip row 1, use proper headers
3. ✅ Merge quotation files → Single dataset
4. ✅ Add unique IDs → All records get consistent IDs
5. ✅ Normalize country names → ISO codes

### Priority 2 (High)
6. Add status tracking to POs
7. Link suppliers to POs via matching
8. Extract project codes from strings
9. Parse PO/Quotation number components
10. Calculate data quality scores

### Priority 3 (Medium)
11. Consolidate address fields
12. Remove/archive legacy fields (Fax, TRN)
13. Add metadata timestamps
14. Normalize material categories
15. Add currency conversion

### Priority 4 (Low)
16. Implement rating system validation
17. Add outcome tracking to quotations
18. Calculate business metrics
19. Add data validation rules
20. Archive duplicate/historical data

---

## 🚀 IMPLEMENTATION STEPS

### Phase 1: Data Extraction & Cleaning
1. Read all Excel files with proper encoding
2. Handle header rows in quotation files
3. Merge quotation files on series_number
4. Validate data types and handle nulls
5. Remove duplicates

### Phase 2: Data Transformation
1. Convert dates to ISO 8601
2. Normalize country names to ISO codes
3. Parse complex string fields (PO numbers, quotation numbers)
4. Structure nested objects (contact, address, financial)
5. Generate unique IDs

### Phase 3: Data Enhancement
1. Calculate data quality scores
2. Add metadata (extraction date, version, etc.)
3. Attempt supplier matching between datasets
4. Extract project codes where possible
5. Normalize status values

### Phase 4: JSON Generation
1. Create suppliers.json with enhanced structure
2. Create purchase_orders.json with improvements
3. Create quotations.json combining all files
4. Validate JSON schema
5. Generate summary statistics

### Phase 5: Documentation & Validation
1. Document all transformations applied
2. Create data dictionary
3. Generate quality report
4. Provide sample queries/use cases
5. Recommend next steps for data governance

---

## 📊 EXPECTED OUTCOMES

### JSON Files Structure
```
MVL Supply Chain Intel Hub - Data/
├── json/
│   ├── suppliers.json (2,189 suppliers)
│   ├── purchase_orders.json (3,539 POs)
│   ├── quotations.json (~9,171 quotations)
│   ├── metadata.json (combined statistics)
│   └── data_dictionary.json (field descriptions)
├── reports/
│   ├── data_quality_report.json
│   ├── transformation_log.txt
│   └── validation_summary.json
```

### Benefits
- ✅ Standardized, consistent data format
- ✅ Machine-readable JSON for APIs/applications
- ✅ Improved data quality and completeness
- ✅ Clear documentation and traceability
- ✅ Foundation for data analytics and BI
- ✅ Easy integration with modern applications
- ✅ Version-controlled data structure

---

## 🎓 NEXT STEPS RECOMMENDATIONS

1. **Implement Conversion Script**: Python script to execute transformation
2. **Data Validation**: Verify all transformations are accurate
3. **API Development**: Create REST API to query JSON data
4. **Dashboard Creation**: Build analytics dashboard
5. **Data Governance**: Establish update procedures and validation rules
6. **Master Data Management**: Link datasets and maintain referential integrity
7. **Historical Tracking**: Archive versions and track changes over time

---

*Document Generated: 2026-02-09*  
*Analysis Version: 1.0*  
*Analyst: GitHub Copilot*
