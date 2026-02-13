# Global Spend Analysis - Visio Wireframe

**Project:** MVL Supply Chain Intel Hub  
**Dashboard:** Global Spend Analysis  
**Source:** Visio Wireframe Screenshot  
**Created:** February 12, 2026

---

## Visual Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (Blue Background #004578)                                                 │
│ ┌─────────────────────┐  ┌────────────┐           ┌──────────────────┐ ┌──────┐│
│ │ Supply Chain Intel  │  │ 🔍 Search..│           │Last Refresh:     │ │ MVL  ││
│ │ Hub Logo            │  │            │           │Thu 05 Jan 2026   │ │ Logo ││
│ └─────────────────────┘  └────────────┘           │06:09 AM          │ └──────┘│
├─────────────────────────────────────────────────────────────────────────────────┤
│ NAVIGATION TABS                                                                  │
│ ┌──────────────────┐ ┌─────────────────────┐ ┌──────────────────────────┐       │
│ │Supplier          │ │ Global Spend        │ │ Materials &              │       │
│ │Marketplace       │ │ Analysis (ACTIVE)   │ │ Disciplines              │       │
│ └──────────────────┘ └─────────────────────┘ └──────────────────────────┘       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ FILTER BAR (Row 1)                                                               │
│ ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐                 │
│ │ENTITY  │ │SUPPLIER  │ │PROJECT  │ │MATERIAL  │ │DISCIPLINE  │                 │
│ │All ▼   │ │All ▼     │ │All ▼    │ │All ▼     │ │All ▼       │                 │
│ └────────┘ └──────────┘ └─────────┘ └──────────┘ └────────────┘                 │
│ FILTER BAR (Row 2)                                                               │
│ ┌────────┐ ┌──────────────┐ ┌────────┐ ┌────────────────────────────────┐       │
│ │YEAR    │ │FROM (Date)   │ │TO      │ │🔍 Search Quotes, Projects etc. │       │
│ │All ▼   │ │Specific Date │ │        │ │                                │       │
│ └────────┘ └──────────────┘ └────────┘ └────────────────────────────────┘       │
├─────────────────────────────────────────────────────────────────────────────────┤
```

---

## Component Specifications

### 1. Header Section

#### 1.1 Header Bar
| Element | Specification |
|---------|---------------|
| Background | Navy Blue gradient (#004578) |
| Height | ~60px |
| Layout | Flex, space-between |

#### 1.2 Left Side - Branding
| Element | Details |
|---------|---------|
| Logo | Supply Chain Intel Hub logo |
| Search Bar | Rounded input with placeholder "🔍 Search..." |
| Search Width | ~200px |

#### 1.3 Right Side - Info
| Element | Details |
|---------|---------|
| Refresh Time | "Last Refresh: Thu 05 Jan 2026 06:09 AM" |
| MVL Logo | Company logo aligned right |
| Text Color | White |

#### 1.4 Navigation Tabs
| Tab | State | Style |
|-----|-------|-------|
| Supplier Marketplace | Inactive | Light gray background, dark text |
| **Global Spend Analysis** | **Active** | Navy blue background, white text |
| Materials & Disciplines | Inactive | Light gray background, dark text |

---

### 2. Filter Section

Two-row filter bar with white background.

#### 2.1 Row 1 Filters
| Filter | Type | Default | Width |
|--------|------|---------|-------|
| ENTITY | Dropdown | "All Entities" | 120px |
| SUPPLIER | Dropdown | "All Suppliers" | 120px |
| PROJECT | Dropdown | "All Projects" | 120px |
| MATERIAL | Dropdown | "All Materials" | 120px |
| DISCIPLINE | Dropdown | "All Disciplines" | 120px |

#### 2.2 Row 2 Filters
| Filter | Type | Default | Width |
|--------|------|---------|-------|
| YEAR | Dropdown | "All Years" | 100px |
| FROM | Date Picker | "Specific Date" | 140px |
| TO | Date Picker | "" | 140px |
| Search | Text Input | "Search Quotes, Projects, etc." | 250px |

---

### 3. KPI Cards Row

Six KPI cards in a horizontal row with colored **TOP** accent borders.

```
┌─────────────────┐┌─────────────────┐┌─────────────────┐┌─────────────────┐┌─────────────────┐┌─────────────────┐
│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀││▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀││▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀││▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀││▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀││▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀│
│ Orange Border   ││ Green Border    ││ Blue Border     ││ Yellow Border   ││ Yellow Border   ││ Blue Border     │
│ 📦              ││ 💵💵            ││ 📦              ││ 💵💵            ││ 🏆              ││ 🏢              │
│ Total No. of    ││ TOTAL SPEND     ││ Total No. of    ││ Total Amount of ││ ACTIVE          ││ ACTIVE          │
│ Purchase Orders ││                 ││ Change Orders   ││ Change Orders   ││ SUPPLIERS       ││ ENTITIES        │
│                 ││                 ││                 ││                 ││                 ││                 │
│ 3,539           ││ $397.4M         ││ 3,539           ││ $397.4M         ││ 1,093           ││ 21              │
│                 ││                 ││                 ││                 ││                 ││                 │
│ Including       ││                 ││ All records     ││                 ││                 ││                 │
│ Change Orders   ││                 ││                 ││                 ││                 ││                 │
└─────────────────┘└─────────────────┘└─────────────────┘└─────────────────┘└─────────────────┘└─────────────────┘
```

#### 3.1 KPI Card Specifications

| # | KPI Name | Value | Sub-text | Top Border Color | Icon |
|---|----------|-------|----------|------------------|------|
| 1 | Total No. of Purchase Orders | 3,539 | "Including Change Orders" | Orange (#FF8C00) | 📦 Package icon |
| 2 | TOTAL SPEND | $397.4M | - | Green (#339933) | 💵💵 Money/cash icon |
| 3 | Total No. of Change Orders | 3,539 | "All records" | Blue (#0066CC) | 📦 Package icon |
| 4 | Total Amount of Change Orders | $397.4M | - | Yellow (#FFD700) | 💵💵 Money/cash icon |
| 5 | ACTIVE SUPPLIERS | 1,093 | - | Yellow (#FFB900) | 🏆 Trophy/medal icon |
| 6 | ACTIVE ENTITIES | 21 | - | Blue (#0066CC) | 🏢 Building/entities icon |

#### 3.2 KPI Card Styling
| Property | Value |
|----------|-------|
| Background | White |
| Border | 1px solid #e0e0e0 |
| **Top Accent** | **4px solid (color varies)** |
| Border Radius | 8px |
| Shadow | 0 2px 8px rgba(0,0,0,0.08) |
| Padding | 16px |
| Icon | Top-left, colored to match border |
| Title Font | 11px, uppercase, gray (#666) |
| Value Font | 28px, bold, dark (#333) |
| Sub-text Font | 12px, light gray, below value |

---

### 4. Row 1: Annual Spend Trend + Supplier Tooltip Card

```
┌────────────────────────────────────────────────────────┐┌─────────────────────────┐
│ Annual Spend Trend (Base vs Change Orders)             ││ Name of Supplier        │
│ ─────────────────────────────────────────────────────  ││ Location (Country)      │
│ $700K ┤                                    ████   $2500K││ ★★★★★ Rating    4.37/5  │
│ $600K ┤                               ████ ████   $2000K││ Email                   │
│ $500K ┤  ████ ████                   █████ █████ $1500K ││ Contact                 │
│ $400K ┤ █████ █████      ████  ████  █████ █████        ││                         │
│ $300K ┤ █████ █████ ████ █████ █████ █████ █████  $1000K││                         │
│ $200K ┤ █████ █████ █████ ████ █████ █████ █████        ││                         │
│ $100K ┤ █████ █████ █████ ████ █████ █████ █████  $500K ││                         │
│  $0K  ┼──────────────────────────────────────────  $0K  ││                         │
│       Aug25  Sep25  Oct25  Nov25 Dec25  Jan26          ││                         │
│                                                        ││                         │
│       █ Base Spend █ Change Orders ── Running Total   ││                         │
└────────────────────────────────────────────────────────┘└─────────────────────────┘
                 ~75% width                                      ~25% width
