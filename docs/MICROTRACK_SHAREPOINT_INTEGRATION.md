# Microtrack → SharePoint Integration Guide
## PHP Implementation for Real-Time Data Sync

---

## Overview

This guide explains how to integrate your Microtrack PHP/MySQL application with the SharePoint data hub to enable real-time Power BI dashboards.

### Architecture Flow
```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   MICROTRACK    │ ──▶  │   SHAREPOINT     │ ──▶  │    POWER BI     │
│   PHP/MySQL     │      │   Lists (API)    │      │   Dashboards    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
     Source               Graph API Auth            Auto-Refresh
```

---

## Prerequisites

### 1. Server Requirements
- PHP 7.4 or higher
- cURL extension enabled
- MySQL/MariaDB connection to Microtrack database
- Outbound HTTPS access to Microsoft Graph API

### 2. Azure AD App (Already Configured)
The Entra App is already set up with the following credentials:

| Setting | Value |
|---------|-------|
| Tenant ID | `416328e6-260f-438f-bf3c-9c4f15b6a1ca` |
| Client ID | `1b9540e1-6c1e-4214-8d97-6116394ef72c` |
| Client Secret | `cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4` |

### 3. SharePoint Site (Already Created)
| Setting | Value |
|---------|-------|
| Site URL | `https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi` |
| Site ID | `mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59` |

---

## Installation

### Step 1: Copy PHP Files to Microtrack Server

Upload these files to your Microtrack server:

```
/var/www/microtrack/sharepoint/
├── MicrotrackSharePointSync.php    # Main sync class
├── microtrack_sync_cron.php        # Cron job wrapper
└── config.php                      # Configuration (create this)
```

### Step 2: Create Configuration File

Create `/var/www/microtrack/sharepoint/config.php`:

```php
<?php
return [
    // Database Configuration
    'db_host' => 'localhost',
    'db_user' => 'microtrack_user',
    'db_pass' => 'YOUR_DATABASE_PASSWORD',
    'db_name' => 'microtrack',
    
    // Azure AD / Entra App (DO NOT CHANGE)
    'tenant_id' => '416328e6-260f-438f-bf3c-9c4f15b6a1ca',
    'client_id' => '1b9540e1-6c1e-4214-8d97-6116394ef72c',
    'client_secret' => 'cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4',
    
    // SharePoint Site (DO NOT CHANGE)
    'site_id' => 'mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59',
    
    // Sync Settings
    'log_file' => '/var/log/microtrack_sharepoint_sync.log',
    'sync_limit' => 1000,  // Max records per sync
];
```

### Step 3: Update Database Queries

Edit `MicrotrackSharePointSync.php` and update the SQL queries to match your actual Microtrack database schema.

**Current placeholder queries need to be updated:**

#### Purchase Orders Query (Line ~150)
```php
// BEFORE (placeholder):
$sql = "SELECT po.po_number AS POID, ...";

// AFTER (update to match your schema):
$sql = "
    SELECT 
        your_po_table.po_number AS POID,
        your_po_table.po_date AS PODate,
        your_supplier_table.name AS SupplierName,
        your_po_table.value_usd AS ValueUSD,
        your_entity_table.name AS Entity,
        your_po_table.material_group AS MaterialGroup
    FROM your_po_table
    LEFT JOIN your_supplier_table ON ...
    LEFT JOIN your_entity_table ON ...
    WHERE your_po_table.updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
";
```

#### Quotations Query (Line ~210)
```php
// Update similarly to match your quotations table
```

---

## SharePoint List Schema

The following SharePoint lists are already created and waiting for data:

### MT_PurchaseOrders
| Column | Type | Description |
|--------|------|-------------|
| Title | Text | PO Number (required) |
| POID | Text | PO Number (for lookup) |
| SupplierName | Text | Supplier name |
| ValueUSD | Number | PO value in USD |
| Entity | Text | Entity/Division name |
| MaterialGroup | Text | Material category |
| Discipline | Text | Discipline code |
| PODate | DateTime | PO date |
| Status | Choice | Open/Closed/Cancelled |

### MT_Quotations
| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Quotation number |
| QuotationID | Text | Quotation number (for lookup) |
| Status | Choice | Quotation/Waiting/Order/Cancelled |
| ValueUSD | Number | Quote value in USD |
| ClientName | Text | Client name |
| Entity | Text | Entity name |
| Discipline | Text | Discipline |
| CreatedDate | DateTime | Quote creation date |

