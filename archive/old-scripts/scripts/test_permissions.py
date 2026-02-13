"""
Test Azure AD App Permissions - Comprehensive Test
"""
from msal import ConfidentialClientApplication
import requests

tenant_id = '416328e6-260f-438f-bf3c-9c4f15b6a1ca'
client_id = '1b9540e1-6c1e-4214-8d97-6116394ef72c'
client_secret = 'cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4'

print("=" * 55)
print("  MVL Supply Intel Hub - API Permission Test")
print("=" * 55)

app = ConfidentialClientApplication(
    client_id,
    authority=f'https://login.microsoftonline.com/{tenant_id}',
    client_credential=client_secret
)

results = {"pass": 0, "fail": 0}

def test(name, url, headers):
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        print(f'   ✅ {name}')
        results["pass"] += 1
        return response.json()
    else:
        print(f'   ❌ {name}: {response.status_code}')
        results["fail"] += 1
        return None

# Test Graph API
print("\n📊 Microsoft Graph API")
result = app.acquire_token_for_client(scopes=['https://graph.microsoft.com/.default'])
if 'access_token' in result:
    print('   ✅ Token acquired')
    results["pass"] += 1
    h = {'Authorization': f"Bearer {result['access_token']}"}
    
    test("Organization.Read.All", 'https://graph.microsoft.com/v1.0/organization', h)
    test("User.Read.All", 'https://graph.microsoft.com/v1.0/users?$top=1', h)
    test("Group.Read.All", 'https://graph.microsoft.com/v1.0/groups?$top=1', h)
    test("Directory.Read.All", 'https://graph.microsoft.com/v1.0/directoryRoles?$top=1', h)
    test("Sites.Read.All", 'https://graph.microsoft.com/v1.0/sites/root', h)
else:
    print(f'   ❌ Token failed: {result.get("error_description")}')
    results["fail"] += 1

# Test Power BI API
print("\n⚡ Power BI API")
result2 = app.acquire_token_for_client(scopes=['https://analysis.windows.net/powerbi/api/.default'])
if 'access_token' in result2:
    print('   ✅ Token acquired')
    results["pass"] += 1
    h2 = {'Authorization': f"Bearer {result2['access_token']}"}
    
    data = test("Tenant.Read.All (Workspaces)", 'https://api.powerbi.com/v1.0/myorg/admin/groups?$top=5', h2)
    if data:
        ws = data.get('value', [])
        print(f'       → Found {len(ws)} workspaces')
        for w in ws[:3]:
            print(f'         • {w.get("name", "N/A")}')
else:
    print(f'   ❌ Token failed')
    results["fail"] += 1

# Summary
print("\n" + "=" * 55)
print(f"  Results: {results['pass']} passed, {results['fail']} failed")
print("=" * 55)