```

#### 4.1 Annual Spend Trend Chart
| Property | Specification |
|----------|---------------|
| Chart Type | **Stacked Vertical Bar + Line (dual axis)** |
| Title | "Annual Spend Trend (Base vs Change Orders)" |
| Title Underline | Red/orange accent line below title |
| X-Axis | Months (MMM YY format: Aug 25, Sep 25, Oct 25, Nov 25, Dec 25, Jan 26) |
| **Y-Axis Left** | Monthly values ($0K to $700K) |
| **Y-Axis Right** | Running Total cumulative ($0K to $2,500K) |
| Bar Colors | **Base Spend: Orange (#FF8C00)**, **Change Orders: Yellow (#FFD700) stacked on top** |
| Line | **Running Total: Blue line (#0066CC) with circle markers** |
| Legend | Bottom of chart: "Base Spend", "Change Orders", "Running Total" |
| Background Grid | Light gray horizontal gridlines |

**Data Series:**
1. **Base Spend** - Orange bars (primary PO amounts)
2. **Change Orders** - Yellow bars (stacked on top of base spend)
3. **Running Total** - Blue line overlay with data point markers (cumulative trend)

**Visual Behavior:**
- Bars grow cumulatively month over month
- Running total line shows upward trajectory
- Hover shows detailed breakdown per month

#### 4.2 Supplier Profile Tooltip Card
| Field | Type | Example/Format |
|-------|------|----------------|
| Name | Header text | "Name of Supplier" (dynamic) |
| Location | Sub-text | "Location (Country)" |
| Rating | Star rating + number | ★★★★★ **4.37/5** |
| Email | Text/Link | Blue hyperlink |
| Contact | Text | Contact person name |

**Tooltip Card Styling:**
| Property | Value |
|----------|-------|
| Background | White |
| Border | 1px solid #e0e0e0 |
| Border Left | 3px solid #0066CC (accent) |
| Shadow | 0 4px 12px rgba(0,0,0,0.15) |
| Width | ~220px |
| Padding | 16px |
| Appears On | Hover over chart bar/data point |
| Rating Stars | Gold (#FFD700) filled stars |

---

### 5. Row 2: Spend by Entity + Spend by Projects

```
┌────────────────────────────────────────┐┌────────────────────────────────────────┐
│ Spend by Entity                        ││ Spend by Projects                      │
│ Top 5 Entities by PO Value             ││ Top 5 Projects by PO Value             │
│                                        ││                                        │
│ MVL Nepal    ████████████████████████  ││ DG      ██████████████████████████████ │
│ MVL USA, INC ████ (green)              ││ Triton  ████████ (blue)                │
│ Unknown      ███ (yellow)              ││ Kwaj    ██████ (red)                   │
│ MVL Greece   ██ (small blue)           ││ Japan   █████ (orange)                 │
│ MVL VENTURES █ (smallest)              ││ USA     ██ (blue)                      │
│                                        ││                                        │
│ $0  $50.0M $100.0M $150.0M $200.0M$300M││ $0  $50.0M $100.0M $150.0M $200.0M$300M│
└────────────────────────────────────────┘└────────────────────────────────────────┘
              50% width                                   50% width
