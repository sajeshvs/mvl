"""
Power BI Agentic Report Creator
===============================

This script provides multiple approaches to create Power BI reports
programmatically without user interaction:

1. Browser Automation - Opens Power BI Service and guides through creation
2. Quick Report URL - Direct deep link to create report from dataset
3. Power BI Template - Exports report specs for manual import

Since Power BI API doesn't support direct report creation with visuals,
we use browser automation as the most practical agentic approach.
"""

import os
import sys
import json
import time
import webbrowser
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

# Configuration
@dataclass
class PowerBIConfig:
    workspace_id: str = "4913fadb-9d03-4742-9e8c-39412a64a93f"
    dataset_id: str = "c725ca87-7e4b-4a83-819c-55b1bdcbceeb"
    base_url: str = "https://app.powerbigov.us"
    
    @property
    def workspace_url(self) -> str:
        return f"{self.base_url}/groups/{self.workspace_id}"
    
    @property
    def dataset_url(self) -> str:
        return f"{self.workspace_url}/datasets/{self.dataset_id}"
    
    @property
    def create_report_url(self) -> str:
        """Deep link to create a new report from the dataset"""
        return f"{self.dataset_url}/details?experience=power-bi"
    
    @property
    def quick_create_url(self) -> str:
        """Quick create report URL (auto-generates a basic report)"""
        return f"{self.base_url}/quickcreate?experience=power-bi&datasetId={self.dataset_id}&workspaceId={self.workspace_id}"

config = PowerBIConfig()

# Report Templates matching v3 HTML designs
REPORT_TEMPLATES = {
    "supplier_marketplace": {
        "name": "Supplier Marketplace",
        "description": "Quotation analysis, supplier rankings, entity/material breakdown",
        "pages": [{
            "name": "Supplier Marketplace",
            "visuals": [
                {"type": "Card", "title": "Total Quotations", "field": "COUNT(Quotations[QuotationID])"},
                {"type": "Card", "title": "Total Quoted Value", "field": "SUM(Quotations[ValueUSD])", "format": "$#,##0"},
                {"type": "Card", "title": "Active Suppliers", "field": "DISTINCTCOUNT(Quotations[SupplierCode])"},
                {"type": "Card", "title": "Win Rate", "field": "DIVIDE(CALCULATE(COUNT(Quotations[QuotationID]), Quotations[Status]=\"Order\"), COUNT(Quotations[QuotationID]))"},
                {"type": "Card", "title": "Avg Quote Value", "field": "AVERAGE(Quotations[ValueUSD])"},
                {"type": "Funnel", "title": "Quotation Funnel", "category": "Status", "value": "COUNT(QuotationID)"},
                {"type": "Bar Chart", "title": "Top Suppliers by Value", "category": "SupplierCode", "value": "SUM(ValueUSD)", "topN": 10},
                {"type": "Donut Chart", "title": "Quotations by Entity", "category": "Entity", "value": "COUNT(QuotationID)"},
                {"type": "Bar Chart", "title": "Spend by Discipline", "category": "Discipline", "value": "SUM(ValueUSD)"},
                {"type": "Table", "title": "Quotation Details", "columns": ["QuotationID", "Status", "ValueUSD", "Entity", "Discipline", "ClientName"]}
            ],
            "slicers": ["Entity", "Discipline", "Status"]
        }]
    },
    "global_spend": {
        "name": "Global Spend Analysis",
        "description": "PO spend trends, entity/material breakdown, supplier performance",
        "pages": [{
            "name": "Global Spend Analysis",
            "visuals": [
                {"type": "Card", "title": "Total Spend", "field": "SUM(PurchaseOrders[POAmount])", "format": "$#,##0"},
                {"type": "Card", "title": "PO Count", "field": "COUNT(PurchaseOrders[PONumber])"},
                {"type": "Card", "title": "Avg PO Value", "field": "AVERAGE(PurchaseOrders[POAmount])"},
                {"type": "Card", "title": "Active Suppliers", "field": "DISTINCTCOUNT(PurchaseOrders[SupplierCode])"},
                {"type": "Card", "title": "Entities", "field": "DISTINCTCOUNT(PurchaseOrders[EntityCode])"},
                {"type": "Card", "title": "Categories", "field": "DISTINCTCOUNT(PurchaseOrders[MaterialCategory])"},
                {"type": "Line Chart", "title": "Monthly Spend Trend", "x": "Month", "y": "TotalSpend", "table": "SpendByMonth"},
                {"type": "Donut Chart", "title": "Spend by Entity", "category": "EntityName", "value": "SUM(POAmount)"},
                {"type": "Bar Chart", "title": "Spend by Category", "category": "MaterialCategory", "value": "SUM(POAmount)"},
                {"type": "Bar Chart", "title": "Top Suppliers", "category": "SupplierName", "value": "SUM(POAmount)", "topN": 10}
            ],
            "slicers": ["EntityName", "MaterialCategory", "SupplierName"]
        }]
    },
    "disciplines": {
        "name": "Disciplines Consolidated",
        "description": "Quote vs Order comparison by discipline",
        "pages": [{
            "name": "Disciplines",
            "visuals": [
                {"type": "Card", "title": "Disciplines", "field": "DISTINCTCOUNT(Disciplines[DisciplineName])"},
                {"type": "Card", "title": "Total Quoted", "field": "SUM(Disciplines[TotalQuotedAmount])"},
                {"type": "Card", "title": "Total Ordered", "field": "SUM(Disciplines[TotalOrderAmount])"},
                {"type": "Card", "title": "Quote Count", "field": "SUM(Disciplines[QuotationCount])"},
                {"type": "Card", "title": "PO Count", "field": "SUM(Disciplines[POCount])"},
                {"type": "Clustered Bar", "title": "Quote vs Order by Discipline", "category": "DisciplineName", "values": ["TotalQuotedAmount", "TotalOrderAmount"]},
                {"type": "Clustered Bar", "title": "Count by Discipline", "category": "DisciplineName", "values": ["QuotationCount", "POCount"]},
                {"type": "Table", "title": "Discipline Summary", "columns": ["DisciplineName", "QuotationCount", "TotalQuotedAmount", "POCount", "TotalOrderAmount"]}
            ],
            "slicers": ["EntityName", "DisciplineName"]
        }]
    }
}


