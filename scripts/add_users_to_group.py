"""Add users to the Friday Activity Dashboard security group"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

GROUP_ID = "7558b5e2-274d-465e-bea3-77393b40018c"

# Search by email to get correct user IDs
USER_EMAILS = [
    "Hani.Khawaja@mvl-group.com",
    "rita.jamal@mvl-group.com", 
    "abie.musa@mvl-group.com",
    "Sajesh.Sukumaran@mvl-group.com"
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
    print("  Adding Users to Friday Activity Dashboard Group")
    print("=" * 60)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # First verify the group exists
    print(f"\n🔍 Verifying group {GROUP_ID[:20]}...")
    group_url = f"https://graph.microsoft.com/v1.0/groups/{GROUP_ID}"
    resp = requests.get(group_url, headers=headers)
    if resp.status_code == 200:
        group = resp.json()
        print(f"   ✅ Group: {group.get('displayName')}")
    else:
        print(f"   ❌ Group not found: {resp.status_code}")
        return
    
    # Check current members
    print("\n📋 Current members:")
    members_url = f"https://graph.microsoft.com/v1.0/groups/{GROUP_ID}/members"
    resp = requests.get(members_url, headers=headers)
    if resp.status_code == 200:
        members = resp.json().get("value", [])
        for m in members:
            print(f"   • {m.get('displayName')} ({m.get('mail', m.get('userPrincipalName'))})")
        if not members:
            print("   (no members)")
    
    # Look up each user and add to group
    print("\n👥 Adding users...")
    
    for email in USER_EMAILS:
        # Find user by email
        user_url = f"https://graph.microsoft.com/v1.0/users?$filter=mail eq '{email}' or userPrincipalName eq '{email}'&$select=id,displayName,mail"
        resp = requests.get(user_url, headers=headers)
        
        if resp.status_code == 200:
            users = resp.json().get("value", [])
            if users:
                user = users[0]
                user_id = user["id"]
                print(f"\n   {user.get('displayName')} ({email})")
                print(f"   ID: {user_id}")
                
                # Add to group
                member_url = f"https://graph.microsoft.com/v1.0/groups/{GROUP_ID}/members/$ref"
                member_data = {
                    "@odata.id": f"https://graph.microsoft.com/v1.0/directoryObjects/{user_id}"
                }
                resp2 = requests.post(member_url, headers=headers, json=member_data)
                
                if resp2.status_code == 204:
                    print(f"   ✅ Added to group!")
                elif resp2.status_code == 400 and "already exist" in resp2.text.lower():
                    print(f"   ℹ️ Already a member")
                else:
                    print(f"   ❌ Failed: {resp2.status_code} - {resp2.text[:100]}")
            else:
                print(f"\n   ❌ User not found: {email}")
        else:
            print(f"\n   ❌ Error looking up {email}: {resp.status_code}")
    
    # Show final members
    print("\n" + "=" * 60)
    print("  Final Group Members")
    print("=" * 60)
    resp = requests.get(members_url, headers=headers)
    if resp.status_code == 200:
        members = resp.json().get("value", [])
        for m in members:
            print(f"   ✅ {m.get('displayName')} - {m.get('mail', m.get('userPrincipalName'))}")
    
    print("\n📝 NEXT STEP:")
    print("   Share the dashboard page with this security group:")
    print("   Group: Friday Activity Dashboard - Viewers")
    print("   Dashboard: https://mvlgroupusa.sharepoint.com/sites/MVLITAdmin/SitePages/Friday-Activity-Dashboard(1).aspx")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
