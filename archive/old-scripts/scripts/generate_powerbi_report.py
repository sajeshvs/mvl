"""
Power BI Report Generator - Agentic Report Creation
====================================================

This script creates Power BI reports programmatically by:
1. Generating a PBIX file with report definitions
2. Importing it to Power BI Service via API
3. Rebinding to the existing push dataset

PBIX files are ZIP archives with specific structure.
"""

import json
import zipfile
import base64
import requests
import io
import os
from pathlib import Path
from msal import ConfidentialClientApplication
from datetime import datetime

# Configuration
TENANT_ID = "416328e6-260f-438f-bf3c-9c4f15b6a1ca"
CLIENT_ID = "1b9540e1-6c1e-4214-8d97-6116394ef72c"
CLIENT_SECRET = "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4"
WORKSPACE_ID = "4913fadb-9d03-4742-9e8c-39412a64a93f"
DATASET_ID = "c725ca87-7e4b-4a83-819c-55b1bdcbceeb"
PBI_API_BASE = "https://api.powerbigov.us/v1.0/myorg"
PBI_SCOPE = "https://analysis.usgovcloudapi.net/powerbi/api/.default"

def get_pbi_token():
    """Get Power BI API access token"""
    app = ConfidentialClientApplication(
        CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{TENANT_ID}",
        client_credential=CLIENT_SECRET
    )
    result = app.acquire_token_for_client(scopes=[PBI_SCOPE])
    return result["access_token"]

def get_headers():
    """Get API headers with auth token"""
    token = get_pbi_token()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

# Power BI Report Definition JSON (report layout specification)
def create_report_layout(report_name: str, pages: list) -> dict:
    """Create a Power BI report layout definition"""
    
    layout = {
        "id": 0,
        "reportId": 0,
        "modelId": 0,
        "displayOption": 1,
        "defaultDrillFilterOtherVisuals": True,
        "sections": [],
        "config": json.dumps({
            "version": "5.50",
            "themeCollection": {
                "baseTheme": {
                    "name": "CY24SU02",
                    "version": "5.50",
                    "type": 2
                }
            },
            "activeSectionIndex": 0,
            "linguisticSchemaSyncVersion": 2,
            "settings": {
                "useStylableVisualContainerHeader": True,
                "exportDataMode": 1
            },
            "objects": {
                "section": [{"properties": {"verticalAlignment": {"expr": {"Literal": {"Value": "'Top'"}}}}}]
            }
        }),
        "filters": "[]",
        "layoutOptimization": 0,
        "publicCustomVisuals": [],
        "resourcePackages": []
    }
    
    for idx, page in enumerate(pages):
        section = create_page_section(page, idx)
        layout["sections"].append(section)
    
    return layout

def create_page_section(page: dict, index: int) -> dict:
    """Create a page/section in the report"""
    
    visuals = []
    for vis_config in page.get("visuals", []):
        visual = create_visual(vis_config)
        visuals.append(visual)
    
    section = {
        "id": index,
        "name": f"ReportSection{index}",
        "displayName": page["displayName"],
        "ordinal": index,
        "visualContainers": visuals,
        "config": json.dumps({
            "layouts": [{"id": 0, "position": {"x": 0, "y": 0, "z": 0, "width": 1280, "height": 720, "tabOrder": 0}}],
            "name": f"ReportSection{index}",
            "displayName": page["displayName"]
        }),
        "filters": "[]",
        "width": 1280,
        "height": 720,
        "displayOption": 1
    }
    
    return section

