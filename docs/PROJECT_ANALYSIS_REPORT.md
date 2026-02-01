# MVL Supply Intel Hub - Project Analysis Report

**Document Version:** 1.0  
**Created:** 30 January 2026  
**Purpose:** Comprehensive project understanding before CSV data integration  

---

## 📋 Executive Summary

This project is the **MVL Supplier Intel Hub** - an automated Power BI solution for **MVL GROUP** designed to support construction, supply chain, and procurement decision-making. The current workspace contains HTML mockup templates that visually represent the final Power BI dashboards. Our goal is to connect these templates with real data from CSV files to validate, clean, and prepare data for Power BI implementation.

### Project Owner
| Role | Department |
|------|------------|
| Document Owner | Transformation Department |
| Approver | CTIO |
| Version | 1.0 |
| Created | 23-01-2026 |

---

## 🎯 Project Objectives

1. **Single Source of Truth** - Provide MVL executives with unified view of quotations, POs, suppliers, projects, and materials
2. **Reusable Cloud Data Layer** - Create data layer for PHP data that can later support broader integration projects
3. **Two Interactive Dashboards** - Supplier Marketplace + Global Spend Analysis with full MVL branding
4. **Third Dashboard** - Disciplines Consolidated (added for budget/cost tracking)

---

## 📊 Dashboard Overview

### 1. Supplier Marketplace Dashboard
**Theme Color:** Blue gradient (`#004578` to `#0064a3`)  
**Purpose:** Quotation-to-PO pipeline tracking by supplier and material

#### Layout Structure:
| Zone | Width | Content |
|------|-------|---------|
| Header | Full | Title + Last Refresh + Logo |
| Filter Bar | Full | Entity, Supplier/Client, Quotation Type, Status, Material Type, Discipline |
| Left Column | ~35% | Supplier Profile, Contacts, Rating, KPIs, Approved Materials Table |
| Middle Column | ~35% | Quotation Funnel Chart, Quote-to-PO Timeline Chart |
| Right Column | ~30% | Marketplace Workbench Table |

#### Key KPIs:
- Total Quotations
- Total POs
- Win Rate %
- Quotation Funnel (Quotation → Waiting → Order → Cancelled)

#### Slicers/Filters:
- Entity Name (multi-select)
- Supplier/Client
- Material Type
- Discipline
- Quotation Type (IQ vs RFQ)
- Status (Quotation, Waiting, Order, Cancelled)

---

### 2. Global Spend Analysis Dashboard
**Theme Color:** Orange gradient (`#d96f3c` to `#e8824a`)  
**Purpose:** Annual spend trends, change orders, and project procurement insights

#### Layout Structure:
| Zone | Width | Content |
|------|-------|---------|
| Header | Full | Title + Date Range + Last Refresh |
| Filter Tier 1 | Full | Entity, Supplier, Project, PO No., Year, PO Placement Date |
| Filter Tier 2 | Full | Material Type, Discipline, Quotation Type, PO Type, Currency |
| KPI Row | Full | Total Spend, Base POs, Change Orders, Active Suppliers |
| Charts Left | ~60% | Annual Spend Trend (Base vs Change) |
| Charts Right | ~40% | Spend by Project (Donut) |
| Tables | Full | PO Details, Top 10 Suppliers, Bottom 10 Suppliers |

#### Key KPIs:
- Total Spend (USD)
- No. of Base POs
- No. of Change Orders
- Active Suppliers
- Average PO Value
- YoY Growth %

#### Slicers/Filters:
- Year
- Entity
- Currency
- PO Type (Base/Change)
- Project
- Discipline
- Supplier

---

### 3. Disciplines Consolidated Dashboard
**Theme Color:** Dark blue gradient (`#0f3d5e` to `#1a5a8a`)  
**Purpose:** Budget, actual cost, and variance tracking across 10 disciplines

#### Key KPIs:
- Total Budget
- Actual Spend
- Variance
- Active Projects
- Budget Utilization %

#### The 10 Disciplines:
1. Mechanical
2. Electrical
3. Structural
4. MEP (Mechanical, Electrical, Plumbing)
5. Piping
6. Instrumentation
7. Civil
8. HVAC
9. Insulation
10. Painting

---

## 🗄️ Data Model Specification

### Star Schema Design

