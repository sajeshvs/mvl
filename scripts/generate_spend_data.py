"""
Generate Global Spend Analysis data.json from PO and Quotation CSV files
"""
import csv
import json
import os
from datetime import datetime
from collections import defaultdict

# Paths
BASE_PATH = r"c:\Users\Sajesh\Documents\Apps\Rita\PowerBI\Re_ Quotation, PO and Expediting Modules Enhancement - Microtrack"
PO_FILE = os.path.join(BASE_PATH, "PO_List_Jan-23-2026.csv")
QUOTATION_PATH = os.path.join(BASE_PATH, "Quotation Reports")
OUTPUT_PATH = r"c:\Users\Sajesh\Documents\Apps\Rita\PowerBI\v2\global-spend-analysis\data.json"

# Currency conversion rates to USD
CURRENCY_RATES = {
    'USD': 1.0,
    'AED': 0.2723,  # 1 AED = 0.2723 USD
    'EUR': 1.08,
    'GBP': 1.27,
    'SAR': 0.2667,
    'QAR': 0.2747,
    'KWD': 3.26,
    'BHD': 2.65,
    'OMR': 2.60,
    'INR': 0.012
}

def parse_date(date_str):
    """Parse various date formats"""
    formats = [
        "%d %b %Y",      # 23 Jan 2026
        "%d-%b-%Y",      # 23-Jan-2026
        "%d/%m/%Y",      # 23/01/2026
        "%Y-%m-%d",      # 2026-01-23
        "%B %d, %Y",     # January 23, 2026
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except:
            continue
    return None

def extract_po_type(po_number):
    """Determine if PO is Base (ends with -1) or Change Order (ends with -2, -3, etc.)"""
    if po_number:
        last_part = po_number.split('-')[-1]
        if last_part == '1':
            return 'Base PO'
        elif last_part.isdigit() and int(last_part) > 1:
            return 'Change Order'
    return 'Base PO'

def extract_entity_from_po(po_number):
    """Extract entity code from PO number (e.g., RFPO-5829-M4004-1 -> M4004)"""
    if po_number:
        parts = po_number.split('-')
        if len(parts) >= 3:
            return parts[2]
    return 'Unknown'

def get_usd_value(value, currency):
    """Convert value to USD"""
    try:
        val = float(str(value).replace(',', '').replace('$', ''))
        rate = CURRENCY_RATES.get(currency.upper().strip(), 1.0)
        return val * rate
    except:
        return 0

def load_quotation_data():
    """Load quotation data to get entity and project mappings"""
    quotation_files = [
        "Quotation_Report_Jan-28-2026.csv",
        "Quotation_Report_Jan-28-2026 (1).csv",
        "Quotation_Report_Jan-28-2026 (2).csv",
        "Quotation_Report_Jan-28-2026 (3).csv",
        "Quotation_Report_Jan-28-2026 (4).csv"
    ]
    
    # Map: quotation number -> {entity, project, material, discipline}
    quote_map = {}
    
    for filename in quotation_files:
        filepath = os.path.join(QUOTATION_PATH, filename)
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()
            # Skip title row
            if lines and 'Quotation Report' in lines[0]:
                lines = lines[1:]
            
            reader = csv.DictReader(lines)
            for row in reader:
                quote_num = row.get('Number', '').strip()
                if quote_num:
                    # Extract base quote number (e.g., RFQ-5829 from RFQ-5829-E6823)
                    parts = quote_num.split('-')
                    if len(parts) >= 2:
                        base_num = f"{parts[0]}-{parts[1]}"
                        quote_map[base_num] = {
                            'entity': row.get('Company', 'Unknown'),
                            'project': row.get('Project Name', 'Unknown'),
                            'material': row.get('Material', 'Unknown'),
                            'client': row.get('Client', 'Unknown')
                        }
    
    return quote_map

def load_po_data(quote_map):
    """Load and process PO data"""
    pos = []
    
    with open(PO_FILE, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            po_number = row.get('PO number', '').strip()
            if not po_number:
                continue
            
            # Parse date
            date_str = row.get('Po Date', '').strip()
            parsed_date = parse_date(date_str)
            
            # Get currency and value
            currency = row.get('Cur.', 'USD').strip()
            original_value = row.get('Total', '0')
            try:
                original_value_num = float(str(original_value).replace(',', ''))
            except:
                original_value_num = 0
            
            usd_value = get_usd_value(original_value, currency)
            
            # Extract PO type
            po_type = extract_po_type(po_number)
            
            # Extract entity code from PO
            entity_code = extract_entity_from_po(po_number)
            
            # Try to get additional info from quotation
            base_quote = None
            parts = po_number.replace('RFPO-', 'RFQ-').split('-')
            if len(parts) >= 2:
                base_quote = f"{parts[0].replace('RFPO', 'RFQ')}-{parts[1]}"
            
            quote_info = quote_map.get(base_quote, {})
            
            # Map entity codes to names
            entity_mapping = {
                'M': 'MACRO', 'E': 'MVL ENERGY', 'V': 'MVL VENTURES',
                'O': 'MVL OPERATIONS', 'C': 'CENTRICO', 'S': 'MVL SOLUTIONS',
                'P': 'MVL PROJECTS', 'I': 'MVL INDUSTRIES', 'T': 'MVL TRADING',
                'A': 'MVL ARABIA', 'G': 'MVL GLOBAL', 'F': 'MVL FACILITIES'
            }
            
            entity_letter = entity_code[0] if entity_code else 'M'
            entity_name = quote_info.get('entity', entity_mapping.get(entity_letter, 'Unknown'))
            
            # Get year
            year = parsed_date.year if parsed_date else 2026
            month = parsed_date.month if parsed_date else 1
            
            po_record = {
                'poNumber': po_number,
                'poDate': date_str,
                'poName': row.get('PO Name', ''),
                'supplier': row.get('Supplier', 'Unknown'),
                'originalValue': original_value_num,
                'currency': currency,
                'valueUSD': round(usd_value, 2),
                'poType': po_type,
                'entity': entity_name,
                'entityCode': entity_code,
                'project': quote_info.get('project', 'General'),
                'material': quote_info.get('material', 'General'),
                'year': year,
                'month': month,
                'yearMonth': f"{year}-{month:02d}"
            }
            
            pos.append(po_record)
    
    return pos

def generate_summary(pos):
    """Generate summary statistics"""
    total_spend = sum(p['valueUSD'] for p in pos)
    base_pos = [p for p in pos if p['poType'] == 'Base PO']
    change_orders = [p for p in pos if p['poType'] == 'Change Order']
    
    suppliers = set(p['supplier'] for p in pos)
    projects = set(p['project'] for p in pos if p['project'] != 'General')
    entities = set(p['entity'] for p in pos)
    
    return {
        'totalSpendUSD': round(total_spend, 2),
        'totalPOs': len(pos),
        'basePOs': len(base_pos),
        'changeOrders': len(change_orders),
        'basePOValue': round(sum(p['valueUSD'] for p in base_pos), 2),
        'changeOrderValue': round(sum(p['valueUSD'] for p in change_orders), 2),
        'supplierCount': len(suppliers),
        'projectCount': len(projects),
        'entityCount': len(entities),
        'avgPOValue': round(total_spend / len(pos), 2) if pos else 0,
        'changeOrderRatio': round(len(change_orders) / len(pos) * 100, 1) if pos else 0
    }

def generate_annual_trend(pos):
    """Generate annual spend trend data"""
    yearly = defaultdict(lambda: {'base': 0, 'change': 0, 'total': 0, 'count': 0, 'suppliers': set()})
    
    for p in pos:
        year = p['year']
        value = p['valueUSD']
        yearly[year]['total'] += value
        yearly[year]['count'] += 1
        yearly[year]['suppliers'].add(p['supplier'])
        
        if p['poType'] == 'Base PO':
            yearly[year]['base'] += value
        else:
            yearly[year]['change'] += value
    
    trend = []
    for year in sorted(yearly.keys()):
        data = yearly[year]
        trend.append({
            'year': year,
            'baseValue': round(data['base'], 2),
            'changeValue': round(data['change'], 2),
            'totalValue': round(data['total'], 2),
            'poCount': data['count'],
            'supplierCount': len(data['suppliers'])
        })
    
    return trend

def generate_monthly_trend(pos):
    """Generate monthly spend trend for last 2 years"""
    monthly = defaultdict(lambda: {'value': 0, 'count': 0})
    
    for p in pos:
        if p['year'] >= 2024:  # Last 2 years
            ym = p['yearMonth']
            monthly[ym]['value'] += p['valueUSD']
            monthly[ym]['count'] += 1
    
    trend = []
    for ym in sorted(monthly.keys()):
        data = monthly[ym]
        trend.append({
            'yearMonth': ym,
            'value': round(data['value'], 2),
            'count': data['count']
        })
    
    return trend

def generate_supplier_rankings(pos):
    """Generate top and bottom supplier rankings"""
    supplier_spend = defaultdict(lambda: {'value': 0, 'count': 0, 'base': 0, 'change': 0})
    
    for p in pos:
        supplier = p['supplier']
        supplier_spend[supplier]['value'] += p['valueUSD']
        supplier_spend[supplier]['count'] += 1
        if p['poType'] == 'Base PO':
            supplier_spend[supplier]['base'] += 1
        else:
            supplier_spend[supplier]['change'] += 1
    
    # Sort by spend
    sorted_suppliers = sorted(supplier_spend.items(), key=lambda x: x[1]['value'], reverse=True)
    
    # Top 15 suppliers
    top_suppliers = []
    for supplier, data in sorted_suppliers[:15]:
        top_suppliers.append({
            'name': supplier,
            'valueUSD': round(data['value'], 2),
            'poCount': data['count'],
            'basePOs': data['base'],
            'changeOrders': data['change']
        })
    
    # Bottom 15 (excluding zero spend)
    active_suppliers = [(s, d) for s, d in sorted_suppliers if d['value'] > 0]
    bottom_suppliers = []
    for supplier, data in active_suppliers[-15:]:
        bottom_suppliers.append({
            'name': supplier,
            'valueUSD': round(data['value'], 2),
            'poCount': data['count']
        })
    
    return {
        'top': top_suppliers,
        'bottom': list(reversed(bottom_suppliers))
    }

def generate_entity_breakdown(pos):
    """Generate spend by entity"""
    entity_data = defaultdict(lambda: {'value': 0, 'count': 0, 'base': 0, 'change': 0})
    
    for p in pos:
        entity = p['entity']
        entity_data[entity]['value'] += p['valueUSD']
        entity_data[entity]['count'] += 1
        if p['poType'] == 'Base PO':
            entity_data[entity]['base'] += p['valueUSD']
        else:
            entity_data[entity]['change'] += p['valueUSD']
    
    result = []
    for entity, data in sorted(entity_data.items(), key=lambda x: x[1]['value'], reverse=True):
        result.append({
            'name': entity,
            'valueUSD': round(data['value'], 2),
            'poCount': data['count'],
            'baseValue': round(data['base'], 2),
            'changeValue': round(data['change'], 2)
        })
    
    return result

def generate_material_breakdown(pos):
    """Generate spend by material type"""
    material_data = defaultdict(lambda: {'value': 0, 'count': 0})
    
    for p in pos:
        material = p['material'] or 'General'
        material_data[material]['value'] += p['valueUSD']
        material_data[material]['count'] += 1
    
    result = []
    for material, data in sorted(material_data.items(), key=lambda x: x[1]['value'], reverse=True):
        result.append({
            'name': material,
            'valueUSD': round(data['value'], 2),
            'poCount': data['count']
        })
    
    return result

def generate_po_type_breakdown(pos):
    """Generate breakdown by PO type"""
    base_pos = [p for p in pos if p['poType'] == 'Base PO']
    change_orders = [p for p in pos if p['poType'] == 'Change Order']
    
    return {
        'basePO': {
            'count': len(base_pos),
            'valueUSD': round(sum(p['valueUSD'] for p in base_pos), 2)
        },
        'changeOrder': {
            'count': len(change_orders),
            'valueUSD': round(sum(p['valueUSD'] for p in change_orders), 2)
        }
    }

def generate_filters(pos):
    """Generate filter options"""
    entities = sorted(set(p['entity'] for p in pos))
    suppliers = sorted(set(p['supplier'] for p in pos))
    materials = sorted(set(p['material'] for p in pos if p['material']))
    years = sorted(set(p['year'] for p in pos))
    currencies = sorted(set(p['currency'] for p in pos))
    
    return {
        'entities': entities,
        'suppliers': suppliers,
        'materials': materials,
        'years': years,
        'currencies': currencies,
        'poTypes': ['Base PO', 'Change Order']
    }

def main():
    print("🔄 Loading quotation data for cross-reference...")
    quote_map = load_quotation_data()
    print(f"   Found {len(quote_map)} quotation mappings")
    
    print("🔄 Loading PO data...")
    pos = load_po_data(quote_map)
    print(f"   Loaded {len(pos)} PO records")
    
    print("📊 Generating analytics...")
    
    # Build the complete data structure
    data = {
        'summary': generate_summary(pos),
        'annualTrend': generate_annual_trend(pos),
        'monthlyTrend': generate_monthly_trend(pos),
        'supplierRankings': generate_supplier_rankings(pos),
        'entityBreakdown': generate_entity_breakdown(pos),
        'materialBreakdown': generate_material_breakdown(pos),
        'poTypeBreakdown': generate_po_type_breakdown(pos),
        'filters': generate_filters(pos),
        'workbench': pos  # Full PO details for table
    }
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    # Write JSON
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    file_size = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n✅ Generated: {OUTPUT_PATH}")
    print(f"📊 File size: {file_size:.2f} MB")
    
    print(f"\n📈 Summary:")
    print(f"   • Total POs: {data['summary']['totalPOs']:,}")
    print(f"   • Base POs: {data['summary']['basePOs']:,}")
    print(f"   • Change Orders: {data['summary']['changeOrders']:,}")
    print(f"   • Total Spend: ${data['summary']['totalSpendUSD']:,.2f}")
    print(f"   • Suppliers: {data['summary']['supplierCount']}")
    print(f"   • Entities: {data['summary']['entityCount']}")
    print(f"   • Years covered: {min(p['year'] for p in pos)} - {max(p['year'] for p in pos)}")

if __name__ == "__main__":
    main()