def create_visual(config: dict) -> dict:
    """Create a visual container"""
    
    visual_type_map = {
        "card": "card",
        "barChart": "barChart",
        "clusteredBarChart": "clusteredBarChart",
        "lineChart": "lineChart",
        "pieChart": "pieChart",
        "donutChart": "donutChart",
        "funnel": "funnel",
        "table": "tableEx",
        "slicer": "slicer"
    }
    
    pos = config.get("position", {"x": 0, "y": 0, "width": 300, "height": 200})
    vtype = visual_type_map.get(config.get("type", "card"), "card")
    
    visual = {
        "x": pos["x"],
        "y": pos["y"],
        "z": 0,
        "width": pos["width"],
        "height": pos["height"],
        "config": json.dumps({
            "name": config.get("id", f"visual_{id(config)}"),
            "layouts": [{
                "id": 0,
                "position": {
                    "x": pos["x"],
                    "y": pos["y"],
                    "z": 0,
                    "width": pos["width"],
                    "height": pos["height"]
                }
            }],
            "singleVisual": {
                "visualType": vtype,
                "projections": {},
                "prototypeQuery": {},
                "objects": {
                    "general": [{"properties": {"responsive": {"expr": {"Literal": {"Value": "true"}}}}}]
                }
            },
            "parentGroupName": None
        }),
        "filters": "[]",
        "query": "",
        "dataTransforms": ""
    }
    
    return visual

def create_minimal_pbix(report_name: str) -> bytes:
    """
    Create a minimal PBIX file structure.
    
    PBIX is a ZIP with:
    - [Content_Types].xml
    - DataModelSchema (JSON)
    - DiagramState
    - Metadata
    - Report/Layout (JSON)
    - SecurityBindings
    - Settings
    - Version
    """
    
    buffer = io.BytesIO()
    
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Content Types
        content_types = '''<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="json" ContentType="application/json"/>
    <Default Extension="xml" ContentType="application/xml"/>
</Types>'''
        zf.writestr("[Content_Types].xml", content_types)
        
        # Version
        zf.writestr("Version", "2.127.602.0")
        
        # Settings
        settings = json.dumps({
            "ReportSettings": {
                "DefaultDrillFilterOtherVisuals": True
            }
        })
        zf.writestr("Settings", settings)
        
        # Metadata
        metadata = json.dumps({
            "version": "1.0",
            "createdFrom": "MVL Supply Intel Hub Agent",
            "queryVersion": 0
        })
        zf.writestr("Metadata", metadata)
        
        # SecurityBindings (empty)
        zf.writestr("SecurityBindings", "")
        
        # DiagramState
        diagram = json.dumps({"version": 1, "diagrams": []})
        zf.writestr("DiagramState", diagram)
        
        # Report Layout - This defines the actual visuals
        pages = [
            {
                "displayName": "Supplier Marketplace",
                "visuals": [
                    {"type": "card", "id": "kpi1", "position": {"x": 20, "y": 20, "width": 200, "height": 100}},
                    {"type": "card", "id": "kpi2", "position": {"x": 230, "y": 20, "width": 200, "height": 100}},
                    {"type": "card", "id": "kpi3", "position": {"x": 440, "y": 20, "width": 200, "height": 100}},
                    {"type": "card", "id": "kpi4", "position": {"x": 650, "y": 20, "width": 200, "height": 100}},
                    {"type": "card", "id": "kpi5", "position": {"x": 860, "y": 20, "width": 200, "height": 100}},
                    {"type": "funnel", "id": "funnel1", "position": {"x": 20, "y": 140, "width": 400, "height": 280}},
                    {"type": "barChart", "id": "bar1", "position": {"x": 440, "y": 140, "width": 400, "height": 280}},
                    {"type": "donutChart", "id": "donut1", "position": {"x": 860, "y": 140, "width": 380, "height": 280}},
                    {"type": "table", "id": "table1", "position": {"x": 20, "y": 440, "width": 1220, "height": 260}},
                ]
            },
            {
                "displayName": "Global Spend Analysis", 
                "visuals": [
                    {"type": "card", "id": "spend_kpi1", "position": {"x": 20, "y": 20, "width": 180, "height": 100}},
                    {"type": "card", "id": "spend_kpi2", "position": {"x": 210, "y": 20, "width": 180, "height": 100}},
                    {"type": "card", "id": "spend_kpi3", "position": {"x": 400, "y": 20, "width": 180, "height": 100}},
                    {"type": "card", "id": "spend_kpi4", "position": {"x": 590, "y": 20, "width": 180, "height": 100}},
                    {"type": "card", "id": "spend_kpi5", "position": {"x": 780, "y": 20, "width": 180, "height": 100}},
                    {"type": "card", "id": "spend_kpi6", "position": {"x": 970, "y": 20, "width": 180, "height": 100}},
                    {"type": "lineChart", "id": "trend1", "position": {"x": 20, "y": 140, "width": 700, "height": 280}},
                    {"type": "donutChart", "id": "spend_donut", "position": {"x": 740, "y": 140, "width": 400, "height": 280}},
                    {"type": "barChart", "id": "spend_bar1", "position": {"x": 20, "y": 440, "width": 550, "height": 260}},
                    {"type": "barChart", "id": "spend_bar2", "position": {"x": 590, "y": 440, "width": 550, "height": 260}},
                ]
            },
            {
                "displayName": "Disciplines Consolidated",
                "visuals": [
                    {"type": "card", "id": "disc_kpi1", "position": {"x": 20, "y": 20, "width": 200, "height": 100}},
                    {"type": "card", "id": "disc_kpi2", "position": {"x": 230, "y": 20, "width": 200, "height": 100}},
                    {"type": "card", "id": "disc_kpi3", "position": {"x": 440, "y": 20, "width": 200, "height": 100}},
                    {"type": "card", "id": "disc_kpi4", "position": {"x": 650, "y": 20, "width": 200, "height": 100}},
                    {"type": "card", "id": "disc_kpi5", "position": {"x": 860, "y": 20, "width": 200, "height": 100}},
                    {"type": "clusteredBarChart", "id": "disc_bar1", "position": {"x": 20, "y": 140, "width": 600, "height": 300}},
                    {"type": "clusteredBarChart", "id": "disc_bar2", "position": {"x": 640, "y": 140, "width": 600, "height": 300}},
                    {"type": "table", "id": "disc_table", "position": {"x": 20, "y": 460, "width": 1220, "height": 240}},
                ]
            }
        ]
        
        layout = create_report_layout(report_name, pages)
        zf.writestr("Report/Layout", json.dumps(layout))
        
        # DataModelSchema - Empty for push datasets (we'll rebind)
        data_model = json.dumps({
            "name": report_name,
            "compatibilityLevel": 1550,
            "model": {
                "culture": "en-US",
                "tables": [],
                "relationships": [],
                "annotations": []
            }
        })
        zf.writestr("DataModelSchema", data_model)
    
    buffer.seek(0)
    return buffer.read()

