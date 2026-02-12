# Agent Instructions: Data & SharePoint Integration

## Overview

The MVL Supply Intel Hub uses SharePoint Online lists as the data backend. Data from MicroTrack (production system) is loaded into SharePoint lists, which the SPFx web part reads via Microsoft Graph API.

---

## ⚠️ IMPORTANT: New Improved Data Available

**As of February 9, 2026**, improved data exists in:
```
g:\Rita\mvl-powerbi-dashboards\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data\json\
```

| File | Records | Enhancements |
|------|---------|--------------|
| `suppliers_improved.json` | 2,189 | Supplier scoring, contact parsing, phone validation |
| `purchase_orders_improved.json` | 3,539 | PO status, categories, supplier linking |
| `quotations_improved.json` | 12,136 | Win rates, client types, project extraction |

**See:** [DATA_COMPARISON_OLD_VS_NEW.md](DATA_COMPARISON_OLD_VS_NEW.md) for full comparison

---

## SharePoint Site

| Property | Value |
|----------|-------|
| **Site URL** | https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi |
| **Site Name** | MVL-MicroTrack-PowerBI |
| **Site ID** | mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59 |

---

## Azure AD App Registration

| Property | Value |
|----------|-------|
| **Tenant ID** | 416328e6-260f-438f-bf3c-9c4f15b6a1ca |
| **Client ID** | 1b9540e1-6c1e-4214-8d97-6116394ef72c |
| **Client Secret** | cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4 |
| **Permissions** | Sites.ReadWrite.All, User.Read.All |

---

## SharePoint Lists

### MT_Quotations (Primary data - 12,000+ records)
Quotation transaction data from MicroTrack.

| Column | Type | Description |
|--------|------|-------------|
| Id | Number | Auto-generated ID |
| QuotationNumber | Text | Unique quotation ID (QT-YYYY-NNNNNN) |
| SupplierName | Text | Supplier name |
| Entity | Text | MVL entity (Marine, Offshore, etc.) |
| MaterialGroup | Text | Material category |
| MaterialCode | Text | Optional material code |
| QuotationValue | Number | Quote amount in USD |
| Currency | Text | Original currency |
| Status | Choice | Order, Waiting, Quotation, Cancelled |
| StatusCategory | Text | Status grouping |
| QuoteType | Text | Type classification |
| CreatedDate | Date | Quote creation date |
| ValidityDays | Number | Quote validity period |
| Description | Text | Item description |
| PONumber | Text | Linked PO if converted |

### MT_PurchaseOrders (7,000+ records)
Purchase order data.

| Column | Type | Description |
|--------|------|-------------|
| Id | Number | Auto-generated ID |
| PONumber | Text | PO number (PO-YYYY-NNNNNN) |
| SupplierName | Text | Supplier name |
| Entity | Text | MVL entity |
| MaterialGroup | Text | Material category |
| POValue | Number | PO value in USD |
| Currency | Text | Original currency |
| PODate | Date | PO issue date |
| Status | Choice | Open, Completed, Cancelled |
| DeliveryDate | Date | Expected delivery |
| QuotationNumber | Text | Linked quotation |

### MT_Suppliers
Supplier master data.

| Column | Type | Description |
|--------|------|-------------|
| Id | Number | Auto-generated ID |
| SupplierName | Text | Supplier name |
| SupplierCode | Text | Internal code |
| Country | Text | Country |
| Category | Text | Supplier category |
| TotalQuotes | Number | Total quotations received |
| TotalOrders | Number | Total POs issued |
| TotalSpend | Number | Cumulative spend USD |

### MT_Entities
MVL entity master data.

| Column | Type | Description |
|--------|------|-------------|
| Id | Number | Auto-generated ID |
| EntityName | Text | Entity name |
| EntityCode | Text | Short code |
| Region | Text | Geographic region |
| QuotationCount | Number | Total quotations |
| POCount | Number | Total POs |
| TotalSpend | Number | Total spend USD |

### MT_Disciplines
28 procurement disciplines.

