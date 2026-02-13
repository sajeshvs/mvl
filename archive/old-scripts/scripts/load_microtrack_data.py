"""
Load Microtrack Production Data into SharePoint Lists
======================================================
Loads actual data from v3 JSON files (Microtrack Excel exports) into 
the MVL-MicroTrack-PowerBI SharePoint site lists.

Data Sources:
- v3/supplier-marketplace/data.json - Quotations and supplier data
- v3/global-spend-analysis/data.json - PO and spend data  
- v3/disciplines-consolidated/data.json - Discipline breakdown

Target Lists:
- MT_Suppliers - Supplier master data
- MT_Quotations - Quotation transactions
- MT_PurchaseOrders - PO transactions
- MT_Entities - Entity master data
- MT_Disciplines - Discipline master data
- MT_MaterialGroups - Material group master
- MT_Summary - Dashboard KPIs
- MT_SpendByMonth - Monthly trends
"""

from msal import ConfidentialClientApplication
import requests
import json
from pathlib import Path
from datetime import datetime
import time

# Configuration
CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

# Site info from previous creation
SITE_ID = "mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59"

# Data paths
DATA_PATH = Path("c:/Users/Sajesh/Documents/Apps/Rita/PowerBI/v3")


def get_token():
    """Get Graph API access token"""
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    return result.get("access_token")


def get_list_id(headers, list_name):
    """Get SharePoint list ID by name"""
    url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists?$filter=displayName eq '{list_name}'"
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        lists = resp.json().get("value", [])
        if lists:
            return lists[0]["id"]
    return None


def add_list_items(headers, list_id, items, batch_size=50):
    """Add items to a SharePoint list in batches"""
    added = 0
    failed = 0
    
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        
        for item in batch:
            url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{list_id}/items"
            payload = {"fields": item}
            resp = requests.post(url, headers=headers, json=payload)
            
            if resp.status_code == 201:
                added += 1
            else:
                failed += 1
                if failed <= 3:  # Show first few errors
                    print(f"      Error: {resp.status_code} - {resp.text[:100]}")
        
        # Progress update every batch
        print(f"      Progress: {min(i + batch_size, len(items))}/{len(items)} items")
        time.sleep(0.5)  # Rate limiting
    
    return added, failed


