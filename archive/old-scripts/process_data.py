"""
MVL Supply Intel Hub - Data Processing Script
==============================================
This script processes the raw CSV data and creates JSON files for each dashboard.

Steps:
1. Merge quotation files
2. Clean and transform data
3. Generate linking keys
4. Build JSON files for each dashboard
"""

import pandas as pd
import json
import os
import re
from datetime import datetime

# Paths
BASE_DIR = r'c:\Users\Sajesh\Documents\Apps\Rita\PowerBI'
DATA_DIR = os.path.join(BASE_DIR, 'Re_ Quotation, PO and Expediting Modules Enhancement - Microtrack')
QUOTE_DIR = os.path.join(DATA_DIR, 'Quotation Reports')

# Output paths
SUPPLIER_MARKETPLACE_DIR = os.path.join(BASE_DIR, 'supplier-marketplace')
GLOBAL_SPEND_DIR = os.path.join(BASE_DIR, 'global-spend-analysis')
DISCIPLINES_DIR = os.path.join(BASE_DIR, 'disciplines-consolidated')

# Material code mappings (from Rita's email)
MATERIAL_LETTER_TO_CODE = {
    'A': 'Architectural',
    'C': 'Chemicals',
    'E': 'Electrical',
    'F': 'Fire',
    'L': 'Logistics',
    'M': 'Mechanical',
    'O': 'Office Assets',
    'P': 'Protection',
    'R': 'Rental',
    'S': 'Services',
    'T': 'Tools',
    'V': 'Various'
}

# Status mappings (Note: 'Cancled' is misspelled in source data)
STATUS_FLAGS = {
    'Quotation': {'IsOpen': True, 'IsWon': False, 'IsLost': False},
    'Waiting': {'IsOpen': True, 'IsWon': False, 'IsLost': False},
    'Order': {'IsOpen': False, 'IsWon': True, 'IsLost': False},
    'Cancelled': {'IsOpen': False, 'IsWon': False, 'IsLost': True},
    'Cancled': {'IsOpen': False, 'IsWon': False, 'IsLost': True}  # Misspelled in source
}

def parse_date(date_str):
    """Parse date string like '23 Jan 2026' to datetime"""
    if pd.isna(date_str):
        return None
    try:
        return datetime.strptime(str(date_str).strip(), '%d %b %Y')
    except:
        try:
            return datetime.strptime(str(date_str).strip(), '%d %B %Y')
        except:
            return None

def extract_linking_key(doc_number):
    """Extract linking key from document number
    RFQ-5829-E6823 -> 5829-E6823
    RFPO-5829-E6823-1 -> 5829-E6823
    """
    if pd.isna(doc_number):
        return None
    parts = str(doc_number).split('-')
    if len(parts) >= 3:
        # Get project ref and material-sequence
        return f"{parts[1]}-{parts[2]}"
    return None

def extract_po_type(po_number):
    """Extract PO type from PO number ending
    RFPO-xxx-xxx-1 -> Base
    RFPO-xxx-xxx-2 -> Change Order
    """
    if pd.isna(po_number):
        return 'Unknown'
    parts = str(po_number).split('-')
    if len(parts) >= 4:
        last_digit = parts[-1]
        if last_digit == '1':
            return 'Base'
        elif last_digit == '2':
            return 'Change Order'
        else:
            return f'Change Order {last_digit}'
    return 'Unknown'

def extract_material_letter(doc_number):
    """Extract material letter code from document number
    RFQ-5829-E6823 -> E
    """
    if pd.isna(doc_number):
        return None
    parts = str(doc_number).split('-')
    if len(parts) >= 3:
        material_seq = parts[2]
        if len(material_seq) > 0:
            return material_seq[0].upper()
    return None

def clean_currency(value, currency):
    """Convert value to USD (simplified - using fixed rates)"""
    fx_rates = {
        'AED': 0.2723,  # 1 AED = 0.2723 USD
        'USD': 1.0,
        'EUR': 1.08,
        'GBP': 1.27,
        'SAR': 0.2667
    }
    try:
        numeric_value = float(str(value).replace(',', ''))
        rate = fx_rates.get(str(currency).upper().strip(), 1.0)
        return round(numeric_value * rate, 2)
    except:
        return 0.0

def clean_html_entities(text):
    """Clean HTML entities from text"""
    if pd.isna(text):
        return ''
    text = str(text)
    text = text.replace('&ndash;', '-')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&quot;', '"')
    return text

print("=" * 60)
print("MVL Supply Intel Hub - Data Processing")
print("=" * 60)

