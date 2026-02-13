"""
Power BI Report Creator for MVL Supply Intelligence Hub
========================================================

This script provides the direct URLs and instructions to create
Power BI reports from the push dataset in Power BI GCC.

Since Power BI REST API doesn't support creating reports with visuals
programmatically (only Power BI Desktop or the web interface can do this),
this script provides:

1. Direct links to create reports in Power BI Service
2. DAX measure definitions to add
3. Visual specifications matching v3 HTML designs
"""

import json
import webbrowser
from pathlib import Path

# Configuration
WORKSPACE_ID = "4913fadb-9d03-4742-9e8c-39412a64a93f"
DATASET_ID = "c725ca87-7e4b-4a83-819c-55b1bdcbceeb"
PBI_BASE_URL = "https://app.powerbigov.us"

def get_create_report_url():
    """Get the URL to create a new report from the dataset"""
    return f"{PBI_BASE_URL}/groups/{WORKSPACE_ID}/datasets/{DATASET_ID}/details?experience=power-bi"

def get_workspace_url():
    """Get the workspace URL"""
    return f"{PBI_BASE_URL}/groups/{WORKSPACE_ID}?experience=power-bi"

def get_dataset_url():
    """Get the dataset URL"""
    return f"{PBI_BASE_URL}/groups/{WORKSPACE_ID}/datasets/{DATASET_ID}"

# DAX Measures to add in Power BI Service
DAX_MEASURES = {
    "Quotations": [
        {
            "name": "Total Quotations",
            "expression": "COUNT(Quotations[QuotationNumber])"
        },
        {
            "name": "Total Quoted Value",
            "expression": 'FORMAT(SUM(Quotations[QuotedAmount]), "$#,##0")'
        },
        {
            "name": "Active Suppliers",
            "expression": "DISTINCTCOUNT(Quotations[SupplierCode])"
        },
        {
            "name": "Win Rate",
            "expression": '''DIVIDE(
    CALCULATE(COUNT(Quotations[QuotationNumber]), Quotations[Status]="Accepted"),
    COUNT(Quotations[QuotationNumber]),
    0
)'''
        },
        {
            "name": "Avg Quote Value",
            "expression": 'FORMAT(AVERAGE(Quotations[QuotedAmount]), "$#,##0")'
        }
    ],
    "PurchaseOrders": [
        {
            "name": "Total Spend",
            "expression": 'FORMAT(SUM(PurchaseOrders[POAmount]), "$#,##0")'
        },
        {
            "name": "PO Count",
            "expression": "COUNT(PurchaseOrders[PONumber])"
        },
        {
            "name": "Avg PO Value",
            "expression": 'FORMAT(AVERAGE(PurchaseOrders[POAmount]), "$#,##0")'
        },
        {
            "name": "Supplier Count",
            "expression": "DISTINCTCOUNT(PurchaseOrders[SupplierCode])"
        }
    ],
    "Disciplines": [
        {
            "name": "Conversion Rate",
            "expression": '''DIVIDE(
    SUM(Disciplines[TotalOrderAmount]),
    SUM(Disciplines[TotalQuotedAmount]),
    0
)'''
        }
    ]
}

# Report Visual Specifications (matching v3 HTML designs)
REPORT_SPECS = {
    "Supplier Marketplace": {
        "description": "Quotation analysis, supplier rankings, entity breakdown",
        "kpi_cards": [
            "Total Quotations",
            "Total Quoted Value ($)", 
            "Active Suppliers",
            "Win Rate (%)",
            "Average Quote Value"
        ],
        "charts": [
            {
                "type": "Funnel Chart",
                "title": "Quotation Funnel",
                "category": "Status",
                "values": "Count of QuotationNumber",
                "data_from": "Quotations table"
            },
            {
                "type": "Bar Chart (Horizontal)",
                "title": "Top 10 Suppliers by Quote Value",
                "category": "SupplierName", 
                "values": "Sum of QuotedAmount",
                "filter": "Top 10 by Sum of QuotedAmount"
            },
            {
                "type": "Donut Chart",
                "title": "Quotations by Entity",
                "category": "EntityName",
                "values": "Count of QuotationNumber"
            },
            {
                "type": "Bar Chart",
                "title": "Spend by Material Category",
                "category": "MaterialCategory",
                "values": "Sum of QuotedAmount"
            },
            {
                "type": "Table",
                "title": "Quotation Details",
                "columns": ["QuotationNumber", "SupplierName", "EntityName", "MaterialCategory", "QuotedAmount", "Status", "QuotationDate"]
            }
        ],
        "slicers": ["EntityName", "MaterialCategory", "Status", "QuotationDate (date range)"]
    },
    "Global Spend Analysis": {
        "description": "PO spend trends, entity/material breakdown, supplier performance",
        "kpi_cards": [
            "Total Spend ($)",
            "PO Count",
            "Avg PO Value",
            "Active Suppliers",
            "Entities",
            "Material Categories"
        ],
        "charts": [
            {
                "type": "Line Chart",
                "title": "Monthly Spend Trend",
                "x_axis": "Month (from SpendByMonth)",
                "y_axis": "TotalSpend",
                "data_from": "SpendByMonth table"
            },
            {
                "type": "Donut Chart", 
                "title": "Spend by Entity",
                "category": "EntityName",
                "values": "Sum of POAmount"
            },
            {
                "type": "Bar Chart",
                "title": "Spend by Material Category",
                "category": "MaterialCategory",
                "values": "Sum of POAmount"
            },
            {
                "type": "Bar Chart (Horizontal)",
                "title": "Top 10 Suppliers by Spend",
                "category": "SupplierName",
                "values": "Sum of POAmount",
                "filter": "Top 10 by Sum of POAmount"
            }
        ],
        "slicers": ["EntityName", "MaterialCategory", "SupplierName", "PODate (date range)"]
    },
    "Disciplines Consolidated": {
        "description": "Quote vs Order comparison by discipline",
        "kpi_cards": [
            "Total Disciplines",
            "Total Quoted ($)",
            "Total Ordered ($)",
            "Quote Count",
            "PO Count"
        ],
        "charts": [
            {
                "type": "Clustered Bar Chart",
                "title": "Quote vs Order Amount by Discipline",
                "category": "DisciplineName",
                "values": ["TotalQuotedAmount", "TotalOrderAmount"],
                "legend": "Quoted vs Ordered"
            },
            {
                "type": "Clustered Bar Chart",
                "title": "Quote vs PO Count by Discipline", 
                "category": "DisciplineName",
                "values": ["QuotationCount", "POCount"],
                "legend": "Quotes vs POs"
            },
            {
                "type": "Table",
                "title": "Discipline Summary",
                "columns": ["DisciplineName", "QuotationCount", "TotalQuotedAmount", "POCount", "TotalOrderAmount"]
            }
        ],
        "slicers": ["EntityName", "DisciplineName"]
    }
}