```

#### 5.1 Spend by Entity Chart
| Property | Specification |
|----------|---------------|
| Chart Type | Horizontal Bar |
| Title | "Spend by Entity" |
| Subtitle | "Top 5 Entities by PO Value" |
| Y-Axis | Entity names (left aligned) |
| X-Axis | PO Value $0 to $300.0M |
| **Bar Colors** | **Multi-color per entity** |
| Sorting | Descending (highest at top) |
| Data Labels | Value at bar end |

**Sample Data (from wireframe):**
| Entity | Approx Value | Bar Color |
|--------|--------------|-----------|
| MVL Nepal | ~$280M | Blue (#0066CC) |
| MVL USA, INC | ~$30M | Green (#339933) |
| Unknown | ~$20M | Yellow (#FFD700) |
| MVL Greece | ~$10M | Blue (#0066CC) |
| MVL VENTURES | ~$5M | Blue (#0066CC) |

#### 5.2 Spend by Projects Chart
| Property | Specification |
|----------|---------------|
| Chart Type | Horizontal Bar |
| Title | "Spend by Projects" |
| Subtitle | "Top 5 Projects by PO Value" |
| Y-Axis | Project names |
| X-Axis | PO Value $0 to $300.0M |
| **Bar Colors** | **Multi-color per project** |
| Sorting | Descending |

**Sample Data (from wireframe):**
| Project | Approx Value | Bar Color |
|---------|--------------|-----------|
| DG | ~$290M | Green (#339933) |
| Triton | ~$35M | Blue (#0066CC) |
| Kwaj | ~$25M | Red (#CC3333) |
| Japan | ~$20M | Orange (#FF8C00) |
| USA | ~$5M | Blue (#0066CC) |

---

### 6. Row 3: Top & Bottom Suppliers

**Two display options shown in wireframe:**

#### Option A: Horizontal Bar Charts

```
┌────────────────────────────────────────┐┌────────────────────────────────────────┐
│ Top Suppliers                          ││ Top Suppliers                          │
│ Top 10 suppliers by Spend              ││ Bottom 10 Active Suppliers             │
│                                        ││                                        │
│ Rastra Bhusan Construction...██████████││ Rastra Bhusan Construction...█████████ │
│ Shivam Traders            ████████ grn ││ Shivam Traders            ████████     │
│ GODAWARI STEEL PVT. LTD. ███████ blue  ││ GODAWARI STEEL PVT. LTD. ███████       │
│ Fox Logistics and Const. ██████        ││ Fox Logistics and Const. ██████        │
│ World Gate Engineering   █████         ││ World Gate Engineering   █████         │
│ ...more suppliers...                   ││ ...more suppliers...                   │
│                                        ││                                        │
│ $0  $20.0M  $40.0M  $60.0M  $80.0M     ││ $0  $20.0M  $40.0M  $60.0M  $80.0M     │
└────────────────────────────────────────┘└────────────────────────────────────────┘
              50% width                                   50% width