def open_powerbi_create_report():
    """Open Power BI Service to create a report from the dataset"""
    print("\n🌐 Opening Power BI Service...")
    print(f"   URL: {config.create_report_url}")
    webbrowser.open(config.create_report_url)
    print("\n   1. Click 'Create a report' on the dataset page")
    print("   2. Choose 'Start from scratch' or 'Auto-create'")
    print("   3. Build visuals using the specifications below")


def open_quick_create():
    """Open Power BI Quick Create (auto-generates basic report)"""
    print("\n🚀 Opening Power BI Quick Create...")
    print(f"   URL: {config.quick_create_url}")
    webbrowser.open(config.quick_create_url)
    print("\n   Power BI will auto-generate a basic report from the data")


def print_visual_instructions(template_key: str):
    """Print instructions for building a specific report"""
    template = REPORT_TEMPLATES.get(template_key)
    if not template:
        print(f"❌ Unknown template: {template_key}")
        return
    
    print(f"\n{'='*60}")
    print(f"  📊 {template['name']}")
    print(f"{'='*60}")
    print(f"\n{template['description']}\n")
    
    for page in template["pages"]:
        print(f"\n📄 Page: {page['name']}")
        print("-" * 40)
        
        print("\n  Visuals to add:")
        for i, visual in enumerate(page["visuals"], 1):
            print(f"\n  {i}. {visual['type']}: {visual['title']}")
            if "field" in visual:
                print(f"     DAX: {visual['field']}")
            if "category" in visual:
                print(f"     Category: {visual['category']}")
            if "value" in visual:
                print(f"     Value: {visual['value']}")
            if "values" in visual:
                print(f"     Values: {', '.join(visual['values'])}")
            if "columns" in visual:
                print(f"     Columns: {', '.join(visual['columns'])}")
            if "topN" in visual:
                print(f"     Filter: Top {visual['topN']}")
        
        print(f"\n  Slicers: {', '.join(page['slicers'])}")


