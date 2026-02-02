"""
Load remaining Microtrack data into SharePoint (continuation)
==============================================================
Loads the remaining quotations and POs that weren't loaded in the initial batch.

Initial load: 1000 quotations, 1000 POs
Remaining: ~11,500 quotations, ~2,500 POs
"""

from msal import ConfidentialClientApplication
import requests
import json
from pathlib import Path
from datetime import datetime
import time
import sys

# Configuration
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


def add_list_items_batch(headers, list_id, items, batch_name="items"):
    """Add items with progress tracking and rate limiting"""
    added = 0
    failed = 0
    total = len(items)
    
    for i, item in enumerate(items):
        url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{list_id}/items"
        payload = {"fields": item}
        
        try:
            resp = requests.post(url, headers=headers, json=payload)
            
            if resp.status_code == 201:
                added += 1
            elif resp.status_code == 429:  # Rate limited
                print(f"\n   ⏳ Rate limited, waiting 60 seconds...")
                time.sleep(60)
                # Retry
                resp = requests.post(url, headers=headers, json=payload)
                if resp.status_code == 201:
                    added += 1
                else:
                    failed += 1
            else:
                failed += 1
        except Exception as e:
            failed += 1
        
        # Progress update every 100 items
        if (i + 1) % 100 == 0:
            print(f"   Progress: {i + 1}/{total} {batch_name} (✅ {added} / ❌ {failed})")
            time.sleep(1)  # Rate limiting pause
    
    return added, failed


def main():
    # Parse command line for start offset
    list_to_load = sys.argv[1] if len(sys.argv) > 1 else "quotations"
    start_offset = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
    batch_size = int(sys.argv[3]) if len(sys.argv) > 3 else 2000
    
    print("=" * 70)
    print("  LOADING REMAINING MICROTRACK DATA")
    print("=" * 70)
    print(f"\n📊 Loading: {list_to_load}")
    print(f"📍 Starting at offset: {start_offset}")
    print(f"📦 Batch size: {batch_size}")
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    if list_to_load == "quotations":
        # Load quotations
        with open(DATA_PATH / "supplier-marketplace/data.json", 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        workbench = data.get('workbench', [])
        items_to_load = []
        
        for item in workbench[start_offset:start_offset + batch_size]:
            status = item.get('Status', 'Quotation')
            if status not in ['Quotation', 'Waiting', 'Order', 'Cancelled']:
                status = 'Quotation'
            
            items_to_load.append({
                "Title": item.get('QuotationNumber', '')[:255],
                "QuotationID": item.get('QuotationNumber', '')[:255],
                "Status": status,
                "ValueUSD": round(item.get('QuotationValue', 0), 2),
                "ClientName": (item.get('Client', '') or '')[:255],
                "Entity": (item.get('Entity', '') or '')[:255],
                "Discipline": (item.get('Material', '') or '')[:255],
            })
        
        list_id = get_list_id(headers, "MT_Quotations")
        print(f"\n📝 Loading {len(items_to_load)} quotations (offset {start_offset})...")
        added, failed = add_list_items_batch(headers, list_id, items_to_load, "quotations")
        
    elif list_to_load == "pos":
        # Load POs
        with open(DATA_PATH / "global-spend-analysis/data.json", 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        workbench = data.get('workbench', [])
        items_to_load = []
        
        for item in workbench[start_offset:start_offset + batch_size]:
            items_to_load.append({
                "Title": item.get('poNumber', '')[:255],
                "POID": item.get('poNumber', '')[:255],
                "SupplierName": (item.get('supplier', '') or '')[:255],
                "ValueUSD": round(item.get('valueUSD', 0), 2),
                "Entity": (item.get('entity', '') or '')[:255],
                "MaterialGroup": (item.get('material', '') or '')[:255],
            })
        
        list_id = get_list_id(headers, "MT_PurchaseOrders")
        print(f"\n📝 Loading {len(items_to_load)} POs (offset {start_offset})...")
        added, failed = add_list_items_batch(headers, list_id, items_to_load, "POs")
    
    print(f"\n✅ Added: {added}")
    print(f"❌ Failed: {failed}")


if __name__ == "__main__":
    main()
