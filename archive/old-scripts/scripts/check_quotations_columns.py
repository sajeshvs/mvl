"""
Check exact columns in MT_Quotations
"""

from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}
SITE_ID = "mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59"

app = ConfidentialClientApplication(
    CONFIG["client_id"],
    authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
    client_credential=CONFIG["client_secret"]
)
token = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Get MT_Quotations list columns
resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists", headers=headers)
lists = resp.json().get("value", [])

for lst in lists:
    if lst["displayName"] == "MT_Quotations":
        list_id = lst["id"]
        cols_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{list_id}/columns", headers=headers)
        cols = cols_resp.json().get("value", [])
        print("=== MT_Quotations COLUMNS ===")
        for c in cols:
            if not c.get("readOnly", False):
                print(f"  {c['name']}")
        
        # Get sample item
        items_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{list_id}/items?$expand=fields&$top=2", headers=headers)
        items = items_resp.json().get("value", [])
        if items:
            print("\n=== SAMPLE ITEM FIELDS ===")
            fields = items[0].get("fields", {})
            for k in fields.keys():
                if k not in ["@odata.etag", "id", "ContentType"]:
                    val = str(fields[k])
                    if len(val) > 50:
                        val = val[:50] + "..."
                    print(f"  {k}: {val}")
        break