# ============================================================
# STEP 1: Load and Merge Quotation Files
# ============================================================
print("\n[1/6] Loading and merging quotation files...")

quotation_files = [
    'Quotation_Report_Jan-28-2026.csv',
    'Quotation_Report_Jan-28-2026 (1).csv',
    'Quotation_Report_Jan-28-2026 (2).csv',
    'Quotation_Report_Jan-28-2026 (3).csv',
    'Quotation_Report_Jan-28-2026 (4).csv'
]

all_quotations = []
for qf in quotation_files:
    fpath = os.path.join(QUOTE_DIR, qf)
    if os.path.exists(fpath):
        df = pd.read_csv(fpath, encoding='utf-8', on_bad_lines='skip', header=1)
        all_quotations.append(df)
        print(f"  - Loaded {qf}: {len(df)} rows")

df_quotes = pd.concat(all_quotations, ignore_index=True)
print(f"  ✓ Total quotations merged: {len(df_quotes)}")

# ============================================================
# STEP 2: Load PO and Clients Data
# ============================================================
print("\n[2/6] Loading PO and Clients data...")

df_pos = pd.read_csv(
    os.path.join(DATA_DIR, 'PO_List_Jan-23-2026.csv'),
    encoding='utf-8', on_bad_lines='skip'
)
print(f"  - Loaded PO List: {len(df_pos)} rows")

df_clients = pd.read_csv(
    os.path.join(DATA_DIR, 'MVL_Clients_List_Jan-23-2026.csv'),
    encoding='utf-8', on_bad_lines='skip'
)
print(f"  - Loaded Clients List: {len(df_clients)} rows")

# ============================================================
# STEP 3: Clean and Transform Data
# ============================================================
print("\n[3/6] Cleaning and transforming data...")

# Clean Quotations
df_quotes['QuotationNumber'] = df_quotes['Number']
df_quotes['QuotationType'] = df_quotes['Number'].apply(lambda x: 'IQ' if str(x).startswith('IQ') or str(x).startswith('Q-') else 'RFQ')
df_quotes['Entity'] = df_quotes['Company'].fillna('Unknown')
df_quotes['QuotationDate'] = df_quotes['Date'].apply(parse_date)
df_quotes['QuotationYear'] = df_quotes['QuotationDate'].apply(lambda x: x.year if pd.notna(x) and x is not None else None)
df_quotes['QuotationMonth'] = df_quotes['QuotationDate'].apply(lambda x: x.strftime('%b %Y') if pd.notna(x) and x is not None else None)
df_quotes['MaterialCode'] = df_quotes['Material Code'].fillna('Unknown')
df_quotes['MaterialName'] = df_quotes['Material'].fillna('Unknown')
df_quotes['QuotationValue'] = pd.to_numeric(df_quotes['Quo. Value'], errors='coerce').fillna(0)
df_quotes['Currency'] = df_quotes['Cur.'].fillna('USD')
df_quotes['QuotationValueUSD'] = df_quotes.apply(lambda r: clean_currency(r['QuotationValue'], r['Currency']), axis=1)
df_quotes['Status'] = df_quotes['Status'].fillna('Unknown')
df_quotes['LinkingKey'] = df_quotes['Number'].apply(extract_linking_key)
df_quotes['MaterialLetter'] = df_quotes['Number'].apply(extract_material_letter)
df_quotes['Contact'] = df_quotes['MVL Contact'].fillna('')
df_quotes['Client'] = df_quotes['Client'].fillna('')
df_quotes['ProjectName'] = df_quotes['Project Name'].apply(clean_html_entities)
df_quotes['Description'] = df_quotes['Description'].apply(clean_html_entities)

# Add status flags
for status, flags in STATUS_FLAGS.items():
    df_quotes.loc[df_quotes['Status'] == status, 'IsOpen'] = flags['IsOpen']
    df_quotes.loc[df_quotes['Status'] == status, 'IsWon'] = flags['IsWon']
    df_quotes.loc[df_quotes['Status'] == status, 'IsLost'] = flags['IsLost']

print(f"  ✓ Quotations cleaned: {len(df_quotes)} rows")