def parse_date(date_str):
    """Parse various date formats to ISO format"""
    if not date_str:
        return None
    
    try:
        # Try common formats
        formats = [
            "%d %b %Y",        # "19 Oct 2022"
            "%Y-%m-%d",        # "2022-10-19"
            "%d/%m/%Y",        # "19/10/2022"
            "%m/%d/%Y",        # "10/19/2022"
            "%d %B %Y",        # "19 October 2022"
            "%d-%b-%Y",        # "19-Oct-2022"
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.strftime("%Y-%m-%dT00:00:00Z")
            except:
                continue
        
        return None
    except:
        return None


def load_json_data():
    """Load all JSON data files"""
    print("\n📂 Loading Microtrack JSON data files...")
    
    sm_path = DATA_PATH / "supplier-marketplace/data.json"
    gs_path = DATA_PATH / "global-spend-analysis/data.json"
    dc_path = DATA_PATH / "disciplines-consolidated/data.json"
    
    with open(sm_path, 'r', encoding='utf-8') as f:
        supplier_marketplace = json.load(f)
    print(f"   ✅ Supplier Marketplace: {len(supplier_marketplace.get('workbench', []))} records")
    
    with open(gs_path, 'r', encoding='utf-8') as f:
        global_spend = json.load(f)
    print(f"   ✅ Global Spend Analysis: {len(global_spend.get('workbench', []))} records")
    
    with open(dc_path, 'r', encoding='utf-8') as f:
        disciplines = json.load(f)
    print(f"   ✅ Disciplines: {len(disciplines.get('disciplines', []))} disciplines")
    
    return supplier_marketplace, global_spend, disciplines


def prepare_suppliers_data(sm_data, gs_data):
    """Prepare supplier records from JSON data"""
    print("\n   Processing suppliers...")
    
    # Use supplier data from supplier marketplace
    suppliers = []
    seen = set()
    
    for s in sm_data.get('suppliers', []):
        name = s.get('SupplierName', '').strip()
        if name and name not in seen:
            seen.add(name)
            suppliers.append({
                "Title": name[:255] if name else "Unknown",
                "SupplierName": name[:255] if name else "Unknown",
                "POCount": s.get('POCount', 0),
                "TotalSpendUSD": round(s.get('TotalSpendUSD', 0), 2),
            })
    
    print(f"      Found {len(suppliers)} unique suppliers")
    return suppliers[:500]  # Limit for initial load


def prepare_quotations_data(sm_data):
    """Prepare quotation records from workbench"""
    print("\n   Processing quotations...")
    
    quotations = []
    workbench = sm_data.get('workbench', [])
    
    for item in workbench:
        status = item.get('Status', 'Quotation')
        # Map to valid choices
        if status not in ['Quotation', 'Waiting', 'Order', 'Cancelled']:
            status = 'Quotation'
        
        quotations.append({
            "Title": item.get('QuotationNumber', '')[:255],
            "QuotationID": item.get('QuotationNumber', '')[:255],
            "Status": status,
            "ValueUSD": round(item.get('QuotationValue', 0), 2),
            "ClientName": (item.get('Client', '') or '')[:255],
            "Entity": (item.get('Entity', '') or '')[:255],
            "Discipline": (item.get('Material', '') or '')[:255],
        })
    
    print(f"      Found {len(quotations)} quotations")
    return quotations[:1000]  # Limit for initial load


def prepare_purchase_orders_data(gs_data):
    """Prepare PO records from global spend workbench"""
    print("\n   Processing purchase orders...")
    
    pos = []
    workbench = gs_data.get('workbench', [])
    
    for item in workbench:
        po_date = parse_date(item.get('poDate', ''))
        
        pos.append({
            "Title": item.get('poNumber', '')[:255],
            "POID": item.get('poNumber', '')[:255],
            "SupplierName": (item.get('supplier', '') or '')[:255],
            "ValueUSD": round(item.get('valueUSD', 0), 2),
            "Entity": (item.get('entity', '') or '')[:255],
            "MaterialGroup": (item.get('material', '') or '')[:255],
        })
    
    print(f"      Found {len(pos)} purchase orders")
    return pos[:1000]  # Limit for initial load


def prepare_entities_data(sm_data, gs_data):
    """Prepare entity master data"""
    print("\n   Processing entities...")
    
    entities = []
    seen = set()
    
    # From supplier marketplace entities
    for e in sm_data.get('entities', []):
        name = e.get('Entity', '').strip()
        if name and name not in seen:
            seen.add(name)
            entities.append({
                "Title": name[:255],
                "EntityCode": name[:50],
                "EntityName": name[:255],
                "Region": "UAE",  # Default
                "Country": "United Arab Emirates",
            })
    
    # Also from global spend entity breakdown
    for e in gs_data.get('entityBreakdown', []):
        name = e.get('name', '').strip()
        if name and name not in seen:
            seen.add(name)
            entities.append({
                "Title": name[:255],
                "EntityCode": name[:50],
                "EntityName": name[:255],
                "Region": "UAE",
                "Country": "United Arab Emirates",
            })
    
    print(f"      Found {len(entities)} unique entities")
    return entities


def prepare_disciplines_data(dc_data):
    """Prepare discipline master data"""
    print("\n   Processing disciplines...")
    
    disciplines = []
    
    for d in dc_data.get('disciplines', []):
        name = d.get('name', '').strip()
        if name:
            disciplines.append({
                "Title": name[:255],
                "DisciplineCode": name[:50].upper().replace(' ', '_').replace('/', '_'),
                "DisciplineName": name[:255],
                "Category": "General",
            })
    
    print(f"      Found {len(disciplines)} disciplines")
    return disciplines


def prepare_material_groups_data(sm_data, gs_data):
    """Prepare material group master data"""
    print("\n   Processing material groups...")
    
    materials = []
    seen = set()
    
    # From global spend material breakdown
    for m in gs_data.get('materialBreakdown', []):
        name = m.get('name', '').strip()
        if name and name not in seen:
            seen.add(name)
            materials.append({
                "Title": name[:255],
                "MaterialCode": name[:50].upper().replace(' ', '_'),
                "MaterialName": name[:255],
                "Category": "General",
            })
    
    print(f"      Found {len(materials)} material groups")
    return materials


def prepare_summary_data(sm_data, gs_data, dc_data):
    """Prepare summary KPIs for all dashboards"""
    print("\n   Processing summary KPIs...")
    
    now = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    summary = []
    
    # Supplier Marketplace KPIs
    sm_summary = sm_data.get('summary', {})
    summary.extend([
        {"Title": "SM_TotalQuotations", "MetricName": "Total Quotations", "MetricValue": sm_summary.get('totalQuotations', 0), "Dashboard": "SupplierMarketplace", "AsOfDate": now},
        {"Title": "SM_TotalPOs", "MetricName": "Total POs", "MetricValue": sm_summary.get('totalPOs', 0), "Dashboard": "SupplierMarketplace", "AsOfDate": now},
        {"Title": "SM_WinRate", "MetricName": "Win Rate %", "MetricValue": sm_summary.get('winRate', 0), "Dashboard": "SupplierMarketplace", "AsOfDate": now},
        {"Title": "SM_TotalQuotationValueUSD", "MetricName": "Total Quotation Value USD", "MetricValue": round(sm_summary.get('totalQuotationValueUSD', 0), 2), "Dashboard": "SupplierMarketplace", "AsOfDate": now},
        {"Title": "SM_TotalPOSpendUSD", "MetricName": "Total PO Spend USD", "MetricValue": round(sm_summary.get('totalPOSpendUSD', 0), 2), "Dashboard": "SupplierMarketplace", "AsOfDate": now},
        {"Title": "SM_TotalClients", "MetricName": "Total Clients", "MetricValue": sm_summary.get('totalClients', 0), "Dashboard": "SupplierMarketplace", "AsOfDate": now},
        {"Title": "SM_TotalEntities", "MetricName": "Total Entities", "MetricValue": sm_summary.get('totalEntities', 0), "Dashboard": "SupplierMarketplace", "AsOfDate": now},
    ])
    
    # Global Spend KPIs
    gs_summary = gs_data.get('summary', {})
    summary.extend([
        {"Title": "GS_TotalSpendUSD", "MetricName": "Total Spend USD", "MetricValue": round(gs_summary.get('totalSpendUSD', 0), 2), "Dashboard": "GlobalSpend", "AsOfDate": now},
        {"Title": "GS_TotalPOs", "MetricName": "Total POs", "MetricValue": gs_summary.get('totalPOs', 0), "Dashboard": "GlobalSpend", "AsOfDate": now},
        {"Title": "GS_BasePOs", "MetricName": "Base POs", "MetricValue": gs_summary.get('basePOs', 0), "Dashboard": "GlobalSpend", "AsOfDate": now},
        {"Title": "GS_ChangeOrders", "MetricName": "Change Orders", "MetricValue": gs_summary.get('changeOrders', 0), "Dashboard": "GlobalSpend", "AsOfDate": now},
        {"Title": "GS_BasePOValue", "MetricName": "Base PO Value USD", "MetricValue": round(gs_summary.get('basePOValue', 0), 2), "Dashboard": "GlobalSpend", "AsOfDate": now},
        {"Title": "GS_ChangeOrderValue", "MetricName": "Change Order Value USD", "MetricValue": round(gs_summary.get('changeOrderValue', 0), 2), "Dashboard": "GlobalSpend", "AsOfDate": now},
        {"Title": "GS_SupplierCount", "MetricName": "Supplier Count", "MetricValue": gs_summary.get('supplierCount', 0), "Dashboard": "GlobalSpend", "AsOfDate": now},
        {"Title": "GS_ProjectCount", "MetricName": "Project Count", "MetricValue": gs_summary.get('projectCount', 0), "Dashboard": "GlobalSpend", "AsOfDate": now},
        {"Title": "GS_AvgPOValue", "MetricName": "Avg PO Value USD", "MetricValue": round(gs_summary.get('avgPOValue', 0), 2), "Dashboard": "GlobalSpend", "AsOfDate": now},
        {"Title": "GS_ChangeOrderRatio", "MetricName": "Change Order Ratio %", "MetricValue": gs_summary.get('changeOrderRatio', 0), "Dashboard": "GlobalSpend", "AsOfDate": now},
    ])
    
    # Disciplines KPIs
    dc_summary = dc_data.get('summary', {})
    summary.extend([
        {"Title": "DC_TotalQuoted", "MetricName": "Total Quoted USD", "MetricValue": round(dc_summary.get('totalQuoted', 0), 2), "Dashboard": "Disciplines", "AsOfDate": now},
        {"Title": "DC_TotalOrdered", "MetricName": "Total Ordered USD", "MetricValue": round(dc_summary.get('totalOrdered', 0), 2), "Dashboard": "Disciplines", "AsOfDate": now},
        {"Title": "DC_TotalVariance", "MetricName": "Total Variance USD", "MetricValue": round(dc_summary.get('totalVariance', 0), 2), "Dashboard": "Disciplines", "AsOfDate": now},
        {"Title": "DC_OverallUtilization", "MetricName": "Overall Utilization %", "MetricValue": dc_summary.get('overallUtilization', 0), "Dashboard": "Disciplines", "AsOfDate": now},
        {"Title": "DC_QuotationCount", "MetricName": "Quotation Count", "MetricValue": dc_summary.get('quotationCount', 0), "Dashboard": "Disciplines", "AsOfDate": now},
        {"Title": "DC_POCount", "MetricName": "PO Count", "MetricValue": dc_summary.get('poCount', 0), "Dashboard": "Disciplines", "AsOfDate": now},
        {"Title": "DC_DisciplineCount", "MetricName": "Discipline Count", "MetricValue": dc_summary.get('disciplineCount', 0), "Dashboard": "Disciplines", "AsOfDate": now},
    ])
    
    print(f"      Created {len(summary)} summary KPIs")
    return summary


def prepare_spend_by_month_data(gs_data):
    """Prepare monthly spend trend data"""
    print("\n   Processing monthly trends...")
    
    trends = []
    
    for m in gs_data.get('monthlyTrend', []):
        ym = m.get('yearMonth', '')
        if ym and '-' in ym:
            parts = ym.split('-')
            year = int(parts[0])
            month = int(parts[1])
            
            trends.append({
                "Title": ym,
                "YearMonth": ym,
                "Year": year,
                "Month": month,
                "TotalSpendUSD": round(m.get('value', 0), 2),
                "POCount": m.get('count', 0),
            })
    
    # Also add annual trends
    for a in gs_data.get('annualTrend', []):
        year = a.get('year')
        if year:
            trends.append({
                "Title": f"{year}-00",
                "YearMonth": f"{year}-00",
                "Year": year,
                "Month": 0,  # 0 = annual total
                "TotalSpendUSD": round(a.get('totalValue', 0), 2),
                "POCount": a.get('poCount', 0),
            })
    
    print(f"      Created {len(trends)} trend records")
    return trends


def main():
    print("=" * 70)
    print("  LOADING MICROTRACK DATA INTO SHAREPOINT")
    print("=" * 70)
    print(f"\n🎯 Target Site: MVL-MicroTrack-PowerBI")
    print(f"📊 Data Source: v3 JSON files (Microtrack Excel export)")
    
    # Get auth token
    print("\n🔐 Authenticating...")
    token = get_token()
    if not token:
        print("   ❌ Failed to get access token")
        return
    print("   ✅ Authenticated")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Load JSON data
    sm_data, gs_data, dc_data = load_json_data()
    
    # Prepare all data sets
    print("\n📋 Preparing data for SharePoint lists...")
    
    data_sets = {
        "MT_Summary": prepare_summary_data(sm_data, gs_data, dc_data),
        "MT_Entities": prepare_entities_data(sm_data, gs_data),
        "MT_Disciplines": prepare_disciplines_data(dc_data),
        "MT_MaterialGroups": prepare_material_groups_data(sm_data, gs_data),
        "MT_SpendByMonth": prepare_spend_by_month_data(gs_data),
        "MT_Suppliers": prepare_suppliers_data(sm_data, gs_data),
        "MT_Quotations": prepare_quotations_data(sm_data),
        "MT_PurchaseOrders": prepare_purchase_orders_data(gs_data),
    }
    
    # Load each list
    print("\n" + "=" * 70)
    print("  LOADING DATA INTO SHAREPOINT LISTS")
    print("=" * 70)
    
    total_added = 0
    total_failed = 0
    
    for list_name, data in data_sets.items():
        print(f"\n📝 Loading {list_name}...")
        
        list_id = get_list_id(headers, list_name)
        if not list_id:
            print(f"   ❌ List not found: {list_name}")
            continue
        
        print(f"   Found list ID: {list_id[:20]}...")
        print(f"   Loading {len(data)} items...")
        
        if data:
            added, failed = add_list_items(headers, list_id, data)
            total_added += added
            total_failed += failed
            print(f"   ✅ Added: {added}, Failed: {failed}")
        else:
            print(f"   ⚠️ No data to load")
    
    # Summary
    print("\n" + "=" * 70)
    print("  LOAD COMPLETE")
    print("=" * 70)
    print(f"\n✅ Total items added: {total_added}")
    print(f"❌ Total items failed: {total_failed}")
    print(f"\n🔗 View data at: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi")
    print(f"\n📊 Next Steps:")
    print(f"   1. Connect Power BI to these SharePoint lists")
    print(f"   2. Create relationships between tables")
    print(f"   3. Build dashboard visuals matching v3 HTML designs")


if __name__ == "__main__":
    main()
