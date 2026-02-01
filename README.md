# MVL Supply Intel Hub

A comprehensive procurement analytics solution built with HTML/CSS/JavaScript and Chart.js, designed to visualize quotation, purchase order, and supplier data for MVL (Multi Vision Limited).

## 🎯 Project Overview

The MVL Supply Intel Hub consists of three interactive dashboards:

| Dashboard | Description | Theme Color |
|-----------|-------------|-------------|
| **Supplier Marketplace** | Quotation funnel, supplier profiles, marketplace workbench | Blue |
| **Global Spend Analysis** | PO spend analysis, Base vs Change Orders | Orange |
| **Disciplines Consolidated** | Budget vs Actual by material discipline | Dark Blue |

## 📁 Project Structure

```
PowerBI/
├── process_data.py                    # Data processing script
├── PROJECT_ANALYSIS_REPORT.md         # Full project documentation
├── DATA_MAPPING_RULES.md              # Business rules from Rita
│
├── supplier-marketplace/
│   ├── supplier-marketplace.html      # Dashboard HTML
│   ├── data.json                      # Generated data
│   ├── README.md                      # Dashboard documentation
│   └── resources/                     # Assets
│
├── global-spend-analysis/
│   ├── global-spend-analysis.html     # Dashboard HTML
│   ├── data.json                      # Generated data
│   ├── README.md                      # Dashboard documentation
│   └── resources/                     # Assets
│
├── disciplines-consolidated/
│   ├── disciplines-consolidated.html  # Dashboard HTML
│   ├── data.json                      # Generated data
│   ├── README.md                      # Dashboard documentation
│   └── resources/                     # Assets
│
├── data-review/
│   └── DATA_FILES_REVIEW.md           # CSV data analysis
│
├── html/                              # Original HTML templates
│   └── archive/                       # Previous versions
│
└── reference/                         # Reference documents
    ├── Scope of Work.md
    ├── 6. Data model – fact tables and dimensions.md
    ├── 7. Key DAX measures.md
    └── ...
```

## 📊 Data Summary

| Dataset | Records | Source File |
|---------|---------|-------------|
| Quotations | 12,532 | 5 CSV files (Quotation Reports) |
| Purchase Orders | 3,539 | PO_List_Jan-23-2026.csv |
| Suppliers/Clients | 2,542 | MVL_Clients_List_Jan-23-2026.csv |

### Key Metrics
- **Total Quotation Value**: $3.3B USD
- **Total PO Spend**: $421.9M USD
- **Win Rate**: 100% (Order / (Order + Cancelled))
- **Active Suppliers**: 400+

## 🚀 Quick Start

### Prerequisites
- Python 3.x with pandas installed
- Web browser (Chrome, Firefox, Edge recommended)

### Generate Data
```bash
# Navigate to project directory
cd "c:\Users\Sajesh\Documents\Apps\Rita\PowerBI"

# Activate virtual environment
.venv\Scripts\activate

# Run data processing script
python process_data.py
```

### View Dashboards
Option 1: Direct file access (may have CORS issues)
```
Open any dashboard HTML file in browser
```

Option 2: Local server (recommended)
```bash
python -m http.server 8000
# Then open http://localhost:8000/supplier-marketplace/supplier-marketplace.html
```

## 🔧 Data Processing Pipeline

The `process_data.py` script performs:

1. **Load & Merge**: Combines 5 quotation CSV files
2. **Clean**: Handles nulls, HTML entities, date parsing
3. **Transform**: Extracts PO types, material codes, linking keys
4. **Aggregate**: Calculates KPIs, summaries, rankings
5. **Export**: Generates JSON for each dashboard

### Business Rules Applied

#### PO Type Classification
- Last digit `1` = Base PO
- Last digit `2+` = Change Order

#### Material Code Extraction
Letter in document number indicates discipline:
- M = Mechanical
- E = Electrical
- A = Architectural
- V = Various
- (Full list in DATA_MAPPING_RULES.md)

#### Quote-to-PO Linking
Middle portion of document number creates linking key:
- `RFQ-5829-E6823` → Key: `5829-E6823`
- `RFPO-5829-E6823-1` → Key: `5829-E6823`

## 🎨 Design System

### Color Themes
| Dashboard | Primary | Secondary |
|-----------|---------|-----------|
| Supplier Marketplace | #004578 | #0078d4 |
| Global Spend Analysis | #c45500 | #f5770a |
| Disciplines Consolidated | #1e3a5f | #2c5282 |

### Status Colors
- **Quotation**: Gray (#8a8886)
- **Waiting**: Yellow (#faa916)
- **Order**: Green (#107c10)
- **Cancelled**: Red (#a80000)

## 📈 Charts Library

All charts use [Chart.js 4.4.0](https://www.chartjs.org/) with:
- Responsive design
- Custom tooltips
- Consistent styling with MVL branding

## 🔄 Refreshing Data

To update dashboards with new data:

1. Place updated CSV files in the data folder
2. Run `process_data.py`
3. Refresh the HTML dashboard in browser

## 📝 Documentation

| Document | Purpose |
|----------|---------|
| PROJECT_ANALYSIS_REPORT.md | Complete project analysis |
| DATA_MAPPING_RULES.md | Business rules from Rita |
| DATA_FILES_REVIEW.md | CSV structure analysis |
| Individual README.md | Dashboard-specific docs |

## 🤝 Contributors

- **Rita El Jamal** - Business requirements & data model
- **BI Developer** - Dashboard implementation

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial release with real data |

---

*Powered by MVL Supply Intel Hub*