def automate_with_selenium():
    """Use Selenium to automate report creation"""
    try:
        from selenium import webdriver
        from selenium.webdriver.edge.service import Service
        from selenium.webdriver.edge.options import Options
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from webdriver_manager.microsoft import EdgeChromiumDriverManager
    except ImportError:
        print("❌ Selenium not installed. Run: pip install selenium webdriver-manager")
        return False
    
    print("\n🤖 Starting browser automation...")
    
    # Use Edge (default on Windows with M365)
    options = Options()
    options.add_argument("--start-maximized")
    # Use existing profile for SSO
    user_data_dir = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\User Data")
    options.add_argument(f"--user-data-dir={user_data_dir}")
    options.add_argument("--profile-directory=Default")
    
    try:
        service = Service(EdgeChromiumDriverManager().install())
        driver = webdriver.Edge(service=service, options=options)
    except Exception as e:
        print(f"   ⚠️ Could not start Edge: {e}")
        print("   Falling back to opening URL in default browser...")
        open_powerbi_create_report()
        return False
    
    try:
        # Navigate to dataset
        print(f"   Opening: {config.create_report_url}")
        driver.get(config.create_report_url)
        
        # Wait for page to load
        print("   Waiting for Power BI to load...")
        time.sleep(5)
        
        # Look for "Create a report" button
        try:
            wait = WebDriverWait(driver, 30)
            create_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Create') or contains(@aria-label, 'Create')]")))
            print("   Found 'Create' button, clicking...")
            create_btn.click()
            time.sleep(2)
        except:
            print("   Could not find Create button automatically")
            print("   Browser is open - please click 'Create a report' manually")
        
        print("\n✅ Browser automation complete!")
        print("   The browser will remain open for you to continue.")
        print("   Press Enter when done to close...")
        input()
        
    except Exception as e:
        print(f"❌ Automation error: {e}")
    finally:
        driver.quit()
    
    return True


def export_template_json():
    """Export report templates as JSON for reference"""
    output_path = Path(__file__).parent / "report_templates.json"
    with open(output_path, 'w') as f:
        json.dump(REPORT_TEMPLATES, f, indent=2)
    print(f"\n📁 Templates exported to: {output_path}")


def main():
    print("=" * 60)
    print("  MVL SUPPLY INTEL HUB - AGENTIC REPORT CREATION")
    print("=" * 60)
    print(f"""
Workspace: MVL Supply Intelligence Hub
Dataset:   MVL-SupplyIntelHub-Data (15,779 rows)
Cloud:     Power BI GCC (app.powerbigov.us)

Available Actions:
  1. Open Power BI to create report (browser)
  2. Open Quick Create (auto-generate report)
  3. Show Supplier Marketplace template
  4. Show Global Spend template
  5. Show Disciplines template
  6. Automate with Selenium
  7. Export templates to JSON
  8. Exit
""")
    
    while True:
        choice = input("\nSelect action (1-8): ").strip()
        
        if choice == "1":
            open_powerbi_create_report()
        elif choice == "2":
            open_quick_create()
        elif choice == "3":
            print_visual_instructions("supplier_marketplace")
        elif choice == "4":
            print_visual_instructions("global_spend")
        elif choice == "5":
            print_visual_instructions("disciplines")
        elif choice == "6":
            automate_with_selenium()
        elif choice == "7":
            export_template_json()
        elif choice == "8":
            print("\n👋 Goodbye!")
            break
        else:
            print("Invalid choice. Enter 1-8.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd == "--open":
            open_powerbi_create_report()
        elif cmd == "--quick":
            open_quick_create()
        elif cmd == "--auto":
            automate_with_selenium()
        elif cmd == "--template":
            template = sys.argv[2] if len(sys.argv) > 2 else "supplier_marketplace"
            print_visual_instructions(template)
        elif cmd == "--export":
            export_template_json()
        else:
            print(f"Unknown command: {cmd}")
            print("Usage: python powerbi_agentic_creator.py [--open|--quick|--auto|--template <name>|--export]")
    else:
        main()
