"""Find SharePoint sites in MVL USA Inc"""
from msal import ConfidentialClientApplication
import requests

app = ConfidentialClientApplication(
    '1b9540e1-6c1e-4214-8d97-6116394ef72c',
    authority='https://login.microsoftonline.com/416328e6-260f-438f-bf3c-9c4f15b6a1ca',
    client_credential='cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4'
)

r = app.acquire_token_for_client(scopes=['https://graph.microsoft.com/.default'])
h = {'Authorization': f"Bearer {r['access_token']}"}

print("=" * 60)
print("  Searching SharePoint Sites in MVL USA Inc")
print("=" * 60)

# Search for Friday Activity related sites
search_terms = ["Friday", "Activity", "Dashboard"]

for term in search_terms:
    print(f"\n🔍 Searching for '{term}'...")
    url = f"https://graph.microsoft.com/v1.0/sites?search={term}&$select=id,name,displayName,webUrl"
    resp = requests.get(url, headers=h)
    if resp.status_code == 200:
        sites = resp.json().get('value', [])
        if sites:
            for s in sites:
                print(f"   ✅ {s.get('displayName') or s.get('name')}")
                print(f"      URL: {s.get('webUrl')}")
                print(f"      ID: {s.get('id')}")
        else:
            print(f"   No sites found")
    else:
        print(f"   Error: {resp.status_code}")

# Also list all sites
print("\n" + "=" * 60)
print("  All SharePoint Sites")
print("=" * 60)

url = "https://graph.microsoft.com/v1.0/sites?$top=20&$select=id,name,displayName,webUrl"
resp = requests.get(url, headers=h)
if resp.status_code == 200:
    sites = resp.json().get('value', [])
    for i, s in enumerate(sites, 1):
        name = s.get('displayName') or s.get('name') or 'N/A'
        print(f"{i:2}. {name}")
        print(f"    {s.get('webUrl', 'N/A')}")
else:
    print(f"Error: {resp.status_code} - {resp.text[:100]}")

print("\n" + "=" * 60)