def import_pbix_to_powerbi(pbix_bytes: bytes, report_name: str) -> dict:
    """Import PBIX file to Power BI Service"""
    
    token = get_pbi_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Import API endpoint
    import_url = f"{PBI_API_BASE}/groups/{WORKSPACE_ID}/imports?datasetDisplayName={report_name}&nameConflict=CreateOrOverwrite"
    
    files = {
        'file': (f'{report_name}.pbix', pbix_bytes, 'application/octet-stream')
    }
    
    print(f"📤 Uploading {report_name}.pbix to Power BI...")
    response = requests.post(import_url, headers=headers, files=files)
    
    if response.status_code in [200, 201, 202]:
        result = response.json()
        print(f"✅ Import started: {result.get('id', 'unknown')}")
        return result
    else:
        print(f"❌ Import failed: {response.status_code}")
        print(response.text)
        return None

def check_import_status(import_id: str) -> dict:
    """Check the status of an import operation"""
    headers = get_headers()
    url = f"{PBI_API_BASE}/groups/{WORKSPACE_ID}/imports/{import_id}"
    
    response = requests.get(url, headers=headers)
    return response.json()

def rebind_report_to_dataset(report_id: str, dataset_id: str) -> bool:
    """Rebind a report to use a different dataset"""
    headers = get_headers()
    url = f"{PBI_API_BASE}/groups/{WORKSPACE_ID}/reports/{report_id}/Rebind"
    
    body = {"datasetId": dataset_id}
    response = requests.post(url, headers=headers, json=body)
    
    return response.status_code == 200

def list_reports() -> list:
    """List all reports in the workspace"""
    headers = get_headers()
    url = f"{PBI_API_BASE}/groups/{WORKSPACE_ID}/reports"
    response = requests.get(url, headers=headers)
    return response.json().get("value", [])

