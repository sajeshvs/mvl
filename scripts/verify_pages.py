"""Quick verify Friday pages"""
from msal import ConfidentialClientApplication
import requests

app = ConfidentialClientApplication(
    '1b9540e1-6c1e-4214-8d97-6116394ef72c',
    authority='https://login.microsoftonline.com/416328e6-260f-438f-bf3c-9c4f15b6a1ca',
    client_credential='cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4'
)
t = app.acquire_token_for_client(scopes=['https://graph.microsoft.com/.default'])['access_token']
h = {'Authorization': f'Bearer {t}'}

SITE_ID = "mvlgroupusa.sharepoint.com,146dbf8a-155c-457c-88b2-5a34dcb0e1e2,e958e24c-db93-4a6a-a648-c3002cdf1e20"

r = requests.get(f'https://graph.microsoft.com/v1.0/sites/{SITE_ID}/pages', headers=h)
pages = [p for p in r.json().get('value', []) if 'friday' in p.get('name', '').lower()]

print("=" * 60)
print("  Friday Activity Dashboard - Verification")
print("=" * 60)

if pages:
    for p in pages:
        name = p.get('name')
        url = p.get('webUrl')
        has_suffix = "(1)" in name
        print(f"\n   📄 {name}")
        print(f"      URL: {url}")
        if has_suffix:
            print(f"      ⚠️  Still has (1) suffix")
        else:
            print(f"      ✅ Clean URL - Perfect!")
else:
    print("\n   ❌ No Friday Activity pages found")

print("\n" + "=" * 60)
