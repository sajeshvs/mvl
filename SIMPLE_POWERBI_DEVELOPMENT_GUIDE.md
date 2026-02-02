# Simple Power BI Development Guide - No Automation Needed

**Goal:** Create 3 Power BI dashboards matching your v3 HTML prototypes  
**Approach:** Direct development in Power BI Desktop (like you did with HTML)  
**Time:** 8-12 hours total (2-4 hours per dashboard)  
**No GitHub Actions, No Agents, No Complexity** ✅

---

## Why This Approach is Better for You

You already have:
- ✅ **SharePoint data ready** (15,793 records)
- ✅ **Power BI workspace created**
- ✅ **HTML prototypes as design reference** (v3/)
- ✅ **All credentials configured**

You just need to:
1. Open Power BI Desktop
2. Connect to SharePoint
3. Build 3 dashboards (copy the HTML designs)
4. Publish
5. Done!

**That's it. No automation, no CI/CD, no Copilot agents.**

---

## Step-by-Step Instructions

### Step 1: Install Power BI Desktop (5 minutes)

**Download & Install:**
```
https://aka.ms/pbidesktop
```

**Sign in:**
- Use: sajesh.admin@mvlgroupusa.onmicrosoft.com
- This gives you access to your workspace

---

### Step 2: Connect to SharePoint Data (10 minutes)

1. **Open Power BI Desktop**

2. **Get Data:**
   - Home tab → Get Data → More
   - Search for "SharePoint"
   - Select **"SharePoint Online List"**
   - Click Connect

3. **Enter Site URL:**
   ```
   https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi
   ```
   - Click OK

4. **Sign In:**
   - Use your Microsoft account
   - Authenticate

5. **Select Lists:**
   - Check ALL lists that start with "MT_":
     - ✅ MT_Quotations
     - ✅ MT_PurchaseOrders
     - ✅ MT_Suppliers
     - ✅ MT_Entities
     - ✅ MT_Disciplines
     - ✅ MT_MaterialGroups
     - ✅ MT_Summary
     - ✅ MT_SpendByMonth
   - Click **Load** (not Transform)

6. **Wait for data to load** (1-2 minutes for 15K records)

**✅ You now have all the data in Power BI!**

---

### Step 3: Build Dashboard 1 - Supplier Marketplace (3 hours)

**Reference:** `v3/supplier-marketplace/index.html`