```

#### 6.1 Top 10 Suppliers Chart
| Property | Specification |
|----------|---------------|
| Title | "Top Suppliers" |
| Subtitle | "Top 10 suppliers by Spend" |
| Chart Type | Horizontal Bar |
| Y-Axis | Supplier names (truncated with ...) |
| X-Axis | $0 to $80.0M |
| **Bar Colors** | **Multi-color: Green (#339933), Blue (#0066CC), mixed** |
| Sorting | Descending by total spend |

**Sample Suppliers (from wireframe):**
1. Rastra Bhusan Construction and Suppliers Pvt Ltd (~$75M, green)
2. Shivam Traders (~$45M, green)
3. GODAWARI STEEL PVT. LTD. (~$38M, blue)
4. Fox Logistics and Construction (~$30M)
5. World Gate Engineering & Construction (~$25M)

#### 6.2 Bottom 10 Active Suppliers Chart
| Property | Specification |
|----------|---------------|
| Title | "Top Suppliers" |
| Subtitle | "Bottom 10 Active Suppliers" |
| Chart Type | Horizontal Bar |
| **Bar Colors** | **Multi-color bars per supplier** |
| Sorting | Ascending (lowest spend first) |
| Note | Only shows suppliers with spend > $0 |

---

#### Option B: Ranked Table View (Alternative)

*"Another way of showing the top 10 suppliers and bottom 10 suppliers"*

```
┌───────────────────────────────────────────────┐┌───────────────────────────────────────────────┐
│ Top 5 Suppliers by Spend                      ││ Bottom 5 Suppliers                            │
├─────────────────────────────────────────────--│├─────────────────────────────────────────────--│
│ #  │ SUPPLIER        │ TOTAL SPEND │ POS     ││ #  │ SUPPLIER        │ TOTAL SPEND │ POS     │
├────┼─────────────────┼─────────────┼─────────│├────┼─────────────────┼─────────────┼─────────│
│ 1  │ Samsung         │ $200K       │ 2       ││ 2  │ L&T ECC         │ $110K       │ 1       │
│ 2  │ L&T ECC         │ $110K       │ 1       ││ 1  │ Samsung         │ $200K       │ 2       │
│    │                 │             │         ││    │                 │             │         │
│                      ↓ Ranked by total spend ││                     ↓ Smallest suppliers      │
└───────────────────────────────────────────────┘└───────────────────────────────────────────────┘
```

#### 6.3 Table View Specifications
| Property | Top 5 Table | Bottom 5 Table |
|----------|-------------|----------------|
| Title | "Top 5 Suppliers by Spend" | "Bottom 5 Suppliers" |
| Columns | #, SUPPLIER, TOTAL SPEND, POS | #, SUPPLIER, TOTAL SPEND, POS |
| Rank Indicator | Orange circle with number | Orange circle with number |
| Footer Link | "↓ Ranked by total spend" (orange) | "↓ Smallest suppliers" (orange) |
| Background | White | White |
| Border | 1px solid #e0e0e0 | 1px solid #e0e0e0 |
| Shadow | Subtle box shadow | Subtle box shadow |

**Table Column Details:**
| Column | Width | Format |
|--------|-------|--------|
| # | 40px | Orange circle badge |
| SUPPLIER | 180px | Text, left-aligned |
| TOTAL SPEND | 100px | Currency ($###K/M) |
| POS | 60px | Number (PO count) |

---

### 7. Row 4: PO Details Table + Marketplace Workbench Toggle

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PO Details                                                      Marketplace Workbench B/9,015 ✕ │
├──────────────┬──────┬───────────────────┬──────────┬───────────┬──────────────┬─────────────────┤
│ PO No.       │ Type │ Project           │ PO Date  │ Type Type │ Fysc2al Type │ PO Value (LS$)  │
├──────────────┼──────┼───────────────────┼──────────┼───────────┼──────────────┼─────────────────┤
│ RFPO-2025-001│ P-105│ LAT E&C           │ PE108    │ 01.07.2030│              │ $1,300,000      │
│ RFPO-2025-001│ P-106│ Nuevo Pignone     │ PE105    │           │ Pipes        │ $310,000        │
│ RFPO-2025-002│ P-106│ Global Valves Ltd.│ PE108    │           │ Mechanical   │ $500,000        │
│ RFPO-2025-003│ P-107│ Pumps             │ CIU89    │ Calver    │              │ $1,135,000      │
│ RFPO-Etoe... │ P-106│ Pipes             │ C&03     │ Mechanical│              │ $318,000        │
│ RFPO-2025-004│ P-105│ Cyrromini I Tod.  │ ABB      │ United Mfg│ Schor Nugns  │                 │
│ RFPO-2025-004│ P-108│ Precision Flow Inc│ ABB      │ Future Sys│ Apes Hughes  │                 │
└──────────────┴──────┴───────────────────┴──────────┴───────────┴──────────────┴─────────────────┘
                                                                  ▲ Orange highlight row
```