The data model follows procurement best practices with a star schema approach.

### Dimension Tables

| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| **DimDate** | DateKey (YYYYMMDD) | FullDate, Year, Quarter, MonthNumber, MonthName, WeekNumber, IsCurrentYear, IsLast12Months |
| **DimEntity** | EntityKey | EntityCode, EntityName, Region/Country |
| **DimSupplierClient** | PartnerKey | PartnerName, PartnerType (Supplier/Client), PrimaryEntityKey, Email, Phone, Rating |
| **DimProject** | ProjectKey | ProjectCode, ProjectName, EntityKey, BusinessLine/Function |
| **DimMaterial** | MaterialKey | MaterialType, MaterialShortDescription, Discipline, Category/Commodity |
| **DimCurrency** | CurrencyKey | CurrencyCode (USD, EUR, AED), CurrencyName, ConversionRateToUSD |
| **DimQuotationStatus** | QuotationStatusKey | StatusName (Quotation, Waiting, Order, Cancelled), IsWon, IsOpen, IsLost |
| **DimPOType** | POTypeKey | POTypeName (Base, Change Order), DerivationRule |

### Fact Tables

#### FactQuotationHeader
| Column | Type | Description |
|--------|------|-------------|
| QuotationKey | PK (surrogate) | Unique identifier |
| QuotationNumber | String | e.g., RFP-2025-000123 |
| QuotationType | String | IQ or RFQ |
| EntityKey | FK | Links to DimEntity |
| PartnerKey | FK | Links to DimSupplierClient |
| ProjectKey | FK | Links to DimProject |
| MaterialKey | FK | Links to DimMaterial |
| QuotationStatusKey | FK | Links to DimQuotationStatus |
| QuotationDateKey | FK | Links to DimDate |
| QuotationValue | Decimal | Original currency value |
| CurrencyKey | FK | Links to DimCurrency |
| QuotationValueUSD | Decimal | Pre-converted to USD |
| CreatedByContact | String | Responsible person |

#### FactPOTable (Header-level)
| Column | Type | Description |
|--------|------|-------------|
| POKey | PK | Unique identifier |
| PONumber | String | e.g., RFPO-2025-000123-1 |
| SourceQuotationKey | FK | Links to FactQuotationHeader |
| EntityKey | FK | Links to DimEntity |
| PartnerKey | FK | Links to DimSupplierClient |
| ProjectKey | FK | Links to DimProject |
| POTypeKey | FK | Links to DimPOType |
| POPlacementDateKey | FK | Links to DimDate |
| POHeaderValue | Decimal | Original currency value |
| CurrencyKey | FK | Links to DimCurrency |
| POHeaderValueUSD | Decimal | Pre-converted to USD |

#### FactPOLine (Optional - for line-level analysis)
| Column | Type | Description |
|--------|------|-------------|
| POLineKey | PK | Unique identifier |
| POKey | FK | Links to FactPOTable |
| LineNumber | Integer | Line sequence |
| MaterialKey | FK | Links to DimMaterial |
| Quantity | Decimal | Quantity ordered |
| UnitPrice | Decimal | Unit price |
| LineValue | Decimal | Original currency |
| LineValueUSD | Decimal | Converted to USD |
| DeliveryTerms | String | Delivery terms |
| ForecastDeliveryDateKey | FK | Links to DimDate |

---

## 📐 Key Business Rules

### 1. Quotation Type Derivation
| Type | Logic |
|------|-------|
| **IQ** | Internal Quotation - specific logic TBD from source data |
| **RFQ** | Request for Quotation |

### 2. PO Type Derivation
| Type | Rule |
|------|------|
| **Base PO** | PO number ending with "1" (e.g., RFPO-2026-001-**1**) |
| **Change Order** | PO number ending with "2" (e.g., RFPO-2026-001-**2**) |

### 3. Quotation-to-PO Linking
- POs are linked to quotations via number pattern
- RFP-2026-001 (Quote) → RFPO-2026-001-1 (PO)

### 4. Status Classification
| Status | Flag |
|--------|------|
| Quotation | IsOpen |
| Waiting | IsOpen |
| Order | IsWon |
| Cancelled | IsLost |

### 5. Currency Handling
- All values converted to USD for reporting
- ConversionRateToUSD maintained in DimCurrency
- Both original currency and USD values stored

