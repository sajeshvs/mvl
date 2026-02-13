# Global Spend Analysis Requirements Document

**Project:** MVL Supply Chain Intel Hub  
**Dashboard:** Global Spend Analysis  
**Status:** Requirements Documented - Awaiting Visio Wireframe

---

## Executive Summary

The Global Spend Analysis Dashboard provides consolidated visibility into global procurement spending across entities, projects, suppliers, materials, and disciplines. It enables data-driven decisions on supplier performance, project cost control, and category management.

**Focus:** Historical and current spend based on **Purchase Orders (POs)** and **Change Orders**

**Complements:** Supplier Marketplace Dashboard (which focuses on quotations, RFQs, and marketplace interactions)

**Shared Elements:** Same data model, filter framework, and branding as Supplier Marketplace

---

## Dashboard Purpose

Provide stakeholders with a unified view of purchase-order-based spending across the MVL network:

- Analyze total spend by entity, project, supplier, material, and discipline
- Separate and quantify main POs vs. change orders (including amounts)
- Identify top 5 entities and projects by PO value
- Monitor top 10 suppliers by spend and bottom 10 active suppliers
- Drill into supplier-level details (rating, location, email, contact)

---

## Target Users

| User Group | Primary Interest |
|------------|------------------|
| Procurement Team | Supplier spend analysis, contract management |
| Project Directors | Project-level cost control |
| Finance & Cost Control | Budget tracking, change order monitoring |
| Executive Leadership | Strategic spend overview |

---

## Page Layout and Structure

### Header Section

#### Tab Styling
| State | Style |
|-------|-------|
| Active Tab | Navy blue background, white text |
| Inactive Tabs | Light gray background, dark gray text |

#### Company Branding
- MVL logo: Top right corner
- Last refresh timestamp: Next to logo (e.g., "Last updated: 10 Feb 2026, 07:05 Dubai time")
- Manual refresh icon/button near timestamp

#### Dashboard Branding
- "Supply Chain Intel Hub" logo and name: Top left corner
- Global search bar: Right of logo with placeholder "Search Quotes, Projects, etc."

#### Navigation Tabs (Horizontal)
1. Supplier Marketplace
2. **Global Spend Analysis** (active)
3. Materials & Disciplines

---

## Filter Section

Horizontal filter bar below navigation tabs, harmonized with Supplier Marketplace design.

### Filter Controls Layout (Left to Right)

| Filter Name | Default Value | Filter Type |
|-------------|---------------|-------------|
| ENTITY | All Entities | Multi-select dropdown |
| SUPPLIER | All Suppliers | Multi-select dropdown |
| PROJECT | All Projects | Multi-select dropdown |
| MATERIAL | All Materials | Multi-select dropdown |
| DISCIPLINE | All Disciplines | Multi-select dropdown |
| YEAR | All Years (since 2010) | Single/multi-select list |
| From (Date) | Specific Date | Date picker (start) |
| To (Date) | Specific Date | Date picker (end) |

**Search Box:** Far right of filter bar

### Filter Styling
- Background: White with subtle shadow
- Dropdowns: Type-to-search, scrollable lists
- Date pickers: Calendar icon, clear/apply actions

### Filter Behavior
- All filters are **global** (affect all KPIs, charts, tables)
- Combine using **logical AND**
- Search box filters across key text fields (supplier name, project name, entity, material description)
- Year filter interacts with From/To date pickers

---

## Currency Conversion and Notation

### Conversion Rules
| Aspect | Specification |
|--------|---------------|
| Source | Internet-based FX sources |
| Update Timing | Once daily at 07:00 AM Dubai time |
| Reporting Currency | AED or USD (configurable) |
| Consistency | Shared logic with Supplier Marketplace |

### Display
- Note near top KPIs: *"Financial values are converted to AED using rates captured from FX rates at 07:00 AM UAE time daily."*
- "View FX details" link/tooltip showing key FX pairs (USD→AED, EUR→AED, JPY→AED)

### Formatting
- Currency symbol + thousands separators (e.g., $3,974)
- Units: thousands, millions, billions as appropriate

---

## Key Performance Indicators (KPIs)

KPI band below filter bar, above main charts. Same card style as Supplier Marketplace.

### KPI Card Style
- Horizontal row with consistent size/spacing
- White background with subtle drop shadow
- Left accent border for category differentiation

### KPI Definitions

| KPI Name | Description | Format |
|----------|-------------|--------|
| **Total No. of Purchase Orders** | Count of all POs including change orders | Integer, comma-separated |
| **Total Spend** | Total value of all POs (main + change) | Currency, M/B |
| **Total No. of Change Orders** | Count of POs classified as change orders (suffix " 2") | Integer, comma-separated |
| **Total Amount of Change Orders** | Sum of change order values | Currency, M/B |
| **No. of Active Suppliers** | Distinct suppliers with spend > 0 | Integer |
| **Average Change Order % of PO Value** | Avg % of PO value from change orders | Percentage, 1 decimal |

---

## Main Dashboard Content Area

### Row 1: Trend & Supplier Profile

#### 7.1.1 Annual Spend Trend (Base vs. Change Orders)
| Attribute | Specification |
|-----------|---------------|
| Type | Vertical bar chart |
| X-Axis | Month with year |
| Y-Axis | Values in $ thousands |
| Data | Split between first revision orders and change orders |
| Features | Running total line |
| Data Labels | Spend value at end of each bar |

