# V6 Development Notes

## Build Date

February 16, 2026

## Changes from V5

### Data Layer

- **build_data.py**: New Python pipeline that reads V5 raw data, deduplicates, normalizes, and outputs clean JSON
- **Employee separation**: MVL employees (54 total) are now in their own `employees.json` file, properly separated from the 2,189 suppliers
- **Status normalization**: "Cancled" → "Cancelled", status values standardized across all records
- **Discipline consolidation**: 29+ discipline categories consolidated to 7 clean categories
- **Blank supplier fix**: Records with blank supplier names are filtered or labeled as "Unknown"
- **Deduplication**: Quotation and PO records deduplicated by their unique identifiers, eliminating 3-4x data bloat
- **Single source of truth**: `dashboard.json` contains pre-computed KPIs, filters, and aggregations

### Architecture

- **ES6 Modules**: Each tab has its own controller (tab-sm.js, tab-gsa.js, tab-md.js) and chart module (charts-sm.js, charts-gsa.js, charts-md.js)
- **Centralized state**: `state.js` holds all app state — active tab, filters, pagination, chart instances
- **Event-driven**: Custom events for tab switching, chart type changes, supplier selection, FX rate updates
- **Lazy initialization**: Tabs only initialize on first visit to improve load performance

### Visual Design

- **Design tokens**: CSS custom properties for consistent theming
- **Three distinct themes**: SM (Blue #004578), GSA (Orange #d96f3c), M&D (Dark Blue #0f3d5e)
- **Responsive**: Breakpoints at 1200px, 992px, 768px
- **Accessibility**: Focus indicators, keyboard shortcuts (Ctrl+1/2/3)

### Charts

- **Chart.js 4.4.1**: Consistent API usage with proper lifecycle management (destroy before recreate)
- **Chart toggles**: Entity chart switches between Quote Value and PO Spend views; Material chart switches between Bar, Pie, Doughnut, and Radar
- **Interactive**: Clicking GSA chart bars applies filters to the active tab
- **Tooltips**: Rich tooltips showing counts, values, and percentages

### Filtering

- **Per-tab filters**: Each tab has its own independent filter state
- **Immediate apply**: Dropdown changes auto-apply; search input uses debounce (300ms)
- **Clear all**: Each tab has a Clear button to reset all filters
- **Apply buttons**: Linked to window-scoped filter functions for onclick handlers

## Known Limitations

1. **FX rates**: API call to open.er-api.com may fail behind corporate firewalls; falls back to hardcoded rates
2. **Map**: Leaflet map requires client-to-country mapping; suppliers without mapped countries won't appear
3. **Large datasets**: If quotation/PO counts grow >50K, consider adding server-side pagination
4. **No offline mode**: Requires HTTP server (not file:// protocol) due to ES modules

## File Sizes (approximate)

- dashboard.json: 676 KB
- quotations.json: 9.7 MB
- purchase_orders.json: 2.9 MB
- suppliers.json: 1.4 MB
- employees.json: 10 KB
- client_country_map.json: 93 KB
- Total data: ~14.8 MB
- Total JS: ~55 KB
- Total CSS: ~30 KB