### MT_Suppliers
| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Supplier name |
| SupplierName | Text | Supplier name |
| POCount | Number | Total PO count |
| TotalSpendUSD | Number | Total spend in USD |

### MT_Summary
| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Metric key (e.g., GS_TotalPOs) |
| MetricName | Text | Display name |
| MetricValue | Number | Metric value |
| Dashboard | Choice | SupplierMarketplace/GlobalSpend/Disciplines |
| AsOfDate | DateTime | Last updated timestamp |

---

## Setting Up Scheduled Sync

### Option A: Cron Job (Recommended)

Add to crontab for hourly sync:

```bash
# Edit crontab
crontab -e

# Add this line for hourly sync
0 * * * * /usr/bin/php /var/www/microtrack/sharepoint/microtrack_sync_cron.php >> /var/log/microtrack_sync.log 2>&1

# Or every 15 minutes for near real-time
*/15 * * * * /usr/bin/php /var/www/microtrack/sharepoint/microtrack_sync_cron.php >> /var/log/microtrack_sync.log 2>&1
```

### Option B: Trigger on Data Changes

Add sync calls to your existing Microtrack PHP code:

```php
// After saving a new PO
function savePurchaseOrder($poData) {
    // ... existing save logic ...
    
    // Trigger SharePoint sync
    require_once '/var/www/microtrack/sharepoint/MicrotrackSharePointSync.php';
    $sync = new MicrotrackSharePointSync($dbHost, $dbUser, $dbPass, $dbName);
    $sync->syncPurchaseOrders(1); // Sync just this one
}
```

---

## Testing the Integration

### 1. Manual Test Run

```bash
cd /var/www/microtrack/sharepoint
php MicrotrackSharePointSync.php all
```

Expected output:
```
[2026-02-02 10:00:00] [INFO] === Starting full sync ===
[2026-02-02 10:00:01] [INFO] Starting Supplier sync...
[2026-02-02 10:00:05] [INFO] Supplier sync complete: Added=0, Updated=47, Failed=0
[2026-02-02 10:00:05] [INFO] Starting Quotation sync...
...
[2026-02-02 10:01:30] [INFO] === Full sync complete ===
```

### 2. Verify in SharePoint

1. Go to: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi
2. Click on each list (MT_PurchaseOrders, MT_Quotations, etc.)
3. Verify new/updated records appear

### 3. Check Logs

```bash
tail -f /var/log/microtrack_sharepoint_sync.log
```

---

## Troubleshooting

### Error: "Failed to get access token"
- Verify client secret hasn't expired (expires in 2 years)
- Check internet connectivity to Microsoft servers
- Verify tenant ID and client ID are correct

### Error: "List not found"
- Ensure SharePoint site exists
- Verify site ID is correct
- Check that lists were created (MT_PurchaseOrders, etc.)

### Error: "Database connection failed"
- Verify database credentials in config.php
- Check MySQL/MariaDB is running
- Ensure PHP has MySQL extension enabled

### Rate Limiting (HTTP 429)
- The script includes 100ms delays between API calls
- If you hit limits, increase the delay in `usleep()` calls
- Microsoft Graph allows ~2000 requests per minute

---

## Security Considerations

1. **Protect credentials**: Store config.php outside web root or protect with .htaccess
2. **Log rotation**: Set up log rotation to prevent disk fill
3. **Monitor failures**: Set up alerts for sync failures
4. **Firewall**: Ensure only outbound HTTPS to Microsoft is allowed

---

## API Rate Limits

| API | Limit | Notes |
|-----|-------|-------|
| Microsoft Graph | 2000/min per app | Per tenant |
| SharePoint Lists | 5000 items/request | Use pagination |
| Token Requests | 10/min | Token cached for 1 hour |

---

## Support

For issues with:
- **Microtrack database schema**: Contact Microtrack development team
- **SharePoint/Power BI**: Contact IT administrator
- **Azure AD/Entra**: Contact Microsoft 365 admin

---

## Files Reference

| File | Location | Purpose |
|------|----------|---------|
| MicrotrackSharePointSync.php | php/ | Main sync class |
| microtrack_sync_cron.php | php/ | Cron wrapper |
| config.php | php/ | Configuration (create this) |

---

*Last Updated: February 2, 2026*