# Clean POs
df_pos['PONumber'] = df_pos['PO number']
df_pos['POType'] = df_pos['PO number'].apply(extract_po_type)
df_pos['PODate'] = df_pos['Po Date'].apply(parse_date)
df_pos['POYear'] = df_pos['PODate'].apply(lambda x: x.year if pd.notna(x) and x is not None else None)
df_pos['POMonth'] = df_pos['PODate'].apply(lambda x: x.strftime('%b %Y') if pd.notna(x) and x is not None else None)
df_pos['SupplierName'] = df_pos['Supplier'].fillna('Unknown')
df_pos['POValue'] = pd.to_numeric(df_pos['Total'], errors='coerce').fillna(0)
df_pos['Currency'] = df_pos['Cur.'].fillna('USD')
df_pos['POValueUSD'] = df_pos.apply(lambda r: clean_currency(r['POValue'], r['Currency']), axis=1)
df_pos['LinkingKey'] = df_pos['PO number'].apply(extract_linking_key)
df_pos['MaterialLetter'] = df_pos['PO number'].apply(extract_material_letter)
df_pos['MaterialCode'] = df_pos['MaterialLetter'].map(MATERIAL_LETTER_TO_CODE).fillna('Unknown')
df_pos['POName'] = df_pos['PO Name'].apply(clean_html_entities)

print(f"  ✓ POs cleaned: {len(df_pos)} rows")

# Clean Clients
df_clients['PartnerName'] = df_clients['Name'].fillna('')
df_clients['PartnerType'] = df_clients['Type'].fillna('Supplier')
df_clients['ContactName'] = df_clients['Contact Name'].fillna('')
df_clients['Email'] = df_clients['Email'].fillna('')
df_clients['Phone'] = df_clients['Phone'].fillna('')
df_clients['Address'] = df_clients['Address'].fillna('').str.replace('\n', ', ')

print(f"  ✓ Clients cleaned: {len(df_clients)} rows")

# ============================================================
# STEP 4: Generate Linking Keys and Join Data
# ============================================================
print("\n[4/6] Generating linking keys and joining data...")

# Link POs to Quotations
po_quote_merge = df_pos.merge(
    df_quotes[['LinkingKey', 'QuotationNumber', 'Entity', 'Status', 'Client', 'ProjectName']],
    on='LinkingKey',
    how='left',
    suffixes=('', '_Quote')
)
print(f"  ✓ POs linked to Quotations: {po_quote_merge['QuotationNumber'].notna().sum()} matches")

# ============================================================
# STEP 5: Calculate Aggregations and Metrics
# ============================================================
print("\n[5/6] Calculating aggregations and metrics...")

# Quotation Status Summary
status_summary = df_quotes.groupby('Status').agg({
    'QuotationNumber': 'count',
    'QuotationValueUSD': 'sum'
}).reset_index()
status_summary.columns = ['Status', 'Count', 'TotalValueUSD']
print(f"  Status Distribution:")
for _, row in status_summary.iterrows():
    print(f"    - {row['Status']}: {row['Count']} quotes, ${row['TotalValueUSD']:,.2f}")

# PO Type Summary
po_type_summary = df_pos.groupby('POType').agg({
    'PONumber': 'count',
    'POValueUSD': 'sum'
}).reset_index()
po_type_summary.columns = ['POType', 'Count', 'TotalValueUSD']
print(f"  PO Type Distribution:")
for _, row in po_type_summary.iterrows():
    print(f"    - {row['POType']}: {row['Count']} POs, ${row['TotalValueUSD']:,.2f}")

# Material Summary
material_summary = df_quotes.groupby('MaterialCode').agg({
    'QuotationNumber': 'count',
    'QuotationValueUSD': 'sum'
}).reset_index()
material_summary.columns = ['MaterialCode', 'QuoteCount', 'TotalValueUSD']
material_summary = material_summary.sort_values('TotalValueUSD', ascending=False)

# Entity Summary
entity_summary = df_quotes.groupby('Entity').agg({
    'QuotationNumber': 'count',
    'QuotationValueUSD': 'sum'
}).reset_index()
entity_summary.columns = ['Entity', 'QuoteCount', 'TotalValueUSD']

# Supplier Summary (from POs)
supplier_summary = df_pos.groupby('SupplierName').agg({
    'PONumber': 'count',
    'POValueUSD': 'sum'
}).reset_index()
supplier_summary.columns = ['SupplierName', 'POCount', 'TotalSpendUSD']
supplier_summary = supplier_summary.sort_values('TotalSpendUSD', ascending=False)

# Calculate Win Rate (handle both 'Cancelled' and 'Cancled' spellings)
total_won = len(df_quotes[df_quotes['Status'] == 'Order'])
total_lost = len(df_quotes[df_quotes['Status'].isin(['Cancelled', 'Cancled'])])
total_decided = total_won + total_lost
win_rate = (total_won / total_decided * 100) if total_decided > 0 else 0
print(f"  Win Rate: {win_rate:.1f}% ({total_won} won / {total_decided} decided)")

# ============================================================
# STEP 6: Build JSON Files for Each Dashboard
# ============================================================
print("\n[6/6] Building JSON files for dashboards...")

