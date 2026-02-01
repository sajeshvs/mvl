"""
Grant SharePoint Access via Site Groups or Direct Sharing
Site: https://mvlgroupusa.sharepoint.com/sites/MVLITAdmin
"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

SITE_ID = "mvlgroupusa.sharepoint.com,146dbf8a-155c-457c-88b2-5a34dcb0e1e2,e958e24c-db93-4a6a-a648-c3002cdf1e20"

USERS = [
    {"name": "Hani Khawaja", "email": "Hani.Khawaja@mvl-group.com", "id": "a7730666-d68a-472f-8f18-3cbec98b0dfc"},
    {"name": "Rita Jamal", "email": "rita.jamal@mvl-group.com", "id": "5acb8233-d1a1-4c55-abee-805556e9bf25"},
    {"name": "Abie Musa", "email": "abie.musa@mvl-group.com", "id": "70516f11-f56f-4d64-be84-614548824bfa"},
    {"name": "Sajesh Sukumaran", "email": "Sajesh.Sukumaran@mvl-group.com", "id": "5a278777-1033-401e-b755-8d129db9c559"},
]

def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"]).get("access_token")

def main():
    print("=" * 60)
    print("  Exploring SharePoint Access Options")
    print("=" * 60)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # 1. Check if there's an associated M365 Group
    print("\n🔍 Checking for associated M365 Group...")
    
    # Search for MVLITAdmin group
    groups_url = "https://graph.microsoft.com/v1.0/groups?$filter=startswith(displayName,'MVL IT')&$select=id,displayName,mail,groupTypes"
    resp = requests.get(groups_url, headers=headers)
    
    if resp.status_code == 200:
        groups = resp.json().get("value", [])
        print(f"   Found {len(groups)} related groups:")
        for g in groups:
            print(f"   • {g.get('displayName')} - {g.get('id')[:20]}...")
            print(f"     Types: {g.get('groupTypes', [])}")
    
    # 2. Try to find SharePoint site's associated group
    print("\n🔍 Checking site for associated group...")
    site_url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}?$select=id,displayName,webUrl"
    resp = requests.get(site_url, headers=headers)
    if resp.status_code == 200:
        site = resp.json()
        print(f"   Site: {site.get('displayName')}")
    
    # 3. Check site drives/lists for the Friday Activity page
    print("\n📄 Looking for the Friday Activity Dashboard page...")
    pages_url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/pages"
    resp = requests.get(pages_url, headers=headers)
    if resp.status_code == 200:
        pages = resp.json().get("value", [])
        for p in pages:
            if "friday" in p.get("name", "").lower() or "friday" in p.get("title", "").lower():
                print(f"   ✅ Found: {p.get('name')} - {p.get('title')}")
                print(f"      ID: {p.get('id')}")
    else:
        print(f"   Pages API: {resp.status_code}")
    
    # 4. Alternative: Create a Security Group and add users
    print("\n" + "=" * 60)
    print("  RECOMMENDED: Create Security Group for Dashboard Access")
    print("=" * 60)
    
    group_name = "Friday Activity Dashboard - Viewers"
    
    print(f"\n📋 Creating security group: '{group_name}'...")
    
    group_data = {
        "displayName": group_name,
        "description": "Users with read access to the Friday Activity Dashboard",
        "mailEnabled": False,
        "mailNickname": "FridayActivityViewers",
        "securityEnabled": True
    }
    
    create_url = "https://graph.microsoft.com/v1.0/groups"
    resp = requests.post(create_url, headers=headers, json=group_data)
    
    if resp.status_code == 201:
        group = resp.json()
        group_id = group["id"]
        print(f"   ✅ Created group: {group_id}")
        
        # Add users to the group
        print("\n👥 Adding users to the group...")
        for user in USERS:
            member_url = f"https://graph.microsoft.com/v1.0/groups/{group_id}/members/$ref"
            member_data = {
                "@odata.id": f"https://graph.microsoft.com/v1.0/directoryObjects/{user['id']}"
            }
            resp = requests.post(member_url, headers=headers, json=member_data)
            if resp.status_code == 204:
                print(f"   ✅ Added: {user['name']}")
            elif resp.status_code == 400 and "already exist" in resp.text.lower():
                print(f"   ℹ️ Already member: {user['name']}")
            else:
                print(f"   ❌ Failed: {user['name']} - {resp.status_code}")
        
        print(f"\n✅ Security Group Created!")
        print(f"   Group Name: {group_name}")
        print(f"   Group ID: {group_id}")
        print(f"\n📝 NEXT STEP:")
        print(f"   Go to SharePoint site settings and add this group as 'Visitors'")
        print(f"   Or share the page directly with this group")
        
    elif resp.status_code == 400 and "already exists" in resp.text.lower():
        print(f"   ℹ️ Group may already exist, searching...")
        search_url = f"https://graph.microsoft.com/v1.0/groups?$filter=displayName eq '{group_name}'"
        resp = requests.get(search_url, headers=headers)
        if resp.status_code == 200:
            groups = resp.json().get("value", [])
            if groups:
                group_id = groups[0]["id"]
                print(f"   Found existing group: {group_id}")
    else:
        print(f"   ❌ Failed to create group: {resp.status_code}")
        print(f"   {resp.text[:200]}")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
