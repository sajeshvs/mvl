# MVL Supply Intel Hub

A comprehensive Power BI-style interactive dashboard for MVL procurement and supply chain analytics.

## 📊 Dashboards

### 1. Supplier Marketplace ✅ Complete
**URL**: `/supplier-marketplace/`

Comprehensive supplier performance and quotation management dashboard.

**Features:**
- 📈 **12,532 Quotation Records** - Full dataset loaded
- 🔄 **Dynamic Filtering** - All components update in real-time
- 📊 **Multiple Chart Types** - Bar, Pie, Line, Radar, Polar, Doughnut
- 🎯 **Funnel Analytics** - Click to filter by stage
- 📅 **Trend Analysis** - Monthly performance trends
- 📋 **Paginated Workbench** - Sortable, filterable data table

**KPIs Tracked:**
- Total Quotations & PO Conversion
- Win Rate & Quote Values
- Supplier Performance Rankings
- Material Category Analysis
- Entity-wise Breakdown

### 2. Global Spend Analysis 🚧 Coming Soon
### 3. Disciplines Consolidated 🚧 Coming Soon

---

## 🚀 Quick Start

### View Locally
```bash
cd mvl
python -m http.server 8080
# Open: http://localhost:8080/supplier-marketplace/
```

### View Online (GitHub Pages)
```
https://sajeshvs.github.io/mvl/supplier-marketplace/
```

---

## 📁 Repository Structure

```
mvl/
├── README.md                    # This file
├── index.html                   # Portal landing page
├── .gitignore                   # Git ignore rules
│
├── shared/                      # Common assets
│   ├── styles.css              # Dashboard styling
│   ├── charts.js               # Chart.js utilities
│   └── data-utils.js           # Data processing helpers
│
├── supplier-marketplace/        # ✅ Complete
│   ├── index.html              # Dashboard HTML
│   ├── app.js                  # Dashboard logic
│   └── data.json               # Data (12,532 records)
│
├── scripts/                     # Data generation
│   └── generate_full_data.py
│
└── docs/
    └── DEPLOYMENT_GUIDE.md
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure |
| **CSS3** | Styling (Flexbox, Grid) |
| **JavaScript (ES6+)** | Interactivity |
| **Chart.js 4.4.0** | Visualizations |

---

## 📊 Data Summary

| Metric | Value |
|--------|-------|
| Total Quotations | 12,532 |
| Total POs | 7,697 |
| Win Rate | 97.7% |
| Total Quote Value | $3.6 Billion |
| Total PO Spend | $721 Million |
| Entities | 19 |
| Materials | 12 |
| Suppliers | 48 |

---

## 📈 Dashboard Features

### Interactive Filtering
- **Entity Dropdown** - Filter by business entity
- **Material Dropdown** - Filter by material category
- **Supplier List** - Click to filter by supplier
- **Funnel Stages** - Click to filter by status
- **Date Range** - Filter by time period

### Chart Toggle Options
| Chart | View Options |
|-------|--------------|
| Material Analysis | Bar, Pie, Line, Radar |
| Entity Breakdown | Horizontal, Grouped, Stacked |
| Status Overview | Doughnut, Bar, Polar Area |

---

## 📝 Changelog

### v2.0.0 (January 2026)
- ✅ Complete Supplier Marketplace dashboard
- ✅ Full data loading (12,532 records)
- ✅ Dynamic filtering on all components
- ✅ Multiple chart type toggles
- ✅ Monthly trend chart

---

## 📄 License

© 2026 MVL. All rights reserved.
