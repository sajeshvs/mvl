from msal import ConfidentialClientApplication
import requests

app = ConfidentialClientApplication(
    '1b9540e1-6c1e-4214-8d97-6116394ef72c',
    authority='https://login.microsoftonline.com/416328e6-260f-438f-bf3c-9c4f15b6a1ca',
    client_credential='cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4'
)

print("Testing Power BI Government API (GCC)...")
print("=" * 50)

# Try different scopes for GCC
scopes_to_try = [
    'https://analysis.usgovcloudapi.net/powerbi/api/.default',
    'https://api.powerbigov.us/.default',
]

for scope in scopes_to_try:
    print(f"\nTrying scope: {scope[:50]}...")
    r = app.acquire_token_for_client(scopes=[scope])
    if 'access_token' in r:
        print("   Token: OK")
        h = {'Authorization': f"Bearer {r['access_token']}"}
        
        # Admin API
        resp = requests.get('https://api.powerbigov.us/v1.0/myorg/admin/groups?$top=5', headers=h)
        print(f"   Admin API: {resp.status_code}")
        if resp.status_code == 200:
            ws = resp.json().get('value', [])
            print(f"   ✅ Found {len(ws)} workspaces!")
            for w in ws[:3]:
                print(f"      - {w.get('name')}")
            break
    else:
        print(f"   Token failed: {r.get('error_description', 'Unknown')[:50]}")

print("\n" + "=" * 50)
