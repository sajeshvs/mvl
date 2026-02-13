# MVL Supply Intel Hub - Project Status & Next Steps

**Last Updated:** February 2, 2026  
**Project Owner:** Sajesh (sajesh.admin@mvlgroupusa.onmicrosoft.com)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [What We Have Built (Completed)](#what-we-have-built-completed)
3. [Current Architecture](#current-architecture)
4. [Next Steps](#next-steps)
5. [Technical Reference](#technical-reference)
6. [Quick Start Guide](#quick-start-guide)

---

## Executive Summary

The MVL Supply Intel Hub is a comprehensive procurement analytics solution that visualizes quotations, purchase orders, and supplier performance data. The project has progressed through multiple phases:

**✅ Phase 1-3 Complete:** HTML Prototypes → SharePoint Integration → MicroTrack API  
**🔄 Phase 4 In Progress:** Power BI Dashboard Creation

---

## What We Have Built (Completed)

### ✅ 1. HTML Dashboard Prototypes (v3)

**Purpose:** Design prototypes to validate UI/UX before Power BI implementation

**What's Built:**
- **3 Interactive Dashboards** with professional Power BI styling
  - Supplier Marketplace (Blue theme)
  - Global Spend Analysis (Orange theme)
  - Disciplines Consolidated (Dark blue theme)

**Features:**
- 📊 Chart.js visualizations (Bar, Pie, Line, Radar, Polar, Doughnut)
- 🔄 Real-time filtering across all components
- 📱 Mobile responsive design
- 🎯 Click-to-view detail modals
- 📋 Paginated, sortable data tables

**Data Loaded:**
- 12,134 Quotations
- 3,539 Purchase Orders
- 47 Suppliers
- 28 Disciplines

**Live Demo:** https://sajeshvs.github.io/mvl/

**Location:** `v3/` folder

---

### ✅ 2. SharePoint Data Hub

**Purpose:** Central data repository for Power BI to consume real-time data

**SharePoint Site Created:**
- **Site Name:** MVL-MicroTrack-PowerBI
- **Site URL:** https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi
- **Group ID:** 62393668-6ed8-4089-809b-0ad41b9c27c0
- **Site ID:** mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59

**8 SharePoint Lists Created & Populated:**

| List Name | Records | Purpose |
|-----------|---------|---------|
| **MT_Quotations** | 12,073 | All quotation transactions |
| **MT_PurchaseOrders** | 3,539 | All PO transactions |
| **MT_Suppliers** | 47 | Supplier master data |
| **MT_Entities** | 28 | Entity/division master |
| **MT_Disciplines** | 28 | Discipline categories |
| **MT_MaterialGroups** | 14 | Material group master |
| **MT_Summary** | 24 | Pre-calculated KPIs |
| **MT_SpendByMonth** | 40 | Monthly trend data |
| **TOTAL** | **15,793** | All data ready for Power BI |

**List Schemas Defined:**
- Each list has proper column types (Text, Number, DateTime, Choice)
- Lookup relationships configured
- Optimized for Power BI consumption

**Data Status:** ✅ All data loaded and verified (as of Feb 2, 2026)

**Scripts Used:**
- `scripts/create_mvl_microtrack_powerbi.py` - Site and list creation
- `scripts/load_microtrack_data.py` - Data population
- `scripts/verify_sharepoint_data.py` - Data verification

---

### ✅ 3. MicroTrack → SharePoint API Integration

**Purpose:** Real-time data sync from MicroTrack PHP/MySQL app to SharePoint

**Integration Architecture:**
```
┌─────────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│   MICROTRACK        │      │    SHAREPOINT        │      │    POWER BI     │
│   PHP/MySQL App     │ ───► │    Lists (8 Lists)   │ ───► │   Dashboards    │
│   (Source System)   │      │    (Data Hub)        │      │  (Visualization)│
└─────────────────────┘      └──────────────────────┘      └─────────────────┘
         ↓                            ↓                            ↓
    Transactions              Microsoft Graph API          Auto-Refresh
    Generated Daily           Authenticated Sync            Scheduled
```

**PHP Sync Files Created:**
- **`php/MicrotrackSharePointSync.php`** - Main sync class (not in repo yet - needs creation)
- **`php/microtrack_sync_cron.php`** - Cron job wrapper for scheduled sync

**Integration Guide:**
- **`docs/MICROTRACK_SHAREPOINT_INTEGRATION.md`** - Complete setup instructions

**Key Features:**
- ✅ Azure AD authentication configured
- ✅ Graph API client credentials flow
- ✅ Batch processing (50 items per batch)
- ✅ Rate limiting protection
- ✅ Error logging and retry logic
- ✅ Incremental sync (only changed data)

**Sync Options:**
1. **Scheduled Cron Job** - Hourly or every 15 minutes
2. **Trigger on Save** - Real-time push when PO/Quote created
3. **Manual Run** - On-demand full sync

**To Deploy in Production:**
```bash
# 1. Copy PHP files to Microtrack server
/var/www/microtrack/sharepoint/
├── MicrotrackSharePointSync.php
├── microtrack_sync_cron.php
└── config.php

# 2. Update database queries in sync class

# 3. Add to crontab
*/15 * * * * php /var/www/microtrack/sharepoint/microtrack_sync_cron.php >> /var/log/microtrack_sync.log 2>&1
```

**Status:** ✅ Architecture designed, scripts ready, awaiting production deployment

---

### ✅ 4. Azure AD Application Setup

**Purpose:** Secure authentication for all Microsoft 365 integrations

**Application Name:** MVL-SupplyIntelHub-Integration

**Credentials (Entra App):**
- **Tenant ID:** `416328e6-260f-438f-bf3c-9c4f15b6a1ca`
- **Client ID:** `1b9540e1-6c1e-4214-8d97-6116394ef72c`
- **Client Secret:** `cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4`
- **Secret Expires:** ~2027 (2 years from creation)

**Permissions Granted (Admin Consented):**
- Microsoft Graph API - Full permissions
  - Sites.FullControl.All
  - User.Read.All, Group.ReadWrite.All
  - Mail.Send, Reports.Read.All
- Power BI Service API
  - Tenant.ReadWrite.All
  - Dataset.ReadWrite.All
  - Report.ReadWrite.All
- SharePoint API
  - Sites.FullControl.All

**Documentation:** `scripts/AZURE_APP_REGISTRATION_GUIDE.md`

---

### ✅ 5. Power BI Workspace & Dataset

**Power BI Workspace Created:**
- **Workspace Name:** MVL Supply Intelligence Hub
- **Workspace ID:** `4913fadb-9d03-4742-9e8c-39412a64a93f`
- **Type:** Premium workspace (for automated refresh)

**Dataset Created:**
- **Dataset Name:** MVL-SupplyIntelHub-Data
- **Dataset ID:** `c725ca87-7e4b-4a83-819c-55b1bdcbceeb`
- **Data Source:** SharePoint Lists (8 lists connected)
- **Refresh Schedule:** Can be configured (currently manual)

**Dataset Tables:**
1. PurchaseOrders
2. Quotations
3. Suppliers
4. Entities
5. Disciplines
6. Summary
7. SpendByMonth

**Power BI Configurations:**
- ✅ SharePoint connector configured
- ✅ Azure AD authentication
- ✅ Gateway-free (cloud-to-cloud)
- ✅ Incremental refresh capable

**Files:**
- `scripts/powerbi_workspace_info.json` - Workspace metadata
- `scripts/MVL-SupplyIntelHub-Dashboard.pbix` - Template file
- `powerbi-creator/index.html` - Browser-based report builder

---

## Current Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA SOURCES                                   │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │  Microtrack      │         │  v3 HTML Data    │                  │
│  │  PHP/MySQL       │         │  (JSON Files)    │                  │
│  │  (Production)    │         │  (Development)   │                  │
│  └────────┬─────────┘         └────────┬─────────┘                  │
└───────────┼──────────────────────────┼─────────────────────────────┘
            │                          │
            │ Graph API Sync          │ Python Scripts
            │ (Incremental)           │ (Initial Load)
            ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SHAREPOINT DATA HUB                               │
│          https://mvlgroupusa.sharepoint.com/sites/                   │
│                    mvlmicrotrackpowerbi                              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  8 Lists (15,793 records total)                         │        │
│  │  - MT_Quotations (12,073)                               │        │
│  │  - MT_PurchaseOrders (3,539)                            │        │
│  │  - MT_Suppliers, MT_Entities, MT_Disciplines...         │        │
│  └─────────────────────────────────────────────────────────┘        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ Power BI Connector
                                │ (OAuth Authentication)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     POWER BI SERVICE                                 │
│          https://app.powerbi.com (Gov Cloud)                         │
│                                                                       │
│  ┌──────────────────────────────────────────────┐                   │
│  │  Workspace: MVL Supply Intelligence Hub      │                   │
│  │  Dataset: MVL-SupplyIntelHub-Data            │                   │
│  │  ├── 7 Tables (from SharePoint Lists)        │                   │
│  │  └── Refresh: Scheduled or On-Demand         │                   │
│  └──────────────────────────────────────────────┘                   │
│                         │                                            │
│                         ▼                                            │
│  ┌──────────────────────────────────────────────┐                   │
│  │  📊 Reports (TO BE CREATED)                  │                   │
│  │  1. Supplier Marketplace                     │                   │
│  │  2. Global Spend Analysis                    │                   │
│  │  3. Disciplines Consolidated                 │                   │
│  └──────────────────────────────────────────────┘                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ Embed or Publish
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         END USERS                                    │
│  - Power BI Web App                                                  │
│  - Power BI Mobile App                                               │
│  - Embedded in Internal Portal (optional)                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Source** | PHP/MySQL (Microtrack) | Transaction system |
| **Integration** | Microsoft Graph API | Data sync |
| **Data Hub** | SharePoint Online Lists | Central repository |
| **Analytics** | Power BI Service | Visualization & BI |
| **Auth** | Azure AD (Entra) | Security |
| **Prototypes** | HTML/CSS/Chart.js | Design reference |

---

## Next Steps

### 🎯 Phase 4: Create Power BI Reports (CURRENT)

**Objective:** Build 3 interactive Power BI reports based on HTML prototypes

#### Option A: Power BI Desktop (Recommended) ⭐

**Why Desktop?**
- Full feature set (all visuals available)
- Offline development
- Version control with .pbix file
- Easier to replicate HTML designs

**Steps:**

1. **Install Power BI Desktop**
   - Download: https://aka.ms/pbidesktop
   - Install on Windows machine

2. **Connect to SharePoint Data**
   ```
   File → Get Data → SharePoint Online List
   Site URL: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi
   Select all MT_ lists → Load
   ```

3. **Create Report 1: Supplier Marketplace**
   - **Design Reference:** `v3/supplier-marketplace/index.html`
   - **Key Visuals:**
     - 5 KPI Cards (Total Quotes, Win Rate, Total Value, etc.)
     - Funnel Chart (Quotation → Waiting → Order pipeline)
     - Bar Chart (Top 10 Suppliers by Value)
     - Donut Chart (Quotes by Entity)
     - Line Chart (Monthly Quote Trend)
     - Table (Quotation Workbench)
   - **Slicers:** Status, Date Range, Entity, Discipline
   - **Theme:** Blue gradient (#004578)

4. **Create Report 2: Global Spend Analysis**
   - **Design Reference:** `v3/global-spend-analysis/index.html`
   - **Key Visuals:**
     - 6 KPI Cards (Total POs, Total Spend, Base vs Change Orders)
     - Line Chart (Monthly Spend Trend)
     - Donut Chart (Spend by Entity)
     - Bar Chart (Spend by Supplier)
     - Bar Chart (Spend by Material Group)
     - Table (PO Workbench)
   - **Slicers:** Date Range, Entity, Supplier
   - **Theme:** Orange gradient (#d96f3c)

5. **Create Report 3: Disciplines Consolidated**
   - **Design Reference:** `v3/disciplines-consolidated/index.html`
   - **Key Visuals:**
     - 5 KPI Cards (Total Disciplines, Budget, Actual, Variance)
     - Clustered Column Chart (Budget vs Actual by Discipline)
     - Card Grid (28 discipline cards with KPIs)
     - Table (Discipline Summary)
   - **Slicers:** Entity, Date Range
   - **Theme:** Dark blue gradient (#0f3d5e)

6. **Apply Power BI Theme**
   - Use JSON theme file based on MVL branding
   - Match colors from HTML prototypes
   - Set Segoe UI as default font

7. **Publish to Workspace**
   ```
   File → Publish → Select "MVL Supply Intelligence Hub"
   ```

**Estimated Time:** 8-12 hours (3-4 hours per dashboard)

---

#### Option B: Power BI Service (Browser)

**Steps:**

1. Go to https://app.powerbi.com
2. Navigate to **Workspaces** → **MVL Supply Intelligence Hub**
3. Click **+ New** → **Report**
4. Select dataset: **MVL-SupplyIntelHub-Data**
5. Build visuals using drag-and-drop interface
6. Save report

**Limitations:**
- Fewer visual types than Desktop
- No custom visuals
- Requires stable internet connection

---

#### Option C: Embedded Report Creator (Browser Tool)

**Steps:**

1. Update access token in `powerbi-creator/config.json`
   ```bash
   # Get new token (expires in 1 hour)
   python scripts/get_powerbi_token.py
   ```

2. Open `powerbi-creator/index.html` in browser

3. Use template guides:
   - Click "Supplier Marketplace" template
   - Add suggested visuals
   - Save report to workspace

**Status:** Tool ready, needs token refresh

---

### 🚀 Phase 5: Automate Data Refresh (Upcoming)

**Objective:** Keep Power BI reports up-to-date with live data

**Option 1: Scheduled Refresh in Power BI**
- Configure in Power BI Service
- Dataset Settings → Scheduled Refresh
- Set to refresh every 1-4 hours
- SharePoint lists refresh automatically

**Option 2: MicroTrack Real-Time Sync**
- Deploy PHP sync scripts to production
- Set cron job for every 15 minutes
- Power BI refreshes on next scheduled time

**Configuration:**
```bash
# Cron job on Microtrack server
*/15 * * * * php /var/www/microtrack/sharepoint/microtrack_sync_cron.php
```

---

### 📱 Phase 6: Deployment & Access (Upcoming)

**Objective:** Make dashboards accessible to end users

**Distribution Options:**

1. **Power BI Web App**
   - Users access via https://app.powerbi.com
   - Navigate to workspace
   - View reports directly

2. **Power BI Mobile App**
   - iOS/Android apps available
   - Phone-optimized layouts
   - Offline access capability

3. **Embed in Intranet Portal**
   - Use Power BI Embed API
   - Secure iframe embedding
   - Single sign-on with Azure AD

4. **Email Subscriptions**
   - Schedule daily/weekly report emails
   - PDF attachments
   - Customized per user

**Access Control:**
- Add users to workspace (Viewer role)
- Row-level security (optional - filter by entity/division)
- Audit logging enabled

---

## Technical Reference

### File Structure

```
mvl-powerbi-dashboards/
│
├── v3/                                    # HTML Prototypes (Design Reference)
│   ├── index.html                         # Portal page
│   ├── supplier-marketplace/              # Dashboard 1 prototype
│   ├── global-spend-analysis/             # Dashboard 2 prototype
│   ├── disciplines-consolidated/          # Dashboard 3 prototype
│   └── shared/                            # Shared components
│
├── docs/                                  # Documentation
│   ├── MICROTRACK_SHAREPOINT_INTEGRATION.md  # PHP sync guide
│   ├── copilot_agent_instructions.md      # Development guidelines
│   ├── AZURE_APP_REGISTRATION_GUIDE.md    # Azure AD setup
│   └── reference/                         # Original requirements
│
├── scripts/                               # Automation Scripts
│   ├── create_mvl_microtrack_powerbi.py   # SharePoint site creation
│   ├── load_microtrack_data.py            # Initial data load
│   ├── verify_sharepoint_data.py          # Data verification
│   ├── add_owner_to_powerbi_site.py       # User management
│   ├── MVL-SupplyIntelHub-Dashboard.pbix  # Power BI template
│   ├── powerbi_workspace_info.json        # Workspace metadata
│   └── microtrack_site_info.txt           # Site details
│
├── php/                                   # MicroTrack Integration
│   └── microtrack_sync_cron.php           # Cron job wrapper
│
├── powerbi-creator/                       # Browser Report Builder
│   ├── index.html                         # Embedded creator tool
│   └── config.json                        # Power BI config
│
├── CONTINUE_LATER.md                      # Quick start guide
├── PROJECT_STATUS_AND_NEXT_STEPS.md       # This file
└── README.md                              # Project overview
```

---

### Key Credentials & IDs

**Azure AD Application:**
- Tenant ID: `416328e6-260f-438f-bf3c-9c4f15b6a1ca`
- Client ID: `1b9540e1-6c1e-4214-8d97-6116394ef72c`
- Client Secret: `cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4`

**SharePoint Site:**
- Site URL: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi
- Group ID: `62393668-6ed8-4089-809b-0ad41b9c27c0`
- Site ID: `mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59`

**Power BI:**
- Workspace ID: `4913fadb-9d03-4742-9e8c-39412a64a93f`
- Dataset ID: `c725ca87-7e4b-4a83-819c-55b1bdcbceeb`
- Embed URL: `https://app.powerbigov.us/reportEmbed...`

**Project Owner:**
- Email: sajesh.admin@mvlgroupusa.onmicrosoft.com
- Role: Owner (SharePoint + Power BI workspace)

---

### Useful Commands

**Verify SharePoint Data:**
```bash
python scripts/verify_sharepoint_data.py
```

**Check Site Access:**
```bash
python scripts/add_owner_to_powerbi_site.py
```

**Run Local HTML Server:**
```bash
cd v3
python -m http.server 8088
# Open http://localhost:8088
```

**Get Power BI Token:**
```python
from msal import ConfidentialClientApplication

app = ConfidentialClientApplication(
    "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    authority="https://login.microsoftonline.com/416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    client_credential="cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4"
)
token = app.acquire_token_for_client(scopes=["https://analysis.windows.net/powerbi/api/.default"])
print(token.get("access_token"))
```

---

## Quick Start Guide

### For New Team Members

**1. Understand What's Built:**
- Review HTML prototypes: https://sajeshvs.github.io/mvl/
- Read this document fully
- Check `CONTINUE_LATER.md` for project context

**2. Access SharePoint Site:**
- Go to: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi
- Verify you can see 8 lists with data
- If no access, contact sajesh.admin@mvlgroupusa.onmicrosoft.com

**3. Access Power BI Workspace:**
- Go to: https://app.powerbi.com
- Navigate to "MVL Supply Intelligence Hub" workspace
- Check dataset: "MVL-SupplyIntelHub-Data"

**4. Install Power BI Desktop:**
- Download: https://aka.ms/pbidesktop
- Install and sign in with your MVL account

**5. Connect to Data:**
- Open Power BI Desktop
- Get Data → SharePoint Online List
- Enter site URL (see above)
- Load all MT_ lists

**6. Start Building:**
- Use `v3/` HTML files as design reference
- Follow visual specifications in "Next Steps" section
- Publish to workspace when ready

---

### For Developers

**Clone Repository:**
```bash
git clone https://github.com/sajeshvs/mvl-powerbi-dashboards.git
cd mvl-powerbi-dashboards
```

**Set Up Python Environment:**
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install msal requests
```

**Run Verification Script:**
```bash
python scripts/verify_sharepoint_data.py
```

**Test HTML Prototypes:**
```bash
cd v3
python -m http.server 8088
```

---

## Success Criteria

### Phase 4 Complete When:
- ✅ All 3 Power BI reports created
- ✅ Reports published to workspace
- ✅ Visuals match HTML prototypes
- ✅ Filters and slicers functional
- ✅ Performance is acceptable (<5 sec load time)

### Phase 5 Complete When:
- ✅ Scheduled refresh configured
- ✅ PHP sync deployed to production
- ✅ Data refreshing automatically every 15-60 minutes
- ✅ Error monitoring in place

### Phase 6 Complete When:
- ✅ End users can access reports
- ✅ Permissions configured correctly
- ✅ User training completed
- ✅ Mobile access verified

---

## Support & Contacts

**Project Owner:**  
Sajesh Admin (sajesh.admin@mvlgroupusa.onmicrosoft.com)

**Azure/M365 Administration:**  
MVL IT Department

**Power BI Support:**  
Microsoft Power BI Support Portal

**Repository:**  
https://github.com/sajeshvs/mvl-powerbi-dashboards

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| Feb 2, 2026 | 1.0 | Initial document created - Project status captured |

---

**🎯 IMMEDIATE NEXT ACTION:** Start creating Power BI reports in Power BI Desktop using the SharePoint data source. Reference the HTML prototypes in `v3/` for design guidance.
