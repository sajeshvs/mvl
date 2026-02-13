# MVL Supply Intel Hub - SPFx Project Plan

## 📋 Complete TODO & Implementation Guide

> **Project:** Convert v3 HTML dashboards to SharePoint Framework (SPFx) web parts  
> **Goal:** Deploy interactive procurement analytics dashboards directly in SharePoint  
> **Status:** Planning Phase  
> **Created:** Auto-generated from v3 HTML analysis

---

## 🎯 Project Overview

### What We're Building
Transform the existing v3 HTML dashboards into a fully-functional SPFx solution that:
- Runs natively in SharePoint Online
- Connects live to SharePoint Lists (MT_* data sources)
- Maintains exact same visual appearance as v3 HTML
- Provides interactive charts, filters, KPIs, and modal details

### Source Dashboards to Port
| Dashboard | Source Path | Key Features |
|-----------|-------------|--------------|
| Portal Home | `v3/index.html` | Dashboard cards, stats bar, navigation |
| Supplier Marketplace | `v3/supplier-marketplace/` | Quotation analysis, funnel, win rate |
| Global Spend Analysis | `v3/global-spend-analysis/` | PO tracking, spend by entity/supplier |
| Disciplines Consolidated | `v3/disciplines-consolidated/` | Budget vs Actual, cost tracking |

### SharePoint Data Sources
| List Name | Records | Used In |
|-----------|---------|---------|
| MT_Quotations | 12,073 | Supplier Marketplace |
| MT_PurchaseOrders | 3,539 | Global Spend Analysis |
| MT_Suppliers | 47 | All dashboards |
| MT_Entities | 28 | All dashboards |
| MT_Disciplines | 28 | Disciplines Consolidated |
| MT_MaterialGroups | 14 | All dashboards |
| MT_Summary | 24 | KPI calculations |
| MT_SpendByMonth | 40 | Trend charts |

---

## 🎨 Design Specifications

### Brand Colors (from v3/shared/styles.css)
```css
/* Primary Brand */
--color-primary: #004578;        /* MVL Blue - Headers, primary elements */
--color-primary-dark: #003359;   /* Dark Blue - Gradients */
--color-primary-light: #0078D4;  /* Microsoft Blue - Accent */
--color-accent: #00A4EF;         /* Light Blue - Highlights */

/* Status Colors */
--color-success: #107C10;        /* Green - Orders, positive */
--color-warning: #FFB900;        /* Amber - Waiting, pending */
--color-danger: #D83B01;         /* Orange-Red - Cancelled */
--color-info: #00B7C3;           /* Teal - Quotations */

/* Backgrounds */
--color-bg: #F4F6F8;             /* Page background */
--color-card: #FFFFFF;           /* Card backgrounds */
--color-border: #EDEBE9;         /* Borders */
```

### Dashboard-Specific Gradients
```css
/* Portal Header */
background: linear-gradient(135deg, #004578 0%, #003359 100%);

/* Supplier Marketplace Cards */
.card-icon.supplier: background: linear-gradient(135deg, #0078D4 0%, #00A4EF 100%);

/* Global Spend Analysis */
.card-icon.spend: background: linear-gradient(135deg, #107C10 0%, #00B7C3 100%);

/* Disciplines */
.card-icon.disciplines: background: linear-gradient(135deg, #881798 0%, #D83B01 100%);
--primary-color: #0f3d5e;
```

### Typography
```css
--font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
--font-size-xs: 10px;
--font-size-sm: 11px;
--font-size-md: 12px;
--font-size-lg: 14px;
--font-size-xl: 16px;
--font-size-xxl: 20px;
--font-size-kpi: 28px;
```

### Logo
- **Location:** `v3/shared/images/logo.png`
- **Usage:** Header left side, portal branding
- **Action:** Include in SPFx assets, use in header component

