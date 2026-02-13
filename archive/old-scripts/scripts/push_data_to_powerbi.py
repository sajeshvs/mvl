"""
Push SharePoint data to Power BI Dataset
=========================================
Reads data from SharePoint lists and pushes to the Power BI push dataset
"""
from msal import ConfidentialClientApplication
import requests
import json
from pathlib import Path

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

# Power BI GCC
PBI_SCOPE = "https://analysis.usgovcloudapi.net/powerbi/api/.default"
PBI_BASE = "https://api.powerbigov.us/v1.0/myorg"

# SharePoint
GRAPH_SCOPE = "https://graph.microsoft.com/.default"
SP_SITE_ID = "mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59"

# Power BI workspace/dataset from previous step
WORKSPACE_ID = "4913fadb-9d03-4742-9e8c-39412a64a93f"
DATASET_ID = "c725ca87-7e4b-4a83-819c-55b1bdcbceeb"


def get_graph_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=[GRAPH_SCOPE]).get("access_token")


def get_pbi_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=[PBI_SCOPE]).get("access_token")


def get_sharepoint_list_data(headers, list_name, max_items=15000):
    """Fetch all items from a SharePoint list"""
    items = []
    
    # First get list ID
    url = f"https://graph.microsoft.com/v1.0/sites/{SP_SITE_ID}/lists?$filter=displayName eq '{list_name}'"
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        print(f"   Error finding list {list_name}: {resp.status_code}")
        return []
    
    lists = resp.json().get("value", [])
    if not lists:
        print(f"   List not found: {list_name}")
        return []
    
    list_id = lists[0]["id"]
    
    # Fetch items with pagination
    url = f"https://graph.microsoft.com/v1.0/sites/{SP_SITE_ID}/lists/{list_id}/items?$expand=fields&$top=5000"
    
    while url and len(items) < max_items:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("value", []):
                items.append(item.get("fields", {}))
            url = data.get("@odata.nextLink")
            print(f"      ... fetched {len(items)} so far")
        else:
            break
    
    return items


def push_to_powerbi(headers, table_name, rows):
    """Push rows to Power BI push dataset"""
    if not rows:
        return 0
    
    url = f"{PBI_BASE}/groups/{WORKSPACE_ID}/datasets/{DATASET_ID}/tables/{table_name}/rows"
    
    # Power BI accepts max 10,000 rows per request
    batch_size = 1000
    pushed = 0
    
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        payload = {"rows": batch}
        
        resp = requests.post(url, headers=headers, json=payload)
        
        if resp.status_code == 200:
            pushed += len(batch)
        else:
            print(f"      Error pushing batch: {resp.status_code} - {resp.text[:100]}")
    
    return pushed


def transform_po_data(sp_items):
    """Transform SharePoint PO items to Power BI schema"""
    rows = []
    for item in sp_items:
        rows.append({
            "POID": item.get("POID", "")[:255],
            "SupplierName": item.get("SupplierName", "")[:255],
            "ValueUSD": float(item.get("ValueUSD", 0) or 0),
            "Entity": item.get("Entity", "")[:255],
            "MaterialGroup": item.get("MaterialGroup", "")[:255],
            "Discipline": item.get("Discipline", "")[:255],
            "PODate": None,  # SharePoint date needs conversion
            "Status": item.get("Status", "")[:255],
        })
    return rows


def transform_quotation_data(sp_items):
    """Transform SharePoint Quotation items to Power BI schema"""
    rows = []
    for item in sp_items:
        rows.append({
            "QuotationID": item.get("QuotationID", "")[:255],
            "Status": item.get("Status", "")[:255],
            "ValueUSD": float(item.get("ValueUSD", 0) or 0),
            "ClientName": item.get("ClientName", "")[:255],
            "Entity": item.get("Entity", "")[:255],
            "Discipline": item.get("Discipline", "")[:255],
            "CreatedDate": None,
        })
    return rows


def transform_supplier_data(sp_items):
    """Transform SharePoint Supplier items to Power BI schema"""
    rows = []
    for item in sp_items:
        rows.append({
            "SupplierName": item.get("SupplierName", "")[:255],
            "POCount": int(item.get("POCount", 0) or 0),
            "TotalSpendUSD": float(item.get("TotalSpendUSD", 0) or 0),
            "Entity": item.get("Entity", "")[:255] if item.get("Entity") else "",
            "Discipline": item.get("Discipline", "")[:255] if item.get("Discipline") else "",
        })
    return rows


