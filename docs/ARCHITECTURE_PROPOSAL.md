# 🏗️ Microtrack → SharePoint → Power BI Architecture

## Executive Summary

Transform the v3 HTML dashboard prototypes into production Power BI dashboards, fed by live data from Microtrack via SharePoint.

---

## 📊 Current Assets

### V3 HTML Dashboards (Our Prototypes)

| Dashboard                    | Data Structure                   | Records          |
| ---------------------------- | -------------------------------- | ---------------- |
| **Supplier Marketplace**     | suppliers, entities, funnel, POs | ~200K lines JSON |
| **Global Spend Analysis**    | trends, breakdowns, rankings     | ~50K lines JSON  |
| **Disciplines Consolidated** | disciplines, quotations, POs     | ~15K lines JSON  |

### Existing Infrastructure

- ✅ Azure AD App: `MVL-SupplyIntelHub-Integration`
- ✅ Graph API permissions configured
- ✅ Power BI GCC environment
- ✅ SharePoint (mvlgroupusa.sharepoint.com)

---

## 🏛️ Proposed Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MICROTRACK    │────▶│  POWER AUTOMATE  │────▶│   SHAREPOINT    │────▶│    POWER BI     │
│   Application   │     │  (Scheduled/API) │     │   Data Store    │     │   Dashboards    │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │                       │
   JSON Export            Transform &              Lists/Tables           Live Visualizations
                          Validate                                        (like v3 HTML)
```

---

## 📁 SharePoint Site Structure

### Site: `Microtrack`

URL: `https://mvlgroupusa.sharepoint.com/sites/Microtrack`

### Option A: SharePoint Lists (Recommended for <100K rows)

```
📁 Microtrack Site
├── 📋 Lists
│   ├── MT_Suppliers           (SupplierName, POCount, TotalSpendUSD, Entity, Discipline)
│   ├── MT_Quotations          (QuotationID, Status, Value, Client, Date, Entity)
│   ├── MT_PurchaseOrders      (POID, SupplierName, Value, Date, Status, Discipline)
│   ├── MT_Entities            (EntityCode, EntityName, Region, Country)
│   ├── MT_Disciplines         (DisciplineCode, DisciplineName, Category)
│   ├── MT_Summary             (MetricName, Value, AsOfDate, Dashboard)
│   └── MT_MaterialGroups      (MaterialCode, MaterialName, Discipline, Spend)
│
├── 📄 Pages
│   ├── Dashboard-Supplier-Marketplace.aspx
│   ├── Dashboard-Global-Spend.aspx
│   └── Dashboard-Disciplines.aspx
│
└── 📁 Documents
    └── Data Exports (JSON backups)
```

### Option B: Dataverse (For large datasets >100K rows)

- Better for complex relationships
- Superior Power BI performance
- Requires Power Platform license

### Option C: Azure SQL Database (For enterprise scale)

- Best performance for millions of rows
- Complex queries and joins
- More DevOps overhead

**Recommendation:** Start with **SharePoint Lists** - easy to set up, direct Power BI connection, your data volume appears manageable.

---

## 📋 SharePoint List Schemas

### 1. MT_Suppliers

| Column        | Type     | Description           |
| ------------- | -------- | --------------------- |
| SupplierName  | Text     | Supplier display name |
| POCount       | Number   | Total PO count        |
| TotalSpendUSD | Currency | Total spend in USD    |
| Entity        | Lookup   | Link to MT_Entities   |
| LastUpdated   | DateTime | Last sync timestamp   |

### 2. MT_Quotations

| Column      | Type     | Description                       |
| ----------- | -------- | --------------------------------- |
| QuotationID | Text     | Unique identifier                 |
| Status      | Choice   | Quotation/Waiting/Order/Cancelled |
| ValueUSD    | Currency | Quotation value                   |
| ClientName  | Text     | Client name                       |
| Entity      | Lookup   | Link to MT_Entities               |
| Discipline  | Lookup   | Link to MT_Disciplines            |
| CreatedDate | DateTime | Quotation date                    |

### 3. MT_PurchaseOrders

| Column       | Type     | Description            |
| ------------ | -------- | ---------------------- |
| POID         | Text     | PO number              |
| SupplierName | Text     | Supplier               |
| ValueUSD     | Currency | PO value               |
| Entity       | Lookup   | Link to MT_Entities    |
| Discipline   | Lookup   | Link to MT_Disciplines |
| PODate       | DateTime | PO date                |
| Status       | Choice   | Open/Closed/Cancelled  |

### 4. MT_Summary (Aggregated KPIs)

