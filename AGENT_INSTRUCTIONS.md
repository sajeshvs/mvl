# MVL Supply Chain Intel Hub — Agent Instructions

**Last Updated:** February 13, 2026  
**Current Version:** V5 (Unified Dashboard)

---

## 📁 Workspace Structure

```
mvl-powerbi-dashboards/
├── v5/                              # 🚀 CURRENT PRODUCTION VERSION
│   ├── index.html                   # Unified dashboard with 3 tabs
│   ├── shared/
│   │   ├── scripts.js               # Main JavaScript (filters, charts, tables)
│   │   ├── styles.css               # Global CSS
│   │   ├── components/              # Reusable components
│   │   └── images/                  # Logo and images
│   ├── data/                        # JSON data files
│   │   ├── sm_data.json             # Supplier Marketplace data (12,532 quotations)
│   │   ├── gsa_data.json            # Global Spend Analysis data (3,539 POs)
│   │   ├── md_data.json             # Materials & Disciplines data
│   │   ├── suppliers.json           # Enriched supplier data (2,189 suppliers)
│   │   ├── client_country_map.json  # Client to country mapping (2,527 mappings)
│   │   ├── quotations.json          # Raw quotations from MicroTrack
│   │   ├── purchase_orders.json     # Raw PO data
│   │   └── orders.json              # Order list data
│   └── README.md                    # V5 documentation
│
├── v3/                              # Previous version (backup reference)
│   ├── supplier-marketplace/
│   ├── global-spend-analysis/
│   └── disciplines-consolidated/
│
├── docs/                            # Documentation
│   ├── reference/                   # Original requirements & narratives
│   │   ├── *.md                     # Requirements docs
│   │   ├── Data/                    # Reference data files
│   │   └── images/                  # Mockups and wireframes
│   ├── copilot_agent_instructions.md
│   ├── DATA_MAPPING_RULES.md
│   └── AGENT_INSTRUCTIONS_*.md
│
├── Data/                            # Source CSV files
│   └── Order_LIST_Feb-12-2026.csv
│
├── mvl-supply-intel-hub-spfx/       # SharePoint Framework project
│
├── archive/                         # Archived/legacy files
│   ├── v2-backup/
│   ├── v4-backup/
│   ├── old-scripts/
│   ├── old-data-folders/
│   └── outdated-docs/
│
└── README.md                        # Project overview
```

---

## 🌐 Live URLs

| Environment | URL |
|-------------|-----|
| **GitHub Pages (Production)** | https://sajeshvs.github.io/mvl/v5/ |
| **Local Development** | http://localhost:8085 |

### To Deploy Updates to GitHub Pages:
```bash
cd G:\Rita\mvl
git pull origin main
# Copy files from mvl-powerbi-dashboards/v5/ to mvl/v5/
git add -A
git commit -m "Update V5 dashboard"
git push origin main
```

---

## 📊 V5 Dashboard Tabs

