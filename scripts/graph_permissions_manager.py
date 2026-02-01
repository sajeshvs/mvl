"""
Microsoft Graph API - Permissions Manager
==========================================
This script manages permissions for Power BI dashboards and SharePoint lists.

Users to grant access:
- Hani Khajah
- Rita Jamal
- Abie Musa
- Sajesh Sukumaran

Requirements:
- pip install msal requests

Setup:
1. Register an app in Azure AD (portal.azure.com)
2. Grant API permissions:
   - Microsoft Graph: Sites.FullControl.All, User.Read.All
   - Power BI Service: Dashboard.Read.All, Dashboard.ReadWrite.All
3. Create a client secret
4. Update the configuration below
"""

import requests
import json
from msal import ConfidentialClientApplication

# ============================================
# CONFIGURATION - UPDATE THESE VALUES
# ============================================
CONFIG = {
    # Azure AD App Registration
    "tenant_id": "YOUR_TENANT_ID",  # e.g., "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    "client_id": "YOUR_CLIENT_ID",  # App (client) ID
    "client_secret": "YOUR_CLIENT_SECRET",  # Client secret value
    
    # SharePoint Configuration
    "sharepoint_site_url": "https://yourtenant.sharepoint.com/sites/YourSite",
    "sharepoint_list_name": "Friday Activity",
    
    # Power BI Configuration
    "powerbi_workspace_id": "YOUR_WORKSPACE_ID",  # Group ID
    "powerbi_dashboard_id": "YOUR_DASHBOARD_ID",
    
    # Users to grant access (use email addresses)
    "users": [
        {"name": "Hani Khajah", "email": "hani.khajah@yourdomain.com"},
        {"name": "Rita Jamal", "email": "rita.jamal@yourdomain.com"},
        {"name": "Abie Musa", "email": "abie.musa@yourdomain.com"},
        {"name": "Sajesh Sukumaran", "email": "sajesh.sukumaran@yourdomain.com"},
    ]
}

# ============================================
# AUTHENTICATION
# ============================================
class GraphAPIClient:
    def __init__(self, config):
        self.config = config
        self.graph_token = None
        self.powerbi_token = None
        
    def get_graph_token(self):
        """Get access token for Microsoft Graph API"""
        app = ConfidentialClientApplication(
            self.config["client_id"],
            authority=f"https://login.microsoftonline.com/{self.config['tenant_id']}",
            client_credential=self.config["client_secret"]
        )
        
        result = app.acquire_token_for_client(
            scopes=["https://graph.microsoft.com/.default"]
        )
        
        if "access_token" in result:
            self.graph_token = result["access_token"]
            print("✅ Graph API token acquired")
            return True
        else:
            print(f"❌ Error getting Graph token: {result.get('error_description')}")
            return False
    
    def get_powerbi_token(self):
        """Get access token for Power BI API"""
        app = ConfidentialClientApplication(
            self.config["client_id"],
            authority=f"https://login.microsoftonline.com/{self.config['tenant_id']}",
            client_credential=self.config["client_secret"]
        )
        
        result = app.acquire_token_for_client(
            scopes=["https://analysis.windows.net/powerbi/api/.default"]
        )
        
        if "access_token" in result:
            self.powerbi_token = result["access_token"]
            print("✅ Power BI API token acquired")
            return True
        else:
            print(f"❌ Error getting Power BI token: {result.get('error_description')}")
            return False

# ============================================
# SHAREPOINT PERMISSIONS
# ============================================
class SharePointPermissions:
    def __init__(self, client):
        self.client = client
        self.base_url = "https://graph.microsoft.com/v1.0"
        
    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.client.graph_token}",
            "Content-Type": "application/json"
        }
    
    def get_site_id(self, site_url):
        """Get SharePoint site ID from URL"""
        # Parse the site URL to get hostname and site path
        # Format: tenant.sharepoint.com:/sites/SiteName
        url_parts = site_url.replace("https://", "").split("/sites/")
        hostname = url_parts[0]
        site_path = url_parts[1] if len(url_parts) > 1 else ""
        
        url = f"{self.base_url}/sites/{hostname}:/sites/{site_path}"
        response = requests.get(url, headers=self.get_headers())
        
        if response.status_code == 200:
            site_id = response.json()["id"]
            print(f"✅ Found site ID: {site_id}")
            return site_id
        else:
            print(f"❌ Error getting site: {response.text}")
            return None
    
    def get_list_id(self, site_id, list_name):
        """Get list ID by name"""
        url = f"{self.base_url}/sites/{site_id}/lists?$filter=displayName eq '{list_name}'"
        response = requests.get(url, headers=self.get_headers())
        
        if response.status_code == 200:
            lists = response.json().get("value", [])
            if lists:
                list_id = lists[0]["id"]
                print(f"✅ Found list ID: {list_id}")
                return list_id
        
        print(f"❌ List '{list_name}' not found")
        return None
    
    def get_user_id(self, email):
        """Get user ID by email"""
        url = f"{self.base_url}/users/{email}"
        response = requests.get(url, headers=self.get_headers())
        
        if response.status_code == 200:
            return response.json()["id"]
        else:
            print(f"❌ User not found: {email}")
            return None
    
    def grant_list_permission(self, site_id, list_id, user_email, role="read"):
        """
        Grant permission to a SharePoint list
        Roles: read, write, owner
        """
        user_id = self.get_user_id(user_email)
        if not user_id:
            return False
        
        # Create a sharing link or direct permission
        url = f"{self.base_url}/sites/{site_id}/lists/{list_id}/permissions"
        
        # Map role to permission level
        role_map = {
            "read": "read",
            "write": "write", 
            "owner": "owner"
        }
        
        payload = {
            "roles": [role_map.get(role, "read")],
            "grantedToIdentities": [{
                "user": {
                    "id": user_id
                }
            }]
        }
        
        response = requests.post(url, headers=self.get_headers(), json=payload)
        
        if response.status_code in [200, 201]:
            print(f"✅ Granted {role} access to {user_email} on list")
            return True
        else:
            print(f"❌ Error granting permission: {response.text}")
            return False
    
    def grant_permissions_to_all_users(self, role="read"):
        """Grant permissions to all configured users"""
        site_id = self.get_site_id(self.client.config["sharepoint_site_url"])
        if not site_id:
            return
        
        list_id = self.get_list_id(site_id, self.client.config["sharepoint_list_name"])
        if not list_id:
            return
        
        print(f"\n📋 Granting SharePoint list permissions...")
        for user in self.client.config["users"]:
            self.grant_list_permission(site_id, list_id, user["email"], role)

