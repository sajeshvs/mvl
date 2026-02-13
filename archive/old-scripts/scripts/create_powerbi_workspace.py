"""
Create Power BI Workspace and Datasets for MVL Supply Intelligence Hub
========================================================================

This script:
1. Creates a Power BI workspace
2. Creates datasets connected to SharePoint lists
3. Creates reports/dashboards based on v3 HTML designs
"""
from msal import ConfidentialClientApplication
import requests
import json
import time

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

# Power BI GCC 
PBI_SCOPE = "https://analysis.usgovcloudapi.net/powerbi/api/.default"
PBI_BASE = "https://api.powerbigov.us/v1.0/myorg"

# SharePoint data source
SHAREPOINT_SITE = "https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi"


def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    result = app.acquire_token_for_client(scopes=[PBI_SCOPE])
    return result.get("access_token")


def create_workspace(headers, name):
    """Create a new Power BI workspace"""
    print(f"\n📁 Creating workspace: {name}")
    
    url = f"{PBI_BASE}/groups"
    payload = {"name": name}
    
    resp = requests.post(url, headers=headers, json=payload)
    
    if resp.status_code == 200:
        ws = resp.json()
        print(f"   ✅ Created: {ws.get('id')}")
        return ws
    elif resp.status_code == 409:
        print(f"   ℹ️ Workspace already exists, finding it...")
        # Find existing
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            for ws in resp.json().get("value", []):
                if ws["name"] == name:
                    print(f"   ✅ Found: {ws['id']}")
                    return ws
    else:
        print(f"   ❌ Failed: {resp.status_code}")
        print(f"   {resp.text[:300]}")
    
    return None


def create_push_dataset(headers, workspace_id, name, tables):
    """Create a push dataset with defined schema"""
    print(f"\n📊 Creating dataset: {name}")
    
    url = f"{PBI_BASE}/groups/{workspace_id}/datasets"
    
    payload = {
        "name": name,
        "defaultMode": "Push",
        "tables": tables
    }
    
    resp = requests.post(url, headers=headers, json=payload)
    
    if resp.status_code in [200, 201]:
        ds = resp.json()
        print(f"   ✅ Created dataset: {ds.get('id')}")
        return ds
    elif resp.status_code == 409:
        print(f"   ℹ️ Dataset already exists")
        # Find existing
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            for ds in resp.json().get("value", []):
                if ds["name"] == name:
                    return ds
    else:
        print(f"   ❌ Failed: {resp.status_code}")
        print(f"   {resp.text[:300]}")
    
    return None


def main():
    print("=" * 70)
    print("  MVL SUPPLY INTELLIGENCE HUB - POWER BI SETUP")
    print("=" * 70)
    
    token = get_token()
    if not token:
        print("❌ Failed to get access token")
        return
    
    print("✅ Authenticated to Power BI API")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 1: Create workspace
    workspace = create_workspace(headers, "MVL Supply Intelligence Hub")
    
    if not workspace:
        print("\n⚠️ Could not create/find workspace.")
        print("   The service principal may need to be granted access.")
        print("\n📋 Manual Steps Required:")
        print("   1. Log into Power BI (app.powerbigov.us)")
        print("   2. Create workspace 'MVL Supply Intelligence Hub'")
        print("   3. Go to Workspace Settings → Access")
        print("   4. Add app: MVL-SupplyIntelHub-Integration as Admin")
        print("   5. Re-run this script")
        return
    
    workspace_id = workspace["id"]
    print(f"\n✅ Workspace ID: {workspace_id}")
    
    # Step 2: Define dataset schemas matching SharePoint lists
    print("\n" + "=" * 70)
    print("  CREATING DATASETS")
    print("=" * 70)
    
    # Dataset tables matching our SharePoint lists
    supply_intel_tables = [
        {
            "name": "PurchaseOrders",
            "columns": [
                {"name": "POID", "dataType": "String"},
                {"name": "SupplierName", "dataType": "String"},
                {"name": "ValueUSD", "dataType": "Double"},
                {"name": "Entity", "dataType": "String"},
                {"name": "MaterialGroup", "dataType": "String"},
                {"name": "Discipline", "dataType": "String"},
                {"name": "PODate", "dataType": "DateTime"},
                {"name": "Status", "dataType": "String"},
            ]
        },
        {
            "name": "Quotations",
            "columns": [
                {"name": "QuotationID", "dataType": "String"},
                {"name": "Status", "dataType": "String"},
                {"name": "ValueUSD", "dataType": "Double"},
                {"name": "ClientName", "dataType": "String"},
                {"name": "Entity", "dataType": "String"},
                {"name": "Discipline", "dataType": "String"},
                {"name": "CreatedDate", "dataType": "DateTime"},
            ]
        },
        {
            "name": "Suppliers",
            "columns": [
                {"name": "SupplierName", "dataType": "String"},
                {"name": "POCount", "dataType": "Int64"},
                {"name": "TotalSpendUSD", "dataType": "Double"},
                {"name": "Entity", "dataType": "String"},
                {"name": "Discipline", "dataType": "String"},
            ]
        },
        {
            "name": "Entities",
            "columns": [
                {"name": "EntityCode", "dataType": "String"},
                {"name": "EntityName", "dataType": "String"},
                {"name": "Region", "dataType": "String"},
                {"name": "Country", "dataType": "String"},
            ]
        },
        {
            "name": "Disciplines",
            "columns": [
                {"name": "DisciplineCode", "dataType": "String"},
                {"name": "DisciplineName", "dataType": "String"},
                {"name": "Category", "dataType": "String"},
            ]
        },
        {
            "name": "Summary",
            "columns": [
                {"name": "MetricName", "dataType": "String"},
                {"name": "MetricValue", "dataType": "Double"},
                {"name": "MetricText", "dataType": "String"},
                {"name": "Dashboard", "dataType": "String"},
                {"name": "AsOfDate", "dataType": "DateTime"},
            ]
        },
        {
            "name": "SpendByMonth",
            "columns": [
                {"name": "YearMonth", "dataType": "String"},
                {"name": "Year", "dataType": "Int64"},
                {"name": "Month", "dataType": "Int64"},
                {"name": "TotalSpendUSD", "dataType": "Double"},
                {"name": "POCount", "dataType": "Int64"},
                {"name": "Entity", "dataType": "String"},
            ]
        },
    ]
    
    dataset = create_push_dataset(
        headers, 
        workspace_id, 
        "MVL-SupplyIntelHub-Data",
        supply_intel_tables
    )
    
    if dataset:
        dataset_id = dataset.get("id")
        print(f"\n✅ Dataset created: {dataset_id}")
        
        # Save workspace and dataset info
        info = {
            "workspace_id": workspace_id,
            "workspace_name": "MVL Supply Intelligence Hub",
            "dataset_id": dataset_id,
            "dataset_name": "MVL-SupplyIntelHub-Data",
            "tables": [t["name"] for t in supply_intel_tables],
            "sharepoint_site": SHAREPOINT_SITE,
        }
        
        with open("scripts/powerbi_workspace_info.json", "w") as f:
            json.dump(info, f, indent=2)
        
        print(f"\n📝 Saved workspace info to powerbi_workspace_info.json")
    
    print("\n" + "=" * 70)
    print("  NEXT STEPS")
    print("=" * 70)
    print("""
1. Open Power BI Desktop
2. Connect to SharePoint Online List
3. URL: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi
4. Select all MT_* lists
5. Create relationships between tables
6. Build visuals matching v3 HTML designs
7. Publish to 'MVL Supply Intelligence Hub' workspace
""")


if __name__ == "__main__":
    main()
