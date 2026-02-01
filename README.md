# MVL Supply Intel Hub 🏢

A comprehensive procurement analytics solution built with HTML/CSS/JavaScript and Chart.js, designed to visualize quotation, purchase order, and supplier data for MVL (Multi Vision Limited).

[![Private Repo](https://img.shields.io/badge/repo-private-red.svg)](https://github.com/sajeshvs/mvl-powerbi-dashboards)
[![Version](https://img.shields.io/badge/version-3.0-blue.svg)](./v3/)
[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://sajeshvs.github.io/mvl/)

---

## 📋 Version History

| Version | Date | Description |
|---------|------|-------------|
| **v3.0** | Jan 2025 | Modal system, mobile responsive, component architecture |
| **v2.0** | Jan 2025 | Multi-page architecture with navigation |
| **v1.0** | Jan 2025 | Initial standalone HTML dashboards |

---

## 🎯 Project Overview

The MVL Supply Intel Hub consists of three interactive dashboards:

| Dashboard | Description | Theme Color | Records |
|-----------|-------------|-------------|---------|
| **Supplier Marketplace** | Quotation funnel, supplier profiles, marketplace workbench | Blue | 12,134 |
| **Global Spend Analysis** | PO spend analysis, Base vs Change Orders | Orange | 3,539 |
| **Disciplines Consolidated** | Budget vs Actual by material discipline | Dark Blue | 28 |

### 🌐 Live Demo
**Public URL:** https://sajeshvs.github.io/mvl/

---

## 📁 Project Structure

```
PowerBI/
├── v3/                                # ⭐ CURRENT PRODUCTION VERSION
│   ├── index.html                     # Main navigation hub
│   ├── supplier-marketplace/          # Quotation dashboard
│   ├── global-spend-analysis/         # PO spend dashboard
│   ├── disciplines-consolidated/      # Budget analysis
│   └── shared/                        # Common components
│       ├── components/                # Modal system
│       ├── styles.css                 # Shared styling
│       ├── charts.js                  # Chart configurations
│       └── data-utils.js              # Data utilities
│
├── v2/                                # Previous stable backup
│
├── docs/                              # 📚 All documentation
│   ├── reference/                     # Original requirements
│   ├── images/                        # UI mockups & screenshots
│   └── *.md/*.docx                    # Project docs
│
├── archive/                           # 📦 Historical files
│   ├── legacy-html/                   # Old standalone HTMLs
│   ├── legacy-dashboards/             # Original dashboard attempts
│   ├── old-scripts/                   # Previous Python scripts
│   └── data-review/                   # Data analysis files
│
├── working/                           # 🔧 Scratch/experimental
│
├── CONTINUE_LATER.md                  # Instructions to resume work
└── README.md                          # This file
```

---

## ✨ v3.0 Features

### Interactive Modals
Click on any row or card to view detailed information:
- **PO Details**: Full purchase order breakdown
- **Supplier Profiles**: Complete supplier information
- **Quote Details**: Quotation line items and status

### Mobile Responsive
- Optimized layouts for all screen sizes
- Touch-friendly interactions
- Horizontal scrolling tables on mobile

### Shared Component Architecture
```
v3/shared/
├── components/
│   ├── modal.js        # Reusable Modal class
│   ├── modal.css       # Modal styling
│   └── detail-modals.js # PO/Supplier/Quote templates
├── styles.css          # Common styles
├── charts.js           # Chart configurations
└── data-utils.js       # Data utilities
```

---

## 📊 Data Summary

| Dataset | Records | File Size |
|---------|---------|-----------|
| Quotations | 12,134 | 6.4 MB |
| Purchase Orders | 3,539 | 2.0 MB |
| Disciplines | 28 | 309 KB |

### Key Metrics
- **Total Quotation Value**: $3.3B USD
- **Total PO Spend**: $421.9M USD
- **Win Rate**: 100% (Order / (Order + Cancelled))
- **Active Suppliers**: 400+

---

## 🚀 Quick Start

### View Live Demo
Visit: https://sajeshvs.github.io/mvl/

### Run Locally
```bash
# Navigate to v3 folder
cd "c:\Users\Sajesh\Documents\Apps\Rita\PowerBI\v3"

# Start local server
python -m http.server 8000

# Open in browser
http://localhost:8000
```

### Prerequisites
- Python 3.x
- Web browser (Chrome, Firefox, Edge recommended)

---

## 🔧 Development

### Git Repositories
| Repo | Type | Purpose |
|------|------|---------|
| [mvl-powerbi-dashboards](https://github.com/sajeshvs/mvl-powerbi-dashboards) | Private | Complete workspace with data |
| [mvl](https://github.com/sajeshvs/mvl) | Public | v3 production deployment |

### Workflow
1. Make changes in local workspace
2. Test using local server
3. Commit to private repo (full backup)
4. Deploy v3 to public repo for live demo

---

## 📝 Documentation

| Document | Location |
|----------|----------|
| Project Scope | `docs/reference/Scope of Work.md` |
| Data Model | `docs/reference/6. Data model – fact tables and dimensions.md` |
| DAX Measures | `docs/reference/7. Key DAX measures.md` |
| Development Guide | `docs/reference/8. How the BI Developer needs to be proceed.md` |
| Continue Instructions | `CONTINUE_LATER.md` |

---

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

---

## 📈 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js 4.4.0
- **Data**: JSON (processed from CSV)
- **Hosting**: GitHub Pages

---

## 👨‍💻 Author

**Sajesh VS**
- GitHub: [@sajeshvs](https://github.com/sajeshvs)

---

## 📄 License

Private repository - All rights reserved.

## 🤝 Contributors

- **Rita El Jamal** - Business requirements & data model
- **BI Developer** - Dashboard implementation

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial release with real data |

---

*Powered by MVL Supply Intel Hub*