#### Layout Structure:

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Supplier Marketplace (Blue gradient #004578)       │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  CARD    │  CARD    │  CARD    │  CARD    │   CARD          │
│  Total   │  Win     │  Total   │  Orders  │   Pending       │
│  Quotes  │  Rate    │  Value   │          │                 │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Funnel Chart  │  │  Bar Chart     │  │  Donut Chart │  │
│  │  Status        │  │  Top Suppliers │  │  By Entity   │  │
│  │  Pipeline      │  │                │  │              │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Line Chart - Monthly Trend                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Table - Quotation Workbench                           │ │
│  │  (Quotation ID, Supplier, Value, Status, Date, etc.)  │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

#### Visual-by-Visual Instructions:

**1. Add Header & Background:**
- View tab → Page Settings
- Canvas Background → Color: #004578 (blue)
- Add Text Box:
  - Type: "Supplier Marketplace"
  - Font: Segoe UI, 24pt, White, Bold
  - Position at top

**2. Create 5 KPI Cards (Top Row):**

**Card 1 - Total Quotations:**
- Insert → Card
- Field: MT_Quotations → (Count)
- Format: Data label → Display units: None
- Format: Data label → Text size: 36pt
- Format: Category label → Text: "Total Quotations"
- Format: Background → Color: White
- Format: Border → On, Color: #ddd
- Resize: Small rectangle

**Card 2 - Win Rate:**
- Insert → Card
- Click "Add measure" (top bar)
- Name: WinRate
- Formula:
  ```dax
  WinRate = 
  DIVIDE(
      CALCULATE(COUNTROWS(MT_Quotations), MT_Quotations[Status] = "Order"),
      COUNTROWS(MT_Quotations),
      0
  )
  ```
- Format: Percentage, 1 decimal
- Add to card, format like Card 1

**Card 3 - Total Value:**
- Insert → Card
- Field: MT_Quotations → ValueUSD (Sum)
- Format: Currency, 2 decimals
- Format like Card 1

**Card 4 - Orders:**
- Insert → Card
- Create measure:
  ```dax
  Orders = 
  CALCULATE(COUNTROWS(MT_Quotations), MT_Quotations[Status] = "Order")
  ```
- Format like Card 1

**Card 5 - Pending:**
- Insert → Card
- Create measure:
  ```dax
  Pending = 
  CALCULATE(COUNTROWS(MT_Quotations), MT_Quotations[Status] IN {"Quotation", "Waiting"})
  ```
- Format like Card 1

**3. Funnel Chart (Status Pipeline):**
- Insert → Funnel chart
- Category: MT_Quotations[Status]
- Values: MT_Quotations (Count)
- Format → Data colors → Match HTML colors:
  - Order: Green (#107c10)
  - Waiting: Yellow (#ffb900)
  - Quotation: Blue (#0078d4)
  - Cancelled: Red (#d13438)

**4. Bar Chart (Top 10 Suppliers):**
- Insert → Clustered bar chart
- Y-axis: MT_Suppliers[SupplierName]
- X-axis: MT_Quotations[ValueUSD] (Sum)
- Top N filter: Top 10 by ValueUSD
- Format → Data colors → Blue gradient

**5. Donut Chart (By Entity):**
- Insert → Donut chart
- Legend: MT_Entities[EntityName]
- Values: MT_Quotations (Count)
- Format → Legend → Position: Right

**6. Line Chart (Monthly Trend):**
- Insert → Line chart
- X-axis: MT_Quotations[CreatedDate] → Month
- Y-axis: MT_Quotations (Count)
- Format → Line color: Blue

**7. Table (Workbench):**
- Insert → Table
- Columns to add:
  - MT_Quotations[QuotationID]
  - MT_Quotations[SupplierName]
  - MT_Quotations[ClientName]
  - MT_Quotations[ValueUSD]
  - MT_Quotations[Status]
  - MT_Quotations[Entity]
  - MT_Quotations[CreatedDate]
- Format → Grid → Gridlines: Horizontal only
- Format → Style → Minimal

**8. Add Slicers (Left side or top):**
- Insert → Slicer
- Field: MT_Quotations[Status]
- Format → Style: Dropdown or Tile

- Insert → Slicer
- Field: MT_Quotations[Entity]

- Insert → Slicer
- Field: MT_Quotations[CreatedDate] → Date range slicer

**9. Apply Theme:**
- View → Themes → Customize current theme
- Colors:
  - Primary: #004578 (blue)
  - Accent: #0064a3
  - Background: White
  - Font: Segoe UI

**✅ Dashboard 1 Complete!**

---

### Step 4: Build Dashboard 2 - Global Spend Analysis (3 hours)

**Reference:** `v3/global-spend-analysis/index.html`

**Color Theme:** Orange gradient (#d96f3c)

#### Key Visuals:

**6 KPI Cards:**
1. Total POs
2. Total Spend
3. Base Orders
4. Base Value
5. Change Orders
6. Change Value

**Charts:**
1. Line Chart - Monthly Spend Trend
2. Donut Chart - Spend by Entity
3. Bar Chart - Spend by Supplier
4. Bar Chart - Spend by Material Group

**Table:**
- PO Workbench (PO ID, Supplier, Entity, Value, Date, Type)

**DAX Measures:**
```dax
TotalPOs = COUNTROWS(MT_PurchaseOrders)

TotalSpend = SUM(MT_PurchaseOrders[ValueUSD])

BaseOrders = 
CALCULATE(COUNTROWS(MT_PurchaseOrders), MT_PurchaseOrders[POType] = "Base")

BaseValue = 
CALCULATE(SUM(MT_PurchaseOrders[ValueUSD]), MT_PurchaseOrders[POType] = "Base")

ChangeOrders = 
CALCULATE(COUNTROWS(MT_PurchaseOrders), MT_PurchaseOrders[POType] = "Change")

ChangeValue = 
CALCULATE(SUM(MT_PurchaseOrders[ValueUSD]), MT_PurchaseOrders[POType] = "Change")
```

**Follow same process as Dashboard 1, just with PO data and orange theme.**

---

### Step 5: Build Dashboard 3 - Disciplines Consolidated (2 hours)

**Reference:** `v3/disciplines-consolidated/index.html`

**Color Theme:** Dark blue gradient (#0f3d5e)

#### Key Visuals:

**5 KPI Cards:**
1. Total Disciplines
2. Total Quoted Amount
3. Total Order Amount
4. Quote to Order Ratio
5. Variance

**Charts:**
1. Clustered Column Chart - Budget vs Actual by Discipline
2. Matrix or Cards - 28 Discipline tiles with KPIs

**DAX Measures:**
```dax
TotalQuotedAmount = SUM(MT_Disciplines[QuotedAmount])

TotalOrderAmount = SUM(MT_Disciplines[OrderAmount])

QuoteToOrderRatio = 
DIVIDE([TotalOrderAmount], [TotalQuotedAmount], 0)

Variance = [TotalOrderAmount] - [TotalQuotedAmount]
```

**Follow same process as Dashboard 1 & 2.**

---

### Step 6: Publish to Power BI Service (5 minutes)

1. **Save your work:**
   - File → Save As
   - Name: `MVL-SupplyIntelHub-Dashboards.pbix`
   - Save to: `g:\Rita\mvl-powerbi-dashboards\`

2. **Publish:**
   - Home tab → Publish
   - Select workspace: **MVL Supply Intelligence Hub**
   - Click Select
   - Wait for upload (1-2 minutes)

3. **View in Browser:**
   - Click "Open in Power BI" link
   - Or go to: https://app.powerbi.com
   - Navigate to workspace
   - See your 3 dashboards!

**✅ Done! Your dashboards are live!**

---

## Optional: Set Up Scheduled Refresh (10 minutes)

1. Go to workspace in Power BI Service
2. Click dataset (MVL-SupplyIntelHub-Dashboards)
3. Settings → Scheduled refresh
4. Turn On
5. Set frequency: Hourly or Daily
6. Add time slots
7. Save

**SharePoint data will auto-refresh without any manual work!**

---

## Total Time Breakdown

| Task | Time |
|------|------|
| Install Power BI Desktop | 5 min |
| Connect to SharePoint | 10 min |
| Build Supplier Marketplace | 3 hours |
| Build Global Spend Analysis | 3 hours |
| Build Disciplines Consolidated | 2 hours |
| Publish & Configure | 15 min |
| **TOTAL** | **8-9 hours** |

**Spread over 2-3 days = Easy!**

---

## Tips for Success

### 1. Copy HTML Designs Exactly
- Keep your browser open with v3 HTML dashboards
- Match colors, fonts, layout as closely as possible
- Power BI won't be pixel-perfect, but get close

### 2. Save Often
- Power BI Desktop can crash
- Save every 15-30 minutes
- File → Save

### 3. Test Filters
- After adding each visual, test slicers
- Make sure all visuals update together
- This is Power BI's strength!

### 4. Use Bookmarks (Optional)
- View → Bookmarks
- Save different filter states
- Users can click to jump to saved views

### 5. Mobile Layout (Optional)
- View → Mobile Layout
- Rearrange visuals for phone view
- Test on mobile app

---

## Common Issues & Solutions

### Issue: "Can't connect to SharePoint"
**Solution:** 
- Make sure you're signed in with correct account
- Check you're using SharePoint **Online** List connector (not SharePoint Folder)
- URL must be the site URL (not list URL)

### Issue: "Data not showing in visual"
**Solution:**
- Check field is in correct drop zone (Values vs Axis)
- Check filters aren't hiding data
- Click visual → Filters pane → Check "Show items with no data"

### Issue: "Measures not calculating correctly"
**Solution:**
- Check DAX syntax (Power BI will show red squiggle)
- Make sure field names match exactly (case-sensitive)
- Use CALCULATE for filtered measures

### Issue: "Publish button greyed out"
**Solution:**
- Save file first
- Make sure you're signed in (top right corner)
- Check you have publish permissions to workspace

---

## What You Don't Need

❌ **No GitHub Actions** - Just save .pbix file  
❌ **No Copilot Agent** - You build it yourself  
❌ **No PBIP format** - Stay with .pbix  
❌ **No automation scripts** - One-time manual build  
❌ **No CI/CD pipeline** - Just click Publish  
❌ **No version control** - Save .pbix to folder  

**This is the simplest, fastest way to get Power BI dashboards working.**

---

## When to Consider Automation (Later)

If you need to:
- Create 10+ similar dashboards
- Update dashboards weekly with new KPIs
- Deploy to multiple workspaces
- Maintain strict change control

**Then** use the automation approach from POWER_BI_AUTOMATION_PLAN.md.

But for **3 dashboards, built once**, this manual approach is perfect! ✅

---

## Next Steps After Publishing

1. **Share with users:**
   - Workspace → Manage access
   - Add users (Viewer role)
   - They can view in browser or mobile app

2. **Create mobile app:**
   - Download Power BI Mobile (iOS/Android)
   - Sign in
   - Dashboards available offline

3. **Embed in intranet (optional):**
   - Report → File → Embed report → Secure embed code
   - Paste in your website/intranet

4. **Schedule refresh:**
   - Dataset settings → Scheduled refresh
   - Set to refresh hourly/daily
   - Data stays fresh automatically

---

## Support

**Having issues?**
- Check Power BI community: https://community.powerbi.com/
- Microsoft docs: https://learn.microsoft.com/power-bi/
- Or just ask me! 😊

**SharePoint data not updating?**
- Run: `python scripts/verify_sharepoint_data.py`
- Check row counts match expectations

---

## Summary

**What you're doing:**
1. ✅ Install Power BI Desktop
2. ✅ Connect to SharePoint (already has 15K records)
3. ✅ Build 3 dashboards copying v3 HTML designs
4. ✅ Publish to workspace
5. ✅ Done!

**What you're NOT doing:**
- ❌ Complex automation
- ❌ GitHub workflows
- ❌ Copilot agents
- ❌ CI/CD pipelines

**Time:** 8-12 hours over 2-3 days  
**Result:** Professional Power BI dashboards matching your HTML prototypes  
**Cost:** $0 (using existing licenses)

**🚀 Ready to start? Just install Power BI Desktop and follow Step 2!**
