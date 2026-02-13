# MVL Supply Chain Intel Hub 🏢

A comprehensive procurement analytics solution built with HTML/CSS/JavaScript and Chart.js, designed to visualize quotation, purchase order, and supplier data for MVL (Multi Vision Limited).

[![Private Repo](https://img.shields.io/badge/repo-private-red.svg)](https://github.com/sajeshvs/mvl-powerbi-dashboards)
[![Version](https://img.shields.io/badge/version-5.0-blue.svg)](./v5/)
[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://sajeshvs.github.io/mvl/v5/)

---

## 📋 Version History

| Version | Date | Description |
|---------|------|-------------|
| **v5.0** | Feb 2026 | Unified dashboard with 3 tabs, comprehensive filtering, complete data integration |
| **v3.0** | Jan 2025 | Multi-page architecture, modal system, component architecture |
| **v2.0** | Jan 2025 | Initial multi-page architecture with navigation |

---

## 🎯 Project Overview

The MVL Supply Chain Intel Hub is a unified dashboard with three tabs:

| Tab | Description | Theme Color | Records |
|-----|-------------|-------------|---------|
| **Supplier Marketplace** | Quotation pipeline, supplier profiles, marketplace workbench | Blue (#004578) | 12,532 |
| **Global Spend Analysis** | PO spend analysis, Base vs Change Orders, supplier rankings | Orange (#d96f3c) | 3,539 |
| **Materials & Disciplines** | Budget vs Actual by material discipline, supplier performance | Dark Blue (#0f3d5e) | Combined |

### 🌐 Live Demo
**Production URL:** https://sajeshvs.github.io/mvl/v5/

---

## 📁 Project Structure

```
mvl-powerbi-dashboards/
├── v5/                                # ⭐ CURRENT PRODUCTION VERSION
│   ├── index.html                     # Unified dashboard (3 tabs)
│   ├── shared/                        # Scripts, styles, images
│   │   ├── scripts.js                 # Main JavaScript
│   │   ├── styles.css                 # Global CSS
│   │   └── images/                    # Logo and images
│   └── data/                          # JSON data files
│       ├── sm_data.json               # Supplier Marketplace (12,532 quotations)
│       ├── gsa_data.json              # Global Spend Analysis (3,539 POs)
│       ├── md_data.json               # Materials & Disciplines
│       ├── suppliers.json             # Enriched supplier data (2,189)
│       └── client_country_map.json    # Client → Country mapping
│
├── v3/                                # Previous version (backup)
│
├── docs/                              # 📚 Documentation
│   ├── reference/                     # Original requirements & narratives
│   └── *.md                           # Project docs
│
├── Data/                              # Source CSV files
│
├── archive/                           # 📦 Archived files
│   ├── v2-backup/                     # Old v2 files
│   ├── v4-backup/                     # Old v4 files
│   ├── old-scripts/                   # Previous Python scripts
│   └── outdated-docs/                 # Old documentation
│
├── mvl-supply-intel-hub-spfx/         # SharePoint Framework project
│
├── AGENT_INSTRUCTIONS.md              # 📋 Agent instructions (main)
└── README.md                          # This file
```

---

## ✨ v5.0 Features

### Unified 3-Tab Dashboard
- Single page with tab navigation
- Consistent design across all views
- Shared filter state management

### Comprehensive Filtering
- Entity, Project, Supplier, Material filters
- Date range selection
- Real-time chart/table updates on filter change

### Interactive Charts
- Chart.js visualization library
- Bar, Line, Pie, Doughnut charts
- Click-to-filter interactions
- Supplier ranking charts (Top/Bottom)

### Map Integration
- Leaflet.js supplier location map
- Client country mapping for accurate location display
- Filter-aware map updates

---

## 📊 Data Summary

| Dataset | Records | File Size |
|---------|---------|-----------|
| Quotations (SM) | 12,532 | 6.4 MB |
| Purchase Orders (GSA) | 3,539 | 2.0 MB |
| Suppliers | 2,189 | 3.2 MB |
| Client Mappings | 2,527 | 93 KB |

### Key Metrics
- **Total Quotation Value**: $3.0B USD
- **Total PO Spend**: $397.4M USD
- **Active Suppliers**: 1,092
- **Projects**: 98
- **Disciplines**: 28

---

## 🚀 Quick Start

### View Live Demo
Visit: https://sajeshvs.github.io/mvl/v5/

### Run Locally
```bash
# Navigate to v5 folder
cd "G:\Rita\mvl-powerbi-dashboards\v5"

# Start local server
python -m http.server 8085

# Open in browser
http://localhost:8085
```

---

## 🔧 Development

### Git Repositories
| Repo | Type | Purpose |
|------|------|---------|
| [mvl-powerbi-dashboards](https://github.com/sajeshvs/mvl-powerbi-dashboards) | Private | Complete workspace with data |
| [mvl](https://github.com/sajeshvs/mvl) | Public | v5 production deployment (GitHub Pages) |

### Workflow
1. Make changes in local workspace (`mvl-powerbi-dashboards/v5/`)
2. Test using local server (localhost:8085)
3. Commit to private repo
4. Copy to public repo (`mvl/v5/`) and push for live deployment

---

## 📝 Documentation

| Document | Location |
|----------|----------|
| **Agent Instructions** | `AGENT_INSTRUCTIONS.md` |
| Project Scope | `docs/reference/Scope of Work.md` |
| Data Model | `docs/reference/6. Data model – fact tables and dimensions.md` |
| GSA Requirements | `docs/reference/Global Spend Analysis - Requirements.md` |

---

## 🎨 Design System

### Color Themes
| Tab | Primary | Secondary |
|-----|---------|-----------|
| Supplier Marketplace | #004578 | #0064a3 |
| Global Spend Analysis | #d96f3c | #e8824a |
| Materials & Disciplines | #0f3d5e | #1a5a8a |

### Status Colors
- **Order/Completed**: Green (#2ecc71)
- **Waiting/Open**: Orange (#f39c12)
- **Cancelled**: Red (#e74c3c)

---

## 📈 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js 4.4.0
- **Maps**: Leaflet.js
- **Data**: JSON
- **Hosting**: GitHub Pages

---

## 👨‍💻 Author

**Sajesh VS**
- GitHub: [@sajeshvs](https://github.com/sajeshvs)

---

## 📄 License

Private repository - All rights reserved.

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.0 | Feb 2026 | Unified 3-tab dashboard with comprehensive filtering |
| 3.0 | Jan 2026 | Multi-page architecture with modals |
| 2.0 | Jan 2026 | Initial multi-page architecture |

---

*Powered by MVL Supply Intel Hub*