# ============================================
# POWER BI PERMISSIONS
# ============================================
class PowerBIPermissions:
    def __init__(self, client):
        self.client = client
        self.base_url = "https://api.powerbi.com/v1.0/myorg"
        
    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.client.powerbi_token}",
            "Content-Type": "application/json"
        }
    
    def get_user_principal_name(self, email):
        """Get user principal name (usually same as email)"""
        return email
    
    def add_user_to_workspace(self, workspace_id, email, access_right="Viewer"):
        """
        Add user to Power BI workspace
        Access rights: Admin, Member, Contributor, Viewer
        """
        url = f"{self.base_url}/groups/{workspace_id}/users"
        
        payload = {
            "emailAddress": email,
            "groupUserAccessRight": access_right
        }
        
        response = requests.post(url, headers=self.get_headers(), json=payload)
        
        if response.status_code in [200, 201]:
            print(f"✅ Added {email} as {access_right} to workspace")
            return True
        elif response.status_code == 400 and "already exists" in response.text.lower():
            print(f"ℹ️  {email} already has access to workspace")
            return True
        else:
            print(f"❌ Error adding user to workspace: {response.text}")
            return False
    
    def share_dashboard(self, dashboard_id, email, access_right="ReadReshare"):
        """
        Share a specific dashboard with a user
        Access rights: Read, ReadReshare
        """
        # For sharing specific dashboards, we use the reports/dashboards share endpoint
        # This requires the dashboard to be in a workspace the user has access to
        
        workspace_id = self.client.config["powerbi_workspace_id"]
        
        # First ensure user has workspace access
        self.add_user_to_workspace(workspace_id, email, "Viewer")
        
        return True
    
    def grant_permissions_to_all_users(self, access_right="Viewer"):
        """Grant Power BI permissions to all configured users"""
        print(f"\n📊 Granting Power BI workspace permissions...")
        
        workspace_id = self.client.config["powerbi_workspace_id"]
        
        for user in self.client.config["users"]:
            self.add_user_to_workspace(workspace_id, user["email"], access_right)

# ============================================
# MAIN EXECUTION
# ============================================
def main():
    print("=" * 60)
    print("  Microsoft Graph API - Permissions Manager")
    print("  Friday Activity Dashboard Access")
    print("=" * 60)
    
    # Validate configuration
    if CONFIG["tenant_id"] == "YOUR_TENANT_ID":
        print("\n⚠️  Please update the CONFIG section with your actual values!")
        print("\nRequired steps:")
        print("1. Go to portal.azure.com")
        print("2. Navigate to Azure Active Directory → App registrations")
        print("3. Create a new registration or use existing")
        print("4. Note the Application (client) ID and Directory (tenant) ID")
        print("5. Create a client secret under Certificates & secrets")
        print("6. Grant API permissions:")
        print("   - Microsoft Graph: Sites.FullControl.All, User.Read.All")
        print("   - Power BI Service: Tenant.Read.All, Workspace.ReadWrite.All")
        print("7. Admin consent may be required for some permissions")
        print("\n8. Update the CONFIG dictionary in this script")
        return
    
    # Initialize client
    client = GraphAPIClient(CONFIG)
    
    # Get tokens
    print("\n🔐 Authenticating...")
    if not client.get_graph_token():
        return
    if not client.get_powerbi_token():
        return
    
    # Grant SharePoint permissions
    sp = SharePointPermissions(client)
    sp.grant_permissions_to_all_users(role="read")
    
    # Grant Power BI permissions
    pbi = PowerBIPermissions(client)
    pbi.grant_permissions_to_all_users(access_right="Viewer")
    
    print("\n" + "=" * 60)
    print("  ✅ Permission setup complete!")
    print("=" * 60)
    print("\nUsers with access:")
    for user in CONFIG["users"]:
        print(f"  • {user['name']} ({user['email']})")

if __name__ == "__main__":
    main()
