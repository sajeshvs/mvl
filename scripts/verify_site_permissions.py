"""
Verify SharePoint site permissions for users
"""

import os
import requests

# Azure AD credentials (hardcoded for this script)
TENANT_ID = "416328e6-260f-438f-bf3c-9c4f15b6a1ca"
CLIENT_ID = "1b9540e1-6c1e-4214-8d97-6116394ef72c"
CLIENT_SECRET = "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4"

# Site details
SITE_URL = "mvlgroupusa.sharepoint.com"
SITE_PATH = "/sites/mvlmicrotrackpowerbi"

# Users to check
USERS_TO_CHECK = [
    "rita.jamal@mvlgroupusa.onmicrosoft.com",
    "sajesh.sukumaran@mvlgroupusa.onmicrosoft.com",
    "sajesh.admin@mvlgroupusa.onmicrosoft.com"
]

def get_access_token():
    """Get Microsoft Graph access token"""
    url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'https://graph.microsoft.com/.default',
        'grant_type': 'client_credentials'
    }
    response = requests.post(url, data=data)
    response.raise_for_status()
    return response.json()['access_token']

def get_site_info(token):
    """Get SharePoint site information"""
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get site by URL
    url = f"https://graph.microsoft.com/v1.0/sites/{SITE_URL}:{SITE_PATH}"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error getting site: {response.status_code}")
        print(response.text)
        return None

def get_site_permissions(token, site_id):
    """Get site permissions"""
    headers = {'Authorization': f'Bearer {token}'}
    url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/permissions"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json().get('value', [])
    else:
        print(f"Error getting permissions: {response.status_code}")
        return []

def get_user_info(token, user_email):
    """Get user information"""
    headers = {'Authorization': f'Bearer {token}'}
    url = f"https://graph.microsoft.com/v1.0/users/{user_email}"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        return None

def check_group_members(token, group_id):
    """Check members of a group"""
    headers = {'Authorization': f'Bearer {token}'}
    url = f"https://graph.microsoft.com/v1.0/groups/{group_id}/members"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json().get('value', [])
    return []

def get_site_groups(token, site_id):
    """Get SharePoint site groups via sites endpoint"""
    headers = {'Authorization': f'Bearer {token}'}
    
    # Try to get the site's associated groups
    # Microsoft 365 Group connected sites have an associated group
    url = f"https://graph.microsoft.com/v1.0/sites/{site_id}"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        site_data = response.json()
        return site_data
    return None

def main():
    print("=" * 60)
    print("SharePoint Site Permission Verification")
    print("=" * 60)
    
    # Get access token
    print("\n1. Getting access token...")
    try:
        token = get_access_token()
        print("   ✅ Token acquired")
    except Exception as e:
        print(f"   ❌ Failed to get token: {e}")
        return
    
    # Get site info
    print("\n2. Getting site information...")
    site = get_site_info(token)
    if site:
        print(f"   ✅ Site found:")
        print(f"      Name: {site.get('displayName', 'N/A')}")
        print(f"      ID: {site.get('id', 'N/A')}")
        print(f"      Web URL: {site.get('webUrl', 'N/A')}")
        site_id = site.get('id')
    else:
        print("   ❌ Could not find site")
        return
    
    # Check each user
    print("\n3. Checking users...")
    for user_email in USERS_TO_CHECK:
        print(f"\n   Checking: {user_email}")
        user = get_user_info(token, user_email)
        if user:
            print(f"      ✅ User exists in Azure AD")
            print(f"         Display Name: {user.get('displayName', 'N/A')}")
            print(f"         ID: {user.get('id', 'N/A')}")
            print(f"         Account Enabled: {user.get('accountEnabled', 'N/A')}")
            
            # Check if user has a license
            licenses_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/licenseDetails"
            headers = {'Authorization': f'Bearer {token}'}
            lic_response = requests.get(licenses_url, headers=headers)
            if lic_response.status_code == 200:
                licenses = lic_response.json().get('value', [])
                if licenses:
                    print(f"         Licenses: {len(licenses)} assigned")
                else:
                    print(f"         ⚠️  No licenses assigned - may affect access")
        else:
            print(f"      ❌ User NOT found in Azure AD")
    
    # Get site permissions
    print("\n4. Checking site permissions...")
    permissions = get_site_permissions(token, site_id)
    if permissions:
        print(f"   Found {len(permissions)} permission entries:")
        for perm in permissions:
            roles = perm.get('roles', [])
            granted_to = perm.get('grantedToV2', {}) or perm.get('grantedTo', {})
            
            if 'user' in granted_to:
                user_info = granted_to['user']
                print(f"      - User: {user_info.get('displayName', 'N/A')} ({user_info.get('email', 'N/A')})")
                print(f"        Roles: {roles}")
            elif 'group' in granted_to:
                group_info = granted_to['group']
                print(f"      - Group: {group_info.get('displayName', 'N/A')}")
                print(f"        Roles: {roles}")
            elif 'siteGroup' in granted_to:
                sg_info = granted_to['siteGroup']
                print(f"      - Site Group: {sg_info.get('displayName', 'N/A')}")
                print(f"        Roles: {roles}")
    else:
        print("   ⚠️  No permissions found via Graph API")
        print("   This is normal - SharePoint permissions are managed differently")
    
    # Summary and recommendations
    print("\n" + "=" * 60)
    print("RECOMMENDATIONS")
    print("=" * 60)
    print("""
If users still can't access the site, check:

1. SITE URL: Users should access:
   https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi

2. PERMISSION LEVEL: Make sure they have at least "Read" or "Contribute"
   - Go to Site Settings → Site Permissions
   - Check if their names appear

3. SHAREPOINT LICENSE: Users need a SharePoint license
   - Go to Microsoft 365 Admin Center
   - Users → Active Users → Select user → Licenses
   - Ensure "SharePoint Online" is checked

4. SIGN-IN: Users must sign in with their correct account
   - rita.jamal@mvlgroupusa.onmicrosoft.com
   - sajesh.sukumaran@mvlgroupusa.onmicrosoft.com

5. CACHE: Have them try:
   - Clear browser cache
   - Try InPrivate/Incognito window
   - Try different browser

6. DIRECT LINK: Share this exact link:
   https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi/SitePages/MVL-Supply-Intel-Hub.aspx
""")

if __name__ == "__main__":
    main()
