# MVL Supply Intel Hub - v2.0 Documentation

## 📊 Overview

A complete Power BI-style procurement analytics platform built with HTML5, CSS3, JavaScript, and Chart.js.

**Live URL:** https://sajeshvs.github.io/mvl/

**Status:** ✅ Complete - All 3 Dashboards Deployed

---

## 🏗️ Project Structure

```
v2/
├── index.html                    # Main portal with dashboard cards
├── README.md                     # Project documentation
├── shared/
│   ├── styles.css               # Global CSS variables & shared styles
│   ├── data-utils.js            # Data processing utilities
│   ├── charts.js                # Chart.js helper functions
│   └── images/
│       └── logo.png             # MVL company logo
├── supplier-marketplace/
│   ├── index.html               # Dashboard HTML
│   ├── app.js                   # Dashboard logic
│   └── data.json                # Quotation data (12,134 records)
├── global-spend-analysis/
│   ├── index.html               # Dashboard HTML
│   ├── app.js                   # Dashboard logic
│   └── data.json                # PO data (3,539 records, $397M)
├── disciplines-consolidated/
│   ├── index.html               # Dashboard HTML
│   ├── app.js                   # Dashboard logic
│   └── data.json                # Discipline data (28 disciplines)
└── scripts/
    ├── generate_spend_data.py   # Generate PO spend data
    ├── generate_disciplines_data.py  # Generate discipline data
    └── analyze_disciplines.py   # Data analysis utility
```

---

## 📈 Dashboards Summary

### 1. Supplier Marketplace
| Metric | Value |
|--------|-------|
| Total Quotations | 12,134 |
| Purchase Orders | 3,539 |
| Win Rate | 97.7% |
| Total Spend | $397M+ |

**Features:** Status funnel, Top suppliers, Material distribution, Workbench table

---

### 2. Global Spend Analysis
| Metric | Value |
|--------|-------|
| Total PO Spend | $397.4M |
| Purchase Orders | 3,539 |
| Unique Suppliers | 1,093 |
| Avg PO Value | $112K |

**Features:** Annual trends, Base vs Change PO, Entity breakdown, Supplier rankings

---

### 3. Disciplines Consolidated
| Metric | Value |
|--------|-------|
| Total Quoted | $3.27B |
| Total Ordered | $397M |
| Utilization | 12.1% |
| Disciplines | 28 |

**Features:** Quoted vs Ordered comparison, Utilization gauges, Card/Table views

---

## 🎨 Design System

### Color Palette
- **Primary:** #004578 (Dark Blue)
- **Primary Dark:** #003359
- **Success:** #107C10 (Green)
- **Warning:** #FFB900 (Yellow)
- **Danger:** #D83B01 (Orange-Red)
- **Info:** #00B7C3 (Teal)

### Components
- Unified blue header with MVL logo
- Filter bars with dropdowns
- KPI cards with icons
- Chart.js visualizations
- Data tables with pagination
- Card/Table view toggles

---

## 📦 Data Sources

### Raw CSV Files
1. `Quotation_All_Feb-03-2025.csv` - 12,134 quotations
2. `PO_List_Jan-23-2026.csv` - 3,539 purchase orders

### Currency Rates (to USD)
- AED: 0.2723 | EUR: 1.08 | GBP: 1.27 | INR: 0.0119
- NPR: 0.0075 | SAR: 0.2667 | OMR: 2.60 | JPY: 0.0067

---

## 🚀 Running Locally

```bash
cd v2
python -m http.server 8080
# Open http://localhost:8080
```

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| v2.0 | 30 Jan 2026 | Complete 3-dashboard suite, unified styling, MVL logo |
| v1.0 | 28 Jan 2026 | Initial Supplier Marketplace prototype |

---

## 🔧 Technologies

- HTML5, CSS3 (Custom Properties, Flexbox, Grid)
- JavaScript ES6+
- Chart.js 4.4.0
- Python (data generation)

---

**© MVL Supply Intel Hub - Procurement Analytics Platform**
