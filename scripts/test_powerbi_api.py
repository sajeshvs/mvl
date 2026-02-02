"""
Test Power BI API and create workspace for dashboards
"""
from msal import ConfidentialClientApplication
import requests

CONFIG = {
    "tenant_id": "416328e6-260f-438f-bf3c-9c4f15b6a1ca",
    "client_id": "1b9540e1-6c1e-4214-8d97-6116394ef72c",
    "client_secret": "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4",
}

# Power BI GCC endpoints
PBI_SCOPE = "https://analysis.usgovcloudapi.net/powerbi/api/.default"
PBI_BASE = "https://api.powerbigov.us/v1.0/myorg"

def get_token():
    app = ConfidentialClientApplication(
        CONFIG["client_id"],
        authority=f"https://login.microsoftonline.com/{CONFIG['tenant_id']}",
        client_credential=CONFIG["client_secret"]
    )
    result = app.acquire_token_for_client(scopes=[PBI_SCOPE])
    if "access_token" in result:
        return result["access_token"]
    else:
        print(f"Token error: {result.get('error_description')}")
        return None


def main():
    print("=" * 60)
    print("  POWER BI API TEST (Government Cloud)")
    print("=" * 60)
    
    token = get_token()
    if not token:
        print("❌ Failed to get token")
        return
    
    print("✅ Got access token")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Test various endpoints
    endpoints = [
        # Standard user endpoints
        ("Get Groups (Workspaces)", f"{PBI_BASE}/groups"),
        ("Get Capacities", f"{PBI_BASE}/capacities"),
        # Admin endpoints
        ("Admin - Get Groups", f"{PBI_BASE}/admin/groups?$top=5"),
    ]
    
    print("\n📡 Testing API endpoints...\n")
    
    for name, url in endpoints:
        resp = requests.get(url, headers=headers)
        status = "✅" if resp.status_code == 200 else "❌"
        print(f"{status} {name}: HTTP {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            if "value" in data:
                print(f"   Found {len(data['value'])} items")
                for item in data["value"][:3]:
                    print(f"   - {item.get('name', item.get('displayName', 'N/A'))}")
        elif resp.status_code == 401:
            print(f"   Unauthorized - may need Power BI Admin consent")
        elif resp.status_code == 403:
            print(f"   Forbidden - service principal not added to workspace")
    
    print("\n" + "=" * 60)
    print("  DIAGNOSIS")
    print("=" * 60)
    
    print("""
For Service Principal to work with Power BI, you need to:

1. Go to Power BI Admin Portal (app.powerbigov.us)
2. Settings → Admin portal → Tenant settings
3. Enable "Allow service principals to use Power BI APIs"
4. Add the service principal to a security group
5. Specify that security group in the setting

OR use Delegated authentication (user login) instead of 
Application authentication for Power BI operations.
""")


if __name__ == "__main__":
    main()