def print_report_instructions():
    """Print step-by-step instructions for creating reports"""
    print("=" * 70)
    print("  POWER BI REPORT CREATION GUIDE")
    print("  MVL Supply Intelligence Hub")
    print("=" * 70)
    
    print("\n📊 WORKSPACE & DATASET INFO")
    print("-" * 40)
    print(f"Workspace: MVL Supply Intelligence Hub")
    print(f"Dataset:   MVL-SupplyIntelHub-Data")
    print(f"Data:      15,779 rows across 7 tables")
    
    print("\n🔗 QUICK LINKS")
    print("-" * 40)
    print(f"Workspace:     {get_workspace_url()}")
    print(f"Dataset:       {get_dataset_url()}")
    print(f"Create Report: {get_create_report_url()}")
    
    print("\n" + "=" * 70)
    print("  STEP-BY-STEP INSTRUCTIONS")
    print("=" * 70)
    
    print("""
STEP 1: Open Power BI Service
-----------------------------
Navigate to: {workspace_url}
Or run this script with --open flag to auto-open

STEP 2: Create New Report
-------------------------
1. Click on the dataset "MVL-SupplyIntelHub-Data"
2. Click "Create a report" → "Start from scratch" 

STEP 3: Build Each Report Page
------------------------------
""".format(workspace_url=get_workspace_url()))

    for report_name, spec in REPORT_SPECS.items():
        print(f"\n📑 {report_name}")
        print("-" * 40)
        print(f"Description: {spec['description']}")
        
        print("\n  KPI Cards (top row):")
        for kpi in spec['kpi_cards']:
            print(f"    • {kpi}")
        
        print("\n  Charts:")
        for chart in spec['charts']:
            print(f"    • {chart['type']}: {chart['title']}")
            if 'category' in chart:
                print(f"      Category: {chart['category']}")
            if 'values' in chart:
                print(f"      Values: {chart['values']}")
        
        print("\n  Slicers:")
        for slicer in spec['slicers']:
            print(f"    • {slicer}")

    print("\n" + "=" * 70)
    print("  DAX MEASURES TO CREATE")
    print("=" * 70)
    
    for table, measures in DAX_MEASURES.items():
        print(f"\n📐 {table} Table Measures:")
        print("-" * 40)
        for m in measures:
            print(f"\n  {m['name']}:")
            print(f"  {m['expression']}")
    
    print("\n" + "=" * 70)
    print("  THEME SETTINGS")
    print("=" * 70)
    print("""
Apply MVL Corporate theme:
- Primary: #0078D4 (Microsoft Blue)
- Accent:  #D96F3C (Orange) 
- Success: #107C10 (Green)
- Warning: #FFB900 (Yellow)
- Danger:  #D13438 (Red)
- Background: #F5F7FA
""")

def open_powerbi():
    """Open Power BI Service in browser"""
    url = get_create_report_url()
    print(f"\n🌐 Opening Power BI Service...")
    print(f"   URL: {url}")
    webbrowser.open(url)

def export_config():
    """Export configuration to JSON"""
    config = {
        "workspace_id": WORKSPACE_ID,
        "dataset_id": DATASET_ID,
        "urls": {
            "workspace": get_workspace_url(),
            "dataset": get_dataset_url(),
            "create_report": get_create_report_url()
        },
        "dax_measures": DAX_MEASURES,
        "report_specs": REPORT_SPECS
    }
    
    output_path = Path(__file__).parent / "powerbi_report_guide.json"
    with open(output_path, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"\n✅ Configuration exported to: {output_path}")

if __name__ == "__main__":
    import sys
    
    if "--open" in sys.argv:
        open_powerbi()
    elif "--export" in sys.argv:
        export_config()
    else:
        print_report_instructions()
        
        print("\n" + "=" * 70)
        print("  NEXT STEPS")
        print("=" * 70)
        print("""
Options:
  python create_powerbi_reports.py --open    → Open Power BI Service
  python create_powerbi_reports.py --export  → Export config to JSON

The dataset is ready with all 15,779 rows. Create reports in Power BI Service
by following the specifications above to match the v3 HTML dashboard designs.
""")
