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
    
    # Show unique values for key fields
    print(f"\nUnique Materials: {supplier_df['Material'].nunique()}")
    print(f"Material categories: {supplier_df['Material'].value_counts().head(10)}")
    
except Exception as e:
    print(f"Error reading supplier file: {e}")

print("\n" + "=" * 80)
print("ANALYZING PO LIST")
print("=" * 80)

# Try different methods to read PO List
try:
    # Try with ignore_errors
    po_df = pd.read_excel(po_file, engine='xlrd')
    print(f"\nTotal Rows: {len(po_df)}")
    print(f"Total Columns: {len(po_df.columns)}")
    print(f"\nColumn Names:")
    for i, col in enumerate(po_df.columns, 1):
        print(f"  {i}. {col}")
    
    print(f"\nData Types:")
    print(po_df.dtypes)
    
    print(f"\nFirst 5 Rows Sample:")
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', None)
    print(po_df.head(5))
    
    print(f"\nNull/Missing Values Count:")
    print(po_df.isnull().sum())
    
except Exception as e:
    print(f"Error with xlrd engine: {e}")
    try:
        # Try reading with openpyxl by saving as xlsx first or using CSV
        print("\nTrying alternative method...")
        po_df = pd.read_excel(po_file, engine='xlrd', ignore_errors=True)
        print(f"Success with ignore_errors!")
    except Exception as e2:
        print(f"All methods failed: {e2}")

print("\n" + "=" * 80)
print("ANALYZING QUOTATION REPORTS")
print("=" * 80)

# Read all Quotation files
quotation_files = [f for f in os.listdir(quotation_folder) if f.endswith('.xls') or f.endswith('.xlsx')]
print(f"\nFound {len(quotation_files)} quotation files:")
for qf in quotation_files:
    print(f"  - {qf}")

# Try to analyze each quotation file
for i, qfile in enumerate(quotation_files[:2], 1):  # Just first 2 files for sample
    try:
        print(f"\n--- Analyzing File {i}: {qfile} ---")
        file_path = os.path.join(quotation_folder, qfile)
        quot_df = pd.read_excel(file_path, engine='xlrd')
        
        print(f"Total Rows: {len(quot_df)}")
        print(f"Total Columns: {len(quot_df.columns)}")
        print(f"\nColumn Names:")
        for j, col in enumerate(quot_df.columns, 1):
            print(f"  {j}. {col}")
        
        print(f"\nFirst 3 Rows Sample:")
        print(quot_df.head(3))
        
        print(f"\nNull/Missing Values Count:")
        print(quot_df.isnull().sum())
        
    except Exception as e:
        print(f"Error reading {qfile}: {e}")

print("\n" + "=" * 80)
print("ANALYSIS COMPLETE")
print("=" * 80)