# --- SUPPLIER MARKETPLACE JSON ---
print("  Building Supplier Marketplace JSON...")

# Get top 100 suppliers for the dashboard (sorted by spend)
top_suppliers = supplier_summary.head(100).to_dict('records')

# Quotation funnel data (handle misspelled 'Cancled')
funnel_data = {
    'Quotation': int(len(df_quotes[df_quotes['Status'] == 'Quotation'])),
    'Waiting': int(len(df_quotes[df_quotes['Status'] == 'Waiting'])),
    'Order': int(len(df_quotes[df_quotes['Status'] == 'Order'])),
    'Cancelled': int(len(df_quotes[df_quotes['Status'].isin(['Cancelled', 'Cancled'])]))
}

# Monthly timeline data
df_quotes_dated = df_quotes[df_quotes['QuotationDate'].notna()].copy()
monthly_quotes = df_quotes_dated.groupby('QuotationMonth').agg({
    'QuotationNumber': 'count',
    'QuotationValueUSD': 'sum'
}).reset_index()
monthly_quotes.columns = ['Month', 'Count', 'ValueUSD']

# Get recent quotations for workbench (limit to 500 for performance, keep all for aggregations)
recent_quotes = df_quotes.sort_values('QuotationDate', ascending=False).head(500)
workbench_data = recent_quotes[[
    'QuotationNumber', 'QuotationType', 'Status', 'ProjectName', 
    'MaterialName', 'QuotationValue', 'Currency', 'Contact', 'Entity', 'MaterialCode'
]].to_dict('records')

# Materials by discipline
materials_by_discipline = df_quotes.groupby(['MaterialCode', 'MaterialName']).agg({
    'QuotationNumber': 'count',
    'QuotationValueUSD': 'sum'
}).reset_index().to_dict('records')

supplier_marketplace_data = {
    'lastRefresh': datetime.now().strftime('%d %b %Y %I:%M %p'),
    'summary': {
        'totalQuotations': int(len(df_quotes)),
        'totalPOs': int(len(df_pos)),
        'winRate': round(win_rate, 1),
        'totalQuotationValueUSD': round(df_quotes['QuotationValueUSD'].sum(), 2),
        'totalPOSpendUSD': round(df_pos['POValueUSD'].sum(), 2)
    },
    'suppliers': top_suppliers,
    'funnel': funnel_data,
    'statusSummary': status_summary.to_dict('records'),
    'workbench': workbench_data,
    'materialsByDiscipline': materials_by_discipline,
    'entities': entity_summary.to_dict('records')
}

with open(os.path.join(SUPPLIER_MARKETPLACE_DIR, 'data.json'), 'w', encoding='utf-8') as f:
    json.dump(supplier_marketplace_data, f, indent=2, default=str)
print(f"    ✓ Saved: supplier-marketplace/data.json")

# --- GLOBAL SPEND ANALYSIS JSON ---
print("  Building Global Spend Analysis JSON...")

# Annual spend trend
df_pos_dated = df_pos[df_pos['PODate'].notna()].copy()
annual_spend = df_pos_dated.groupby('POYear').agg({
    'PONumber': 'count',
    'POValueUSD': 'sum'
}).reset_index()
annual_spend.columns = ['Year', 'POCount', 'TotalSpendUSD']

# Base vs Change Order by year
annual_by_type = df_pos_dated.groupby(['POYear', 'POType']).agg({
    'PONumber': 'count',
    'POValueUSD': 'sum'
}).reset_index()
annual_by_type.columns = ['Year', 'POType', 'Count', 'SpendUSD']

# Spend by project (from PO names - extract project codes)
# Top 10 suppliers
top_10_suppliers = supplier_summary.head(10).to_dict('records')
bottom_10_suppliers = supplier_summary.tail(10).to_dict('records')

# ALL POs for details table (limit to 500 for performance)
recent_pos = df_pos.sort_values('PODate', ascending=False).head(500)
po_details = recent_pos[[
    'PONumber', 'POType', 'PODate', 'SupplierName', 
    'MaterialCode', 'POValue', 'Currency', 'POValueUSD'
]].to_dict('records')

# KPIs
total_base_pos = len(df_pos[df_pos['POType'] == 'Base'])
total_change_orders = len(df_pos[df_pos['POType'].str.contains('Change', na=False)])
base_spend = df_pos[df_pos['POType'] == 'Base']['POValueUSD'].sum()
change_spend = df_pos[df_pos['POType'].str.contains('Change', na=False)]['POValueUSD'].sum()

