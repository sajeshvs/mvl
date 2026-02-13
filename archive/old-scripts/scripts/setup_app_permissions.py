"""
Setup Application Permissions for MVL-SupplyIntelHub-Integration
- Removes all delegated permissions
- Adds application permissions
- Grants admin consent automatically
"""
from msal import ConfidentialClientApplication
import requests
import json

# Configuration
CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

# Well-known Service Principal IDs (Resource App IDs)
RESOURCE_APPS = {
    "Microsoft Graph": "00000003-0000-0000-c000-000000000000",
    "Power BI Service": "00000009-0000-0000-c000-000000000000",
    "SharePoint": "00000003-0000-0ff1-ce00-000000000000",
}

# Application permissions to add (App Role IDs)
# These are the GUIDs for each application permission
GRAPH_APP_PERMISSIONS = {
    "User.Read.All": "df021288-bdef-4463-88db-98f22de89214",
    "User.ReadWrite.All": "741f803b-c850-494e-b5df-cde7c675a1ca",
    "Group.Read.All": "5b567255-7703-4780-807c-7be8301ae99b",
    "Group.ReadWrite.All": "62a82d76-70ea-41e2-9197-370581804d09",
    "Directory.Read.All": "7ab1d382-f21e-4acd-a863-ba3e13f7da61",
    "Directory.ReadWrite.All": "19dbc75e-c2e2-444c-a770-ec69d8559fc7",
    "Sites.Read.All": "332a536c-c7ef-4017-ab91-336970924f0d",
    "Sites.ReadWrite.All": "9492366f-7969-46a4-8d15-ed1a20078fff",
    "Sites.FullControl.All": "a82116e5-55eb-4c41-a434-62fe8a61c773",
    "Organization.Read.All": "498476ce-e0fe-48b0-b801-37ba7e2685c6",
    "Mail.Send": "b633e1c5-b582-4048-a93e-9f11b44c7e96",
    "AuditLog.Read.All": "b0afded3-3588-46d8-8b3d-9842eff778da",
    "SecurityEvents.Read.All": "bf394140-e372-4bf9-a898-299cfc7564e5",
    "SecurityEvents.ReadWrite.All": "d903a879-88e0-4c09-b0c9-82f6a1333f84",
    "TeamMember.ReadWrite.All": "0121dc95-1b9f-4aed-8bac-58c5ac466691",
}

POWERBI_APP_PERMISSIONS = {
    "Tenant.Read.All": "654b31ae-d941-4e22-8798-7add8fdf049f",
    "Tenant.ReadWrite.All": "28379fa9-8596-4fd9-869e-cb60a93b5d84",
}

SHAREPOINT_APP_PERMISSIONS = {
    "Sites.FullControl.All": "678536fe-1083-478a-9c59-b99265e6b0d3",
    "Sites.Read.All": "d13f72ca-a275-4b96-b789-48ebcc4da984",
    "Sites.ReadWrite.All": "9bff6588-13f2-4c48-bbf2-ddab62256b36",
    "User.Read.All": "df021288-bdef-4463-88db-98f22de89214",
}


def get_access_token():
    """Get access token for Graph API"""
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if "access_token" in result:
        return result["access_token"]
    raise Exception(f"Failed to get token: {result.get('error_description')}")


def get_service_principal(headers, app_id):
    """Get service principal ID for an app"""
    url = f"https://graph.microsoft.com/v1.0/servicePrincipals?$filter=appId eq '{app_id}'"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data.get("value"):
            return data["value"][0]
    return None


def get_our_service_principal(headers):
    """Get our app's service principal"""
    return get_service_principal(headers, CONFIG["client_id"])


