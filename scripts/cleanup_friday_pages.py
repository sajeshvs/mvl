"""
Delete old page and rename the (1) version to clean URL
"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

SITE_ID = "mvlgroupusa.sharepoint.com,146dbf8a-155c-457c-88b2-5a34dcb0e1e2,e958e24c-db93-4a6a-a648-c3002cdf1e20"

# Page IDs from our analysis
OLD_PAGE_ID = "b8f3e2db-a239-4861-9588-627265ecc8e1"  # Friday-Activity-Dashboard.aspx (old)
NEW_PAGE_ID = "c4c03797-44e9-488e-89b1-89bd1313b2ad"  # Friday-Activity-Dashboard(1).aspx (newer)

def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"]).get("access_token")

def main():
    print("=" * 70)
    print("  Cleanup Friday Activity Dashboard Pages")
    print("=" * 70)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Step 1: Delete the old page
    print("\n🗑️  Step 1: Deleting old page (Friday-Activity-Dashboard.aspx)...")
    delete_url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/pages/{OLD_PAGE_ID}"
    resp = requests.delete(delete_url, headers=headers)
    
    if resp.status_code == 204:
        print("   ✅ Old page deleted successfully!")
    elif resp.status_code == 404:
        print("   ℹ️ Old page already deleted or not found")
    else:
        print(f"   ❌ Failed to delete: {resp.status_code}")
        print(f"   Error: {resp.text[:200]}")
    
    # Step 2: Rename the (1) page to remove suffix
    print("\n📝 Step 2: Renaming page to remove (1) suffix...")
    
    # Get the current page details first
    get_url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/pages/{NEW_PAGE_ID}"
    resp = requests.get(get_url, headers=headers)
    
    if resp.status_code == 200:
        page = resp.json()
        print(f"   Current name: {page.get('name')}")
        
        # Try to update the page name
        update_data = {
            "name": "Friday-Activity-Dashboard.aspx",
            "title": "Friday Activity Dashboard"
        }
        
        resp = requests.patch(get_url, headers=headers, json=update_data)
        
        if resp.status_code == 200:
            print("   ✅ Page renamed successfully!")
            print("   New URL: https://mvlgroupusa.sharepoint.com/sites/MVLITAdmin/SitePages/Friday-Activity-Dashboard.aspx")
        else:
            print(f"   ⚠️ Rename via API returned: {resp.status_code}")
            error = resp.json().get("error", {})
            print(f"   Message: {error.get('message', resp.text[:100])}")
            
            # If API rename fails, provide manual instructions
            print("\n   📋 Manual rename steps:")
            print("   1. Go to: https://mvlgroupusa.sharepoint.com/sites/MVLITAdmin/SitePages")
            print("   2. Find 'Friday-Activity-Dashboard(1).aspx'")
            print("   3. Click '...' → 'Rename'")
            print("   4. Change to 'Friday-Activity-Dashboard'")
            print("   5. Click 'Rename'")
    else:
        print(f"   ❌ Could not get page: {resp.status_code}")
    
    # Step 3: Verify final state
    print("\n🔍 Step 3: Verifying final state...")
    pages_url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/pages?$filter=startswith(name,'Friday')"
    resp = requests.get(pages_url, headers=headers)
    
    if resp.status_code == 200:
        pages = resp.json().get("value", [])
        print(f"\n   Remaining Friday pages: {len(pages)}")
        for p in pages:
            print(f"   • {p.get('name')} - {p.get('webUrl')}")
    
    print("\n" + "=" * 70)
    print("  Complete!")
    print("=" * 70)

if __name__ == "__main__":
    main()
