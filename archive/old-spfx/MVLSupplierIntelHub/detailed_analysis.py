import pandas as pd
import json
import os

# File paths
base_path = r"g:\Rita\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data"
supplier_file = os.path.join(base_path, "MVL_Suppliers_List_Feb-05-2026 .xlsx")
po_file_xlsx = os.path.join(base_path, "PO_List_Jan-23-2026.xlsx")
quotation_folder = os.path.join(base_path, "Quotation Reports")

pd.set_option('display.max_columns', None)
pd.set_option('display.width', 200)
pd.set_option('display.max_colwidth', 50)

print("=" * 80)
print("1. MVL SUPPLIER LIST - DETAILED ANALYSIS")
print("=" * 80)

try:
    supplier_df = pd.read_excel(supplier_file)
    print(f"\n📊 Dataset Overview:")
    print(f"   Total Suppliers: {len(supplier_df)}")
    print(f"   Total Columns: {len(supplier_df.columns)}")
    
    print(f"\n📋 Column Structure:")
    for i, col in enumerate(supplier_df.columns, 1):
        non_null = supplier_df[col].count()
        null_count = len(supplier_df) - non_null
        print(f"   {i:2d}. {col:20s} - {non_null:4d} filled, {null_count:4d} missing ({null_count/len(supplier_df)*100:.1f}%)")
    
    print(f"\n🔍 Material Categories ({supplier_df['Material'].nunique()} unique):")
    mat_counts = supplier_df['Material'].value_counts()
    for mat, count in mat_counts.head(10).items():
        print(f"   • {mat:30s}: {count:4d} suppliers")
    
    print(f"\n🌍 Top 10 Countries:")
    country_counts = supplier_df['Country'].value_counts()
    for country, count in country_counts.head(10).items():
        print(f"   • {country:30s}: {count:4d} suppliers")
    
    print(f"\n⭐ Rating Distribution:")
    rating_dist = supplier_df['Rating'].value_counts().sort_index()
    for rating, count in rating_dist.items():
        print(f"   Rating {rating}: {count:4d} suppliers")
    
    print(f"\n📝 Sample Records (First 3):")
    sample = supplier_df.head(3)[['No', 'Name', 'Material', 'Contact Name', 'Email', 'Phone', 'Country', 'Rating']]
    print(sample.to_string(index=False))
    
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 80)
print("2. PO LIST - DETAILED ANALYSIS")
print("=" * 80)

try:
    po_df = pd.read_excel(po_file_xlsx)
    print(f"\n📊 Dataset Overview:")
    print(f"   Total PO Records: {len(po_df)}")
    print(f"   Total Columns: {len(po_df.columns)}")
    
    print(f"\n📋 Column Structure:")
    for i, col in enumerate(po_df.columns, 1):
        dtype = po_df[col].dtype
        non_null = po_df[col].count()
        null_count = len(po_df) - non_null
        print(f"   {i:2d}. {col:30s} [{dtype}] - {non_null:4d} filled, {null_count:4d} missing")
    
    print(f"\n📝 Sample Records (First 5):")
    print(po_df.head(5).to_string(index=False))
    
    print(f"\n🔍 Data Quality Issues:")
    null_summary = po_df.isnull().sum()
    null_summary = null_summary[null_summary > 0].sort_values(ascending=False)
    for col, null_count in null_summary.items():
        print(f"   • {col:30s}: {null_count:4d} missing ({null_count/len(po_df)*100:.1f}%)")
    
    # Check for date columns
    date_cols = [col for col in po_df.columns if 'date' in col.lower() or 'Date' in col]
    if date_cols:
        print(f"\n📅 Date Columns Found: {', '.join(date_cols)}")
    
    # Check for amount/value columns
    amount_cols = [col for col in po_df.columns if any(term in col.lower() for term in ['amount', 'value', 'price', 'cost', 'total'])]
    if amount_cols:
        print(f"\n💰 Financial Columns: {', '.join(amount_cols)}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("3. QUOTATION REPORTS - DETAILED ANALYSIS")
print("=" * 80)

try:
    quotation_files = [f for f in os.listdir(quotation_folder) if f.endswith('.xlsx')]
    print(f"\n📊 Found {len(quotation_files)} quotation files (xlsx)")
    
    # Analyze first file in detail
    first_file = os.path.join(quotation_folder, quotation_files[0])
    quot_df = pd.read_excel(first_file)
    
    print(f"\n📄 Analyzing: {quotation_files[0]}")
    print(f"   Total Records: {len(quot_df)}")
    print(f"   Total Columns: {len(quot_df.columns)}")
    
    print(f"\n📋 Column Structure:")
    for i, col in enumerate(quot_df.columns, 1):
        dtype = quot_df[col].dtype
        non_null = quot_df[col].count()
        null_count = len(quot_df) - non_null
        sample_val = quot_df[col].iloc[0] if len(quot_df) > 0 else "N/A"
        print(f"   {i:2d}. {col:30s} [{dtype}] - Sample: {str(sample_val)[:40]}")
    
    print(f"\n📝 Sample Records (First 3):")
    print(quot_df.head(3).to_string(index=False))
    
    print(f"\n🔍 Looking for Series/Identifier Columns:")
    for col in quot_df.columns:
        col_lower = col.lower()
        if any(term in col_lower for term in ['series', 'number', 'id', 'no.', 'ref', 'quot']):
            unique_count = quot_df[col].nunique()
            print(f"   ✓ {col}: {unique_count} unique values")
            print(f"     Sample values: {quot_df[col].head(5).tolist()}")
    
    # Check all quotation files for consistency
    print(f"\n📊 Checking All Quotation Files for Structure:")
    all_structs = []
    for qfile in quotation_files:
        qpath = os.path.join(quotation_folder, qfile)
        qdf = pd.read_excel(qpath)
        all_structs.append({
            'file': qfile,
            'rows': len(qdf),
            'cols': len(qdf.columns),
            'columns': list(qdf.columns)
        })
        print(f"   • {qfile:45s}: {len(qdf):4d} rows, {len(qdf.columns):2d} columns")
    
    # Check if all files have same structure
    first_cols = set(all_structs[0]['columns'])
    same_structure = all(set(s['columns']) == first_cols for s in all_structs)
    print(f"\n   Structure consistency: {'✓ All files have same columns' if same_structure else '✗ Files have different structures'}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("ANALYSIS COMPLETE!")
print("=" * 80)
