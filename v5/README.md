# V5 - Supply Chain Intel Hub (Unified Dashboard)

_Version: 5.0_
_Created: February 12, 2026_
_Source: Visio Wireframe from Rita (SharePoint)_

---

## Overview

V5 is a **unified single-page dashboard** with three navigation tabs, replacing the separate v4 pages. All tabs share the same header, filters, and KPI row.

### Key Changes from V4
| Aspect | V4 | V5 |
|--------|----|----|
| Structure | 3 separate HTML pages | 1 unified page with tabs |
| Navigation | Portal landing page + links | Tab switching within page |
| Header | Different per dashboard | Single header, shared logos |
| Filters | Separate per page | Global filters affecting all tabs |
| Data | Separate data files | Unified data model |

---

## Folder Structure

```
v5/
├── README.md                    # This file
├── index.html                   # Main unified dashboard
├── data/
│   ├── material_codes.json      # Material code reference (from v4)
│   ├── dashboard_data.json      # Unified dashboard data
│   ├── orders.json              # Main Order data (210 records)
│   └── README.md                # Data documentation
├── shared/
│   ├── styles.css               # Main stylesheet
│   ├── scripts.js               # Main JavaScript
│   ├── images/
│   │   ├── supply-chain-intel-hub-logo.png  # Left header logo
│   │   └── README.md            # Image documentation
│   └── components/
│       └── README.md            # Component documentation
└── docs/
    └── DEVELOPMENT.md           # Development guide
```

---

## Design Specification

### Reference Document
See: `docs/reference/Main Dashboard - Visio Wireframe.md`

### Three Navigation Tabs
1. **Supplier Marketplace** (Default/Active) - ✅ Fully documented
2. **Global Spend Analysis** - 🔄 Pending Visio extraction
3. **Materials & Disciplines** - 🔄 Pending Visio extraction

---

## Header Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [◆ Supply Chain Intel Hub Logo]           [Last Refresh: ...] [MVL Logo]   │
│   (LEFT - network cube + text)                              (RIGHT)        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Supplier Marketplace] | [Global Spend Analysis] | [Materials & Disciplines]│
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Background:** Blue (#004578)
- **Left Logo:** Supply Chain Intel Hub (network cube icon)
- **Right Logo:** MVL company logo
- **Tabs:** Clickable, active tab highlighted

---

## Shared Components

### Filter Row (6 Filters)
| Filter | Default | Type |
|--------|---------|------|
| ENTITY | All Entities | Dropdown |
| PROJECT | All Projects | Dropdown |
| SUPPLIER | All Suppliers | Dropdown |
| STATUS | All Statuses | Dropdown |
| MATERIAL | All Materials | Dropdown |
| Search | "Search..." | Text Input |

### KPI Row (7 Cards)
| # | KPI | Sample Value |
|---|-----|--------------|
| 1 | Request for Quotation | 12,532 |
| 2 | Quote Value | $3.6B |
| 3 | Purchase Orders | 7,697 |
| 4 | PO Values | $721.3M |
| 5 | Win Rate | 97.7% |
| 6 | Change Orders | 7,697 |
| 7 | CO Value | $721.3M |

---

## Tab 1: Supplier Marketplace (Documented)

### Layout
```
┌─────────────────┬─────────────────┬─────────────────┐
│   Left Column   │  Center Column  │  Right Column   │
├─────────────────┼─────────────────┼─────────────────┤
│ Status Chart    │ Location Map    │ Supplier Profile│
│ Entity Compare  │ Material Dist.  │ MVL Employee    │
│ Top 10 Suppliers│ Quote→PO Time   │ Approved Mat.   │
└─────────────────┴─────────────────┴─────────────────┘
┌─────────────────────────────────────────────────────┐
│              Monthly Trend Chart                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ [Supplier List] | [Marketplace Workbench]           │
│ ┌─────────────────────────────────────────────────┐ │
│ │             Data Table                          │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Components
See `docs/reference/Main Dashboard - Visio Wireframe.md` Section 5 for full details.

---

## Tab 2: Global Spend Analysis (Pending)

_Awaiting Visio wireframe extraction_

---

## Tab 3: Materials & Disciplines (Pending)

_Awaiting Visio wireframe extraction_

---

## Data Model

### RFQ/PO Numbering System
- **RFQ Format:** `RFQ-{sequence}-{material_letter}{number}-{version}`
- **PO Format:** `RFPO-{sequence}-{material_letter}{number}-{order_type}`
- **Order Type:** `1` = Main PO, `2+` = Change Order

### Example
- RFQ: `RFQ-7139-V4359-1`
- PO: `RFPO-7139-V4359-1` (Main Order)
- CO: `RFPO-7139-V4359-2` (Change Order)

### Material Code Letters
| Code | Letter |
|------|--------|
| Architectural | A |
| Chemicals | C |
| Electrical | E |
| Fire | F |
| Logistics | L |
| Mechanical | M |
| Various | V |
| Services | S |
| Tools | T |

See `data/material_codes.json` for complete mapping.

---

## Development Progress

### Phase 1: Supplier Marketplace ✅
- [x] Wireframe documented
- [ ] HTML structure
- [ ] CSS styling
- [ ] JavaScript functionality
- [ ] Data integration

### Phase 2: Global Spend Analysis 🔄
- [ ] Wireframe documentation
- [ ] HTML structure
- [ ] CSS styling
- [ ] JavaScript functionality

### Phase 3: Materials & Disciplines 🔄
- [ ] Wireframe documentation
- [ ] HTML structure
- [ ] CSS styling
- [ ] JavaScript functionality

---

## Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Header Background | Blue | #004578 |
| Order Status | Green | #c6f6d5 |
| Waiting Status | Yellow | #fff4ce |
| Quotation Status | Blue | #cce5ff |
| Cancelled Status | Red | #ffe0e0 |
| Logo Primary | Dark Blue | #1a3a5c |
| Logo Secondary | Light Blue | #5da0d1 |

---

## Quick Start

1. Open `index.html` in browser
2. Use navigation tabs to switch views
3. Apply filters to refine data
4. Click charts/lists for drill-down

---

_Document maintained: February 2026_
