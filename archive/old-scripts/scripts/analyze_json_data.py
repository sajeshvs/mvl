"""
Analyze the structure of v3 JSON data files from Microtrack export
"""
import json
from pathlib import Path

# Load all three JSON files
base_path = Path("c:/Users/Sajesh/Documents/Apps/Rita/PowerBI/v3")

print("=" * 60)
print("  ANALYZING MICROTRACK DATA FROM V3 JSON FILES")
print("=" * 60)

# Supplier Marketplace
print("\n📦 SUPPLIER MARKETPLACE (supplier-marketplace/data.json)")
print("-" * 60)
sm_data = json.load(open(base_path / "supplier-marketplace/data.json"))
print(f"Last Refresh: {sm_data.get('lastRefresh')}")
print(f"Summary: {sm_data.get('summary')}")
print(f"\nData sections:")
for key in sm_data.keys():
    if key not in ['summary', 'lastRefresh', 'funnel', 'statusSummary']:
        val = sm_data[key]
        if isinstance(val, list):
            print(f"  • {key}: {len(val)} records")
            if val:
                print(f"    Sample keys: {list(val[0].keys())[:8]}")

# Global Spend Analysis
print("\n\n💰 GLOBAL SPEND ANALYSIS (global-spend-analysis/data.json)")
print("-" * 60)
gs_data = json.load(open(base_path / "global-spend-analysis/data.json"))
print(f"Summary: {gs_data.get('summary')}")
print(f"\nData sections:")
for key in gs_data.keys():
    if key not in ['summary', 'filters']:
        val = gs_data[key]
        if isinstance(val, list):
            print(f"  • {key}: {len(val)} records")
            if val:
                print(f"    Sample keys: {list(val[0].keys())[:8]}")

# Disciplines Consolidated
print("\n\n📊 DISCIPLINES CONSOLIDATED (disciplines-consolidated/data.json)")
print("-" * 60)
dc_data = json.load(open(base_path / "disciplines-consolidated/data.json"))
print(f"Summary: {dc_data.get('summary')}")
print(f"\nData sections:")
for key in dc_data.keys():
    if key not in ['summary', 'filters']:
        val = dc_data[key]
        if isinstance(val, list):
            print(f"  • {key}: {len(val)} records")
            if val:
                print(f"    Sample keys: {list(val[0].keys())[:8]}")

# Show workbench structure (detailed PO/Quotation records)
print("\n\n📋 WORKBENCH DETAIL (Transactional Records)")
print("-" * 60)
if sm_data.get('workbench'):
    print("Supplier Marketplace workbench sample:")
    sample = sm_data['workbench'][0]
    for k, v in sample.items():
        print(f"  {k}: {type(v).__name__} = {str(v)[:50]}")

if gs_data.get('workbench'):
    print("\nGlobal Spend workbench sample:")
    sample = gs_data['workbench'][0]
    for k, v in sample.items():
        print(f"  {k}: {type(v).__name__} = {str(v)[:50]}")

# Count unique values for key dimensions
print("\n\n📈 DATA SUMMARY FOR SHAREPOINT LOAD")
print("-" * 60)

# Collect unique entities, suppliers, disciplines from workbench
if sm_data.get('workbench'):
    entities = set()
    suppliers = set()
    disciplines = set()
    for row in sm_data['workbench']:
        entities.add(row.get('Entity', ''))
        suppliers.add(row.get('SupplierName', ''))
        disciplines.add(row.get('Discipline', ''))
    
    print(f"Unique Entities: {len(entities)}")
    print(f"Unique Suppliers: {len(suppliers)}")
    print(f"Unique Disciplines: {len(disciplines)}")
    print(f"Total Transactions: {len(sm_data['workbench'])}")
