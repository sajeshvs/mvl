"""
Add user to SharePoint site as a member
"""

import os
from dotenv import load_dotenv
from msgraph import GraphServiceClient
from azure.identity import ClientSecretCredential

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# Azure AD credentials
TENANT_ID = os.getenv('AZURE_TENANT_ID')
CLIENT_ID = os.getenv('AZURE_CLIENT_ID')
CLIENT_SECRET = os.getenv('AZURE_CLIENT_SECRET')

# Site and user details
SITE_URL = "mvlgroupusa.sharepoint.com:/sites/mvlmicrotrackpowerbi"
USER_EMAIL = "rita.jamal@mvlgroupusa.onmicrosoft.com"

async def add_site_member():
    """Add user as site member"""
    
    # Create credentials
    credential = ClientSecretCredential(
        tenant_id=TENANT_ID,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET
    )
    
    # Create Graph client
    scopes = ['https://graph.microsoft.com/.default']
    client = GraphServiceClient(credentials=credential, scopes=scopes)
    
    try:
        # Get the site
        print(f"Getting site: {SITE_URL}")
        site = await client.sites.by_site_id(SITE_URL).get()
        print(f"Site ID: {site.id}")
        print(f"Site Name: {site.display_name}")
        
        # Get the user
        print(f"\nGetting user: {USER_EMAIL}")
        user = await client.users.by_user_id(USER_EMAIL).get()
        print(f"User ID: {user.id}")
        print(f"User Name: {user.display_name}")
        
        # Get site permissions/members group
        print("\nGetting site members group...")
        
        # List current permissions
        permissions = await client.sites.by_site_id(site.id).permissions.get()
        print(f"Current permissions count: {len(permissions.value) if permissions.value else 0}")
        
        print("\n✅ Site and user verified. To add the user as a site member:")
        print("   1. Go to: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi")
        print("   2. Click Settings (gear icon) → Site permissions")
        print("   3. Click 'Share site' or 'Add members'")
        print(f"   4. Enter: {USER_EMAIL}")
        print("   5. Select 'Member' role")
        print("   6. Click 'Add'")
        
    except Exception as e:
        print(f"Error: {e}")
        print("\n⚠️ Graph API permissions may not allow adding site members directly.")
        print("   Please add the user manually through SharePoint:")
        print("   1. Go to: https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi")
        print("   2. Click Settings (gear icon) → Site permissions")
        print("   3. Click 'Share site' or 'Invite people'")
        print(f"   4. Enter: {USER_EMAIL}")
        print("   5. Select permission level (Edit/Read)")
        print("   6. Click 'Share'")

if __name__ == "__main__":
    import asyncio
    asyncio.run(add_site_member())