### Spacing System
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 24px;
--space-xxl: 32px;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 2px 4px rgba(0,0,0,0.08);
--shadow-lg: 0 4px 12px rgba(0,0,0,0.12);
--shadow-hover: 0 4px 16px rgba(0,0,0,0.15);
```

---

## 📂 SPFx Project Structure

```
mvl-supply-intel-hub-spfx/
├── config/
│   ├── config.json
│   ├── deploy-azure-storage.json
│   ├── package-solution.json
│   └── serve.json
├── src/
│   ├── webparts/
│   │   ├── supplyIntelHub/
│   │   │   ├── SupplyIntelHubWebPart.ts
│   │   │   ├── SupplyIntelHubWebPart.manifest.json
│   │   │   └── components/
│   │   │       ├── SupplyIntelHub.tsx
│   │   │       ├── SupplyIntelHub.module.scss
│   │   │       ├── Portal/
│   │   │       │   ├── Portal.tsx
│   │   │       │   └── Portal.module.scss
│   │   │       ├── SupplierMarketplace/
│   │   │       │   ├── SupplierMarketplace.tsx
│   │   │       │   ├── SupplierMarketplace.module.scss
│   │   │       │   └── components/
│   │   │       │       ├── KPIRow.tsx
│   │   │       │       ├── FunnelChart.tsx
│   │   │       │       ├── SupplierList.tsx
│   │   │       │       ├── MaterialChart.tsx
│   │   │       │       ├── StatusChart.tsx
│   │   │       │       ├── TrendChart.tsx
│   │   │       │       └── WorkbenchTable.tsx
│   │   │       ├── GlobalSpendAnalysis/
│   │   │       │   ├── GlobalSpendAnalysis.tsx
│   │   │       │   ├── GlobalSpendAnalysis.module.scss
│   │   │       │   └── components/
│   │   │       │       ├── SpendKPIs.tsx
│   │   │       │       ├── EntitySpendChart.tsx
│   │   │       │       ├── SupplierRankingChart.tsx
│   │   │       │       ├── SpendTrendChart.tsx
│   │   │       │       └── POTable.tsx
│   │   │       ├── DisciplinesConsolidated/
│   │   │       │   ├── DisciplinesConsolidated.tsx
│   │   │       │   ├── DisciplinesConsolidated.module.scss
│   │   │       │   └── components/
│   │   │       │       ├── BudgetKPIs.tsx
│   │   │       │       ├── DisciplineCards.tsx
│   │   │       │       ├── BudgetVsActualChart.tsx
│   │   │       │       ├── VarianceChart.tsx
│   │   │       │       └── DisciplineTable.tsx
│   │   │       └── shared/
│   │   │           ├── Header/
│   │   │           │   ├── Header.tsx
│   │   │           │   └── Header.module.scss
│   │   │           ├── FilterBar/
│   │   │           │   ├── FilterBar.tsx
│   │   │           │   └── FilterBar.module.scss
│   │   │           ├── KPICard/
│   │   │           │   ├── KPICard.tsx
│   │   │           │   └── KPICard.module.scss
│   │   │           ├── ChartCard/
│   │   │           │   ├── ChartCard.tsx
│   │   │           │   └── ChartCard.module.scss
│   │   │           ├── DataTable/
│   │   │           │   ├── DataTable.tsx
│   │   │           │   └── DataTable.module.scss
│   │   │           ├── Modal/
│   │   │           │   ├── Modal.tsx
│   │   │           │   ├── Modal.module.scss
│   │   │           │   ├── QuotationDetailModal.tsx
│   │   │           │   ├── SupplierProfileModal.tsx
│   │   │           │   └── PODetailModal.tsx
│   │   │           └── Charts/
│   │   │               ├── BarChart.tsx
│   │   │               ├── HorizontalBarChart.tsx
│   │   │               ├── DoughnutChart.tsx
│   │   │               ├── LineChart.tsx
│   │   │               ├── FunnelChart.tsx
│   │   │               └── ChartColors.ts
│   ├── services/
│   │   ├── SharePointService.ts
│   │   ├── QuotationService.ts
│   │   ├── PurchaseOrderService.ts
│   │   ├── SupplierService.ts
│   │   ├── EntityService.ts
│   │   ├── DisciplineService.ts
│   │   └── DataTransformService.ts
│   ├── models/
│   │   ├── IQuotation.ts
│   │   ├── IPurchaseOrder.ts
│   │   ├── ISupplier.ts
│   │   ├── IEntity.ts
│   │   ├── IDiscipline.ts
│   │   ├── IMaterialGroup.ts
│   │   └── ISummary.ts
│   ├── utils/
│   │   ├── DataUtils.ts
│   │   ├── FormatUtils.ts
│   │   ├── ChartUtils.ts
│   │   └── FilterUtils.ts
│   └── styles/
│       ├── _variables.scss
│       ├── _mixins.scss
│       ├── _typography.scss
│       └── _common.scss
├── assets/
│   └── images/
│       └── logo.png
├── package.json
├── tsconfig.json
├── gulpfile.js
└── README.md
```

---

## ✅ DETAILED TODO LIST

### Phase 1: Project Setup (Day 1)

#### 1.1 Initialize SPFx Project
- [ ] Install Node.js LTS (v18.x recommended)
- [ ] Install Yeoman: `npm install -g yo`
- [ ] Install SPFx Generator: `npm install -g @microsoft/generator-sharepoint`
- [ ] Create project: `yo @microsoft/sharepoint`
  - Solution name: `mvl-supply-intel-hub`
  - Component type: Web Part
  - Framework: React
  - Web part name: `SupplyIntelHub`
  - Web part description: `MVL Supply Intelligence Hub - Procurement Analytics Dashboard`

#### 1.2 Install Dependencies
```bash
npm install @pnp/sp @pnp/graph @pnp/logging
npm install chart.js react-chartjs-2
npm install @fluentui/react
npm install lodash @types/lodash
```

#### 1.3 Configure Project
- [ ] Update `config/package-solution.json` with app catalog settings
- [ ] Configure `config/serve.json` for local development with SharePoint site
- [ ] Add SharePoint site URL to serve configuration
- [ ] Update manifest with required permissions for SharePoint lists

#### 1.4 Copy Assets
- [ ] Copy logo from `v3/shared/images/logo.png` to `assets/images/`
- [ ] Create SCSS variables file from v3 CSS custom properties

---

### Phase 2: Shared Components (Day 2-3)

#### 2.1 Create SCSS Variables
- [ ] Create `src/styles/_variables.scss`
  - Port all CSS custom properties from `v3/shared/styles.css`
  - Define color palette, spacing, typography, shadows

#### 2.2 Header Component
- [ ] Create `src/webparts/supplyIntelHub/components/shared/Header/Header.tsx`
- [ ] Replicate gradient header from v3
- [ ] Include logo, title, subtitle, refresh time, entity info
- [ ] Add back navigation for sub-dashboards

#### 2.3 FilterBar Component
- [ ] Create multi-filter bar with dropdown selects
- [ ] Support Entity, Status, Material, Date Range filters
- [ ] Active filter tags display with remove buttons
- [ ] Reset all filters button

#### 2.4 KPICard Component
- [ ] Card with colored top border
- [ ] Icon, label, value, sub-text, change indicator
- [ ] Clickable variant for drill-down
- [ ] Status-based coloring (success, warning, danger, info)

#### 2.5 DataTable Component
- [ ] Sortable columns with indicators
- [ ] Pagination (25/50/100 per page)
- [ ] Row click handlers for modals
- [ ] Status badges styling
- [ ] Responsive horizontal scroll

#### 2.6 Chart Components
- [ ] Base ChartCard wrapper with header and toggle buttons
- [ ] BarChart component (vertical)
- [ ] HorizontalBarChart component
- [ ] DoughnutChart component
- [ ] LineChart component
- [ ] FunnelChart component (custom CSS-based from v3)
- [ ] ChartColors utility matching v3 palette

#### 2.7 Modal System
- [ ] Base Modal component with overlay, header, body, footer
- [ ] Tabs support inside modals
- [ ] Size variants: small, medium, large, fullscreen
- [ ] Keyboard escape to close
- [ ] Click outside to close
- [ ] QuotationDetailModal
- [ ] SupplierProfileModal
- [ ] PODetailModal

---

### Phase 3: Data Services (Day 3-4)

#### 3.1 PnP/SP Configuration
- [ ] Initialize PnP/SP in web part
- [ ] Configure context in `onInit()`

#### 3.2 SharePoint Service
- [ ] Create base SharePoint service class
- [ ] Implement list data fetching with pagination
- [ ] Handle throttling with retry logic
- [ ] Cache responses for performance

#### 3.3 Data Models
- [ ] Create TypeScript interfaces for all list schemas:
  ```typescript
  interface IQuotation {
    Id: number;
    QuotationNumber: string;
    SupplierName: string;
    Entity: string;
    MaterialGroup: string;
    QuotationValue: number;
    Currency: string;
    Status: string;
    CreatedDate: Date;
    ValidityDays: number;
    Description?: string;
    // ... all fields from MT_Quotations
  }
  ```

#### 3.4 Individual Services
- [ ] QuotationService - MT_Quotations list access
- [ ] PurchaseOrderService - MT_PurchaseOrders list access
- [ ] SupplierService - MT_Suppliers list access
- [ ] EntityService - MT_Entities list access
- [ ] DisciplineService - MT_Disciplines list access
- [ ] SummaryService - MT_Summary, MT_SpendByMonth

#### 3.5 Data Transform Service
- [ ] Aggregation functions (group by entity, material, supplier)
- [ ] KPI calculations (totals, averages, rates)
- [ ] Chart data formatting
- [ ] Filter application logic

---

### Phase 4: Portal/Home Page (Day 4)

#### 4.1 Portal Component
- [ ] Create `Portal.tsx` as main landing page
- [ ] Hero header with gradient and branding
- [ ] Dashboard cards grid (responsive)

#### 4.2 Stats Bar
- [ ] Total Quotations count
- [ ] Total Purchase Orders count
- [ ] Total Suppliers count
- [ ] Last Refresh timestamp

#### 4.3 Dashboard Cards
- [ ] Supplier Marketplace card
  - Icon: 📊 with blue gradient
  - Features list with checkmarks
  - Navigation CTA arrow
- [ ] Global Spend Analysis card
  - Icon: 💰 with green gradient
  - Features list with checkmarks
  - Navigation CTA arrow
- [ ] Disciplines Consolidated card
  - Icon: 📈 with purple gradient
  - Features list with checkmarks
  - Navigation CTA arrow

#### 4.4 Navigation
- [ ] React Router or state-based page switching
- [ ] URL hash routing for bookmarkable pages
- [ ] Breadcrumb navigation

---

### Phase 5: Supplier Marketplace Dashboard (Day 5-6)

#### 5.1 Main Layout
- [ ] Header with "Supplier Marketplace" title
- [ ] Filter bar (Entity, Status, Material, Search)
- [ ] 5-column KPI row
- [ ] Main grid with charts and tables

#### 5.2 KPI Cards
- [ ] 📝 Quotations (total count, % filtered)
- [ ] ✅ Orders/POs (converted count)
- [ ] 🎯 Win Rate (Orders / Decided %)
- [ ] 💰 Quote Value (total quoted $)
- [ ] 🏦 PO Spend (committed $)

#### 5.3 Charts
- [ ] **Funnel Chart**: Quotation → Waiting → Order → Cancelled
- [ ] **Material Group Chart**: Bar chart by material category
- [ ] **Supplier Ranking**: Horizontal bar top 10 suppliers
- [ ] **Entity Distribution**: Doughnut by entity
- [ ] **Status Breakdown**: Doughnut by status
- [ ] **Trend Chart**: Line chart over time

#### 5.4 Workbench Table
- [ ] All quotation records with pagination
- [ ] Columns: Quotation#, Supplier, Entity, Material, Value, Status, Date
- [ ] Sortable headers
- [ ] Row click → Quotation Detail Modal

#### 5.5 Modals
- [ ] Quotation Details with all fields
- [ ] Linked PO information if converted
- [ ] Supplier quick profile link

---

### Phase 6: Global Spend Analysis Dashboard (Day 6-7)

#### 6.1 Main Layout
- [ ] Header with "Global Spend Analysis" title
- [ ] Two-tier filter bar (Entity, Supplier, Material, Date Range)
- [ ] 6-column KPI row
- [ ] Chart grid and PO table

#### 6.2 KPI Cards
- [ ] 📦 Purchase Orders (total count)
- [ ] 💵 Total Spend (sum of PO values)
- [ ] 📊 Avg PO Value
- [ ] 🏢 Active Entities (with POs)
- [ ] 🤝 Active Suppliers (with POs)
- [ ] 📈 Month-over-Month % change

#### 6.3 Charts
- [ ] **Entity Spend**: Horizontal bar by entity
- [ ] **Supplier Ranking**: Top suppliers by spend
- [ ] **Material Distribution**: Doughnut by material group
- [ ] **Monthly Trend**: Line chart with spend over time
- [ ] **YTD Comparison**: Current vs previous year

#### 6.4 PO Table
- [ ] All PO records with pagination
- [ ] Columns: PO#, Supplier, Entity, Value, Date, Status
- [ ] Row click → PO Detail Modal

---

### Phase 7: Disciplines Consolidated Dashboard (Day 7-8)

#### 7.1 Main Layout
- [ ] Header with "Disciplines Consolidated" title
- [ ] Filter bar (Entity, Discipline, View Toggle)
- [ ] 5-column KPI row
- [ ] Charts grid and discipline cards

#### 7.2 KPI Cards
- [ ] 📋 Disciplines (total count)
- [ ] 💰 Total Budget
- [ ] 📊 Total Actual
- [ ] 📈 Variance (Budget - Actual)
- [ ] 📉 Variance % (utilization)

#### 7.3 Charts
- [ ] **Budget vs Actual**: Grouped bar chart
- [ ] **Variance Analysis**: Horizontal diverging bar
- [ ] **Top Over/Under Budget**: Ranked list
- [ ] **Discipline Distribution**: Doughnut

#### 7.4 Discipline Cards Grid
- [ ] Card per discipline with mini chart
- [ ] Budget/Actual/Variance display
- [ ] Progress bar visualization
- [ ] Color-coded variance indicators

#### 7.5 Discipline Table
- [ ] All disciplines with details
- [ ] Sort by budget, actual, variance
- [ ] Click for discipline drill-down

---

### Phase 8: Testing & Refinement (Day 8-9)

#### 8.1 Functional Testing
- [ ] All filters work correctly
- [ ] Charts render with live data
- [ ] Pagination works
- [ ] Modals open/close properly
- [ ] Navigation between dashboards

#### 8.2 Performance Optimization
- [ ] Lazy load chart.js
- [ ] Virtualize large tables
- [ ] Cache SharePoint data
- [ ] Minimize re-renders

#### 8.3 Responsive Design
- [ ] Test on different screen sizes
- [ ] Mobile-friendly filter collapse
- [ ] Chart resize handling
- [ ] Touch interactions

#### 8.4 Cross-browser Testing
- [ ] Edge (primary for SharePoint)
- [ ] Chrome
- [ ] Firefox

---

### Phase 9: Deployment (Day 9-10)

#### 9.1 Build for Production
```bash
gulp clean
gulp bundle --ship
gulp package-solution --ship
```

#### 9.2 Deploy to App Catalog
- [ ] Upload `.sppkg` to SharePoint App Catalog
- [ ] Approve API permissions if needed
- [ ] Deploy globally or to specific sites

#### 9.3 Add to SharePoint Pages
- [ ] Create new Site Page or modify existing
- [ ] Add "MVL Supply Intel Hub" web part
- [ ] Configure initial settings if any

#### 9.4 Documentation
- [ ] Update README with deployment steps
- [ ] Create admin guide
- [ ] Document data refresh schedule

---

## 📊 Component Mapping: v3 HTML → SPFx

| v3 HTML Element | SPFx React Component | Notes |
|-----------------|---------------------|-------|
| `v3/shared/styles.css` | `_variables.scss`, component SCSS | Port CSS variables |
| `v3/shared/charts.js` | `Charts/*.tsx` | React-chartjs-2 wrappers |
| `v3/shared/data-utils.js` | `utils/DataUtils.ts` | TypeScript conversion |
| `v3/shared/components/modal.*` | `shared/Modal/Modal.tsx` | React modal component |
| `.dashboard-header` | `Header.tsx` | Gradient header |
| `.filters-bar` | `FilterBar.tsx` | Multi-select dropdowns |
| `.kpi-card` | `KPICard.tsx` | Reusable KPI component |
| `.card` | `ChartCard.tsx` | Chart container |
| `data-table` | `DataTable.tsx` | Sortable paginated table |
| `Chart.js instance` | `<Bar>`, `<Doughnut>`, etc. | react-chartjs-2 |

---

## 🔗 SharePoint List Field Mappings

### MT_Quotations
| Field | Internal Name | Type | Used In |
|-------|---------------|------|---------|
| ID | Id | Number | All |
| Quotation Number | QuotationNumber | Text | Display |
| Supplier | SupplierName | Text | Charts, filters |
| Entity | Entity | Text | Charts, filters |
| Material Group | MaterialGroup | Choice | Charts, filters |
| Value | QuotationValue | Currency | KPIs, charts |
| Status | Status | Choice | Funnel, filters |
| Created | Created | DateTime | Trend charts |

### MT_PurchaseOrders
| Field | Internal Name | Type | Used In |
|-------|---------------|------|---------|
| PO Number | PONumber | Text | Display |
| Supplier | SupplierName | Text | Charts |
| Entity | Entity | Text | Charts |
| PO Value | POValue | Currency | KPIs |
| PO Date | PODate | DateTime | Trends |

### MT_Disciplines
| Field | Internal Name | Type | Used In |
|-------|---------------|------|---------|
| Discipline | DisciplineName | Text | Display |
| Budget | Budget | Currency | Charts |
| Actual | Actual | Currency | Charts |
| Entity | Entity | Text | Filter |

---

## 🛠️ Key Technical Decisions

### 1. State Management
- Use React Context for global state (filters, selected dashboard)
- Local component state for chart interactions
- PnP/SP for data fetching with caching

### 2. Chart Library
- **chart.js** + **react-chartjs-2** (matches v3 HTML)
- Consistent color palette across all charts
- Responsive chart containers

### 3. Styling Approach
- **SCSS Modules** for component styles
- Shared variables file for consistency
- Fluent UI components where appropriate

### 4. Data Fetching Strategy
- Fetch all data on dashboard load
- Client-side filtering for responsiveness
- Background refresh every 5 minutes
- Loading states and error handling

### 5. Navigation
- Single-page app with state-based routing
- Hash-based URLs for SharePoint compatibility
- Smooth transitions between views

---

## 📋 Pre-requisites Checklist

- [ ] Node.js v18.x LTS installed
- [ ] SharePoint Online tenant admin access
- [ ] App Catalog created in SharePoint
- [ ] Access to MVL MicroTrack Power BI site
- [ ] Read permissions on all MT_* lists
- [ ] VS Code with SPFx extensions

---

## 🚀 Quick Start Commands

```bash
# Navigate to project directory (after creation)
cd mvl-supply-intel-hub-spfx

# Install dependencies
npm install

# Start local development server
gulp serve

# Build for production
gulp bundle --ship
gulp package-solution --ship

# Package location
# sharepoint/solution/mvl-supply-intel-hub.sppkg
```

---

## 📝 Notes & Considerations

1. **Authentication**: SPFx handles authentication automatically via SharePoint context
2. **API Limits**: SharePoint list threshold is 5000 items; use pagination/indexing
3. **Permissions**: Need to request Graph API permissions for lists if using Microsoft Graph
4. **Caching**: Consider localStorage for offline/cached data display
5. **Accessibility**: Follow WCAG guidelines, keyboard navigation, screen readers

---

## 📞 SharePoint Site Details

- **Site URL:** https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi
- **Site ID:** mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59
- **Tenant:** mvlgroupusa.onmicrosoft.com

---

*This TODO file is auto-generated based on analysis of v3 HTML dashboards. Update as implementation progresses.*
