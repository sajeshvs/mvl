# MVL Supply Intel Hub - SPFx Web Part

A SharePoint Framework (SPFx) web part that provides comprehensive procurement analytics dashboards for MVL Group.

## 📊 Features

### Portal (Home)
- Dashboard cards for quick navigation
- Summary statistics (Quotations, POs, Suppliers, Total Spend)
- Quick access to all dashboards

### Supplier Marketplace
- Quotation pipeline analysis
- Win rate tracking
- Material group breakdown charts
- Status distribution (Funnel: Quotation → Waiting → Order → Cancelled)
- Top suppliers ranking
- Interactive filtering by Entity, Status, Material Group

### Global Spend Analysis
- Purchase order tracking
- Spend by entity breakdown
- Supplier spend ranking
- Monthly trend analysis
- Filter by Entity, Supplier, Material Group

### Disciplines Consolidated
- Budget vs Actual comparison
- Variance analysis
- Entity distribution
- Progress tracking with visual indicators
- Chart and Card view modes

## 🛠️ Prerequisites

- Node.js v18.x LTS (recommended)
- SharePoint Online tenant with App Catalog
- Access to MVL MicroTrack Power BI site

## 📦 Installation

1. **Install dependencies:**
   ```bash
   cd mvl-supply-intel-hub-spfx
   npm install
   ```

2. **Update serve.json** with your SharePoint site URL if different

3. **Start development server:**
   ```bash
   gulp serve
   ```

## 🏗️ Build for Production

```bash
# Clean previous build
gulp clean

# Bundle assets
gulp bundle --ship

# Create package
gulp package-solution --ship
```

The package will be created at: `sharepoint/solution/mvl-supply-intel-hub.sppkg`

## 🚀 Deployment

1. Upload `mvl-supply-intel-hub.sppkg` to your SharePoint App Catalog
2. Trust the solution when prompted
3. Add the web part to any SharePoint page
4. Configure the default dashboard view in web part properties

## 📂 Project Structure

```
mvl-supply-intel-hub-spfx/
├── config/                     # SPFx configuration files
├── src/
│   ├── models/                 # TypeScript interfaces
│   ├── services/               # SharePoint data services
│   ├── styles/                 # SCSS variables and mixins
│   ├── utils/                  # Utility functions
│   └── webparts/
│       └── supplyIntelHub/
│           ├── components/
│           │   ├── Portal/
│           │   ├── SupplierMarketplace/
│           │   ├── GlobalSpendAnalysis/
│           │   ├── DisciplinesConsolidated/
│           │   └── shared/     # Reusable components
│           ├── loc/            # Localization
│           └── SupplyIntelHubWebPart.ts
└── assets/                     # Static assets
```

## 🔗 SharePoint Lists Required

The web part connects to these SharePoint lists:

| List Name | Purpose |
|-----------|---------|
| MT_Quotations | Quotation data |
| MT_PurchaseOrders | Purchase order data |
| MT_Suppliers | Supplier information |
| MT_Entities | Entity/Company information |
| MT_Disciplines | Discipline/Department data |
| MT_MaterialGroups | Material categories |
| MT_Summary | Aggregated metrics |
| MT_SpendByMonth | Monthly spend data |

## 🎨 Design System

### Colors
- **Primary:** #004578 (MVL Blue)
- **Primary Light:** #0078D4
- **Success:** #107C10
- **Warning:** #FFB900
- **Danger:** #D83B01
- **Info:** #00B7C3

### Typography
- Font: Segoe UI (Microsoft standard)
- Responsive sizing from 10px to 28px

## 📝 Configuration

### Web Part Properties
- **Title:** Dashboard title displayed in header
- **Default Dashboard:** Which dashboard to show on load (Portal, Supplier Marketplace, Global Spend, Disciplines)

## 🐛 Troubleshooting

### "List not found" errors
Ensure all MT_* lists exist in your SharePoint site with the correct column names.

### "No permissions" errors
Ensure the app has been granted Sites.Read.All permission in the SharePoint Admin Center.

### Charts not rendering
Check that Chart.js is properly loaded. If using a CDN, ensure it's not blocked by CSP.

## 📄 License

Proprietary - MVL Group USA

## 🤝 Support

For issues or questions, contact the IT Development team.