global_spend_data = {
    'lastRefresh': datetime.now().strftime('%d %b %Y %I:%M %p'),
    'summary': {
        'totalSpendUSD': round(df_pos['POValueUSD'].sum(), 2),
        'totalBasePOs': int(total_base_pos),
        'totalChangeOrders': int(total_change_orders),
        'baseSpendUSD': round(base_spend, 2),
        'changeSpendUSD': round(change_spend, 2),
        'changeOrderPercent': round((change_spend / (base_spend + change_spend) * 100) if (base_spend + change_spend) > 0 else 0, 1),
        'activeSuppliers': int(df_pos['SupplierName'].nunique()),
        'avgPOValueUSD': round(df_pos['POValueUSD'].mean(), 2)
    },
    'annualSpend': annual_spend.to_dict('records'),
    'annualByType': annual_by_type.to_dict('records'),
    'topSuppliers': top_10_suppliers,
    'bottomSuppliers': bottom_10_suppliers,
    'poDetails': po_details,
    'poTypeSummary': po_type_summary.to_dict('records'),
    'materialSpend': df_pos.groupby('MaterialCode').agg({
        'PONumber': 'count',
        'POValueUSD': 'sum'
    }).reset_index().to_dict('records')
}

with open(os.path.join(GLOBAL_SPEND_DIR, 'data.json'), 'w', encoding='utf-8') as f:
    json.dump(global_spend_data, f, indent=2, default=str)
print(f"    ✓ Saved: global-spend-analysis/data.json")

# --- DISCIPLINES CONSOLIDATED JSON ---
print("  Building Disciplines Consolidated JSON...")

# Discipline/Material summary
discipline_summary = df_quotes.groupby('MaterialCode').agg({
    'QuotationNumber': 'count',
    'QuotationValueUSD': 'sum'
}).reset_index()
discipline_summary.columns = ['Discipline', 'QuoteCount', 'QuoteValueUSD']

# Add PO data to disciplines
po_discipline = df_pos.groupby('MaterialCode').agg({
    'PONumber': 'count',
    'POValueUSD': 'sum'
}).reset_index()
po_discipline.columns = ['Discipline', 'POCount', 'POValueUSD']

disciplines_merged = discipline_summary.merge(po_discipline, on='Discipline', how='outer').fillna(0)

# Calculate budget vs actual (using quotes as budget proxy, POs as actual)
disciplines_merged['Budget'] = disciplines_merged['QuoteValueUSD']
disciplines_merged['Actual'] = disciplines_merged['POValueUSD']
disciplines_merged['Variance'] = disciplines_merged['Budget'] - disciplines_merged['Actual']
disciplines_merged['Utilization'] = (disciplines_merged['Actual'] / disciplines_merged['Budget'] * 100).fillna(0)

disciplines_data = {
    'lastRefresh': datetime.now().strftime('%d %b %Y %I:%M %p'),
    'summary': {
        'totalBudget': round(disciplines_merged['Budget'].sum(), 2),
        'totalActual': round(disciplines_merged['Actual'].sum(), 2),
        'totalVariance': round(disciplines_merged['Variance'].sum(), 2),
        'overallUtilization': round((disciplines_merged['Actual'].sum() / disciplines_merged['Budget'].sum() * 100) if disciplines_merged['Budget'].sum() > 0 else 0, 1),
        'activeDisciplines': int(len(disciplines_merged[disciplines_merged['Actual'] > 0])),
        'activeProjects': int(df_quotes['ProjectName'].nunique())
    },
    'disciplines': disciplines_merged.to_dict('records'),
    'materialMapping': material_summary.to_dict('records'),
    'byEntity': entity_summary.to_dict('records')
}

with open(os.path.join(DISCIPLINES_DIR, 'data.json'), 'w', encoding='utf-8') as f:
    json.dump(disciplines_data, f, indent=2, default=str)
print(f"    ✓ Saved: disciplines-consolidated/data.json")

# ============================================================
# COMPLETE
# ============================================================
print("\n" + "=" * 60)
print("DATA PROCESSING COMPLETE")
print("=" * 60)
print(f"""
Output Files Created:
  • supplier-marketplace/data.json
  • global-spend-analysis/data.json
  • disciplines-consolidated/data.json

Data Summary:
  • Quotations: {len(df_quotes):,}
  • Purchase Orders: {len(df_pos):,}
  • Suppliers/Clients: {len(df_clients):,}
  • Total Quotation Value: ${df_quotes['QuotationValueUSD'].sum():,.2f} USD
  • Total PO Spend: ${df_pos['POValueUSD'].sum():,.2f} USD
  • Win Rate: {win_rate:.1f}%
""")