| Column | Type | Description |
|--------|------|-------------|
| Id | Number | Auto-generated ID |
| DisciplineName | Text | Discipline name |
| DisciplineCode | Text | Short code |
| QuotedAmount | Number | Total quoted USD |
| OrderAmount | Number | Total ordered USD |
| Variance | Number | Difference |
| QuoteCount | Number | Number of quotes |
| OrderCount | Number | Number of orders |

### MT_MaterialGroups
Material category master.

| Column | Type | Description |
|--------|------|-------------|
| Id | Number | Auto-generated ID |
| MaterialGroupName | Text | Category name |
| MaterialGroupCode | Text | Short code |
| QuotationCount | Number | Quote count |
| POCount | Number | PO count |
| TotalValue | Number | Total value USD |

### MT_Summary
Pre-calculated KPI summary.

| Column | Type | Description |
|--------|------|-------------|
| Id | Number | Auto-generated ID |
| MetricName | Text | KPI name |
| MetricValue | Number | KPI value |
| MetricType | Text | Category |
| AsOfDate | Date | Calculation date |

### MT_SpendByMonth
Monthly spend aggregation.

| Column | Type | Description |
|--------|------|-------------|
| Id | Number | Auto-generated ID |
| Year | Number | Year |
| Month | Number | Month (1-12) |
| MonthName | Text | Month name |
| QuotationCount | Number | Quotes received |
| QuotationValue | Number | Quote total USD |
| POCount | Number | POs issued |
| POValue | Number | PO total USD |

---

## Scripts Location

```
g:\Rita\mvl-powerbi-dashboards\scripts\
```

---

## Key Scripts

### load_microtrack_data.py
**Purpose:** Load data from v3 JSON files into SharePoint lists.

```powershell
python scripts/load_microtrack_data.py
```

**What it does:**
1. Reads JSON files from `v3/*/data.json`
2. Connects to SharePoint via Graph API
3. Creates/updates items in MT_* lists
4. Handles batching for large datasets

### verify_sharepoint_data.py
**Purpose:** Verify data was loaded correctly.

```powershell
python scripts/verify_sharepoint_data.py
```

**Output:**
- Row counts per list
- Sample records
- Data quality checks

### add_correct_users.py
**Purpose:** Add users to SharePoint site.

```powershell
python scripts/add_correct_users.py
```

**Users:**
- rita.jamal@mvl-group.com
- sajesh.sukumaran@mvl-group.com

### search_users.py
**Purpose:** Search Azure AD for users.

```powershell
python scripts/search_users.py
```

---

## Data Loading Process

### Initial Load
```powershell
# 1. Verify site exists
python scripts/verify_sharepoint_data.py

# 2. Load all data
python scripts/load_microtrack_data.py

# 3. Verify load completed
python scripts/verify_sharepoint_data.py
```

### Incremental Updates
```powershell
# Load additional quotations
python scripts/add_missing_quotations.py

# Retry failed records
python scripts/retry_failed_quotations.py
```

---

## Graph API Authentication

All scripts use MSAL (Microsoft Authentication Library) for authentication:

```python
from msal import ConfidentialClientApplication

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    result = app.acquire_token_for_client(
        scopes=["https://graph.microsoft.com/.default"]
    )
    return result.get("access_token")
```

---

## SharePoint List Item Threshold

**IMPORTANT:** SharePoint Online has a 5,000 item list view threshold.

### Problem
- MT_Quotations has 12,000+ items
- Standard queries fail with "exceeds list view threshold" error

### Solution Implemented
The SPFx SharePointService.ts uses **ID-based paging**:

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

**Why this works:**
- `Id` is an indexed column
- Filter by `Id gt {lastId}` uses index
- Fetches in batches of 2,000
- Bypasses 5,000 threshold

---

## User Permissions

### Adding Users to Site
Users need the correct email domain:
- ✅ `@mvl-group.com` (correct)
- ❌ `@mvlgroupusa.onmicrosoft.com` (wrong)

### Admin Users
| User | Email | Role |
|------|-------|------|
| Sajesh Admin | sajesh.admin@mvlgroupusa.onmicrosoft.com | Site Owner |
| Rita Jamal | rita.jamal@mvl-group.com | Member |
| Sajesh Sukumaran | sajesh.sukumaran@mvl-group.com | Member |

