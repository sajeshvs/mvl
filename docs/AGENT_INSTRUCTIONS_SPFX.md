# Agent Instructions: SPFx Web Part

## Overview

The MVL Supply Intel Hub SPFx web part is a SharePoint Framework solution that provides interactive procurement analytics dashboards directly in SharePoint Online. It reads data from SharePoint lists and displays three main dashboards.

---

## Project Location

```
g:\Rita\mvl-powerbi-dashboards\mvl-supply-intel-hub-spfx\
```

---

## Solution Information

| Property | Value |
|----------|-------|
| **Name** | MVL Supply Intel Hub |
| **Solution ID** | a5e8f3b2-4c91-4d7e-b8f6-2c9a1d3e5f7b |
| **Version** | 1.0.0.0 |
| **SPFx Version** | 1.21.1 |
| **Node Version** | 18.17.1+ or 20.9.0+ |
| **Package File** | sharepoint/solution/mvl-supply-intel-hub.sppkg |

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| SPFx | 1.21.1 | SharePoint Framework |
| React | 17.0.1 | UI components |
| TypeScript | 4.7.4 | Type-safe code |
| @pnp/sp | 4.8.0 | SharePoint REST API |
| Chart.js | 4.4.0 | Charts |
| react-chartjs-2 | 5.2.0 | React Chart.js wrapper |
| Fluent UI React | 8.110.10 | Microsoft design system |
| react-router-dom | 6.20.0 | Navigation |

---

## Project Structure

```
mvl-supply-intel-hub-spfx/
├── config/
│   ├── config.json
│   ├── deploy-azure-storage.json
│   ├── package-solution.json      # Solution config
│   ├── serve.json
│   └── write-manifests.json
├── src/
│   ├── models/
│   │   └── index.ts               # TypeScript interfaces
│   ├── services/
│   │   └── SharePointService.ts   # Data access layer
│   ├── styles/
│   │   └── variables.module.scss  # Theme variables
│   ├── utils/
│   │   └── (utility functions)
│   └── webparts/
│       └── supplyIntelHub/
│           ├── components/
│           │   ├── DisciplinesConsolidated/
│           │   ├── GlobalSpendAnalysis/
│           │   ├── Portal/
│           │   ├── SupplierMarketplace/
│           │   ├── shared/
│           │   ├── SupplyIntelHub.tsx
│           │   └── SupplyIntelHub.module.scss
│           ├── loc/
│           ├── SupplyIntelHubWebPart.manifest.json
│           └── SupplyIntelHubWebPart.ts
├── sharepoint/
│   └── solution/
│       └── mvl-supply-intel-hub.sppkg  # Deployable package
├── package.json
├── tsconfig.json
└── gulpfile.js
```

---

## Dashboards

### 1. Portal (Landing Page)
**Path:** `components/Portal/`
**View:** `portal`

Navigation hub with cards linking to each dashboard.

