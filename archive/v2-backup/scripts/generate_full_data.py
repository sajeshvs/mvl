"""
Generate Full Data JSON from Excel/CSV sources
Combines all quotation reports, PO list, and client list
"""

import csv
import json
import os
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(r"c:\Users\Sajesh\Documents\Apps\Rita\PowerBI")
SOURCE_DIR = BASE_DIR / "Re_ Quotation, PO and Expediting Modules Enhancement - Microtrack"
OUTPUT_DIR = BASE_DIR / "v2" / "supplier-marketplace"

def read_csv_skip_title(filepath, skip_rows=1):
    """Read CSV file, skipping title rows"""
    rows = []
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        # Skip title rows
        for _ in range(skip_rows):
            next(f, None)
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def parse_value(value_str):
    """Parse currency value to float"""
    if not value_str:
        return 0
    try:
        # Remove commas and convert
        clean = str(value_str).replace(',', '').replace(' ', '')
        return float(clean)
    except:
        return 0

def main():
    print("=" * 60)
    print("GENERATING FULL DATA.JSON FROM SOURCE FILES")
    print("=" * 60)
    
    # Load all quotation reports
    quotation_dir = SOURCE_DIR / "Quotation Reports"
    all_quotations = []
    
    csv_files = list(quotation_dir.glob("*.csv"))
    print(f"\nFound {len(csv_files)} quotation CSV files")
    
    for csv_file in csv_files:
        print(f"  Loading: {csv_file.name}")
        rows = read_csv_skip_title(csv_file, skip_rows=1)
        all_quotations.extend(rows)
        print(f"    → {len(rows)} records")
    
    print(f"\n✅ Total quotations loaded: {len(all_quotations)}")
    
    # Load PO list
    po_file = SOURCE_DIR / "PO_List_Jan-23-2026.csv"
    po_list = []
    if po_file.exists():
        with open(po_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            po_list = list(reader)
        print(f"✅ PO records loaded: {len(po_list)}")
    
    # Load client list
    client_file = SOURCE_DIR / "MVL_Clients_List_Jan-23-2026.csv"
    clients = []
    if client_file.exists():
        with open(client_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            clients = list(reader)
        print(f"✅ Client records loaded: {len(clients)}")
    
    # Process quotations into workbench format
    print("\n📊 Processing data...")
    
    workbench = []
    status_counts = {'Order': 0, 'Quotation': 0, 'Waiting': 0, 'Cancelled': 0}
    material_groups = {}
    entity_groups = {}
    total_quote_value = 0
    total_po_value = 0
    
    for i, row in enumerate(all_quotations):
        # Map CSV columns to our format
        status = row.get('Status', '').strip()
        if status == 'Cancled':
            status = 'Cancelled'
        
        # Count status
        if status in status_counts:
            status_counts[status] += 1
        elif status:
            status_counts['Quotation'] += 1  # Default
        
        quote_value = parse_value(row.get('Quo. Value', 0))
        total_quote_value += quote_value
        
        if status == 'Order':
            total_po_value += quote_value
        
        # Get entity from Company field
        entity = row.get('Company', 'Unknown')
        material_code = row.get('Material Code', row.get('Material', 'Unknown'))
        
        # Track by material
        if material_code:
            if material_code not in material_groups:
                material_groups[material_code] = {'count': 0, 'value': 0}
            material_groups[material_code]['count'] += 1
            material_groups[material_code]['value'] += quote_value
        
        # Track by entity
        if entity:
            if entity not in entity_groups:
                entity_groups[entity] = {'count': 0, 'value': 0}
            entity_groups[entity]['count'] += 1
            entity_groups[entity]['value'] += quote_value
        
        record = {
            'id': i + 1,
            'QuotationNumber': row.get('Number', f'Q-{i+1}'),
            'QuotationType': row.get('Type', 'RFQ'),
            'Status': status or 'Quotation',
            'ProjectName': row.get('Project Name', ''),
            'Description': row.get('Description', ''),
            'MaterialCode': material_code,
            'Material': row.get('Material', ''),
            'Entity': entity,
            'Client': row.get('Client', ''),
            'QuotationValue': quote_value,
            'Currency': row.get('Cur.', 'USD'),
            'Contact': row.get('MVL Contact', ''),
            'Date': row.get('Date', '')
        }
        workbench.append(record)
    
    # Calculate summary stats
    total_quotations = len(workbench)
    total_pos = status_counts['Order']
    total_cancelled = status_counts['Cancelled']
    total_decided = total_pos + total_cancelled
    win_rate = round((total_pos / total_decided * 100), 1) if total_decided > 0 else 0
    
    # Build funnel data
    funnel = {
        'Quotation': status_counts['Quotation'],
        'Waiting': status_counts['Waiting'],
        'Order': status_counts['Order'],
        'Cancelled': status_counts['Cancelled']
    }
    
    # Build status summary
    status_summary = [
        {'Status': 'Order', 'Count': status_counts['Order'], 'TotalValueUSD': total_po_value},
        {'Status': 'Quotation', 'Count': status_counts['Quotation'], 'TotalValueUSD': 0},
        {'Status': 'Waiting', 'Count': status_counts['Waiting'], 'TotalValueUSD': 0},
        {'Status': 'Cancelled', 'Count': status_counts['Cancelled'], 'TotalValueUSD': 0}
    ]
    
    # Build materials by discipline
    materials_by_discipline = [
        {'MaterialCode': k, 'QuotationNumber': v['count'], 'QuotationValueUSD': v['value']}
        for k, v in sorted(material_groups.items(), key=lambda x: -x[1]['value'])
    ]
    
    # Build entities list
    entities = [
        {'Entity': k, 'QuotationCount': v['count'], 'TotalValueUSD': v['value']}
        for k, v in sorted(entity_groups.items(), key=lambda x: -x[1]['value'])
    ]
    
    # Build supplier list from contacts/clients
    supplier_map = {}
    for row in workbench:
        if row['Status'] == 'Order':
            contact = row.get('Contact') or row.get('Client') or 'Unknown'
            if contact not in supplier_map:
                supplier_map[contact] = {'name': contact, 'poCount': 0, 'spend': 0}
            supplier_map[contact]['poCount'] += 1
            supplier_map[contact]['spend'] += row['QuotationValue']
    
    suppliers = [
        {'SupplierName': v['name'], 'POCount': v['poCount'], 'TotalSpendUSD': v['spend']}
        for v in sorted(supplier_map.values(), key=lambda x: -x['spend'])
    ][:100]  # Top 100
    
    # Build final data structure
    data = {
        'lastRefresh': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'summary': {
            'totalQuotations': total_quotations,
            'totalPOs': total_pos,
            'winRate': win_rate,
            'totalQuotationValueUSD': total_quote_value,
            'totalPOSpendUSD': total_po_value,
            'totalClients': len(clients),
            'totalEntities': len(entity_groups)
        },
        'funnel': funnel,
        'statusSummary': status_summary,
        'suppliers': suppliers,
        'entities': entities,
        'materialsByDiscipline': materials_by_discipline,
        'workbench': workbench
    }
    
    # Save to JSON
    output_file = OUTPUT_DIR / 'data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    file_size = os.path.getsize(output_file) / 1024 / 1024
    
    print("\n" + "=" * 60)
    print("✅ DATA GENERATION COMPLETE")
    print("=" * 60)
    print(f"📁 Output: {output_file}")
    print(f"📊 File size: {file_size:.2f} MB")
    print(f"\n📈 Summary:")
    print(f"   • Total Quotations: {total_quotations:,}")
    print(f"   • Total POs: {total_pos:,}")
    print(f"   • Win Rate: {win_rate}%")
    print(f"   • Total Quote Value: ${total_quote_value:,.0f}")
    print(f"   • Total PO Spend: ${total_po_value:,.0f}")
    print(f"   • Entities: {len(entity_groups)}")
    print(f"   • Materials: {len(material_groups)}")
    print(f"   • Suppliers: {len(suppliers)}")

if __name__ == '__main__':
    main()
