"""
Verify SharePoint data load - count items in all lists
"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

SITE_ID = "mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59"


def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"]).get("access_token")


def count_list_items(headers, list_id):
    """Count items in a list using pagination"""
    count = 0
    url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{list_id}/items?$top=5000"
    
    while url:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            count += len(data.get("value", []))
            url = data.get("@odata.nextLink")
        else:
            break
    
    return count


def main():
    print("=" * 60)
    print("  SHAREPOINT DATA VERIFICATION")
    print("=" * 60)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Get all lists
    url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists"
    resp = requests.get(url, headers=headers)
    
    if resp.status_code != 200:
        print(f"Error: {resp.status_code}")
        return
    
    lists = resp.json().get("value", [])
    mt_lists = [l for l in lists if l["displayName"].startswith("MT_")]
    
    print(f"\n📊 Site: MVL-MicroTrack-PowerBI")
    print(f"📋 Found {len(mt_lists)} MT_ lists\n")
    
    total_items = 0
    
    for lst in sorted(mt_lists, key=lambda x: x["displayName"]):
        count = count_list_items(headers, lst["id"])
        total_items += count
        print(f"   {lst['displayName']}: {count:,} items")
    
    print(f"\n{'=' * 40}")
    print(f"   TOTAL ITEMS: {total_items:,}")
    print(f"{'=' * 40}")
    
    print("\n📊 Expected from Microtrack JSON:")
    print("   - Quotations: 12,532")
    print("   - Purchase Orders: 3,539")
    print("   - Suppliers: 47")
    print("   - Entities: 28")
    print("   - Disciplines: 28")
    print("   - Material Groups: 14")
    print("   - Summary KPIs: 24")
    print("   - Spend by Month: 40")


if __name__ == "__main__":
    main()
