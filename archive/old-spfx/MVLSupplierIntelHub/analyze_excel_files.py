import pandas as pd
import json
import os

# File paths
base_path = r"g:\Rita\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data"
supplier_file = os.path.join(base_path, "MVL_Suppliers_List_Feb-05-2026 .xlsx")
po_file = os.path.join(base_path, "PO_List_Jan-23-2026.xls")
quotation_folder = os.path.join(base_path, "Quotation Reports")

print("=" * 80)
print("ANALYZING MVL SUPPLIER LIST")
print("=" * 80)

# Read Supplier List
try:
    supplier_df = pd.read_excel(supplier_file)
    print(f"\nTotal Rows: {len(supplier_df)}")
    print(f"Total Columns: {len(supplier_df.columns)}")
    print(f"\nColumn Names:")
    for i, col in enumerate(supplier_df.columns, 1):
        print(f"  {i}. {col}")
    
    print(f"\nData Types:")
    print(supplier_df.dtypes)
    
    print(f"\nFirst 3 Rows Sample:")
    print(supplier_df.head(3).to_string())
    
    print(f"\nNull/Missing Values Count:")
    print(supplier_df.isnull().sum())
    
except Exception as e:
    print(f"Error reading supplier file: {e}")

print("\n" + "=" * 80)
print("ANALYZING PO LIST")
print("=" * 80)

# Read PO List
try:
    po_df = pd.read_excel(po_file)
    print(f"\nTotal Rows: {len(po_df)}")
    print(f"Total Columns: {len(po_df.columns)}")
    print(f"\nColumn Names:")
    for i, col in enumerate(po_df.columns, 1):
        print(f"  {i}. {col}")
    
    print(f"\nData Types:")
    print(po_df.dtypes)
    
    print(f"\nFirst 3 Rows Sample:")
    print(po_df.head(3).to_string())
    
    print(f"\nNull/Missing Values Count:")
    print(po_df.isnull().sum())
    
except Exception as e:
    print(f"Error reading PO file: {e}")

print("\n" + "=" * 80)
print("ANALYZING QUOTATION REPORTS")
print("=" * 80)

# Read all Quotation files
quotation_files = [f for f in os.listdir(quotation_folder) if f.endswith('.xls') or f.endswith('.xlsx')]
print(f"\nFound {len(quotation_files)} quotation files:")
for qf in quotation_files:
    print(f"  - {qf}")

# Analyze first quotation file as sample
try:
    first_quotation = os.path.join(quotation_folder, quotation_files[0])
    quot_df = pd.read_excel(first_quotation)
    print(f"\nAnalyzing: {quotation_files[0]}")
    print(f"Total Rows: {len(quot_df)}")
    print(f"Total Columns: {len(quot_df.columns)}")
    print(f"\nColumn Names:")
    for i, col in enumerate(quot_df.columns, 1):
        print(f"  {i}. {col}")
    
    print(f"\nData Types:")
    print(quot_df.dtypes)
    
    print(f"\nFirst 3 Rows Sample:")
    print(quot_df.head(3).to_string())
    
    print(f"\nNull/Missing Values Count:")
    print(quot_df.isnull().sum())
    
    # Check for series number or similar identifier
    print(f"\nChecking for potential series/unique identifiers...")
    for col in quot_df.columns:
        if 'series' in col.lower() or 'number' in col.lower() or 'id' in col.lower() or 'no' in col.lower():
            print(f"  Possible identifier column: {col}")
            print(f"    Sample values: {quot_df[col].head(5).tolist()}")
    
except Exception as e:
    print(f"Error reading quotation file: {e}")

print("\n" + "=" * 80)
print("ANALYSIS COMPLETE")
print("=" * 80)