def remove_delegated_permissions(headers, sp_id):
    """Remove all delegated permission grants (oauth2PermissionGrants)"""
    print("\n🗑️  Removing delegated permissions...")
    
    # Get all oauth2PermissionGrants for our service principal
    url = f"https://graph.microsoft.com/v1.0/servicePrincipals/{sp_id}/oauth2PermissionGrants"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"   ⚠️  Could not read delegated permissions: {response.status_code}")
        return
    
    grants = response.json().get("value", [])
    if not grants:
        print("   ℹ️  No delegated permissions found")
        return
    
    for grant in grants:
        grant_id = grant["id"]
        delete_url = f"https://graph.microsoft.com/v1.0/oauth2PermissionGrants/{grant_id}"
        del_response = requests.delete(delete_url, headers=headers)
        if del_response.status_code == 204:
            print(f"   ✅ Removed delegated grant: {grant_id[:20]}...")
        else:
            print(f"   ❌ Failed to remove: {del_response.status_code}")


def add_app_role_assignment(headers, our_sp_id, resource_sp_id, app_role_id, permission_name):
    """Add an application permission (appRoleAssignment)"""
    url = f"https://graph.microsoft.com/v1.0/servicePrincipals/{our_sp_id}/appRoleAssignments"
    
    payload = {
        "principalId": our_sp_id,
        "resourceId": resource_sp_id,
        "appRoleId": app_role_id
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 201:
        print(f"   ✅ Added: {permission_name}")
        return True
    elif response.status_code == 409:
        print(f"   ℹ️  Already exists: {permission_name}")
        return True
    else:
        error = response.json().get("error", {}).get("message", response.text)
        print(f"   ❌ Failed {permission_name}: {error[:50]}")
        return False


def setup_permissions():
    """Main function to setup all permissions"""
    print("=" * 60)
    print("  MVL Supply Intel Hub - Application Permissions Setup")
    print("=" * 60)
    
    # Get access token
    print("\n🔐 Authenticating...")
    try:
        token = get_access_token()
        print("   ✅ Token acquired")
    except Exception as e:
        print(f"   ❌ {e}")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get our service principal
    print("\n🔍 Finding our app's service principal...")
    our_sp = get_our_service_principal(headers)
    if not our_sp:
        print("   ❌ Could not find our service principal")
        return
    our_sp_id = our_sp["id"]
    print(f"   ✅ Found: {our_sp['displayName']} ({our_sp_id[:20]}...)")
    
    # Remove delegated permissions
    remove_delegated_permissions(headers, our_sp_id)
    
    # Add Microsoft Graph application permissions
    print("\n📊 Adding Microsoft Graph Application Permissions...")
    graph_sp = get_service_principal(headers, RESOURCE_APPS["Microsoft Graph"])
    if graph_sp:
        graph_sp_id = graph_sp["id"]
        for perm_name, role_id in GRAPH_APP_PERMISSIONS.items():
            add_app_role_assignment(headers, our_sp_id, graph_sp_id, role_id, perm_name)
    else:
        print("   ❌ Could not find Microsoft Graph service principal")
    
    # Add Power BI application permissions
    print("\n⚡ Adding Power BI Application Permissions...")
    pbi_sp = get_service_principal(headers, RESOURCE_APPS["Power BI Service"])
    if pbi_sp:
        pbi_sp_id = pbi_sp["id"]
        for perm_name, role_id in POWERBI_APP_PERMISSIONS.items():
            add_app_role_assignment(headers, our_sp_id, pbi_sp_id, role_id, perm_name)
    else:
        print("   ❌ Could not find Power BI service principal")
    
    # Add SharePoint application permissions
    print("\n📁 Adding SharePoint Application Permissions...")
    sp_sp = get_service_principal(headers, RESOURCE_APPS["SharePoint"])
    if sp_sp:
        sp_sp_id = sp_sp["id"]
        for perm_name, role_id in SHAREPOINT_APP_PERMISSIONS.items():
            add_app_role_assignment(headers, our_sp_id, sp_sp_id, role_id, perm_name)
    else:
        print("   ❌ Could not find SharePoint service principal")
    
    print("\n" + "=" * 60)
    print("  Setup Complete! Run test_permissions.py to verify.")
    print("=" * 60)


if __name__ == "__main__":
    setup_permissions()
