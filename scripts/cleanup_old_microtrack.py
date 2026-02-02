"""
Clean up lists from the old Microtrack group (created by accident)
"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

# Old Microtrack group that already existed
OLD_GROUP_ID = "f57a920d-914f-4a91-ba30-56c1a7d8255b"

def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"]).get("access_token")

def main():
    print("=" * 60)
    print("  Cleaning up old Microtrack lists")
    print("=" * 60)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Get the site
    print("\n🔍 Finding old Microtrack site...")
    site_url = f"https://graph.microsoft.com/v1.0/groups/{OLD_GROUP_ID}/sites/root"
    resp = requests.get(site_url, headers=headers)
    
    if resp.status_code != 200:
        print(f"   ❌ Could not find site: {resp.status_code}")
        return
    
    site = resp.json()
    site_id = site["id"]
    print(f"   ✅ Found: {site.get('webUrl')}")
    
    # Get all lists
    print("\n📋 Finding MT_ lists to delete...")
    lists_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists"
    resp = requests.get(lists_url, headers=headers)
    
    if resp.status_code != 200:
        print(f"   ❌ Could not get lists: {resp.status_code}")
        return
    
    all_lists = resp.json().get("value", [])
    mt_lists = [l for l in all_lists if l.get("displayName", "").startswith("MT_")]
    
    if not mt_lists:
        print("   ✅ No MT_ lists found - already clean!")
        return
    
    print(f"   Found {len(mt_lists)} lists to delete:")
    for l in mt_lists:
        print(f"      • {l.get('displayName')}")
    
    # Delete each list
    print("\n🗑️  Deleting lists...")
    for l in mt_lists:
        list_id = l["id"]
        list_name = l["displayName"]
        
        delete_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists/{list_id}"
        resp = requests.delete(delete_url, headers=headers)
        
        if resp.status_code == 204:
            print(f"   ✅ Deleted: {list_name}")
        else:
            print(f"   ❌ Failed to delete {list_name}: {resp.status_code}")
    
    print("\n" + "=" * 60)
    print("  ✅ Cleanup Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