| Column      | Type     | Description                                 |
| ----------- | -------- | ------------------------------------------- |
| MetricName  | Text     | e.g., "TotalQuotations", "WinRate"          |
| MetricValue | Number   | Current value                               |
| Dashboard   | Choice   | SupplierMarketplace/GlobalSpend/Disciplines |
| AsOfDate    | DateTime | Calculation timestamp                       |

---

## 🔄 Data Sync Options

### Option 1: Power Automate Flow (Recommended)

```
Trigger: Scheduled (daily/hourly) or HTTP Request
    ↓
Action: HTTP GET from Microtrack API or File
    ↓
Action: Parse JSON
    ↓
Action: Create/Update SharePoint Items
    ↓
Action: Update MT_Summary with aggregates
```

### Option 2: Azure Logic Apps

- Similar to Power Automate
- Better for complex enterprise scenarios

### Option 3: Custom Python Script (Using our Graph API)

- Full control
- Can run from anywhere
- We already have the authentication working!

### Option 4: Power BI Dataflow

- ETL directly in Power BI
- Scheduled refresh
- Good for transformation

---

## 📊 Power BI Dashboard Mapping

### From v3 HTML → Power BI

| HTML Component     | Power BI Visual                    | Notes              |
| ------------------ | ---------------------------------- | ------------------ |
| KPI Cards          | Card / Multi-row Card              | Standard Power BI  |
| Bar Charts         | Clustered Bar Chart                | Native visual      |
| Donut/Pie Charts   | Donut Chart                        | Native visual      |
| Tables with status | Matrix with conditional formatting | With icons         |
| Funnel             | Funnel Chart                       | Native visual      |
| Trend Lines        | Line Chart                         | Native visual      |
| Filter Panel       | Filter Pane / Slicers              | Power BI native    |
| Navigation Tabs    | Bookmarks + Buttons                | Standard technique |

### Theme & Styling

- Create custom Power BI theme (.json) matching v3 colors
- Color palette: Blues, grays, accent colors from HTML
- Typography: Segoe UI (Power BI default, matches our HTML)

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)

1. ✅ Create SharePoint site "Microtrack"
2. ✅ Create SharePoint lists with proper schemas
3. ✅ Initial data load from JSON files
4. ✅ Verify data in SharePoint

### Phase 2: Power BI Development (Week 2-3)

1. Create Power BI workspace
2. Connect to SharePoint lists
3. Build data model (relationships)
4. Create measures (DAX)
5. Build visuals matching v3 HTML
6. Apply custom theme

### Phase 3: Automation (Week 3-4)

1. Create Power Automate flow
2. Connect to Microtrack data source
3. Schedule data refresh
4. Set up error notifications
5. Test end-to-end

### Phase 4: Deployment (Week 4)

1. Publish to Power BI workspace
2. Configure row-level security (if needed)
3. Share with stakeholders
4. Create Power BI app (optional)
5. Embed in SharePoint pages (optional)

---

## 🔐 Security Model

### Data Access

- SharePoint site permissions → Who can see raw data
- Power BI workspace roles → Who can edit dashboards
- Row-Level Security (RLS) → Filter data by user/entity

### Recommended Roles

| Role         | SharePoint | Power BI | Description          |
| ------------ | ---------- | -------- | -------------------- |
| Admin        | Owner      | Admin    | Full control         |
| Data Manager | Member     | Member   | Can update data      |
| Viewer       | Visitor    | Viewer   | Read-only dashboards |

---

## 💰 Cost Considerations

| Component        | License Required             | Notes                      |
| ---------------- | ---------------------------- | -------------------------- |
| SharePoint Lists | M365 Business                | Already have               |
| Power Automate   | M365 + Premium ($15/user/mo) | For HTTP connectors        |
| Power BI Pro     | $10/user/month               | Required for sharing       |
| Power BI Premium | $4,995/month                 | For large scale (optional) |

---

## ❓ Questions to Clarify

1. **Microtrack Data Format:**
   - How does Microtrack export data? (API? File? Database?)
   - What's the data volume? (rows per day/week)
   - How often does data change?

2. **Refresh Requirements:**
   - Real-time? Hourly? Daily?
   - Is there a specific time for refresh?

3. **Users:**
   - How many users will access dashboards?
   - Different access levels needed?

4. **Existing Power BI:**
   - Do you have Power BI Pro licenses?
   - Any existing Power BI workspaces?

---

## ✅ Next Steps

1. **Approve this architecture**
2. **Create Microtrack SharePoint site**
3. **Create SharePoint lists**
4. **Load initial data from v3 JSON**
5. **Start Power BI development**

Ready to proceed? Let me know your thoughts! 🚀
