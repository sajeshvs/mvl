"""Find users by name in MVL USA Inc"""
from msal import ConfidentialClientApplication
import requests

app = ConfidentialClientApplication(
    '1b9540e1-6c1e-4214-8d97-6116394ef72c',
    authority='https://login.microsoftonline.com/416328e6-260f-438f-bf3c-9c4f15b6a1ca',
    client_credential='cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4'
)

r = app.acquire_token_for_client(scopes=['https://graph.microsoft.com/.default'])
h = {'Authorization': f"Bearer {r['access_token']}"}

users_to_find = ["Hani", "Rita", "Abie", "Sajesh"]

print("=" * 60)
print("  Searching for Users in MVL USA Inc")
print("=" * 60)

for name in users_to_find:
    url = f"https://graph.microsoft.com/v1.0/users?$filter=startswith(displayName,'{name}') or startswith(givenName,'{name}')&$select=displayName,mail,userPrincipalName,id"
    resp = requests.get(url, headers=h)
    if resp.status_code == 200:
        users = resp.json().get('value', [])
        print(f"\n🔍 '{name}':")
        if users:
            for u in users:
                print(f"   ✅ {u.get('displayName')}")
                print(f"      Email: {u.get('mail') or u.get('userPrincipalName')}")
                print(f"      ID: {u.get('id')}")
        else:
            print(f"   ❌ No users found")
    else:
        print(f"\n🔍 '{name}': Error {resp.status_code}")

print("\n" + "=" * 60)
