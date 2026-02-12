# Agent Instructions: HTML Dashboards (v3)

## Overview

The HTML dashboards are standalone, interactive web applications that visualize MVL procurement data. They serve as the design reference and can be deployed for quick demos or testing.

---

## Location

```
g:\Rita\mvl-powerbi-dashboards\v3\
```

---

## Dashboard Structure

### 1. Supplier Marketplace
**Path:** `v3/supplier-marketplace/`
**Color Theme:** Blue gradient (#004578)

**Files:**
- `index.html` - Dashboard layout and structure
- `app.js` - Interactive logic, Chart.js integration, filtering
- `data.json` - 12,532 quotation records from MicroTrack

**KPIs Displayed:**
- Total Quotations
- Win Rate (%)
- Total Quote Value
- Total Orders
- Pending Quotes

**Charts:**
- Funnel Chart: Status pipeline (Order → Waiting → Quotation → Cancelled)
- Bar Chart: Top 10 suppliers by value
- Donut Chart: Quotations by entity
- Line Chart: Monthly trend
- Data Table: Quotation workbench (paginated, sortable)

---

### 2. Global Spend Analysis
**Path:** `v3/global-spend-analysis/`
**Color Theme:** Orange gradient (#d96f3c)

**Files:**
- `index.html` - Dashboard layout
- `app.js` - Chart logic and interactivity
- `data.json` - Purchase order data

**KPIs Displayed:**
- Total POs
- Total Spend
- Base Orders / Base Value
- Change Orders / Change Value

**Charts:**
- Line Chart: Monthly spend trend
- Donut Chart: Spend by entity
- Bar Charts: Spend by supplier, by material group
- Data Table: PO workbench

---

### 3. Disciplines Consolidated
**Path:** `v3/disciplines-consolidated/`
**Color Theme:** Dark blue gradient (#0f3d5e)

**Files:**
- `index.html` - Dashboard layout
- `app.js` - Discipline analytics logic
- `data.json` - 28 discipline records

**KPIs Displayed:**
- Total Disciplines (28)
- Total Quoted Amount
- Total Order Amount
- Quote-to-Order Ratio
- Variance

**Charts:**
- Column Chart: Budget vs Actual by discipline
- Discipline Cards: Individual discipline KPIs

---

## Shared Resources

**Path:** `v3/shared/`

- `styles.css` - Common dashboard styling
- `charts.js` - Chart.js configuration utilities
- `data-utils.js` - Data processing helpers

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 | - | Structure |
| CSS3 | - | Styling (Flexbox, Grid) |
| JavaScript | ES6+ | Interactivity |
| Chart.js | 4.4.0 | Visualizations |

---

## Running Locally

```powershell
cd g:\Rita\mvl-powerbi-dashboards\v3
python -m http.server 8080
# Open: http://localhost:8080/supplier-marketplace/
```

---

## Data Sources

The `data.json` files in each dashboard contain exported MicroTrack data:

| Dashboard | Records | Source |
|-----------|---------|--------|
| Supplier Marketplace | 12,532 quotations | MicroTrack Quotations |
| Global Spend Analysis | 7,697 POs | MicroTrack Purchase Orders |
| Disciplines Consolidated | 28 disciplines | MicroTrack Disciplines |

---

## Key Design Patterns

### 1. Filter System
- All charts react to filter changes
- Slicers: Status, Entity, Date Range, Material Group
- Click-to-filter on chart elements

### 2. Responsive Layout
- CSS Grid for dashboard layout
- Flexbox for component arrangement
- Mobile-responsive breakpoints

### 3. Color Coding
```javascript
// Status Colors
const statusColors = {
    'Order': '#107c10',      // Green
    'Waiting': '#ffb900',    // Yellow
    'Quotation': '#0078d4',  // Blue
    'Cancelled': '#d13438'   // Red
};

// Theme Colors
const themes = {
    supplierMarketplace: '#004578',  // Blue
    globalSpend: '#d96f3c',          // Orange
    disciplines: '#0f3d5e'           // Dark Blue
};
```

---

## Updating HTML Dashboards

### To update data:
1. Export new data from MicroTrack
2. Convert to JSON format (same schema)
3. Replace `data.json` in the dashboard folder
4. Refresh browser

### To modify visuals:
1. Edit `app.js` for chart configuration
2. Edit `index.html` for layout changes
3. Edit `shared/styles.css` for styling

---

## Agent Tasks

### Common Operations:

1. **Add new KPI card:**
   - Add HTML element in `index.html`
   - Calculate value in `app.js` loadData function
   - Style in `shared/styles.css`

2. **Modify chart:**
   - Find chart config in `app.js`
   - Update Chart.js options
   - Adjust data processing logic

3. **Update filters:**
   - Modify filter HTML in `index.html`
   - Update `applyFilters()` function in `app.js`

4. **Change color theme:**
   - Update CSS variables in `index.html` or `styles.css`
   - Update chart color arrays in `app.js`

---

## Data Schema Reference

### Quotation Record
```json
{
    "QuotationNumber": "QT-2024-001234",
    "SupplierName": "ABC Supplies",
    "Entity": "MVL Marine",
    "MaterialGroup": "Electrical",
    "QuotationValue": 125000.00,
    "Currency": "USD",
    "Status": "Order",
    "CreatedDate": "2024-01-15"
}
```

### Purchase Order Record
```json
{
    "PONumber": "PO-2024-005678",
    "SupplierName": "XYZ Corp",
    "Entity": "MVL Offshore",
    "POValue": 250000.00,
    "Currency": "USD",
    "PODate": "2024-02-01",
    "Status": "Completed"
}
```

---

## Deployment Options

1. **Local Development:** Python HTTP server
2. **GitHub Pages:** Push to repository, enable Pages
3. **SharePoint:** Upload files to document library
4. **Azure Static Web Apps:** Deploy from GitHub

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Charts not rendering | Check browser console for JS errors |
| Data not loading | Verify data.json path and format |
| Filters not working | Check DOM element IDs match JS selectors |
| Styles broken | Clear browser cache, check CSS paths |

---

## Next Steps After HTML

The HTML dashboards serve as:
1. **Design reference** for SPFx implementation
2. **Prototype** for stakeholder review
3. **Fallback** if SharePoint unavailable
4. **Documentation** of business requirements
