"""Find available name for our SharePoint site"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    return app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"]).get("access_token")

# Proposed names for the site
PROPOSED_NAMES = [
    "MVL-SupplyIntel",
    "SupplyIntelHub",
    "MVL-SupplyChainBI",
    "SCM-Analytics",
    "MVL-ProcurementHub",
    "SupplyChainDashboards",
    "MVL-SpendAnalytics",
    "ProcurementIntel",
]

def main():
    print("=" * 60)
    print("  Finding Available Name for SharePoint Site")
    print("=" * 60)
    
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔍 Checking proposed names against existing groups...\n")
    
    available = []
    taken = []
    
    for name in PROPOSED_NAMES:
        # Check if group exists
        url = f"https://graph.microsoft.com/v1.0/groups?$filter=displayName eq '{name}'"
        resp = requests.get(url, headers=headers)
        
        if resp.status_code == 200:
            groups = resp.json().get("value", [])
            if groups:
                taken.append(name)
                print(f"   ❌ {name} - TAKEN")
            else:
                available.append(name)
                print(f"   ✅ {name} - AVAILABLE")
        else:
            print(f"   ⚠️ {name} - Error checking")
    
    print("\n" + "=" * 60)
    print("  Available Names")
    print("=" * 60)
    
    for i, name in enumerate(available, 1):
        print(f"   {i}. {name}")
    
    if available:
        print(f"\n   🎯 Recommended: {available[0]}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
