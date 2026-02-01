"""Check and manage Friday Activity Dashboard pages"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

SITE_ID = "mvlgroupusa.sharepoint.com,146dbf8a-155c-457c-88b2-5a34dcb0e1e2,e958e24c-db93-4a6a-a648-c3002cdf1e20"

def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"]).get("access_token")

def main():
    print("=" * 70)
    print("  Friday Activity Dashboard - Page Analysis")
    print("=" * 70)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Get all pages
    print("\n🔍 Finding all Friday Activity pages...")
    pages_url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/pages?$select=id,name,title,webUrl,createdDateTime,lastModifiedDateTime"
    resp = requests.get(pages_url, headers=headers)
    
    friday_pages = []
    
    if resp.status_code == 200:
        pages = resp.json().get("value", [])
        for p in pages:
            if "friday" in p.get("name", "").lower():
                friday_pages.append(p)
    
    if not friday_pages:
        print("   No Friday Activity pages found")
        return
    
    print(f"\n📄 Found {len(friday_pages)} Friday Activity pages:\n")
    
    for i, page in enumerate(friday_pages, 1):
        print(f"   {i}. {page.get('name')}")
        print(f"      Title: {page.get('title')}")
        print(f"      ID: {page.get('id')}")
        print(f"      Created: {page.get('createdDateTime', 'N/A')[:10]}")
        print(f"      Modified: {page.get('lastModifiedDateTime', 'N/A')[:10]}")
        print(f"      URL: {page.get('webUrl', 'N/A')}")
        print()
    
    # Identify the duplicate (the one with "(1)")
    original = None
    duplicate = None
    
    for page in friday_pages:
        name = page.get("name", "")
        if "(1)" in name:
            duplicate = page
        else:
            original = page
    
    print("=" * 70)
    print("  Analysis")
    print("=" * 70)
    
    if original and duplicate:
        print(f"\n   📄 Original:  {original.get('name')}")
        print(f"      Modified:  {original.get('lastModifiedDateTime', 'N/A')[:19]}")
        print(f"\n   📄 Duplicate: {duplicate.get('name')}")
        print(f"      Modified:  {duplicate.get('lastModifiedDateTime', 'N/A')[:19]}")
        
        # Compare modification dates
        orig_date = original.get('lastModifiedDateTime', '')
        dup_date = duplicate.get('lastModifiedDateTime', '')
        
        if dup_date > orig_date:
            print(f"\n   ⚠️  The (1) version is NEWER - it may have more recent content!")
            print(f"       You may want to keep it or merge changes.")
        else:
            print(f"\n   ✅ The original is newer or same - safe to delete duplicate.")
        
        print(f"\n   🗑️  To delete the duplicate '{duplicate.get('name')}':")
        print(f"       Page ID: {duplicate.get('id')}")
        
        # Ask if user wants to delete
        print("\n" + "=" * 70)
        print("  DELETE DUPLICATE?")
        print("=" * 70)
        print(f"\n   Run this command to delete '{duplicate.get('name')}':")
        print(f"\n   .venv\\Scripts\\python.exe scripts\\delete_page.py {duplicate.get('id')}")
        
    elif len(friday_pages) == 1:
        print(f"\n   ✅ Only one page exists: {friday_pages[0].get('name')}")
        print(f"       No cleanup needed.")
    else:
        print(f"\n   ℹ️  Could not clearly identify original vs duplicate.")
        print(f"       Please review manually.")

if __name__ == "__main__":
    main()
