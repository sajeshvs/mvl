"""
Add missing quotations that weren't loaded initially
"""
from msal import ConfidentialClientApplication
import requests
import json
from pathlib import Path
import time

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

SITE_ID = "mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59"
DATA_PATH = Path("c:/Users/Sajesh/Documents/Apps/Rita/PowerBI/v3")


def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"]).get("access_token")


def get_list_id(headers, list_name):
    url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists?$filter=displayName eq '{list_name}'"
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        lists = resp.json().get("value", [])
        if lists:
            return lists[0]["id"]
    return None


def get_existing_ids(headers, list_id):
    """Get all existing quotation IDs"""
    existing = set()
    url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{list_id}/items?$expand=fields&$top=5000"
    
    page = 0
    while url:
        page += 1
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("value", []):
                qid = item.get("fields", {}).get("QuotationID", "")
                if qid:
                    existing.add(qid)
            url = data.get("@odata.nextLink")
            print(f"   Page {page}: {len(existing)} unique IDs so far...")
        else:
            print(f"   Error: {resp.status_code}")
            break
    
    return existing


def main():
    print("=" * 60)
    print("  ADDING MISSING QUOTATIONS")
    print("=" * 60)
    
    # Get fresh token
    token = get_token()
    if not token:
        print("❌ Failed to get token")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Load all quotations from JSON
    print("\n📂 Loading quotations from JSON...")
    with open(DATA_PATH / "supplier-marketplace/data.json", 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    workbench = data.get('workbench', [])
    json_quotations = {}
    for i, item in enumerate(workbench):
        qid = item.get('QuotationNumber', '')
        if qid:
            json_quotations[qid] = item
    
    print(f"   Total in JSON: {len(json_quotations)}")
    
    # Get existing from SharePoint
    print("\n📋 Fetching existing quotation IDs from SharePoint...")
    list_id = get_list_id(headers, "MT_Quotations")
    existing_ids = get_existing_ids(headers, list_id)
    print(f"\n   Existing in SharePoint: {len(existing_ids)}")
    
    # Find missing
    missing_ids = set(json_quotations.keys()) - existing_ids
    print(f"\n🔍 Missing quotations: {len(missing_ids)}")
    
    if not missing_ids:
        print("\n✅ All quotations loaded!")
        return
    
    # Add missing quotations
    print(f"\n📝 Adding {len(missing_ids)} missing quotations...")
    
    # Need fresh token for batch adds
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    added = 0
    failed = 0
    
    for i, qid in enumerate(missing_ids):
        item = json_quotations[qid]
        
        status = item.get('Status', 'Quotation')
        if status not in ['Quotation', 'Waiting', 'Order', 'Cancelled']:
            status = 'Quotation'
        
        record = {
            "Title": (item.get('QuotationNumber', '') or '')[:255].strip(),
            "QuotationID": (item.get('QuotationNumber', '') or '')[:255].strip(),
            "Status": status,
            "ValueUSD": round(float(item.get('QuotationValue', 0) or 0), 2),
            "ClientName": (str(item.get('Client', '') or '').replace('\x00', '').strip())[:255],
            "Entity": (str(item.get('Entity', '') or '').replace('\x00', '').strip())[:255],
            "Discipline": (str(item.get('Material', '') or '').replace('\x00', '').strip())[:255],
        }
        
        url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{list_id}/items"
        resp = requests.post(url, headers=headers, json={"fields": record})
        
        if resp.status_code == 201:
            added += 1
        else:
            failed += 1
        
        if (i + 1) % 50 == 0:
            print(f"   Progress: {i + 1}/{len(missing_ids)} (added: {added}, failed: {failed})")
            time.sleep(0.5)
    
    print(f"\n{'=' * 60}")
    print(f"  COMPLETE")
    print(f"{'=' * 60}")
    print(f"   ✅ Added: {added}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📊 Total quotations should be: {len(existing_ids) + added}")


if __name__ == "__main__":
    main()
