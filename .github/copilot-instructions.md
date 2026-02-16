# MVL Supply Chain Intel Hub — Copilot Instructions

This is a **V6 modular dashboard** project built with vanilla ES6 modules (no build tools).

## Quick Context
- **Stack:** HTML + CSS + ES6 Modules + Chart.js 4.4.1 + Leaflet.js 1.9.4
- **Data pipeline:** Python 3.13 (`v6/data/build_data.py`)
- **3 Tabs:** Supplier Marketplace (Blue), Global Spend Analysis (Orange), Materials & Disciplines (Dark Blue)
- **State management:** Centralized in `v6/js/state.js`
- **No npm/webpack:** Pure vanilla JS served as static files

## Key Conventions
- Use `import`/`export` for all module dependencies
- Always `destroyChart(id)` before recreating Chart.js instances
- Tab panels have `id="tab-<tabId>"`, nav buttons have `data-tab="<tabId>"`
- Apply filter functions are window-scoped: `window.applySMFilters`, `window.applyGSAFilters`, `window.applyMdFilters`
- Currency values stored in `valueUSD` / `poSpendUSD` fields, formatted with `formatCurrency()`
- Data JSON files wrap records in `{ "records": [...] }` (except `dashboard.json`)

## File Roles
| File | Purpose |
|------|---------|
| `v6/js/app.js` | Entry point, tab switching, keyboard shortcuts |
| `v6/js/state.js` | Shared state, filters, pagination, chart lifecycle |
| `v6/js/utils.js` | `formatCurrency()`, `debounce()`, pagination HTML |
| `v6/js/dataLoader.js` | Parallel data fetch, FX rate refresh |
| `v6/js/tab-sm.js` | SM tab controller |
| `v6/js/tab-gsa.js` | GSA tab controller |
| `v6/js/tab-md.js` | M&D tab controller |
| `v6/js/charts-*.js` | Chart rendering per tab |
| `v6/js/map.js` | Leaflet supplier location map |

## Design Tokens
- SM: `#004578`, GSA: `#d96f3c`, M&D: `#0f3d5e`
- Font: `'Segoe UI', system-ui, sans-serif`
- Status colors: Green (#2ecc71), Blue (#3498db), Orange (#f39c12), Red (#e74c3c), Gray (#95a5a6)

## Data Rebuild
```bash
cd v6/data && python build_data.py
```

## Detailed Instructions
See `AGENT_INSTRUCTIONS.md` in the repo root for comprehensive architecture docs, field schemas, and development guides.
