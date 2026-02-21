# V5 Development Guide

_Supply Chain Intel Hub - Unified Dashboard_

---

## Quick Start

1. Open `v5/index.html` in browser
2. All three tabs are accessible from the top navigation
3. Supplier Marketplace tab is fully functional
4. Global Spend and Materials tabs show placeholders (pending Visio)

---

## Architecture

### Single Page Application
V5 uses a single HTML file with tab switching instead of separate pages.

```
index.html
├── Header (shared)
├── Navigation Tabs (3)
├── Filter Row (shared)
├── KPI Row (shared)
└── Main Content
    ├── Tab 1: Supplier Marketplace (active)
    ├── Tab 2: Global Spend Analysis (pending)
    └── Tab 3: Materials & Disciplines (pending)
```

### File Structure
```
v5/
├── index.html              # Main dashboard
├── data/
│   ├── dashboard_data.json # All data
│   ├── material_codes.json # Reference data
│   └── orders.json         # Main Order data (210 records)
└── shared/
    ├── styles.css          # All CSS
    ├── scripts.js          # All JavaScript
    └── images/             # Logo assets
```

---

## Adding New Tabs

### Step 1: Document the Wireframe
Create/update `docs/reference/Main Dashboard - Visio Wireframe.md` with:
- Section structure
- Chart specifications
- Sample data
- Color scheme

### Step 2: Add Tab Content HTML
In `index.html`, replace the pending placeholder:

```html
<div class="tab-content" id="tab-global-spend">
    <!-- Your tab content here -->
</div>
```

### Step 3: Add Data
In `data/dashboard_data.json`, update the section:

```json
"globalSpendAnalysis": {
    "chart1": [...],
    "chart2": [...]
}
```

### Step 4: Add Render Functions
In `shared/scripts.js`:

```javascript
function renderGlobalSpend() {
    const data = dashboardData.globalSpendAnalysis;
    // Render charts
}
```

---

## Component Library

### KPI Card
```html
<div class="kpi-card">
    <div class="kpi-value">12,532</div>
    <div class="kpi-label">Label</div>
</div>
```

### Status Bar
```html
<div class="status-bar-item">
    <div class="status-bar-label">Order</div>
    <div class="status-bar-track">
        <div class="status-bar-fill order" style="width: 75%"></div>
    </div>
    <div class="status-bar-value">7,697</div>
</div>
```

### Ranked List Item
```html
<div class="rank-item">
    <div class="rank-circle">1</div>
    <div class="rank-info">
        <div class="rank-name">Name</div>
        <div class="rank-meta">21 POs</div>
    </div>
    <div class="rank-bar-container">
        <div class="rank-bar" style="width: 80%"></div>
    </div>
    <div class="rank-value">$74.65M</div>
</div>
```

### Chart Card
```html
<div class="chart-card">
    <div class="chart-header">
        <h3 class="chart-title">Title</h3>
        <div class="chart-actions">
            <!-- Toggles -->
        </div>
    </div>
    <div class="chart-body">
        <!-- Content -->
    </div>
</div>
```

---

## CSS Variables

All colors and spacing use CSS variables in `:root`:

```css
--header-bg: #004578;
--status-order: #c6f6d5;
--status-quotation: #cce5ff;
--accent-blue: #0078D4;
--accent-orange: #FF6B35;
```

---

## JavaScript API

### Global State
```javascript
dashboardData   // All loaded data
selectedSupplier // Currently selected supplier
```

### Key Functions
```javascript
loadDashboardData()      // Load JSON data
renderSupplierMarketplace() // Render Tab 1
selectSupplier(index)    // Update supplier profile
formatCurrency(value)    // Format as $XXM
formatNumber(num)        // Format with commas
```

---

## Data Format

### RFQ/PO Numbering
```
RFQ-7139-V4359-1  →  RFPO-7139-V4359-1 (Main PO)
                 →  RFPO-7139-V4359-2 (Change Order)
```

- Sequence: `7139`
- Material Letter: `V` = Various
- Material Number: `4359`
- Order Type: `1` = PO, `2+` = CO

---

## Testing

Open browser console to debug:
```javascript
dashboardData()    // View all data
selectedSupplier() // View selected supplier
```

---

## Next Steps

1. **Global Spend Analysis Tab**
   - Get Visio wireframe from user
   - Document in wireframe.md
   - Implement HTML/CSS/JS

2. **Materials & Disciplines Tab**
   - Get Visio wireframe from user
   - Document in wireframe.md
   - Implement HTML/CSS/JS

3. **Enhancements**
   - Real map integration (Leaflet)
   - Live data connection
   - Currency conversion API

---

_Last updated: February 12, 2026_
