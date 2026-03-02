# MVL Supply Chain Intel Hub — Copilot Instructions

This project has **V9** (current, with Tax fields) and **V8** (previous) dashboard versions, built with vanilla JS (no build tools, no ES6 modules).

## Quick Context
- **Stack:** HTML + CSS + Vanilla JS + Chart.js + Leaflet.js 1.9.4
- **V9 Data pipeline:** Python 3.12 (`v9/data/build_v8_data.py`) — reads Excel .xls with Tax/Net Total via xlrd
- **V8 Data pipeline:** Python 3.12 (`v8/data/build_v8_data.py`) — reads Excel .xls via xlrd, auto-detects files
- **3 Tabs:** Supplier Marketplace (Blue), Global Spend Analysis (Orange), Materials & Disciplines (Dark Blue)
- **Architecture:** Single `scripts.js` (~6,030 lines in V9) — NOT modular ES6
- **No npm/webpack:** Pure vanilla JS served as static files
- **Data:** Dynamic — pipeline auto-detects PO/Quotation Excel files and computes all counts
- **V9 Tax:** PO and Quotation records include `taxUSD`/`netTotalUSD` fields; Tax columns in GSA/SM tables
- **V9 Docs:** DOCX generator (`v9/docs/generate_docx.py`), 52 CSV exports, tech doc MD
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
- **All 12 material codes shown** in SM bar chart and M&D doughnut (no `.slice()` truncation)
- **Material count labels:** SM Material Distribution bar chart shows "N materials" at end of each bar via custom Chart.js plugin `materialCountLabels`
- **MATERIAL_RAW_COUNTS** constant maps each code to its raw material count (e.g., Architectural:8, Fire:7, Services:5)
- `generateUniqueColors(count, sat, light)` for dynamic HSL chart colors
- **12-color palette** for material codes: `['#0066CC', '#3399FF', '#339933', '#66CC66', '#FF9900', '#FF6600', '#9966CC', '#CC6699', '#2B4257', '#06B6D4', '#EF4444', '#8B5CF6']`
- Rating property guards: handles both `{score: N}` object and plain number formats
- **No hardcoded data counts** — all KPIs, summaries, and fallbacks are computed from data
- **Pipeline auto-detects** PO file via `glob.glob('PO_List_*.xls')` and extracts export date from filename
- **Header-based column lookup** via `find_column()` / `build_column_map()` with positional fallback
- **Dynamic getFallbackData()** returns zeros so UI shows error state, never stale numbers
- **Country normalization:** `normalizeCountry()` (~150 entries) applied on all 3 tabs — SM map, supplier table/profile, GSA supplier card, M&D supplier table/profile
- **Country mapping pipeline:** `build_client_country_map.py` uses 4-source priority: address → phone_validation → phone_prefix → email_tld, with entity-based fallback
- **29 entity→country mappings** in JS (20 original + 9 GSA-only: MVL VENTURES, ENERGY, SOLUTIONS, CENTRICO, TRADING, FACILITIES, ARABIA, PROJECTS, Unknown)
- **60+ countryCoords** in JS for Leaflet map rendering

## File Roles
| File | Purpose |
|------|---------|
| `v9/index.html` | V9 single-page app with 3 tabs (Tax columns) |
| `v9/shared/scripts.js` | V9 dashboard logic (~6,030 lines, Tax KPIs + table columns) |
| `v9/shared/styles.css` | V9 CSS with design tokens |
| `v9/data/build_v8_data.py` | V9 pipeline — Tax fields + auto-detect Excel |
| `v9/data/gsa_data.json` | V9 GSA: 3,620 POs with taxUSD/netTotalUSD |
| `v9/data/sm_data.json` | V9 SM: 3,941 RFQ quotations with Tax/NetTotal |
| `v9/data/md_data.json` | V9 M&D: combined RFQs + POs with tax fields |
| `v9/csv-exports/` | V9: 52 CSV exports of all JSON data (with tax fields) |
| `v9/csv-exports/export_all_csv.py` | V9: CSV export script — regenerates all 52 CSVs |
| `v9/docs/generate_docx.py` | V9: DOCX generator (~1,530 lines, 12 sections with Tax) |
| `v9/docs/MVL_Dashboard_Documentation.docx` | V9: Generated Word doc (~25+ pages) |
| `v9/docs/MVL_Dashboard_Documentation.md` | V9: Technical documentation (~1,000 lines, 13 sections) |
| `v9/AGENT_INSTRUCTIONS.md` | V9 comprehensive development instructions |
| `v8/index.html` | V8 single-page app with 3 tabs |
| `v8/shared/scripts.js` | V8 dashboard logic (~5,860 lines) |
| `v8/shared/styles.css` | V8 CSS with design tokens |
| `v8/data/build_v8_data.py` | V8 pipeline — auto-detect Excel, no Tax |
| `v8/data/gsa_data.json` | V8 GSA: POs with change order data |
| `v8/data/sm_data.json` | V8 SM: RFQ quotations |
| `v8/data/md_data.json` | V8 M&D: combined RFQs + POs |

## Design Tokens
- SM: `#004578`, GSA: `#d96f3c`, M&D: `#0f3d5e`
- Font: `'Segoe UI', system-ui, sans-serif`
- Status: Green (#2ecc71), Blue (#3498db), Orange (#f39c12), Red (#e74c3c), Gray (#95a5a6)
- CO Badges: Red (#e74c3c) for CO, Green (#2ecc71) for Base, Gold (#f39c12) for group indicator

## Data Rebuild
```bash
# V9 (current — with Tax fields)
cd v9/data
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" build_v8_data.py

# V8 (previous — no Tax)
cd v8/data
& "C:\Users\Sajesh V S\AppData\Local\Programs\Python\Python312\python.exe" build_v8_data.py
```

## Appearance Rules
- When user says "width" or "reduce width", they mean **vertical height** — NOT horizontal width
- Never change SM grid column proportions (`1fr 1fr 1fr`)
- Bottom row last-child cards: `flex: 1` + `max-height: 380px` — all three must align vertically
- Top 10 Suppliers inner list: `max-height: 320px` with scroll
- Approved Material card must stretch to match the other two bottom cards

## Detailed Instructions
See `v9/AGENT_INSTRUCTIONS.md` for V9 comprehensive architecture docs, field schemas, and development guides.
See `AGENT_INSTRUCTIONS.md` in the repo root for V8 architecture docs.