def execute_dax_query(query: str) -> dict:
    """Execute a DAX query against the dataset"""
    headers = get_headers()
    url = f"{PBI_API_BASE}/groups/{WORKSPACE_ID}/datasets/{DATASET_ID}/executeQueries"
    
    body = {
        "queries": [{"query": query}],
        "serializerSettings": {"includeNulls": True}
    }
    
    response = requests.post(url, headers=headers, json=body)
    return response.json()

def get_data_summary() -> dict:
    """Get summary statistics from the dataset"""
    
    queries = {
        "Quotations": """
            EVALUATE 
            SUMMARIZECOLUMNS(
                "TotalQuotations", COUNT(Quotations[QuotationID]),
                "TotalValue", SUM(Quotations[ValueUSD]),
                "UniqueSuppliers", DISTINCTCOUNT(Quotations[SupplierCode])
            )
        """,
        "PurchaseOrders": """
            EVALUATE
            SUMMARIZECOLUMNS(
                "TotalPOs", COUNT(PurchaseOrders[PONumber]),
                "TotalSpend", SUM(PurchaseOrders[POAmount])
            )
        """
    }
    
    summary = {}
    for name, query in queries.items():
        result = execute_dax_query(query)
        if "results" in result and result["results"]:
            rows = result["results"][0].get("tables", [{}])[0].get("rows", [])
            if rows:
                summary[name] = rows[0]
    
    return summary

def main():
    """Main execution"""
    print("=" * 70)
    print("  MVL SUPPLY INTEL HUB - AGENTIC REPORT CREATION")
    print("=" * 70)
    
    # Get current data summary
    print("\n📊 Checking dataset...")
    try:
        summary = get_data_summary()
        print("  Dataset contains:")
        for table, stats in summary.items():
            print(f"    {table}: {stats}")
    except Exception as e:
        print(f"  Warning: Could not get summary: {e}")
    
    # Generate PBIX
    print("\n📦 Generating PBIX file...")
    report_name = "MVL-SupplyIntelHub-Dashboard"
    pbix_bytes = create_minimal_pbix(report_name)
    print(f"  Generated {len(pbix_bytes)} bytes")
    
    # Save locally for inspection
    output_path = Path(__file__).parent / f"{report_name}.pbix"
    with open(output_path, 'wb') as f:
        f.write(pbix_bytes)
    print(f"  Saved to: {output_path}")
    
    # Import to Power BI
    print("\n📤 Importing to Power BI Service...")
    result = import_pbix_to_powerbi(pbix_bytes, report_name)
    
    if result:
        import_id = result.get("id")
        print(f"\n⏳ Checking import status...")
        
        import time
        for _ in range(10):  # Wait up to 30 seconds
            time.sleep(3)
            status = check_import_status(import_id)
            state = status.get("importState", "Unknown")
            print(f"  Status: {state}")
            
            if state == "Succeeded":
                reports = status.get("reports", [])
                datasets = status.get("datasets", [])
                
                if reports:
                    report_id = reports[0].get("id")
                    print(f"\n✅ Report created: {reports[0].get('name')}")
                    print(f"   ID: {report_id}")
                    
                    # Try to rebind to existing push dataset
                    print(f"\n🔗 Rebinding to push dataset {DATASET_ID}...")
                    if rebind_report_to_dataset(report_id, DATASET_ID):
                        print("   ✅ Rebind successful!")
                    else:
                        print("   ⚠️ Rebind not available for this configuration")
                    
                    # Print report URL
                    report_url = f"https://app.powerbigov.us/groups/{WORKSPACE_ID}/reports/{report_id}"
                    print(f"\n🔗 Report URL: {report_url}")
                break
            elif state == "Failed":
                print(f"  ❌ Import failed")
                print(f"  Error: {status}")
                break
    
    # List all reports
    print("\n📋 Reports in workspace:")
    for report in list_reports():
        print(f"  • {report.get('name')} ({report.get('id')})")
    
    print("\n" + "=" * 70)
    print("  DONE")
    print("=" * 70)

if __name__ == "__main__":
    main()
