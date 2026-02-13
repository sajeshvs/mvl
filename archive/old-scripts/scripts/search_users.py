"""
Search for users in Azure AD
"""

import requests

# Azure AD credentials
TENANT_ID = "416328e6-260f-438f-bf3c-9c4f15b6a1ca"
CLIENT_ID = "1b9540e1-6c1e-4214-8d97-6116394ef72c"
CLIENT_SECRET = "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4"

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

def search_users(token, search_term):
    """Search for users containing search term"""
    headers = {'Authorization': f'Bearer {token}'}
    
    # Search by displayName or mail containing the term
    url = f"https://graph.microsoft.com/v1.0/users?$filter=startswith(displayName,'{search_term}') or startswith(mail,'{search_term}') or startswith(userPrincipalName,'{search_term}')"
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json().get('value', [])
    else:
        # Try simpler search
        url = f"https://graph.microsoft.com/v1.0/users?$search=\"displayName:{search_term}\" or \"mail:{search_term}\""
        headers['ConsistencyLevel'] = 'eventual'
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json().get('value', [])
    return []

def list_all_users(token):
    """List all users in the tenant"""
    headers = {'Authorization': f'Bearer {token}'}
    url = "https://graph.microsoft.com/v1.0/users?$select=displayName,mail,userPrincipalName,accountEnabled&$top=100"
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json().get('value', [])
    return []

def main():
    print("=" * 70)
    print("Azure AD User Search")
    print("=" * 70)
    
    # Get token
    token = get_access_token()
    print("✅ Token acquired\n")
    
    # List all users
    print("All users in tenant:")
    print("-" * 70)
    
    users = list_all_users(token)
    
    rita_found = None
    sajesh_found = None
    
    for user in users:
        display_name = user.get('displayName', 'N/A')
        upn = user.get('userPrincipalName', 'N/A')
        mail = user.get('mail', 'N/A')
        enabled = user.get('accountEnabled', 'N/A')
        
        # Check if this could be Rita or Sajesh
        name_lower = display_name.lower()
        upn_lower = upn.lower() if upn else ''
        
        is_rita = 'rita' in name_lower or 'rita' in upn_lower
        is_sajesh = 'sajesh' in name_lower or 'sukumaran' in name_lower or 'sajesh' in upn_lower
        
        marker = ""
        if is_rita:
            marker = " ⭐ RITA"
            rita_found = user
        elif is_sajesh and 'admin' not in upn_lower:
            marker = " ⭐ SAJESH"
            sajesh_found = user
        
        print(f"  {display_name}")
        print(f"    UPN: {upn}")
        print(f"    Mail: {mail}")
        print(f"    Enabled: {enabled}{marker}")
        print()
    
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    if rita_found:
        print(f"\n✅ RITA found:")
        print(f"   Display Name: {rita_found.get('displayName')}")
        print(f"   UPN (use this): {rita_found.get('userPrincipalName')}")
        print(f"   Email: {rita_found.get('mail')}")
    else:
        print("\n❌ RITA not found in Azure AD")
        print("   She needs to be created as a user first!")
    
    if sajesh_found:
        print(f"\n✅ SAJESH found:")
        print(f"   Display Name: {sajesh_found.get('displayName')}")
        print(f"   UPN (use this): {sajesh_found.get('userPrincipalName')}")
        print(f"   Email: {sajesh_found.get('mail')}")
    else:
        print("\n❌ SAJESH (non-admin) not found in Azure AD")
        print("   He needs to be created as a user first!")

if __name__ == "__main__":
    main()
