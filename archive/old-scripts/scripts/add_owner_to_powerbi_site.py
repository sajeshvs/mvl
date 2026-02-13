"""
Add sajesh.admin@mvlgroupusa.onmicrosoft.com to MVL-MicroTrack-PowerBI Owners
"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

GROUP_ID = "62393668-6ed8-4089-809b-0ad41b9c27c0"  # MVL-MicroTrack-PowerBI group
USER_EMAIL = "sajesh.admin@mvlgroupusa.onmicrosoft.com"


def get_token():
    """Get Graph API access token"""
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    return result.get("access_token")


def main():
    print("=" * 70)
    print("  Adding User to MVL-MicroTrack-PowerBI Owners Group")
    print("=" * 70)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Step 1: Get user ID
    print(f"\n🔍 Step 1: Finding user '{USER_EMAIL}'...")
    user_url = f"https://graph.microsoft.com/v1.0/users/{USER_EMAIL}"
    resp = requests.get(user_url, headers=headers)
    
    if resp.status_code != 200:
        print(f"   ❌ User not found: {resp.status_code}")
        print(f"   Error: {resp.text[:200]}")
        return
    
    user = resp.json()
    user_id = user["id"]
    user_name = user.get("displayName", USER_EMAIL)
    print(f"   ✅ Found user: {user_name} ({user_id})")
    
    # Step 2: Check if already a member
    print(f"\n🔍 Step 2: Checking current membership...")
    members_url = f"https://graph.microsoft.com/v1.0/groups/{GROUP_ID}/members"
    resp = requests.get(members_url, headers=headers)
    
    if resp.status_code == 200:
        members = resp.json().get("value", [])
        member_ids = [m["id"] for m in members]
        
        if user_id in member_ids:
            print(f"   ℹ️  User is already a member of the group")
        else:
            print(f"   ℹ️  User is not yet a member")
    
    # Step 3: Check if already an owner
    print(f"\n🔍 Step 3: Checking current ownership...")
    owners_url = f"https://graph.microsoft.com/v1.0/groups/{GROUP_ID}/owners"
    resp = requests.get(owners_url, headers=headers)
    
    if resp.status_code == 200:
        owners = resp.json().get("value", [])
        owner_ids = [o["id"] for o in owners]
        
        if user_id in owner_ids:
            print(f"   ✅ User is already an owner!")
            print(f"\n✨ No changes needed - {user_name} is already an owner.")
            return
        else:
            print(f"   ℹ️  User is not an owner yet")
    
    # Step 4: Add as owner
    print(f"\n➕ Step 4: Adding user as owner...")
    add_owner_url = f"https://graph.microsoft.com/v1.0/groups/{GROUP_ID}/owners/$ref"
    payload = {
        "@odata.id": f"https://graph.microsoft.com/v1.0/users/{user_id}"
    }
    resp = requests.post(add_owner_url, headers=headers, json=payload)
    
    if resp.status_code == 204:
        print(f"   ✅ Successfully added as owner!")
    elif resp.status_code == 400 and "already exist" in resp.text:
        print(f"   ✅ User is already an owner")
    else:
        print(f"   ⚠️  Response: {resp.status_code}")
        print(f"   {resp.text[:300]}")
    
    # Step 5: Add as member (if not already)
    print(f"\n➕ Step 5: Ensuring user is also a member...")
    add_member_url = f"https://graph.microsoft.com/v1.0/groups/{GROUP_ID}/members/$ref"
    resp = requests.post(add_member_url, headers=headers, json=payload)
    
    if resp.status_code == 204:
        print(f"   ✅ Successfully added as member!")
    elif resp.status_code == 400 and "already exist" in resp.text:
        print(f"   ✅ User is already a member")
    else:
        print(f"   ℹ️  Response: {resp.status_code}")
    
    # Step 6: Verify
    print(f"\n✅ Step 6: Verifying final status...")
    resp = requests.get(owners_url, headers=headers)
    
    if resp.status_code == 200:
        owners = resp.json().get("value", [])
        print(f"\n📋 Current Owners ({len(owners)}):")
        for owner in owners:
            status = "👑" if owner["id"] == user_id else "  "
            print(f"   {status} {owner.get('displayName', 'N/A')} ({owner.get('mail', owner.get('userPrincipalName', 'N/A'))})")
    
    print("\n" + "=" * 70)
    print(f"✅ SUCCESS: {user_name} is now an owner of MVL-MicroTrack-PowerBI!")
    print("=" * 70)
    print(f"\n📌 Site URL: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi")
    print(f"📌 Power BI Workspace: MVL Supply Intelligence Hub")


if __name__ == "__main__":
    main()