---

## 📊 Key DAX Measures Required

### Basic Counts
```dax
Total Quotations := COUNTROWS(FactQuotationHeader)
Total POs := COUNTROWS(FactPOTable)
Total Base POs := CALCULATE([Total POs], DimPOType[POTypeName] = "Base")
Total Change Orders := CALCULATE([Total POs], DimPOType[POTypeName] = "Change Order")
Distinct Suppliers := DISTINCTCOUNT(DimSupplierClient[PartnerKey])
Distinct Projects := DISTINCTCOUNT(DimProject[ProjectKey])
```

### Spend Measures
```dax
Total Quotation Value (USD) := SUM(FactQuotationHeader[QuotationValueUSD])
Total PO Spend (USD) := SUM(FactPOTable[POHeaderValueUSD])
Total PO Spend (Last 6 Years) := 
    VAR MaxYear = MAX(DimDate[Year])
    RETURN CALCULATE([Total PO Spend (USD)], DimDate[Year] >= MaxYear - 5)
```

### Win Rate & Conversion
```dax
Won Quotations := CALCULATE([Total Quotations], DimQuotationStatus[StatusName] = "Order")
Open Quotations := CALCULATE([Total Quotations], DimQuotationStatus[StatusName] IN {"Quotation", "Waiting"})
Lost Quotations := CALCULATE([Total Quotations], DimQuotationStatus[StatusName] = "Cancelled")
Win Rate % := DIVIDE([Won Quotations], [Won Quotations] + [Lost Quotations])
Quote to PO Conversion % := DIVIDE([Total POs], [Total Quotations])
```

### Change Order Analysis
```dax
Change Order Spend (USD) := CALCULATE([Total PO Spend (USD)], DimPOType[POTypeName] = "Change Order")
Change Order Spend % := DIVIDE([Change Order Spend (USD)], [Total PO Spend (USD)])
Average PO Value (USD) := DIVIDE([Total PO Spend (USD)], [Total POs])
```

---

## 🎨 MVL Branding Guidelines

### Color Schemes by Dashboard
| Dashboard | Primary Gradient | Usage |
|-----------|------------------|-------|
| Supplier Marketplace | #004578 → #0064a3 | Header, accents |
| Global Spend Analysis | #d96f3c → #e8824a | Header, accents |
| Disciplines | #0f3d5e → #1a5a8a | Header, accents |

### Status Badge Colors
| Status | Background | Text Color |
|--------|------------|------------|
| Quotation | #e1dfdd | #323130 |
| Waiting | #fff4ce | #7a5a00 |
| Order | #dff6dd | #107c10 |
| Cancelled | #fde7e9 | #a80000 |

### Typography
- Primary Font: Segoe UI
- Headers: 600 weight
- Body: Regular weight

---

## 📁 Current Workspace Structure

```
PowerBI/
├── html/
│   ├── supplier-marketplace.html      ← Production template
│   ├── global-spend-analysis.html     ← Production template
│   ├── disciplines-consolidated.html  ← Production template
│   └── archive/                        ← Previous versions
│       ├── mvl-disciplines-consolidated.html
│       ├── mvl-global-spend-analysis.html
│       └── mvl-supplier-marketplace.html
├── reference/
│   ├── Scope of Work.md
│   ├── 2. Narrative for Supplier Marketplace.md
│   ├── 3. Narrative for Global Spend Analysis.md
│   ├── 4. Sample HTML layout – Supplier Marketplace.md
│   ├── 5. Sample HTML layout – Global Spend Analysis.md
│   ├── 6. Data model – fact tables and dimensions.md
│   ├── 7. Key DAX measures.md
│   ├── 8. How the BI Developer needs to be proceed.md
│   ├── Global Spend Analysis - Potential User Interface.md
│   ├── Supplier Marketplace - Potential User Interface.md
│   ├── Power BI Dashboard Mockup - Disciplines.md
│   └── images/
├── copilot_agent_instructions.md
├── convert_workspace_to_md.py
└── Power BI Dashboard Mockup - Disciplines.html
```

---

## 📋 CSV Data Integration Checklist

When you share the CSV data, we need to perform the following analysis and cleaning:

