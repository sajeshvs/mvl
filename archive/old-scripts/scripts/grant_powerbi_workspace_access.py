"""
Check and grant Power BI workspace permissions for sajesh.admin
"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

WORKSPACE_ID = "4913fadb-9d03-4742-9e8c-39412a64a93f"
USER_EMAIL = "sajesh.admin@mvlgroupusa.onmicrosoft.com"


def get_token():
    """Get Power BI access token"""
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    result = app.acquire_token_for_client(
        scopes=["https://analysis.usgovcloudapi.net/powerbi/api/.default"]
    )
    return result.get("access_token")


def get_user_id(headers, email):
    """Get user's Azure AD object ID"""
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    graph_token = app.acquire_token_for_client(
        scopes=["https://graph.microsoft.com/.default"]
    ).get("access_token")
    
    graph_headers = {"Authorization": f"Bearer {graph_token}"}
    url = f"https://graph.microsoft.com/v1.0/users/{email}"
    resp = requests.get(url, headers=graph_headers)
    
    if resp.status_code == 200:
        return resp.json().get("id")
    return None


def main():
    print("=" * 70)
    print("  Power BI Workspace Permissions Check & Fix")
    print("=" * 70)
    
    token = get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    base_url = "https://api.powerbigov.us/v1.0/myorg"
    
    print(f"\n🔍 Checking permissions for: {USER_EMAIL}")
    print(f"   Workspace: MVL Supply Intelligence Hub")
    
    # 1. Get current workspace users
    print("\n📋 Fetching workspace members...")
    url = f"{base_url}/groups/{WORKSPACE_ID}/users"
    resp = requests.get(url, headers=headers)
    
    if resp.status_code == 200:
        users = resp.json().get("value", [])
        print(f"   Found {len(users)} member(s):\n")
        
        user_found = False
        current_role = None
        
        for user in users:
            email = user.get("emailAddress", "N/A")
            role = user.get("groupUserAccessRight", "Unknown")
            identifier = user.get("identifier", "")
            
            is_target = email.lower() == USER_EMAIL.lower()
            marker = "👤" if is_target else "  "
            
            print(f"{marker} {email}")
            print(f"   Role: {role}")
            print(f"   Type: {user.get('principalType', 'N/A')}")
            
            if is_target:
                user_found = True
                current_role = role
                print(f"   ✅ THIS IS YOU!")
            print()
        
        if user_found:
            print(f"✅ You are already a workspace member!")
            print(f"   Your role: {current_role}")
            
            if current_role == "Viewer":
                print(f"\n⚠️  Issue: 'Viewer' role cannot create reports!")
                print(f"   Need to upgrade to 'Contributor' or 'Member'")
                
                # Upgrade to Member
                print(f"\n🔧 Upgrading to 'Member' role...")
                user_id = get_user_id(headers, USER_EMAIL)
                
                if user_id:
                    # Remove current user
                    delete_url = f"{base_url}/groups/{WORKSPACE_ID}/users/{user_id}"
                    requests.delete(delete_url, headers=headers)
                    
                    # Add as Member
                    add_url = f"{base_url}/groups/{WORKSPACE_ID}/users"
                    payload = {
                        "emailAddress": USER_EMAIL,
                        "groupUserAccessRight": "Member",
                        "principalType": "User"
                    }
                    resp = requests.post(add_url, headers=headers, json=payload)
                    
                    if resp.status_code == 200:
                        print(f"   ✅ Upgraded to Member!")
                    else:
                        print(f"   ⚠️  Status: {resp.status_code}")
                        print(f"   {resp.text[:300]}")
                else:
                    print(f"   ⚠️  Could not get user ID")
            
            elif current_role in ["Member", "Admin", "Contributor"]:
                print(f"\n✅ Your role is sufficient to create reports!")
            
        else:
            print(f"⚠️  You are NOT a workspace member yet!")
            print(f"\n🔧 Adding you as workspace Member...")
            
            # Add user as Member
            add_url = f"{base_url}/groups/{WORKSPACE_ID}/users"
            payload = {
                "emailAddress": USER_EMAIL,
                "groupUserAccessRight": "Member",
                "principalType": "User"
            }
            resp = requests.post(add_url, headers=headers, json=payload)
            
            if resp.status_code == 200:
                print(f"   ✅ Successfully added as Member!")
            else:
                print(f"   ⚠️  Status: {resp.status_code}")
                print(f"   Response: {resp.text[:300]}")
    
    else:
        print(f"   ❌ Error fetching users: {resp.status_code}")
        print(f"   {resp.text[:300]}")
    
    # 2. Provide clear instructions
    print("\n" + "=" * 70)
    print("  🎯 How to Create a Report")
    print("=" * 70)
    print("\n1️⃣  Option 1: Use Power BI Desktop (Recommended)")
    print("   - Download: https://aka.ms/pbidesktop")
    print("   - Sign in with: sajesh.admin@mvlgroupusa.onmicrosoft.com")
    print("   - Connect to SharePoint data")
    print("   - Build report locally")
    print("   - Publish to workspace")
    print("\n2️⃣  Option 2: Power BI Service (Web)")
    print("   - Go to: https://app.powerbigov.us")
    print("   - Click 'Workspaces' in left sidebar")
    print("   - Select: MVL Supply Intelligence Hub")
    print("   - Click: + New → Report")
    print("   - Pick dataset: MVL-SupplyIntelHub-Data")
    print("   - Start building!")
    
    print("\n" + "=" * 70)
    print("  ⚠️  Important Notes")
    print("=" * 70)
    print("\n• Power BI Service (web) has limited features")
    print("• Power BI Desktop is recommended for complex reports")
    print("• You can build in Desktop and publish to workspace")
    print("\n• Role permissions:")
    print("   - Viewer: Can only view reports")
    print("   - Member/Contributor: Can create/edit reports ✅")
    print("   - Admin: Full control")


if __name__ == "__main__":
    main()
