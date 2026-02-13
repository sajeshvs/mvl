"""Check MicroTrack + PowerBI name combinations"""
from msal import ConfidentialClientApplication
import requests

app = ConfidentialClientApplication(
    '1b9540e1-6c1e-4214-8d97-6116394ef72c',
    authority='https://login.microsoftonline.com/416328e6-260f-438f-bf3c-9c4f15b6a1ca',
    client_credential='cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4'
)
t = app.acquire_token_for_client(scopes=['https://graph.microsoft.com/.default'])['access_token']
h = {'Authorization': f'Bearer {t}'}

names = [
    'MVL-MicroTrack-PowerBI',
    'MVL MicroTrack PowerBI',
    'MVL-MicroTrack-BI',
    'MicroTrack-PowerBI',
    'MVL-MicroTrack-Analytics',
    'MicroTrack-BI',
    'MVL-MicroTrack-Dashboards',
    'MicroTrack-Analytics',
    'MVL MicroTrack BI',
    'MVL-MT-PowerBI',
]

print("=" * 50)
print("  Checking MicroTrack + PowerBI Names")
print("=" * 50)

for name in names:
    url = f"https://graph.microsoft.com/v1.0/groups?$filter=displayName eq '{name}'"
    r = requests.get(url, headers=h)
    if r.status_code == 200:
        exists = len(r.json().get('value', [])) > 0
        status = 'TAKEN' if exists else 'AVAILABLE'
        icon = '❌' if exists else '✅'
        print(f'{icon} {name} - {status}')

print("=" * 50)