### Permission Levels
- **Owner:** Full control, manage permissions
- **Member:** Edit content, add items
- **Visitor:** Read only

---

## Data Refresh Strategy

### Manual Refresh
1. Export new data from MicroTrack
2. Convert to JSON format
3. Run load script

### Scheduled Refresh (Future)
- Azure Function on timer trigger
- Pull from MicroTrack API
- Update SharePoint lists
- Send notification on completion

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "exceeds list view threshold" | >5000 items | Use ID-based paging |
| "Access denied" | Missing permissions | Add user to site group |
| "User not found" | Wrong email domain | Use @mvl-group.com |
| "Token expired" | Client secret expired | Regenerate in Azure AD |
| "Site not found" | Wrong URL | Check site URL spelling |

---

## Agent Tasks

### 1. Add Data to SharePoint List
```python
# Example: Add new quotation
headers = {'Authorization': f'Bearer {token}'}
url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{LIST_ID}/items"
data = {"fields": {"QuotationNumber": "QT-2024-999999", ...}}
requests.post(url, headers=headers, json=data)
```

### 2. Query SharePoint List
```python
# Get quotations with filter
url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/MT_Quotations/items?$filter=Status eq 'Order'"
```

### 3. Update List Item
```python
# Update existing item
url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{LIST_ID}/items/{ITEM_ID}/fields"
requests.patch(url, headers=headers, json={"Status": "Completed"})
```

### 4. Verify Data Integrity
```powershell
python scripts/verify_sharepoint_data.py
```

---

## Dependencies

```
pip install msal requests python-dotenv
```

---

## Data Flow Diagram

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────────┐
│   MicroTrack    │────▶│  v3/JSON     │────▶│  SharePoint Lists │
│   (Production)  │     │  (Export)    │     │  (MT_*)           │
└─────────────────┘     └──────────────┘     └───────────────────┘
                                                      │
                                                      ▼
                                             ┌───────────────────┐
                                             │   SPFx Web Part   │
                                             │   (Dashboard)     │
                                             └───────────────────┘
```

---

## Security Notes

1. **Client Secret Rotation:** Rotate every 12-24 months
2. **Least Privilege:** Only request necessary Graph API permissions
3. **Site Permissions:** Use groups, not direct user assignments
4. **Data Sensitivity:** PO values are business confidential

---

## New Improved Data (February 2026)

### Location
```
g:\Rita\mvl-powerbi-dashboards\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data\
```

### Files
| File | Records | Purpose |
|------|---------|---------|
| `json/suppliers_improved.json` | 2,189 | Enhanced supplier data with scoring |
| `json/purchase_orders_improved.json` | 3,539 | POs with status, categories, linking |
| `json/quotations_improved.json` | 12,136 | Quotes with win rates, contacts |
| `json/metadata.json` | - | Dataset metadata |
| `json/improvement_summary.json` | - | Enhancement statistics |

### Key Enhancements

**Suppliers:**
- Supplier score (0-100)
- Contact name parsing (first/last)
- Phone validation & standardization
- Country ISO codes

**Purchase Orders:**
- PO status (recent/active/aging/old)
- Category (Material/Office/Vehicle/Equipment/Service)
- Supplier linking (98.9% match rate)
- Project code extraction

**Quotations:**
- Client type (internal/external)
- MVL contact (sales person)
- Status normalized (won/lost/pending)
- Win rate by contact

### Source Excel Files
```
MVL Supply Chain Intel Hub - Data/
├── MVL_Suppliers_List_ENRICHED.xlsx
├── PO_List_Jan-23-2026.xlsx
└── Quotation Reports/
    └── Quotation_Report_Jan-28-2026*.xlsx (5 files)
```

### Processing Scripts
```
MVLSupplierIntelHub/
├── convert_to_json.py          # Excel to JSON conversion
├── improve_all_data.py         # Data enhancement
├── add_supplier_locations.py   # Geocoding
└── detailed_analysis.py        # Data quality analysis
```

### To Load Improved Data
1. Create new SharePoint columns (see DATA_COMPARISON_OLD_VS_NEW.md)
2. Create load script to flatten nested JSON
3. Load via Graph API
4. Update SPFx models and components