### Phase 1: Data Discovery
- [ ] Inventory all CSV files received
- [ ] Document column names and data types
- [ ] Identify primary keys and foreign keys
- [ ] Map CSV columns to star schema tables
- [ ] Check for source data for each dimension and fact table

### Phase 2: Data Quality Assessment
- [ ] Check for missing values (NULL analysis)
- [ ] Identify duplicate records
- [ ] Validate data type consistency
- [ ] Check date format consistency
- [ ] Validate currency values and formats
- [ ] Check status value consistency (spelling, case)
- [ ] Validate PO number format patterns
- [ ] Check quotation number format patterns

### Phase 3: Data Mapping Validation
| Star Schema Table | Source CSV | Key Mapping Questions |
|-------------------|------------|----------------------|
| DimDate | ? | Date format? Range needed? |
| DimEntity | ? | Entity codes? Region info? |
| DimSupplierClient | ? | Separate supplier/client? Rating scale? |
| DimProject | ? | Project codes? Entity link? |
| DimMaterial | ? | Material hierarchy? Discipline link? |
| DimCurrency | ? | FX rates source? Update frequency? |
| DimQuotationStatus | ? | All status values? Derivation rules? |
| DimPOType | ? | Already classified? Or derive from PO#? |
| FactQuotationHeader | ? | One record per quote? Value fields? |
| FactPOTable | ? | Header level only? Value fields? |
| FactPOLine | ? | Line items available? |

### Phase 4: Business Rule Validation
- [ ] Confirm PO Type derivation (ending 1 vs 2)
- [ ] Confirm Quotation-to-PO linking logic
- [ ] Validate status classification rules
- [ ] Confirm currency conversion approach
- [ ] Validate win rate calculation scope

### Phase 5: Data Transformation Requirements
- [ ] Currency conversion (to USD)
- [ ] Date key generation (YYYYMMDD format)
- [ ] Surrogate key generation
- [ ] Status flag derivation (IsWon, IsOpen, IsLost)
- [ ] PO Type classification
- [ ] Quotation Type classification

---

## 🔗 Expected Data Flow

```
[PHP Platform Database]
        ↓
[CSV Export / Data Extract]
        ↓
[Data Validation & Cleaning]  ← We are here
        ↓
[Cloud Landing Zone (Raw)]
        ↓
[Staging Layer (Cleaned/Typed)]
        ↓
[Curated Layer (Star Schema)]
        ↓
[Power BI Semantic Model]
        ↓
[Power BI Reports]
```

---

## 📝 Questions to Answer When Data Arrives

### General Questions
1. What is the date range of the data?
2. How many unique entities/business units?
3. How many unique suppliers/clients?
4. How many unique projects?
5. How many quotations and POs in total?

### Data Quality Questions
1. What percentage of records have missing values?
2. Are there orphan records (POs without quotations)?
3. Are currency conversion rates available?
4. Are contact details (email/phone) complete?

### Business Logic Questions
1. Is the PO numbering pattern consistent?
2. Are status values standardized?
3. How are disciplines and materials categorized?
4. Is there a rating system for suppliers?

---

## 🚀 Next Steps

1. **Receive CSV Data Files** - Share all available data exports
2. **Initial Data Profiling** - Column analysis, row counts, value distributions
3. **Data Mapping Exercise** - Map source columns to star schema
4. **Data Quality Report** - Document issues found and remediation needed
5. **Transformation Scripts** - Build cleaning and transformation logic
6. **Validation Report** - Confirm data ready for Power BI integration
7. **HTML Template Testing** - Load real data into HTML templates to validate visuals

---

## 📧 Email Context Notes

*This section will be updated when email context is shared to capture:*
- Additional business requirements
- Data source clarifications
- Stakeholder expectations
- Timeline constraints
- Any data issues previously identified

---

## 📌 Important Notes

1. **HTML Templates are Mockups** - They represent the visual design; actual implementation will be in Power BI
2. **Sample Data is Dummy** - Current charts use placeholder data that will be replaced
3. **Chart.js Library Used** - Interactive charts in HTML use Chart.js 4.4.0
4. **Responsive Design** - Templates adapt to different screen sizes
5. **MVP Scope** - Two primary dashboards (Supplier Marketplace + Global Spend Analysis) are MVP; Disciplines is additional

---

*Report prepared for data integration planning. Update this document as data analysis progresses.*
