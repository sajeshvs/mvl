"""
Add users to SharePoint site with correct email addresses
"""

import requests

TENANT_ID = "416328e6-260f-438f-bf3c-9c4f15b6a1ca"
CLIENT_ID = "1b9540e1-6c1e-4214-8d97-6116394ef72c"
CLIENT_SECRET = "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4"

# Correct email addresses
USERS_TO_ADD = [
    "rita.jamal@mvl-group.com",
    "sajesh.sukumaran@mvl-group.com"
]

def get_token():
    url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "scope": "https://graph.microsoft.com/.default",
        "grant_type": "client_credentials"
    }
    return requests.post(url, data=data).json()["access_token"]

def main():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("=" * 60)
    print("SharePoint Site Access - Correct User Emails")
    print("=" * 60)
    
    # Get site
    site_url = "https://graph.microsoft.com/v1.0/sites/mvlgroupusa.sharepoint.com:/sites/mvlmicrotrackpowerbi"
    site = requests.get(site_url, headers=headers).json()
    site_id = site.get("id")
    print(f"Site: {site.get('displayName')}")
    print(f"URL: {site.get('webUrl')}")
    print()
    
    # Verify users exist
    print("Verifying users exist in Azure AD...")
    print("-" * 60)
    user_ids = {}
    for email in USERS_TO_ADD:
        user_url = f"https://graph.microsoft.com/v1.0/users/{email}"
        resp = requests.get(user_url, headers=headers)
        if resp.status_code == 200:
            user = resp.json()
            user_ids[email] = user["id"]
            print(f"  [OK] {email}")
            print(f"       Name: {user.get('displayName')}")
            print(f"       ID: {user['id']}")
        else:
            print(f"  [X] {email} - Not found")
    
    print()
    print("=" * 60)
    print("INSTRUCTIONS TO ADD USERS")
    print("=" * 60)
    print("""
Since Graph API doesn't easily add SharePoint site members,
please add them manually in SharePoint:

1. Go to: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi

2. Click Settings (gear icon) -> Site permissions

3. Click 'Share site' or 'Invite people'

4. Add these EXACT email addresses:
""")
    for email in USERS_TO_ADD:
        print(f"   * {email}")
    
    print("""
5. Select permission: 'Edit' (Member) or 'Read' (Visitor)

6. Click 'Add' or 'Share'

IMPORTANT: Use @mvl-group.com domain, NOT @mvlgroupusa.onmicrosoft.com
""")

if __name__ == "__main__":
    main()