### 2. Supplier Marketplace
**Path:** `components/SupplierMarketplace/`
**View:** `supplier-marketplace`
**Theme:** Blue (#004578)

**Features:**
- KPI Cards: Total Quotes, Win Rate, Total Value, Orders, Pending
- Funnel Chart: Status pipeline
- Bar Chart: Top suppliers
- Donut Chart: By entity
- Line Chart: Monthly trend
- Data Table: Quotation workbench

### 3. Global Spend Analysis
**Path:** `components/GlobalSpendAnalysis/`
**View:** `global-spend`
**Theme:** Orange (#d96f3c)

**Features:**
- KPI Cards: Total POs, Total Spend, Base/Change orders
- Line Chart: Monthly spend
- Donut Chart: By entity
- Bar Charts: By supplier, by material
- Data Table: PO workbench

### 4. Disciplines Consolidated
**Path:** `components/DisciplinesConsolidated/`
**View:** `disciplines`
**Theme:** Dark Blue (#0f3d5e)

**Features:**
- KPI Cards: Discipline count, totals, variance
- Column Chart: Budget vs Actual
- Discipline Cards: 28 individual disciplines

---

## Key Files

### SharePointService.ts
**Location:** `src/services/SharePointService.ts`

Data access layer that handles:
- Authentication via SPFx context
- Reading from MT_* SharePoint lists
- Caching (5-minute TTL)
- **ID-based paging** for large lists (>5000 items)

**Key Methods:**
```typescript
// Get quotations (paged for large list)
getQuotations(): Promise<IQuotation[]>

// Get purchase orders (paged)
getPurchaseOrders(): Promise<IPurchaseOrder[]>

// Get all master data
getSuppliers(): Promise<ISupplier[]>
getEntities(): Promise<IEntity[]>
getDisciplines(): Promise<IDiscipline[]>
getMaterialGroups(): Promise<IMaterialGroup[]>

// Get aggregated data
getSummary(): Promise<IPortalSummary>
getSupplierMarketplaceData(): Promise<ISupplierMarketplaceData>
getGlobalSpendData(): Promise<IGlobalSpendData>
getDisciplinesData(): Promise<IDisciplinesData>
```

### Models (index.ts)
**Location:** `src/models/index.ts`

TypeScript interfaces matching SharePoint list schemas:
- `IQuotation` - Quotation record
- `IPurchaseOrder` - PO record
- `ISupplier` - Supplier master
- `IEntity` - Entity master
- `IDiscipline` - Discipline master
- `IMaterialGroup` - Material group master
- `IPortalSummary` - Dashboard summary KPIs

### Main Component (SupplyIntelHub.tsx)
**Location:** `src/webparts/supplyIntelHub/components/SupplyIntelHub.tsx`

Root component that:
- Manages navigation state
- Switches between dashboard views
- Handles URL hash routing
- Provides SharePointService to children

---

## Development Commands

```powershell
# Navigate to project
cd g:\Rita\mvl-powerbi-dashboards\mvl-supply-intel-hub-spfx

# Install dependencies
npm install

# Build (development)
gulp build

# Serve locally (workbench)
gulp serve

# Build for production
gulp bundle --ship

# Create deployment package
gulp package-solution --ship

# Full build + package (shortcut)
npm run bundle && npm run package
```

---

## Deployment

### Build Package
```powershell
cd mvl-supply-intel-hub-spfx
gulp bundle --ship
gulp package-solution --ship
```

Output: `sharepoint/solution/mvl-supply-intel-hub.sppkg`

### Deploy to SharePoint
1. Go to SharePoint Admin Center → More features → Apps → App Catalog
   - Or: https://mvlgroupusa.sharepoint.com/sites/appcatalog
2. Upload `mvl-supply-intel-hub.sppkg`
3. Click "Deploy" (trust the solution)
4. Check "Make this solution available to all sites in the organization"

### Add to Site
1. Go to target site: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi
2. Edit a page
3. Add web part → Search "MVL Supply Intel Hub"
4. Configure web part properties
5. Save and publish page

---

## Web Part Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| title | string | "MVL Supply Intel Hub" | Web part title |
| defaultDashboard | choice | "portal" | Starting view |

**Choices for defaultDashboard:**
- `portal` - Landing page
- `supplier-marketplace` - Supplier dashboard
- `global-spend` - Spend dashboard
- `disciplines` - Disciplines dashboard

---

## URL Hash Navigation

The web part uses URL hash for navigation:
- `#portal` - Portal view
- `#supplier-marketplace` - Supplier Marketplace
- `#global-spend` - Global Spend Analysis
- `#disciplines` - Disciplines Consolidated

Users can bookmark specific views.

---

## SharePoint List Threshold Fix

**Problem:** MT_Quotations has 12,000+ items, exceeding 5,000 threshold.

**Solution in SharePointService.ts:**
```typescript
private async fetchAllItemsById<T>(
    listName: string,
    selectFields: string[],
    batchSize: number = 2000
): Promise<T[]> {
    const allItems: T[] = [];
    let lastId = 0;

    do {
        const items = await this.sp.web.lists
            .getByTitle(listName)
            .items
            .filter(`Id gt ${lastId}`)
            .select(...selectFields)
            .orderBy('Id', true)
            .top(batchSize)();

        if (items.length === 0) break;
        allItems.push(...items);
        lastId = items[items.length - 1].Id;
    } while (true);

    return allItems;
}
```

---

## Styling

### Theme Variables
**Location:** `src/styles/variables.module.scss`

```scss
// Dashboard Themes
$supplier-marketplace-primary: #004578;
$global-spend-primary: #d96f3c;
$disciplines-primary: #0f3d5e;

// Status Colors
$status-order: #107c10;
$status-waiting: #ffb900;
$status-quotation: #0078d4;
$status-cancelled: #d13438;
```

### Component Styles
Each component has its own `.module.scss` file for scoped CSS.

---

## Agent Tasks

### 1. Add New KPI Card
```typescript
// In SupplierMarketplace.tsx or relevant component
<KPICard
    title="New Metric"
    value={data.newMetricValue}
    icon="TrendingUp"
    trend={5.2}
/>
```

### 2. Add New Chart
```typescript
// Import from react-chartjs-2
import { Bar } from 'react-chartjs-2';

// Add chart component
<Bar data={chartData} options={chartOptions} />
```

### 3. Modify Data Fetch
```typescript
// In SharePointService.ts
async getNewData(): Promise<INewData[]> {
    return this.fetchAllItemsById<INewData>(
        'MT_NewList',
        ['Id', 'Field1', 'Field2']
    );
}
```

### 4. Add Filter
```typescript
// In component
const [filter, setFilter] = useState<string>('All');
const filteredData = data.filter(item => 
    filter === 'All' || item.status === filter
);
```

### 5. Build & Deploy
```powershell
cd mvl-supply-intel-hub-spfx
gulp bundle --ship
gulp package-solution --ship
# Upload .sppkg to app catalog
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "gulp not found" | Not installed globally | `npm install -g gulp-cli` |
| Build fails | TypeScript errors | Check `gulp build` output |
| Web part not appearing | Not deployed | Upload .sppkg to app catalog |
| Data not loading | List threshold | Verify ID-based paging |
| Styles broken | CSS module issue | Check import paths |
| Blank page | JS error | Open browser dev tools |

### Debug in Browser
1. Press F12 to open dev tools
2. Check Console for errors
3. Check Network tab for failed requests
4. SPFx workbench: `https://<tenant>.sharepoint.com/_layouts/15/workbench.aspx`

---

## Testing Locally

### Using Workbench
```powershell
gulp serve
# Opens browser to local workbench
# Add web part to test
```

### Using SharePoint Workbench
```
https://mvlgroupusa.sharepoint.com/_layouts/15/workbench.aspx
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0.0 | 2026-02 | Initial release with 3 dashboards |
| 1.0.1.0 | 2026-02 | Fixed list view threshold with ID paging |

---

## Dependencies

### npm packages
```json
{
    "@pnp/sp": "^4.8.0",
    "@pnp/logging": "^4.8.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "@fluentui/react": "^8.110.10",
    "react-router-dom": "^6.20.0"
}
```

### Required Permissions
The web part uses the current user's context, so users need:
- Read access to the SharePoint site
- Read access to MT_* lists

---

## Production Checklist

Before deploying to production:

- [ ] Run `gulp build` with no errors
- [ ] Run `gulp bundle --ship` successfully
- [ ] Run `gulp package-solution --ship`
- [ ] Test all three dashboards
- [ ] Verify data loads (check for threshold errors)
- [ ] Test filters and interactions
- [ ] Upload to App Catalog
- [ ] Add to target site page
- [ ] Test with different user accounts
- [ ] Verify mobile responsive layout