def transform_entity_data(sp_items):
    """Transform SharePoint Entity items to Power BI schema"""
    rows = []
    for item in sp_items:
        rows.append({
            "EntityCode": item.get("EntityCode", "")[:255],
            "EntityName": item.get("EntityName", "")[:255],
            "Region": item.get("Region", "")[:255] if item.get("Region") else "",
            "Country": item.get("Country", "")[:255] if item.get("Country") else "",
        })
    return rows


def transform_discipline_data(sp_items):
    """Transform SharePoint Discipline items to Power BI schema"""
    rows = []
    for item in sp_items:
        rows.append({
            "DisciplineCode": item.get("DisciplineCode", "")[:255],
            "DisciplineName": item.get("DisciplineName", "")[:255],
            "Category": item.get("Category", "")[:255] if item.get("Category") else "",
        })
    return rows


def transform_summary_data(sp_items):
    """Transform SharePoint Summary items to Power BI schema"""
    rows = []
    for item in sp_items:
        rows.append({
            "MetricName": item.get("MetricName", "")[:255],
            "MetricValue": float(item.get("MetricValue", 0) or 0),
            "MetricText": item.get("MetricText", "")[:255] if item.get("MetricText") else "",
            "Dashboard": item.get("Dashboard", "")[:255],
            "AsOfDate": None,
        })
    return rows


def transform_spend_data(sp_items):
    """Transform SharePoint SpendByMonth items to Power BI schema"""
    rows = []
    for item in sp_items:
        rows.append({
            "YearMonth": item.get("YearMonth", "")[:255],
            "Year": int(item.get("Year", 0) or 0),
            "Month": int(item.get("Month", 0) or 0),
            "TotalSpendUSD": float(item.get("TotalSpendUSD", 0) or 0),
            "POCount": int(item.get("POCount", 0) or 0),
            "Entity": item.get("Entity", "")[:255] if item.get("Entity") else "",
        })
    return rows


def main():
    print("=" * 70)
    print("  PUSHING SHAREPOINT DATA TO POWER BI")
    print("=" * 70)
    
    # Get tokens
    graph_token = get_graph_token()
    pbi_token = get_pbi_token()
    
    if not graph_token or not pbi_token:
        print("❌ Failed to get tokens")
        return
    
    print("✅ Authenticated to both APIs")
    
    graph_headers = {"Authorization": f"Bearer {graph_token}"}
    pbi_headers = {"Authorization": f"Bearer {pbi_token}", "Content-Type": "application/json"}
    
    # Clear existing data first
    print("\n🗑️  Clearing existing Power BI data...")
    tables = ["PurchaseOrders", "Quotations", "Suppliers", "Entities", "Disciplines", "Summary", "SpendByMonth"]
    for table in tables:
        url = f"{PBI_BASE}/groups/{WORKSPACE_ID}/datasets/{DATASET_ID}/tables/{table}/rows"
        resp = requests.delete(url, headers=pbi_headers)
        status = "✅" if resp.status_code == 200 else f"⚠️ {resp.status_code}"
        print(f"   {status} Cleared {table}")
    
    # Mapping of SharePoint lists to Power BI tables
    mappings = [
        ("MT_PurchaseOrders", "PurchaseOrders", transform_po_data),
        ("MT_Quotations", "Quotations", transform_quotation_data),
        ("MT_Suppliers", "Suppliers", transform_supplier_data),
        ("MT_Entities", "Entities", transform_entity_data),
        ("MT_Disciplines", "Disciplines", transform_discipline_data),
        ("MT_Summary", "Summary", transform_summary_data),
        ("MT_SpendByMonth", "SpendByMonth", transform_spend_data),
    ]
    
    print("\n📊 Loading and pushing data...")
    
    total_pushed = 0
    
    for sp_list, pbi_table, transform_fn in mappings:
        print(f"\n   📋 {sp_list} → {pbi_table}")
        
        # Fetch from SharePoint
        print(f"      Fetching from SharePoint...")
        sp_items = get_sharepoint_list_data(graph_headers, sp_list)
        print(f"      Got {len(sp_items)} items")
        
        if not sp_items:
            continue
        
        # Transform
        rows = transform_fn(sp_items)
        
        # Push to Power BI
        print(f"      Pushing to Power BI...")
        pushed = push_to_powerbi(pbi_headers, pbi_table, rows)
        print(f"      ✅ Pushed {pushed} rows")
        
        total_pushed += pushed
    
    print("\n" + "=" * 70)
    print(f"  COMPLETE: Pushed {total_pushed} total rows to Power BI")
    print("=" * 70)
    
    print(f"\n🔗 View workspace: https://app.powerbigov.us/groups/{WORKSPACE_ID}")
    print(f"📊 Dataset ID: {DATASET_ID}")


if __name__ == "__main__":
    main()
