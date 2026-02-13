"""
Check and navigate to MVL Supply Intelligence Hub workspace in Power BI
"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

# Expected workspace
WORKSPACE_NAME = "MVL Supply Intelligence Hub"
WORKSPACE_ID = "4913fadb-9d03-4742-9e8c-39412a64a93f"
DATASET_ID = "c725ca87-7e4b-4a83-819c-55b1bdcbceeb"

USER_EMAIL = "sajesh.admin@mvlgroupusa.onmicrosoft.com"


def get_token():
    """Get Power BI access token"""
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    # Power BI Gov Cloud scope
    result = app.acquire_token_for_client(
        scopes=["https://analysis.usgovcloudapi.net/powerbi/api/.default"]
    )
    return result.get("access_token")


def main():
    print("=" * 70)
    print("  Power BI Workspace Access Check")
    print("=" * 70)
    
    token = get_token()
    
    if not token:
        print("\n❌ Failed to get access token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Power BI Gov Cloud API endpoint
    base_url = "https://api.powerbigov.us/v1.0/myorg"
    
    print(f"\n🔍 Checking workspace access for: {USER_EMAIL}")
    print(f"   Target workspace: {WORKSPACE_NAME}")
    print(f"   Workspace ID: {WORKSPACE_ID}")
    
    # 1. List all workspaces user has access to
    print("\n📋 Fetching all accessible workspaces...")
    url = f"{base_url}/groups"
    resp = requests.get(url, headers=headers)
    
    if resp.status_code != 200:
        print(f"   ❌ Error fetching workspaces: {resp.status_code}")
        print(f"   {resp.text[:300]}")
        return
    
    workspaces = resp.json().get("value", [])
    print(f"   ✅ Found {len(workspaces)} accessible workspace(s)\n")
    
    # Display all workspaces
    target_found = False
    for ws in workspaces:
        is_target = ws["id"] == WORKSPACE_ID
        marker = "👉" if is_target else "  "
        print(f"{marker} {ws['name']}")
        print(f"   ID: {ws['id']}")
        print(f"   Type: {ws.get('type', 'Workspace')}")
        
        if is_target:
            target_found = True
            print(f"   🎯 THIS IS YOUR TARGET WORKSPACE!")
        print()
    
    # 2. Check specific workspace
    if not target_found:
        print(f"\n⚠️  Workspace '{WORKSPACE_NAME}' not found in your accessible list.")
        print("\n🔍 Attempting direct access check...")
        
        url = f"{base_url}/groups/{WORKSPACE_ID}"
        resp = requests.get(url, headers=headers)
        
        if resp.status_code == 200:
            ws = resp.json()
            print(f"   ✅ Workspace exists but may need access:")
            print(f"      Name: {ws['name']}")
            print(f"      ID: {ws['id']}")
            print("\n💡 Solution: Add yourself as workspace member")
        elif resp.status_code == 404:
            print(f"   ❌ Workspace does not exist")
            print("\n💡 Solution: Create the workspace first")
        else:
            print(f"   ❌ Error: {resp.status_code}")
            print(f"   {resp.text[:300]}")
    else:
        print(f"✅ Great! You have access to '{WORKSPACE_NAME}'")
        
        # 3. Check dataset in workspace
        print(f"\n🔍 Checking for dataset in workspace...")
        url = f"{base_url}/groups/{WORKSPACE_ID}/datasets"
        resp = requests.get(url, headers=headers)
        
        if resp.status_code == 200:
            datasets = resp.json().get("value", [])
            print(f"   Found {len(datasets)} dataset(s) in workspace:\n")
            
            for ds in datasets:
                is_target = ds["id"] == DATASET_ID
                marker = "👉" if is_target else "  "
                print(f"{marker} {ds['name']}")
                print(f"   ID: {ds['id']}")
                if is_target:
                    print(f"   🎯 THIS IS YOUR DATASET!")
                print()
        else:
            print(f"   ⚠️  Could not fetch datasets: {resp.status_code}")
    
    # 4. Provide direct URLs
    print("\n" + "=" * 70)
    print("  📌 Direct Access URLs")
    print("=" * 70)
    print(f"\n🌐 Workspace URL:")
    print(f"   https://app.powerbigov.us/groups/{WORKSPACE_ID}")
    print(f"\n📊 Create Report URL:")
    print(f"   https://app.powerbigov.us/groups/{WORKSPACE_ID}/create/report?datasetId={DATASET_ID}")
    print(f"\n🏠 Data Hub:")
    print(f"   https://app.powerbigov.us/datahub")
    
    print("\n" + "=" * 70)
    print("  💡 Next Steps")
    print("=" * 70)
    
    if not target_found:
        print("\n⚠️  Workspace not accessible. You need to:")
        print("   1. Create the workspace, OR")
        print("   2. Get added as a member by workspace owner")
        print("\n   Run: python scripts/create_powerbi_workspace_access.py")
    else:
        print("\n✅ You're all set! To create a report:")
        print("   1. Click the 'Create Report URL' above, OR")
        print("   2. Go to workspace → + New → Report → Pick a published dataset")
        print("   3. Select: MVL-SupplyIntelHub-Data")
        print("   4. Start building with drag-drop!")


if __name__ == "__main__":
    main()
