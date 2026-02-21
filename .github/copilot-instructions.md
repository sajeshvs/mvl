# MVL Supply Chain Intel Hub — Copilot Instructions

This is a **V8 unified dashboard** project built with vanilla JS (no build tools, no ES6 modules).

## Quick Context
- **Stack:** HTML + CSS + Vanilla JS + Chart.js + Leaflet.js 1.9.4
- **Data pipeline:** Python 3.12 (`v8/data/build_v8_data.py`) — reads Excel .xls via xlrd, auto-detects files
- **3 Tabs:** Supplier Marketplace (Blue), Global Spend Analysis (Orange), Materials & Disciplines (Dark Blue)
- **Architecture:** Single `scripts.js` (~5,470 lines) — NOT modular ES6
- **No npm/webpack:** Pure vanilla JS served as static files
- **Data:** Dynamic — pipeline auto-detects PO/Quotation Excel files and computes all counts
- **Review Status:** All 47 stakeholder review items resolved

## Key Conventions
- Single `scripts.js` file — all logic in one file (no import/export)
- Tab panels have `id="tab-<tabId>"`, nav buttons have `data-tab="<tabId>"`
- Filter functions: `applyFilters()` (SM), `applyGSAFilters()` (GSA), `applyMdFilters()` (M&D)
- Clear functions: `clearSMFilters()`, `clearGSAFilters()`, `clearMdFilters()`
- Currency values in `valueUSD` / `poSpendUSD` fields, formatted with `formatCurrency()`
- Blanks displayed as `(Blank)` in filters for visibility
- Change orders identified by PO suffix: `-1` = Base, `-2`+ = Change Order
- SearchableSelect component wraps all filter dropdowns with 10+ options (16 dropdowns total)
- Material (30 names) and Material Code (12 categories) filters separated on all tabs
- `generateUniqueColors(count, sat, light)` for dynamic HSL chart colors
- Rating property guards: handles both `{score: N}` object and plain number formats
- **No hardcoded data counts** — all KPIs, summaries, and fallbacks are computed from data
- **Pipeline auto-detects** PO file via `glob.glob('PO_List_*.xls')` and extracts export date from filename
- **Header-based column lookup** via `find_column()` / `build_column_map()` with positional fallback
- **Dynamic getFallbackData()** returns zeros so UI shows error state, never stale numbers

## File Roles
| File | Purpose |
|------|---------|
| `v8/index.html` | Single-page app with 3 tabs |
| `v8/shared/scripts.js` | All dashboard logic (~5,470 lines) |
| `v8/shared/styles.css` | Complete CSS with design tokens |
| `v8/data/build_v8_data.py` | Dynamic Python pipeline — auto-detects Excel files, header-based column lookup |
| `v8/data/gsa_data.json` | GSA: POs with change order data |
| `v8/data/sm_data.json` | SM: RFQ quotations |
| `v8/data/md_data.json` | M&D: combined RFQs + POs |
| `v8/data/change_orders.json` | CO groups with details |
| `v8/data/conversion_times.json` | RFQ→PO links, monthly averages |

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