### Tab 1: Supplier Marketplace (SM)
- **Theme:** Blue gradient (#004578 to #0064a3)
- **Data File:** `v5/data/sm_data.json`
- **Records:** 12,532 quotations
- **Key Components:**
  - Entity Comparison Bar Chart
  - Top Suppliers List (with medal badges)
  - Material Distribution Pie Chart
  - Supplier Location Map (uses `client_country_map.json`)
  - Employee List
  - Quotation to PO Time Chart
  - Conversion Rate KPIs
  - Quotation Workbench Table

### Tab 2: Global Spend Analysis (GSA)
- **Theme:** Orange gradient (#d96f3c to #e8824a)
- **Data File:** `v5/data/gsa_data.json`
- **Records:** 3,539 POs
- **Key Components:**
  - Annual Spend Trend Line Chart
  - Entity Spend Bar Chart
  - Project Spend Bar Chart
  - Top/Bottom Supplier Charts
  - KPIs (PO Count, Total Spend, Change Orders, Active Suppliers)
  - PO Table with Pagination

### Tab 3: Materials & Disciplines (M&D)
- **Theme:** Dark blue gradient (#0f3d5e to #1a5a8a)
- **Data File:** `v5/data/md_data.json`
- **Records:** 3,539 POs + 12,532 quotations
- **Key Components:**
  - Discipline Spend Chart (Quoted vs Actual)
  - Material Distribution Pie Chart
  - Supplier Performance Table
  - Approved Materials Table
  - PO Table
  - Supplier Profile Card

---

## 📦 Data Files Reference

### Primary Data Files (v5/data/)

| File | Size | Description | Key Fields |
|------|------|-------------|------------|
| `sm_data.json` | 6,382 KB | Supplier Marketplace | workbench (quotations), filters, summary |
| `gsa_data.json` | 2,025 KB | Global Spend Analysis | workbench (POs), supplierRanking, trend, filters |
| `md_data.json` | 6,943 KB | Materials & Disciplines | pos, quotations, disciplines, entityBreakdown |
| `suppliers.json` | 3,200 KB | Enriched supplier data | name, address, phone_validation, contact, rating |
| `client_country_map.json` | 93 KB | Client → Country mapping | { "Client Name": "Country" } |

### Data Field Mappings

**SM Data (sm_data.json) - Quotation Fields:**
```javascript
{
  "QuotationNumber": "Q-1192-F12093",
  "QuotationType": "IQ",
  "Status": "Order" | "Waiting" | "Cancelled",
  "ProjectName": "PARK INN#ATCON#JVT#000004",
  "Material": "Firestop/ DC 315",
  "Entity": "FIRESTOP",
  "Client": "Al F.F.",
  "QuotationValue": 6016.5,
  "Currency": "AED",
  "Contact": "Ajeesh J.",
  "Date": "19 Oct 2022"
}
```

**GSA Data (gsa_data.json) - PO Fields:**
```javascript
{
  "poNumber": "RFPO-5829-M4004-1",
  "poDate": "23 Jan 2026",
  "poName": "PO for AIR PAVEMENT - Portable Diesel Air Compressor",
  "supplier": "WECARE MACHINERY TRADING – Sole Proprietorship LLC",
  "originalValue": 42000.0,
  "currency": "AED",
  "valueUSD": 11436.6,
  "poType": "Base PO" | "Change Order",
  "entity": "MACRO",
  "entityCode": "M4004",
  "project": "ORD-5929 UAE-123R W912ER22C0026...",
  "material": "Rental",
  "year": 2026,
  "month": 1,
  "yearMonth": "2026-01"
}
```

**M&D Data (md_data.json) - Combined Structure:**
```javascript
{
  "summary": { "disciplineCount", "totalQuoted", "totalOrdered", "supplierCount", "projectCount" },
  "disciplines": [{ "name", "quotedValue", "orderedValue", "quotedCount", "orderedCount" }],
  "entityBreakdown": [{ "name", "quotedValue", "orderedValue", "poCount", "quoteCount" }],
  "filters": { "entities": [], "disciplines": [], "projects": [], "suppliers": [] },
  "pos": [{ "poNumber", "supplier", "entity", "project", "discipline", "value" }],
  "quotations": [{ "number", "supplier", "entity", "project", "discipline", "quotedValue" }]
}
```

---

## 🔧 Key Functions (scripts.js)

### Supplier Marketplace (SM) Tab
- `loadSmData()` - Load quotation data
- `applyFilters()` - Apply all SM filters across charts/tables
- `updateTopSuppliers()` - Update top suppliers list
- `renderSupplierMapFromLocations()` - Render filtered map

### Global Spend Analysis (GSA) Tab
- `initGlobalSpendAnalysis()` - Initialize GSA tab
- `populateGSAFilters()` - Populate filter dropdowns
- `applyGSAFilters()` - Apply filters to all GSA components
- `clearGSAFilters()` - Reset all GSA filters
- `createGSASupplierCharts()` - Create top/bottom supplier charts
- `updateGSAKPIs()` - Update KPI cards
- `updateGSATable()` - Update PO table

### Materials & Disciplines (M&D) Tab
- `initMaterialsDisciplines()` - Initialize M&D tab
- `initMdFilters()` - Setup filter dropdowns with event handlers
- `applyMdFilters()` - Apply filters across all M&D components
- `updateMdKPIsFiltered()` - Update KPIs from filtered data
- `createDisciplineSpendChartFiltered()` - Create discipline chart
- `createMaterialDistributionChartFiltered()` - Create material pie chart
- `updateMdSupplierTableFiltered()` - Update supplier table
- `updateMdApprovedMaterialsFiltered()` - Update approved materials
- `updateMdPoTable()` - Update PO table

### Currency Conversion
- `convertToUSD(value, currency)` - Convert to USD using live FX rates
- Default rates: AED=3.67, SAR=3.75, KWD=0.31, QAR=3.64, NPR=133.5

---

## 🎨 Design Guidelines

### Color Themes
| Tab | Primary | Secondary | Gradient |
|-----|---------|-----------|----------|
| SM | #004578 | #0064a3 | Blue |
| GSA | #d96f3c | #e8824a | Orange |
| M&D | #0f3d5e | #1a5a8a | Dark Blue |

### Status Colors
- **Order/Completed:** Green (#2ecc71)
- **Waiting/Open:** Yellow/Orange (#f39c12)
- **Cancelled:** Red (#e74c3c)

### Typography
- Font Family: Segoe UI, system-ui, sans-serif
- KPI Values: 1.6rem - 2rem, bold
- Table Text: 0.75rem - 0.85rem

---

## 🔄 Data Rebuild Scripts

Located in `v5/data/`:

1. **`rebuild_md_data.py`** - Rebuild Materials & Disciplines data
   ```bash
   cd v5/data
   python rebuild_md_data.py
   ```

2. **`build_client_country_map.py`** - Build client → country mapping
   ```bash
   cd v5/data
   python build_client_country_map.py
   ```

---

## 📋 Common Tasks

### 1. Update Filter Logic
Edit `v5/shared/scripts.js`:
- SM filters: `applyFilters()` (line ~1468)
- GSA filters: `applyGSAFilters()` (line ~3737)
- M&D filters: `applyMdFilters()` (line ~3960)

### 2. Add New Chart
1. Add canvas element in `v5/index.html`
2. Create chart function in `v5/shared/scripts.js`
3. Call function from init and filter apply functions

### 3. Update Data
1. Modify source JSON in `v5/data/`
2. Update corresponding filter options if needed
3. Verify chart/table rendering

### 4. Deploy to GitHub Pages
```bash
cd G:\Rita\mvl
# Sync files from mvl-powerbi-dashboards/v5 to mvl/v5
cp -r ../mvl-powerbi-dashboards/v5/* v5/
git add -A
git commit -m "Update dashboard"
git push origin main
```

---

## ⚠️ Important Notes

1. **Filter Event Handlers:** All filter dropdowns have `change` event listeners that auto-apply filters
2. **Currency Conversion:** FX rates are fetched from open.er-api.com on load
3. **Map Filtering:** Uses `client_country_map.json` for accurate country display
4. **Chart Destruction:** Always destroy existing chart instances before recreating
5. **Data Format:** All monetary values should be converted to USD for consistency

---

## 🔗 Related Repositories

| Repository | Purpose |
|------------|---------|
| `sajeshvs/mvl-powerbi-dashboards` | Main development workspace |
| `sajeshvs/mvl` | GitHub Pages deployment |

---

## 📞 Contact

**Project Owner:** Sajesh  
**Email:** sajesh.admin@mvlgroupusa.onmicrosoft.com
