"""
Grant SharePoint Access to Friday Activity Dashboard
Site: https://mvlgroupusa.sharepoint.com/sites/MVLITAdmin
Users: Hani Khawaja, Rita Jamal, Abie Musa, Sajesh Sukumaran
"""
from msal import ConfidentialClientApplication
import requests

# Configuration
CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

# SharePoint site
SITE_URL = "mvlgroupusa.sharepoint.com:/sites/MVLITAdmin"

# Users to grant access
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
    result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    return result.get("access_token")

def main():
    print("=" * 60)
    print("  Grant Access to Friday Activity Dashboard")
    print("  Site: MVLITAdmin")
    print("=" * 60)
    
    token = get_token()
    if not token:
        print("❌ Failed to get token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get the site
    print("\n🔍 Finding SharePoint site...")
    site_url = f"https://graph.microsoft.com/v1.0/sites/{SITE_URL}"
    resp = requests.get(site_url, headers=headers)
    
    if resp.status_code != 200:
        print(f"❌ Failed to find site: {resp.status_code}")
        print(resp.text[:200])
        return
    
    site = resp.json()
    site_id = site["id"]
    print(f"✅ Found: {site.get('displayName', site.get('name'))}")
    print(f"   ID: {site_id}")
    print(f"   URL: {site.get('webUrl')}")
    
    # Get current permissions
    print("\n📋 Current site permissions:")
    perms_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/permissions"
    resp = requests.get(perms_url, headers=headers)
    if resp.status_code == 200:
        perms = resp.json().get("value", [])
        if perms:
            for p in perms[:5]:
                roles = p.get("roles", [])
                granted = p.get("grantedToIdentitiesV2", p.get("grantedToIdentities", []))
                for g in granted:
                    user = g.get("user", {}) or g.get("application", {})
                    print(f"   • {user.get('displayName', 'N/A')} - {roles}")
        else:
            print("   No explicit permissions found (may be inherited)")
    else:
        print(f"   Could not read permissions: {resp.status_code}")
    
    # Grant read access to each user using the correct API format
    print("\n🔐 Granting read access to users...")
    
    for user in USERS:
        print(f"\n   Adding {user['name']}...")
        
        # Try adding user to site members using Graph API
        # First, let's check if there's a site group we can add them to
        
        # Method 1: Use site permissions with correct format
        perm_data = {
            "roles": ["read"],
            "grantedToIdentitiesV2": [
                {
                    "user": {
                        "userPrincipalName": user["email"]
                    }
                }
            ]
        }
        
        create_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/permissions"
        resp = requests.post(create_url, headers=headers, json=perm_data)
        
        if resp.status_code in [200, 201]:
            print(f"   ✅ {user['name']} - Access granted!")
        elif resp.status_code == 409:
            print(f"   ℹ️ {user['name']} - Already has access")
        else:
            # Try alternative: invite user to site
            invite_data = {
                "roles": ["read"],
                "recipients": [
                    {"email": user["email"]}
                ],
                "message": "You have been granted access to the Friday Activity Dashboard",
                "sendInvitation": False
            }
            
            invite_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/permissions"
            resp2 = requests.post(invite_url, headers=headers, json=invite_data)
            
            if resp2.status_code in [200, 201]:
                print(f"   ✅ {user['name']} - Access granted via invite!")
            else:
                print(f"   ❌ {user['name']} - Failed: {resp.status_code}")
                # Show detailed error
                try:
                    error_detail = resp.json()
                    print(f"      Error: {error_detail}")
                except:
                    print(f"      Error: {resp.text[:200]}")
    
    print("\n" + "=" * 60)
    print("  Complete!")
    print("  Dashboard: https://mvlgroupusa.sharepoint.com/sites/MVLITAdmin/SitePages/Friday-Activity-Dashboard(1).aspx")
    print("=" * 60)

if __name__ == "__main__":
    main()
