# V5 Shared Components

## Overview
Reusable UI components for the unified dashboard.

## Components

### 1. KPI Card
```html
<div class="kpi-card">
    <div class="kpi-value">12,532</div>
    <div class="kpi-label">Request for Quotation</div>
</div>
```

### 2. Filter Dropdown
```html
<div class="filter-group">
    <select class="filter-select" id="entityFilter">
        <option>All Entities</option>
    </select>
</div>
```

### 3. Status Bar
```html
<div class="status-bar">
    <div class="status-label">Order</div>
    <div class="status-progress" style="width: 75%"></div>
    <div class="status-value">7,697</div>
</div>
```

### 4. Ranked List Item
```html
<div class="rank-item">
    <div class="rank-circle">1</div>
    <div class="rank-info">
        <div class="rank-name">Supplier Name</div>
        <div class="rank-meta">21 POs</div>
    </div>
    <div class="rank-bar"></div>
    <div class="rank-value">$74.65M</div>
</div>
```

### 5. Navigation Tab
```html
<div class="nav-tabs">
    <button class="nav-tab active" data-tab="supplier-marketplace">
        Supplier Marketplace
    </button>
    <button class="nav-tab" data-tab="global-spend">
        Global Spend Analysis
    </button>
    <button class="nav-tab" data-tab="materials">
        Materials & Disciplines
    </button>
</div>
```

### 6. Chart Card
```html
<div class="chart-card">
    <div class="chart-header">
        <h3 class="chart-title">Chart Title</h3>
        <div class="chart-actions">
            <!-- Toggles, buttons -->
        </div>
    </div>
    <div class="chart-body">
        <!-- Chart content -->
    </div>
</div>
```

---

## Usage

Include in HTML:
```html
<link rel="stylesheet" href="shared/styles.css">
<script src="shared/scripts.js"></script>
```

---

_Last updated: February 12, 2026_
