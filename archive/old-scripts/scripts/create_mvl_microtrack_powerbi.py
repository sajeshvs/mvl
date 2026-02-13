"""
Create MVL-MicroTrack-PowerBI SharePoint Site and Lists
"""
from msal import ConfidentialClientApplication
import requests
import time

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

SITE_NAME = "MVL-MicroTrack-PowerBI"
SITE_DESCRIPTION = "MVL MicroTrack Power BI Data Hub - Supply Chain Intelligence"

def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"]).get("access_token")

def create_column_definition(col):
    """Create column definition based on type"""
    base = {"name": col["name"]}
    
    if col["type"] == "text":
        base["text"] = {"maxLength": 255}
    elif col["type"] == "number":
        base["number"] = {"decimalPlaces": "two"}
    elif col["type"] == "dateTime":
        base["dateTime"] = {"format": "dateTime"}
    elif col["type"] == "choice":
        base["choice"] = {"choices": col.get("choices", [])}
    
    return base

def main():
    print("=" * 70)
    print(f"  Creating SharePoint Site: {SITE_NAME}")
    print("=" * 70)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Step 1: Create M365 Group
    print(f"\n📁 Step 1: Creating M365 Group '{SITE_NAME}'...")
    
    group_data = {
        "displayName": SITE_NAME,
        "description": SITE_DESCRIPTION,
        "mailEnabled": True,
        "mailNickname": "mvlmicrotrackpowerbi",
        "securityEnabled": False,
        "groupTypes": ["Unified"],
        "visibility": "Private"
    }
    
    create_url = "https://graph.microsoft.com/v1.0/groups"
    resp = requests.post(create_url, headers=headers, json=group_data)
    
    if resp.status_code == 201:
        group = resp.json()
        group_id = group["id"]
        print(f"   ✅ Created group: {group_id}")
    elif resp.status_code == 400 and "already exists" in resp.text.lower():
        print(f"   ℹ️ Group already exists, finding it...")
        check_url = f"https://graph.microsoft.com/v1.0/groups?$filter=displayName eq '{SITE_NAME}'"
        resp = requests.get(check_url, headers=headers)
        groups = resp.json().get("value", [])
        if groups:
            group_id = groups[0]["id"]
            print(f"   ✅ Found existing group: {group_id}")
        else:
            print("   ❌ Could not find group")
            return
    else:
        print(f"   ❌ Failed: {resp.status_code}")
        print(f"   Error: {resp.text[:300]}")
        return
    
    # Step 2: Wait for SharePoint site provisioning
    print("\n⏳ Step 2: Waiting for SharePoint site provisioning...")
    
    site_id = None
    site_url = None
    
    for attempt in range(15):
        time.sleep(3)
        site_check = f"https://graph.microsoft.com/v1.0/groups/{group_id}/sites/root"
        resp = requests.get(site_check, headers=headers)
        
        if resp.status_code == 200:
            site = resp.json()
            site_url = site.get("webUrl")
            site_id = site.get("id")
            print(f"   ✅ Site ready: {site_url}")
            break
        else:
            print(f"   ... waiting ({attempt + 1}/15)")
    
    if not site_id:
        print("   ⚠️ Site not ready yet. Please wait a few minutes and run again.")
        return
    
    # Step 3: Create SharePoint Lists
    print("\n📋 Step 3: Creating SharePoint Lists...")
    
    lists_to_create = [
        {
            "name": "MT_Suppliers",
            "description": "Supplier master data and spend summary",
            "columns": [
                {"name": "SupplierName", "type": "text"},
                {"name": "POCount", "type": "number"},
                {"name": "TotalSpendUSD", "type": "number"},
                {"name": "Entity", "type": "text"},
                {"name": "Discipline", "type": "text"},
                {"name": "LastUpdated", "type": "dateTime"},
            ]
        },
        {
            "name": "MT_Quotations",
            "description": "Quotation transactions",
            "columns": [
                {"name": "QuotationID", "type": "text"},
                {"name": "Status", "type": "choice", "choices": ["Quotation", "Waiting", "Order", "Cancelled"]},
                {"name": "ValueUSD", "type": "number"},
                {"name": "ClientName", "type": "text"},
                {"name": "Entity", "type": "text"},
                {"name": "Discipline", "type": "text"},
                {"name": "CreatedDate", "type": "dateTime"},
            ]
        },
        {
            "name": "MT_PurchaseOrders",
            "description": "Purchase order transactions",
            "columns": [
                {"name": "POID", "type": "text"},
                {"name": "SupplierName", "type": "text"},
                {"name": "ValueUSD", "type": "number"},
                {"name": "Entity", "type": "text"},
                {"name": "Discipline", "type": "text"},
                {"name": "MaterialGroup", "type": "text"},
                {"name": "PODate", "type": "dateTime"},
                {"name": "Status", "type": "choice", "choices": ["Open", "Closed", "Cancelled"]},
            ]
        },
        {
            "name": "MT_Entities",
            "description": "Entity/Region master data",
            "columns": [
                {"name": "EntityCode", "type": "text"},
                {"name": "EntityName", "type": "text"},
                {"name": "Region", "type": "text"},
                {"name": "Country", "type": "text"},
            ]
        },
        {
            "name": "MT_Disciplines",
            "description": "Discipline master data",
            "columns": [
                {"name": "DisciplineCode", "type": "text"},
                {"name": "DisciplineName", "type": "text"},
                {"name": "Category", "type": "text"},
            ]
        },
        {
            "name": "MT_MaterialGroups",
            "description": "Material group master data",
            "columns": [
                {"name": "MaterialCode", "type": "text"},
                {"name": "MaterialName", "type": "text"},
                {"name": "Discipline", "type": "text"},
                {"name": "Category", "type": "text"},
            ]
        },
        {
            "name": "MT_Summary",
            "description": "Aggregated KPIs for dashboards",
            "columns": [
                {"name": "MetricName", "type": "text"},
                {"name": "MetricValue", "type": "number"},
                {"name": "MetricText", "type": "text"},
                {"name": "Dashboard", "type": "choice", "choices": ["SupplierMarketplace", "GlobalSpend", "Disciplines", "All"]},
                {"name": "AsOfDate", "type": "dateTime"},
            ]
        },
        {
            "name": "MT_SpendByMonth",
            "description": "Monthly spend trend data",
            "columns": [
                {"name": "YearMonth", "type": "text"},
                {"name": "Year", "type": "number"},
                {"name": "Month", "type": "number"},
                {"name": "TotalSpendUSD", "type": "number"},
                {"name": "POCount", "type": "number"},
                {"name": "Entity", "type": "text"},
                {"name": "Discipline", "type": "text"},
            ]
        },
    ]
    
    for list_def in lists_to_create:
        print(f"\n   📋 Creating: {list_def['name']}...")
        
        list_data = {
            "displayName": list_def["name"],
            "description": list_def["description"],
            "list": {"template": "genericList"}
        }
        
        create_list_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists"
        resp = requests.post(create_list_url, headers=headers, json=list_data)
        
        if resp.status_code == 201:
            new_list = resp.json()
            list_id = new_list["id"]
            print(f"      ✅ List created")
            
            # Add columns
            for col in list_def["columns"]:
                col_data = create_column_definition(col)
                col_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists/{list_id}/columns"
                col_resp = requests.post(col_url, headers=headers, json=col_data)
                
                if col_resp.status_code == 201:
                    print(f"      + {col['name']}")
                else:
                    print(f"      ⚠️ {col['name']}: {col_resp.status_code}")
                    
        elif resp.status_code == 409 or "already exists" in resp.text.lower():
            print(f"      ℹ️ Already exists")
        else:
            print(f"      ❌ Failed: {resp.status_code}")
    
    # Summary
    print("\n" + "=" * 70)
    print("  ✅ MVL-MicroTrack-PowerBI Setup Complete!")
    print("=" * 70)
    print(f"\n  📍 SharePoint Site: {site_url}")
    print(f"  📋 Lists Created: {len(lists_to_create)}")
    print(f"  🔗 Group ID: {group_id}")
    print(f"  🔗 Site ID: {site_id}")
    print("\n  📋 Lists:")
    for l in lists_to_create:
        print(f"      • {l['name']}")
    print("\n" + "=" * 70)
    
    # Save site info for later use
    with open("scripts/microtrack_site_info.txt", "w") as f:
        f.write(f"Site Name: {SITE_NAME}\n")
        f.write(f"Site URL: {site_url}\n")
        f.write(f"Site ID: {site_id}\n")
        f.write(f"Group ID: {group_id}\n")
    print("  💾 Site info saved to scripts/microtrack_site_info.txt")


if __name__ == "__main__":
    main()