**Interactivity:**
- Click entity → filters other components
- Hover tooltip: entity name, total spend, PO count
- If supplier filtered: tooltip shows supplier name, total spend, order count

#### 7.1.2 Supplier Profile Card
| Field | Type | Example |
|-------|------|---------|
| Supplier Name | Text (large, bold) | ABC Manufacturing Inc. |
| Location | Text | Italy |
| Rating | 5-star visual (gold filled) | ★★★★★ (5/5) |
| Email | Blue hyperlink | john.smith@abcmfg.com |
| Contact | Text | John Smith |
| Phone | Text | +1-555-123-4567 |

*Empty state if no supplier selected. Empty field if data unavailable.*

---

### Row 2: Entity & Project Spend

#### 7.2.1 Spend by Entity
| Attribute | Specification |
|-----------|---------------|
| Type | Horizontal bar chart |
| Data | Top 5 entities by PO value |
| X-Axis | PO value (reporting currency) |
| Y-Axis | Entity names |
| Sorting | Descending (highest at top) |
| Data Labels | PO value at bar end |

**Interactivity:**
- Click entity → filters other components
- Hover: entity name, PO value, PO count

#### 7.2.2 Spend by Projects
| Attribute | Specification |
|-----------|---------------|
| Type | Horizontal bar chart |
| Data | Top 5 projects by PO spend |
| X-Axis | PO value (reporting currency) |
| Y-Axis | Project names |
| Sorting | Descending |
| Data Labels | PO value at bar end |

**Interactivity:**
- Click project → filters other components
- Hover: project name, entity, PO value, PO count

---

### Row 3: Supplier Rankings

#### 7.3.1 Top 10 Suppliers by Spend
| Attribute | Specification |
|-----------|---------------|
| Type | Horizontal bar chart OR ranked list |
| Data | 10 suppliers with highest total spend |
| Left Side | Ranking numbers 1-10 (colored badges) |
| Center | Supplier names |
| Right Side | Spend bars with values |

**Interactivity:**
- Click supplier → filters to that supplier
- Hover: supplier name, total spend, PO count, change order count

#### 7.3.2 Bottom 10 Active Suppliers
| Attribute | Specification |
|-----------|---------------|
| Type | Horizontal bar chart OR ranked list |
| Data | 10 suppliers with lowest spend (but > 0) |
| Sorting | Ascending (lowest at top) |
| Left Side | Ranking numbers 1-10 (neutral badges) |
| Center | Supplier names |
| Right Side | Spend bars with values |

*Purpose: Diversification analysis and long-tail management*

**Alternative Display:** List style showing rank, supplier name, total spend, PO count

---

### Row 4: PO Details Table

#### 7.4.1 PO Details Table
| Column | Data Type | Format |
|--------|-----------|--------|
| PO Number | Text | Numbers with characters |
| PO Date | Date | DD-MMM-YYYY |
| PO Value | Number | Currency formatted |
| Currency | Symbol | Original currency symbol |
| Project Name | Text | - |
| Expected Delivery Date | Date | DD-MMM-YYYY |

**Hyperlink Styling:**
- Supplier Name: Blue text, underline on hover, purple when visited
- Cursor: Pointer on hover

**Interactivity:**
- Column sorting by clicking headers

---

## Data and Functional Requirements

### Data Definitions

| Term | Definition |
|------|------------|
| **Main PO** | PO with suffix " 1" in PO number |
| **Change Order** | PO with suffix " 2" (or equivalent), counted separately |
| **Change Order Amount** | Sum of PO values for change order records |
| **Active Supplier** | Supplier with ≥1 PO in filtered period and PO value > 0 |

### Ranking Rules
- Top 5 / Top 10: Computed after filters applied
- Bottom 10: Only suppliers with non-zero spend

### Filtering & Interactivity
- All filters dynamically update every KPI, chart, and table
- Search filters across supplier names, project names, entities, text fields
- Clicking any bar/card/ranking filters or drills down to that dimension

### Data Refresh & Performance
| Metric | Target |
|--------|--------|
| Initial load | < 3 seconds |
| Filter/chart refresh | < 1 second |
| Data capacity | 10,000+ POs without degradation |
| FX rate update | Daily at 07:00 AM Dubai time |
| Refresh display | "Last updated" timestamp in header |

---

## Export, Sharing & Future Enhancements

### Export Options
- Dashboard view as PDF
- Individual charts as PNG/SVG
- Tables as CSV/Excel

### Sharing
- URL sharing with filter state preserved

---

## Implementation Notes

### Data Sources (from existing v5 structure)
| Source | Fields |
|--------|--------|
| `purchase_orders.json` | PO number, date, value, supplier, project, entity |
| `suppliers.json` | Contact details, location, rating |

### Change Order Identification
```
Main PO: PO number ends with " 1" or "-1"
Change Order: PO number ends with " 2" or "-2" (or higher)
```

### Required New Calculations
1. Total Change Order Amount
2. Change Order % of PO Value
3. Bottom 10 Active Suppliers ranking
4. Annual spend trend with base/change split

---

## Next Steps

1. **Receive Visio Wireframe** - Visual layout reference
2. **Create Wireframe MD** - Document visual specifications
3. **Implement Tab** - Build Global Spend Analysis tab in v5
4. **Connect Data** - Use existing PO data with new calculations
5. **Test & Iterate** - Validate with stakeholders

---

*Document Version: 1.0*  
*Created: February 12, 2026*  
*Awaiting: Visio Wireframe*