#### 7.1 PO Details Table
| Column | Data Type | Format | Width |
|--------|-----------|--------|-------|
| PO No. | Text | RFPO-YYYY-### | 120px |
| Type | Text | P-### | 60px |
| Project | Text | Project/Supplier name | 160px |
| PO Date | Text | PE### or date format | 80px |
| Type Type | Text | Category | 100px |
| Fiscal Type | Text | Material category | 100px |
| PO Value (LS$) | Currency | $#,###,### | 120px |

**Table Features:**
- Sortable columns (click header to sort)
- Row selection highlight (orange background on hover/select)
- Pagination support (page controls below)
- Hyperlinks on PO numbers (blue, underline on hover)
- Scrollable tbody with fixed header
- Alternating row colors (white/light gray)

#### 7.2 Marketplace Workbench Toggle Button
| Property | Value |
|----------|-------|
| Position | Top-right of table header |
| Title | "Marketplace Workbench" |
| Record Count | "B/9,015" (batch count) |
| Close Button | ✕ icon |
| Purpose | Toggle between PO Details and Workbench view |
| Background | Blue (#0066CC) when active |

#### 7.3 Table Row Highlighting
| State | Style |
|-------|-------|
| Normal | White background |
| Hover | Light gray (#F5F5F5) background |
| Selected | Orange (#FF8C00) background highlight |
| Link Color | Blue (#0066CC), underline on hover |

---

## Color Palette

| Element | Color Code | Usage |
|---------|------------|-------|
| Header Background | #004578 | Navy blue header |
| Active Tab | #004578 | Navigation active state |
| Inactive Tab | #F3F2F1 | Navigation inactive |
| **Primary Blue** | #0066CC | Charts, KPI borders, links |
| **Primary Green** | #339933 | Spend by Entity/Project bars, KPI border |
| **Warning Yellow** | #FFD700 | Change orders bars, KPI borders |
| **Orange** | #FF8C00 | Base spend bars, KPI border, row highlights |
| **Red** | #CC3333 | Project chart bars (Kwaj) |
| Background | #F5F7FA | Page background |
| Card Background | #FFFFFF | Cards and tables |
| Border | #E0E0E0 | Card borders |
| Text Primary | #323130 | Main text |
| Text Secondary | #605E5C | Labels, subtitles |
| **Table Rank Badge** | #FF8C00 | Orange circle for rank # |
| **Rating Stars** | #FFD700 | Gold star rating icons |
| **Running Total Line** | #0066CC | Blue line with markers |

---

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Header Title | Segoe UI | 22px | 600 |
| KPI Value | Segoe UI | 28px | 700 |
| KPI Label | Segoe UI | 11px | 600, Uppercase |
| Chart Title | Segoe UI | 14px | 600 |
| Chart Subtitle | Segoe UI | 11px | 400 |
| Table Header | Segoe UI | 12px | 600 |
| Table Cell | Segoe UI | 12px | 400 |
| Filter Label | Segoe UI | 10px | 600, Uppercase |

---

## Grid Layout

| Row | Components | Height |
|-----|------------|--------|
| Header | Branding, Search, Tabs | 100px |
| Filters | 2 rows of filters (Entity, Supplier, Project, Material, Discipline / Year, From, To, Search) | 90px |
| KPIs | 6 KPI cards (PO Count, Total Spend, Change Order Count, Change Order Amount, Active Suppliers, Active Entities) | 110px |
| Row 1 | Annual Spend Trend Chart (75%) + Supplier Tooltip Card (25%) | 400px |
| Row 2 | Spend by Entity (50%) + Spend by Projects (50%) | 320px |
| Row 3 | Top 10 Suppliers (50%) + Bottom 10 Suppliers (50%) - OR Table View | 320px |
| Row 4 | PO Details Table with Marketplace Workbench toggle | Flexible (min 400px) |

---

## Interactivity Requirements

| Element | Action | Result |
|---------|--------|--------|
| Filter Dropdown | Change | Update all components |
| Date Picker | Select | Filter by date range |
| Search Box | Type | Filter across text fields |
| Chart Bar | Click | Filter to that dimension |
| Chart Bar | Hover | Show tooltip with details |
| Supplier Card | Click list item | Update supplier profile |
| Table Row | Click | Open PO details modal |
| Table Header | Click | Sort column |
| KPI Card | Click | Drill down (optional) |

---

## Data Sources

### From `purchase_orders.json`
- Total PO count
- Total PO value (Total Spend)
- Change order identification (suffix " 2")
- Entity, Project, Supplier aggregations
- Monthly trend data

### From `suppliers.json`
- Supplier details (name, location, rating, contact)
- Active supplier count

### Calculations Required
| Calculation | Formula |
|-------------|---------|
| Change Order Count | Count of POs where po_number ends with " 2" |
| Change Order Amount | Sum of po.financial.total_amount where change order |
| Active Suppliers | Count distinct suppliers with PO value > 0 |
| Top/Bottom Rankings | Sort by total spend, take first/last 10 |

---

## Implementation Notes

### Reuse from v5 Supplier Marketplace
- Header component (same branding)
- Filter bar styling
- KPI card components
- Table styling
- Chart.js configuration patterns

### New Components Needed
1. Stacked bar + line combo chart (Annual Trend)
2. Date range picker integration
3. Change order vs base PO calculation
4. Bottom 10 ranking logic (ascending sort, exclude $0)

---

*Wireframe Document Version: 1.0*  
*Based on Visio Screenshot: February 2026*
