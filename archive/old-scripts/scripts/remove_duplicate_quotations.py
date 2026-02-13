"""
Remove duplicate quotations from SharePoint
Keep only unique QuotationIDs
"""
from msal import ConfidentialClientApplication
import requests
import time
from collections import defaultdict

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

SITE_ID = "mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59"


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


def get_all_items(headers, list_id):
    """Get all items with their IDs and QuotationIDs"""
    items = []
    url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{list_id}/items?$expand=fields&$top=5000"
    
    while url:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("value", []):
                item_id = item.get("id")
                qid = item.get("fields", {}).get("QuotationID", "")
                items.append({"id": item_id, "QuotationID": qid})
            
            url = data.get("@odata.nextLink")
            print(f"   Fetched {len(items)} items...")
        else:
            print(f"   Error: {resp.status_code} - {resp.text[:200]}")
            break
    
    return items


def main():
    print("=" * 60)
    print("  REMOVING DUPLICATE QUOTATIONS")
    print("=" * 60)
    
    token = get_token()
    if not token:
        print("❌ Failed to get token")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    list_id = get_list_id(headers, "MT_Quotations")
    print(f"\n✅ Found MT_Quotations list: {list_id[:20]}...")
    
    # Get all items
    print("\n📋 Fetching all quotation items...")
    all_items = get_all_items(headers, list_id)
    print(f"\n   Total items in list: {len(all_items)}")
    
    # Find duplicates
    qid_to_items = defaultdict(list)
    for item in all_items:
        qid = item["QuotationID"]
        qid_to_items[qid].append(item["id"])
    
    # Identify duplicates (keep first, delete rest)
    duplicates_to_delete = []
    for qid, item_ids in qid_to_items.items():
        if len(item_ids) > 1:
            # Keep the first one, delete the rest
            duplicates_to_delete.extend(item_ids[1:])
    
    print(f"\n🔍 Found {len(duplicates_to_delete)} duplicate items to delete")
    print(f"   Unique quotations: {len(qid_to_items)}")
    
    if not duplicates_to_delete:
        print("\n✅ No duplicates found!")
        return
    
    # Delete duplicates
    print(f"\n🗑️  Deleting {len(duplicates_to_delete)} duplicates...")
    
    deleted = 0
    failed = 0
    
    for i, item_id in enumerate(duplicates_to_delete):
        url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists/{list_id}/items/{item_id}"
        resp = requests.delete(url, headers=headers)
        
        if resp.status_code == 204:
            deleted += 1
        else:
            failed += 1
            if failed <= 3:
                print(f"   Error deleting {item_id}: {resp.status_code}")
        
        if (i + 1) % 100 == 0:
            print(f"   Progress: {i + 1}/{len(duplicates_to_delete)} (deleted: {deleted}, failed: {failed})")
            time.sleep(1)  # Rate limiting
    
    print(f"\n{'=' * 60}")
    print(f"  CLEANUP COMPLETE")
    print(f"{'=' * 60}")
    print(f"   ✅ Deleted: {deleted}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📊 Remaining items: {len(all_items) - deleted}")


if __name__ == "__main__":
    main()
