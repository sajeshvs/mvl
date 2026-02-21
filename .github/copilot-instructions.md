# MVL Supply Chain Intel Hub — Copilot Instructions

This is a **V8 unified dashboard** project built with vanilla JS (no build tools, no ES6 modules).

## Quick Context
- **Stack:** HTML + CSS + Vanilla JS + Chart.js + Leaflet.js 1.9.4
- **Data pipeline:** Python 3.12 (`v8/data/build_v8_data.py`) — reads Excel .xls via xlrd
- **3 Tabs:** Supplier Marketplace (Blue), Global Spend Analysis (Orange), Materials & Disciplines (Dark Blue)
- **Architecture:** Single `scripts.js` (~5,545 lines) — NOT modular ES6
- **No npm/webpack:** Pure vanilla JS served as static files
- **Data:** 3,946 RFQ quotations + 3,596 POs (309 Change Orders) from Feb 20, 2026 Excel export

## Key Conventions
- Single `scripts.js` file — all logic in one file (no import/export)
- Tab panels have `id="tab-<tabId>"`, nav buttons have `data-tab="<tabId>"`
- Filter functions: `applyFilters()` (SM), `applyGSAFilters()` (GSA), `applyMdFilters()` (M&D)
- Clear functions: `clearSMFilters()`, `clearGSAFilters()`, `clearMdFilters()`
- Currency values in `valueUSD` / `poSpendUSD` fields, formatted with `formatCurrency()`
- Blanks displayed as `(Blank)` in filters for visibility
- Change orders identified by PO suffix: `-1` = Base, `-2`+ = Change Order
- SearchableSelect component wraps all filter dropdowns with 10+ options

## File Roles
| File | Purpose |
|------|---------|
| `v8/index.html` | Single-page app with 3 tabs |
| `v8/shared/scripts.js` | All dashboard logic (~5,545 lines) |
| `v8/shared/styles.css` | Complete CSS with design tokens |
| `v8/data/build_v8_data.py` | Python pipeline reading Excel files (1,118 lines) |
| `v8/data/gsa_data.json` | GSA: 3,596 POs with change order data |
| `v8/data/sm_data.json` | SM: 3,946 RFQ quotations |
| `v8/data/md_data.json` | M&D: combined RFQs + POs |
| `v8/data/change_orders.json` | 191 CO groups with details |
| `v8/data/conversion_times.json` | 441 RFQ→PO links, monthly averages |

## Design Tokens
- SM: `#004578`, GSA: `#d96f3c`, M&D: `#0f3d5e`
- Font: `'Segoe UI', system-ui, sans-serif`
- Status: Green (#2ecc71), Blue (#3498db), Orange (#f39c12), Red (#e74c3c), Gray (#95a5a6)
- CO Badges: Red (#e74c3c) for CO, Green (#2ecc71) for Base, Gold (#f39c12) for group indicator

## Data Rebuild
```bash
cd v8/data
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" build_v8_data.py
```

## Detailed Instructions
See `AGENT_INSTRUCTIONS.md` in the repo root for comprehensive architecture docs, field schemas, and development guides.
