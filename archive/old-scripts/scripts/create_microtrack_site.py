"""
Create Microtrack SharePoint Site and Lists
Using existing Azure AD App: MVL-SupplyIntelHub-Integration
"""
from msal import ConfidentialClientApplication
import requests
import json

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
    return app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"]).get("access_token")

def main():
    print("=" * 70)
    print("  Creating Microtrack SharePoint Site")
    print("=" * 70)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Step 1: Create a Microsoft 365 Group (which creates a SharePoint site)
    print("\n📁 Step 1: Creating M365 Group 'Microtrack'...")
    
    group_data = {
        "displayName": "Microtrack",
        "description": "Microtrack Data Hub - Supply Chain Intelligence Platform",
        "mailEnabled": True,
        "mailNickname": "microtrack",
        "securityEnabled": False,
        "groupTypes": ["Unified"],
        "visibility": "Private"
    }
    
    # Check if group already exists
    check_url = "https://graph.microsoft.com/v1.0/groups?$filter=displayName eq 'Microtrack'"
    resp = requests.get(check_url, headers=headers)
    
    existing_groups = resp.json().get("value", [])
    
    if existing_groups:
        group = existing_groups[0]
        group_id = group["id"]
        print(f"   ℹ️ Group already exists: {group_id}")
    else:
        create_url = "https://graph.microsoft.com/v1.0/groups"
        resp = requests.post(create_url, headers=headers, json=group_data)
        
        if resp.status_code == 201:
            group = resp.json()
            group_id = group["id"]
            print(f"   ✅ Created group: {group_id}")
        else:
            print(f"   ❌ Failed: {resp.status_code}")
            print(f"   Error: {resp.text[:200]}")
            return
    
    # Wait for SharePoint site provisioning
    print("\n⏳ Waiting for SharePoint site provisioning...")
    import time
    
    site_url = None
    for attempt in range(10):
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
            print(f"   ... attempt {attempt + 1}/10")
    
    if not site_url:
        print("   ⚠️ Site not ready yet. It may take a few minutes.")
        print("   Check: https://mvlgroupusa.sharepoint.com/sites/microtrack")
        return
    
    # Step 2: Create SharePoint Lists
    print("\n📋 Step 2: Creating SharePoint Lists...")
    
    lists_to_create = [
        {
            "name": "MT_Suppliers",
            "description": "Supplier master data and spend summary",
            "columns": [
                {"name": "SupplierName", "type": "text"},
                {"name": "POCount", "type": "number"},
                {"name": "TotalSpendUSD", "type": "number"},
                {"name": "Entity", "type": "text"},
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
            "name": "MT_Summary",
            "description": "Aggregated KPIs for dashboards",
            "columns": [
                {"name": "MetricName", "type": "text"},
                {"name": "MetricValue", "type": "number"},
                {"name": "Dashboard", "type": "choice", "choices": ["SupplierMarketplace", "GlobalSpend", "Disciplines"]},
                {"name": "AsOfDate", "type": "dateTime"},
            ]
        },
    ]
    
    for list_def in lists_to_create:
        print(f"\n   Creating list: {list_def['name']}...")
        
        # Create the list
        list_data = {
            "displayName": list_def["name"],
            "description": list_def["description"],
            "list": {
                "template": "genericList"
            }
        }
        
        create_list_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists"
        resp = requests.post(create_list_url, headers=headers, json=list_data)
        
        if resp.status_code == 201:
            new_list = resp.json()
            list_id = new_list["id"]
            print(f"   ✅ List created: {list_def['name']}")
            
            # Add columns
            for col in list_def["columns"]:
                col_data = create_column_definition(col)
                col_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists/{list_id}/columns"
                col_resp = requests.post(col_url, headers=headers, json=col_data)
                
                if col_resp.status_code == 201:
                    print(f"      ✅ Column: {col['name']}")
                else:
                    print(f"      ⚠️ Column {col['name']}: {col_resp.status_code}")
                    
        elif resp.status_code == 409:
            print(f"   ℹ️ List already exists: {list_def['name']}")
        else:
            print(f"   ❌ Failed: {resp.status_code} - {resp.text[:100]}")
    
    # Summary
    print("\n" + "=" * 70)
    print("  ✅ Microtrack SharePoint Setup Complete!")
    print("=" * 70)
    print(f"\n  📍 Site URL: {site_url}")
    print(f"  📋 Lists Created: {len(lists_to_create)}")
    print("\n  Next Steps:")
    print("  1. Verify lists at the SharePoint site")
    print("  2. Configure Power BI connection")
    print("  3. Add PHP code to Microtrack for data sync")
    print("=" * 70)


def create_column_definition(col):
    """Create column definition based on type"""
    base = {"name": col["name"], "description": f"{col['name']} column"}
    
    if col["type"] == "text":
        base["text"] = {"maxLength": 255}
    elif col["type"] == "number":
        base["number"] = {"decimalPlaces": "two"}
    elif col["type"] == "dateTime":
        base["dateTime"] = {"format": "dateTime"}
    elif col["type"] == "choice":
        base["choice"] = {"choices": col.get("choices", [])}
    
    return base


if __name__ == "__main__":
    main()
