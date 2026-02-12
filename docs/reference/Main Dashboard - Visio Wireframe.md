# Main Dashboard - Visio Wireframe Specification

_Source: Visio file from Rita (SharePoint)_
_Converted: 2026-02-12_

---

## 1. Header Section

| Element | Specification |
|---------|---------------|
| Background | Blue (#004578) |
| Logo (LEFT) | Supply Chain Intel Hub logo with network cube icon |
| Logo File | `v4/shared/images/supply-chain-intel-hub-logo.png` |
| Logo (RIGHT) | MVL logo |
| Last Refresh | "Last Refresh: Thu 08 Jan 2026 06:08 AM" |
| Note | "Insert conversion rates for the rates that apply reading from the internet" |

### Header Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [◆ Supply Chain Intel Hub]              [Last Refresh: ...] [MVL Logo] │
│   (network cube + text)                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Logo Details
- **Supply Chain Intel Hub Logo:** Network/polyhedron icon with connected blue nodes + text
- **MVL Logo:** Company logo on right side
- **Colors:** Dark blue (#1a3a5c) text and primary nodes, light blue (#5da0d1) secondary nodes

---

## 2. Navigation Tabs

Three main navigation tabs:
1. **Supplier Marketplace** (active/default)
2. **Global Spend Analysis**
3. **Materials & Disciplines**

---

## 3. Filter Row

| Filter | Default Value | Type |
|--------|---------------|------|
| ENTITY | All Entities | Dropdown |
| PROJECT | All Projects | Dropdown |
| SUPPLIER | All Suppliers | Dropdown |
| STATUS | All Statuses | Dropdown |
| MATERIAL | All Materials | Dropdown |
| Search | "Search Quotes, Projects, etc." | Text Input |

---

## 4. KPI Row (7 Cards)

| # | KPI Label | Sample Value | Subtitle/Note |
|---|-----------|--------------|---------------|
| 1 | Request for Quotation | 12,532 | Count |
| 2 | Quote Value | $3.6B | Total quoted value |
| 3 | Purchase Orders (POs) | 7,697 | Count |
| 4 | POs Values | $721.3M | Total PO value |
| 5 | Win Rate | 97.7% | Order / Quoted |
| 6 | Change Orders (COs) | 7,697 | Count |
| 7 | COs Value | $721.3M | Total CO value |

---

## 5. Main Content Area

### 5.1 Left Column

#### 5.1.1 Status Chart
- **Type:** Horizontal bar chart (separate bars per status)
- **Title:** "Status" (with chart icon)
- **Categories (5 rows):**

| Status | Bar Color | Sample Count | Right Label |
|--------|-----------|--------------|-------------|
| Quotation | Blue/Cyan | 4,249 | Value (#) |
| Waiting | Yellow/Amber | (small) | Value (#) |
| Order | Green | 7,697 | Value (#) |
| Cancelled | Red | (small) | Value (#) |
| Closed | Gray | (medium) | Value (#) |

- **Bottom KPI Row (2 metrics):**

| Metric | Value | Label |
|--------|-------|-------|
| Conversion Rate | 97.7% | Conversion Rate |
| Open Quotes | 4,650 | Open Quotes |

#### 5.1.2 Entity Comparison
- **Title:** "Entity Comparison" (with chart icon)
- **Type:** Horizontal bar chart
- **Data Toggle Tabs:** "By Quote" | "By PO Spend"
- **Chart Type Toggle (right side):** "Horizontal" (active) | "Grouped" | "Stacked"
- **X-axis:** Dollar values ($0 to $2B)
- **Y-axis:** Entity names

**Sample Entities (colored bars, sorted by value):**

| Entity | Bar Color | Sample Value |
|--------|-----------|--------------|
| Yamauchi Gumi | Blue | ~$1.8B |
| MACRO | Green | ~$800M |
| MVL Nepal | Green | ~$300M |
| FIRESTOP | Yellow/Orange | ~$280M |
| MICRON | Red/Brown | ~$120M |
| MV LLC | Purple | ~$100M |
| MVL USA, INC | Cyan/Teal | ~$50M |
| MVL USA JV LLC | Red | ~$20M |

- **Features:**
  - Toggle between "By Quote" count and "By PO Spend" value
  - Chart type options: Horizontal, Grouped, Stacked
  - Each entity has distinct color for visual identification
  - Sorted descending by value

#### 5.1.3 Top 10 Suppliers by Spend
- **Title:** "Top 10 Suppliers by Spend"
- **Type:** Ranked list with progress bars
- **Layout:** Scrollable list (8+ visible, scrollbar on right)

**Row Structure:**
| Element | Description |
|---------|-------------|
| Rank Circle | Orange numbered circle (1, 2, 3...) |
| Supplier Name | Full supplier name |
| PO Count | Number of POs (e.g., "21 POs") |
| Progress Bar | Horizontal orange bar (proportional to spend) |
| Spend Value | Dollar amount (right-aligned) |

**Sample Data (Top 8 shown):**

| Rank | Supplier Name | PO Count | Spend |
|------|---------------|----------|-------|
| 1 | Rastra Bhusan Construction and... | 21 POs | $74.65M |
| 2 | KATKUWA SUPPLIERS | 10 POs | $49.01M |
| 3 | Shivam Traders | 13 POs | $41.26M |
| 4 | TATEKAN Constructions and Serv... | 2 POs | $19.32M |
| 5 | GODAWARI STEEL PVT. LTD. | 3 POs | $14.03M |
| 6 | Oman Cables Industry (SAOG) | 5 POs | $7.63M |
| 7 | Fox Logistics and Construction | 1 POs | $7.05M |
| 8 | J.M.T. GROUP PVT. LTD. | 5 POs | $6.71M |

- **Features:**
  - Orange progress bars proportional to spend value
  - Scrollable to see all 10 suppliers
  - Click on supplier to populate Supplier Profile card (right column)

---

### 5.2 Center Column

#### 5.2.1 Location of Suppliers
- **Type:** Interactive Map visualization
- **Title:** "Location of Suppliers"
- **Description:** "MAP here with pins indicating the location of the suppliers. Also if there are a lot of suppliers in 1 location, we can work with the intensity of the colors"
- **Features:**
  - Geographic pins showing supplier locations
  - Color intensity indicates supplier density (more suppliers = darker/more intense color)
  - Interactive click on location for details

#### 5.2.2 Material Distribution
- **Title:** "Material Distribution" (with chart icon)
- **Type:** Vertical bar chart
- **Chart Type Toggle (top right):** "Bar" (active/blue) | "Pie" | "Line" | "Radar"
- **Y-axis:** Dollar values ($0 to $2B, increments: $200M, $400M, $600M, $800M, $1B, $1.2B, $1.4B, $1.6B, $1.8B, $2B)
- **X-axis:** Material categories

**Sample Data (sorted descending by value):**

| Material Category | Bar Color | Sample Value |
|-------------------|-----------|--------------|
| Logistics | Dark Blue (#0066CC) | ~$1.9B |
| Tools | Light Blue (#3399FF) | ~$450M |
| Various | Green (#339933) | ~$350M |
| Fire | Orange (#FF9900) | ~$250M |
| Unknown | Red/Orange (#CC3300) | ~$150M |
| Services | Purple (#9933CC) | ~$150M |
| Electrical | Cyan (#00CCCC) | ~$80M |
| Mechanical | Red (#CC0000) | ~$80M |
| Chemicals | Dark Teal (#006666) | ~$50M |
| Architectural | Light Green (#66CC66) | ~$40M |

- **Features:**
  - Toggle between chart types: Bar (default), Pie, Line, Radar
  - Each material category has distinct color
  - Sorted descending by spend value
  - Responsive to filters (Entity, Project, Supplier, etc.)

#### 5.2.3 Quotation to PO Time
- **Title:** "Quotation to PO Time"
- **Type:** Vertical bar chart
- **Y-axis:** Number of Days (average)
- **X-axis:** Months of the Year (Jan - Dec)
- **Description:** "Here we will show also in bar chart how many days it took us to go from RFQ to issue PO. i.e. it will have to measure for each month, the time between the quotation date and the Purchase Order Date and average this number each month...."
- **Calculation:** Average days from Quotation Date to Purchase Order Date, grouped by month
- **Features:**
  - Monthly average processing time visualization
  - Helps identify bottlenecks in procurement cycle
  - Trend analysis for RFQ-to-PO conversion efficiency

---

### 5.3 Right Column

#### 5.3.1 Supplier Profile Card
| Field | Description |
|-------|-------------|
| Supplier Name | Selected supplier name |
| Contact Name | Primary contact |
| Email | Contact email |
| Phone | Contact phone |
| Rating | Star rating (1-5 stars) |

#### 5.3.2 Responsible MVL Employee
- **Title:** "Responsible MVL Employee"
- **Type:** Ranked list with progress bars (similar to Top 10 Suppliers)
- **Toggle (top right):** "BY SPEND" (blue link)
- **Search Bar:** "Search suppliers..."
- **Layout:** Scrollable list with scrollbar on right

**Row Structure:**
| Element | Description |
|---------|-------------|
| Rank Circle | Colored numbered circle (1=Orange, 2+=Gray) |
| Employee Name | First name + Last initial (e.g., "Lince M.") |
| PO Count | Number of POs managed (e.g., "256 POs") |
| Progress Bar | Gray horizontal bar (proportional to spend) |
| Total Spend | Dollar amount with "Total Spend" label |

**Sample Data (Top 6 shown):**

| Rank | Employee Name | PO Count | Total Spend |
|------|---------------|----------|-------------|
| 1 | (Top Employee) | 1965 POs | $503.8M |
| 2 | Lince M. | 256 POs | $41.4M |
| 3 | Marman I. | 655 POs | $32.8M |
| 4 | Rahul N. | 584 POs | $26.5M |
| 5 | Cecil R. | 6 POs | $16.9M |
| 6 | Maricar I. | 289 POs | $14.8M |

- **Features:**
  - Gray progress bars proportional to total spend
  - Scrollable to see more employees
  - Rank #1 has orange circle, others have gray circles
  - Shows MVL employees responsible for managing supplier POs
  - Click on employee to filter dashboard by their POs

#### 5.3.3 Approved Material Card
- **Title:** "Approved Material"
- **Description:** "List of Material Approved with this Supplier"
- **Note:** "Later on, this list will be brought from an actual Head that means tracking and tracing of Material Approved (Material which was approved for supplying this supplier)"
- **Table Columns:**
  | Column | Description |
  |--------|-------------|
  | Approved Material | Material name |
  | Specification Number | Spec reference |
  | Lead Time | Delivery lead time |
  | Value | Material value |

---

## 6. Monthly Trend Chart (Full Width)

- **Type:** Multi-line chart
- **Width:** Full dashboard width
- **X-axis:** Months (Jan - Dec)
- **Legend:** Quote, Order, CO, etc. (multiple colored lines)
- **Title:** "Submit & Order Quantity"
- **Purpose:** Track quote/order trends over time

---

## 7. Bottom Section: Tabbed Tables

### 7.1 Tab Navigation
Two tabs:
1. **Supplier List**
2. **Marketplace Workbench** (active by default)

### 7.2 Supplier List Tab
| Column | Description |
|--------|-------------|
| Supplier Name | Supplier company name |
| Location | Supplier location |
| Total PO Spend | Total spend with supplier |
| Contact Name | Primary contact |

### 7.3 Marketplace Workbench Tab
| Column | Description |
|--------|-------------|
| QUOTATION | Quote/PO number |
| TYPE | Quote type |
| STATUS | Current status |
| MATERIAL | Material category |
| PROJECT | Project name |
| MATERIAL | Material detail |
| VALUE | Monetary value |
| REMARK | Notes/comments |

- **Pagination:** "Result 1000 | Page With"

---

## 8. Color Scheme

| Element | Color | Hex (estimated) |
|---------|-------|-----------------|
| Header Background | Blue | #004578 |
| Order Status | Green | #c6f6d5 |
| Waiting Status | Yellow/Amber | #fff4ce |
| Quotation Status | Blue | #cce5ff |
| Closed Status | Red | #ffe0e0 |

---

## 9. Implementation Notes

### 9.1 Data Sources Required
- Quotations data (RFQ only)
- Purchase Orders data
- Suppliers data with location/contact info
- Change Orders data
- MVL Employee data
- **Orders data** → `v5/data/orders.json` (210 records: Order Number, Date, Client, Destination)

### 9.2 Interactive Features
- Navigation tabs switch between dashboard views
- Filter dropdowns filter all charts/tables
- Search box for quick lookup
- Entity Comparison toggle (By Quote / By PO Spend)
- Supplier selection populates Profile card
- Bottom tabs switch between Supplier List and Workbench

### 9.3 Future Enhancements (noted in Visio)
- Currency conversion rates from internet
- Approved Material tracking from actual system head
- Map visualization with supplier density

---

## 10. Questions for Clarification

1. Should the map use a real mapping library (Leaflet, etc.) or a placeholder?
2. What API/source for currency conversion rates?
3. Is "Responsible MVL Employee" linked to supplier selection?
4. What differentiates "Supplier List" from "Marketplace Workbench" data?
5. Is this the main landing page replacing the current portal?

---

_Document created: February 12, 2026_
