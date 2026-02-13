"""
Generate Disciplines Consolidated data.json from Quotation and PO data
Compares Budgeted (Quoted) vs Actual (Ordered) spend by material discipline
"""
import csv
import json
import os
from datetime import datetime
from collections import defaultdict

# Paths
BASE_PATH = r"c:\Users\Sajesh\Documents\Apps\Rita\PowerBI\Re_ Quotation, PO and Expediting Modules Enhancement - Microtrack"
QUOTATION_PATH = os.path.join(BASE_PATH, "Quotation Reports")
PO_FILE = os.path.join(BASE_PATH, "PO_List_Jan-23-2026.csv")
OUTPUT_PATH = r"c:\Users\Sajesh\Documents\Apps\Rita\PowerBI\v2\disciplines-consolidated\data.json"

# Currency conversion rates to USD
CURRENCY_RATES = {
    'USD': 1.0,
    'AED': 0.2723,
    'EUR': 1.08,
    'GBP': 1.27,
    'SAR': 0.2667,
    'QAR': 0.2747,
    'KWD': 3.26,
    'BHD': 2.65,
    'OMR': 2.60,
    'INR': 0.012
}

# Discipline colors for visualization
DISCIPLINE_COLORS = {
    'Electrical': '#0078D4',
    'Mechanical': '#107C10',
    'Instruments': '#5C2D91',
    'Structural': '#D13438',
    'Civil': '#FFB900',
    'Piping': '#00B7C3',
    'Equipment': '#E74856',
    'Vessels': '#881798',
    'Safety': '#FF8C00',
    'General': '#605E5C',
    'IT & Services': '#0099BC',
    'Architectural': '#8764B8',
    'Procurement': '#038387',
    'Office': '#4A154B',
    'Vehicles': '#00CC6A',
    'Unknown': '#A19F9D'
}

def get_usd_value(value, currency):
    """Convert value to USD"""
    try:
        val = float(str(value).replace(',', '').replace('$', ''))
        rate = CURRENCY_RATES.get(currency.upper().strip(), 1.0)
        return val * rate
    except:
        return 0

def load_quotation_data():
    """Load all quotation data with material/discipline info"""
    quotation_files = [
        "Quotation_Report_Jan-28-2026.csv",
        "Quotation_Report_Jan-28-2026 (1).csv",
        "Quotation_Report_Jan-28-2026 (2).csv",
        "Quotation_Report_Jan-28-2026 (3).csv",
        "Quotation_Report_Jan-28-2026 (4).csv"
    ]
    
    quotations = []
    
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
                if not quote_num:
                    continue
                
                material = row.get('Material', '').strip() or 'General'
                value_str = row.get('Quo. Value', '0')
                currency = row.get('Cur.', 'USD').strip()
                usd_value = get_usd_value(value_str, currency)
                
                # Extract quote base number for PO matching
                parts = quote_num.split('-')
                base_num = f"{parts[0]}-{parts[1]}" if len(parts) >= 2 else quote_num
                
                quotations.append({
                    'number': quote_num,
                    'baseNumber': base_num,
                    'entity': row.get('Company', 'Unknown'),
                    'project': row.get('Project Name', 'Unknown'),
                    'material': material,
                    'discipline': material,  # Material is the discipline
                    'quotedValue': usd_value,
                    'currency': currency,
                    'status': row.get('Status', ''),
                    'type': row.get('Type', '')
                })
    
    return quotations

def load_po_data():
    """Load PO data and try to match to quotations"""
    pos = []
    
    with open(PO_FILE, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            po_number = row.get('PO number', '').strip()
            if not po_number:
                continue
            
            currency = row.get('Cur.', 'USD').strip()
            original_value = row.get('Total', '0')
            usd_value = get_usd_value(original_value, currency)
            
            # Try to extract quote reference from PO number
            # RFPO-5829-M4004-1 -> RFQ-5829
            parts = po_number.replace('RFPO-', '').split('-')
            base_num = f"RFQ-{parts[0]}" if parts else None
            
            pos.append({
                'poNumber': po_number,
                'baseQuoteNum': base_num,
                'supplier': row.get('Supplier', 'Unknown'),
                'orderedValue': usd_value,
                'currency': currency
            })
    
    return pos

def match_po_to_quotations(quotations, pos):
    """Match POs to quotations to get discipline info"""
    # Build lookup by base quote number
    quote_lookup = {}
    for q in quotations:
        base = q['baseNumber']
        if base not in quote_lookup:
            quote_lookup[base] = q
    
    # Match POs
    matched_pos = []
    for po in pos:
        base = po['baseQuoteNum']
        if base and base in quote_lookup:
            quote = quote_lookup[base]
            po['discipline'] = quote['discipline']
            po['material'] = quote['material']
            po['entity'] = quote['entity']
            po['project'] = quote['project']
        else:
            # Try to infer discipline from PO name or code
            po['discipline'] = 'General'
            po['material'] = 'General'
            po['entity'] = 'Unknown'
            po['project'] = 'Unknown'
        
        matched_pos.append(po)
    
    return matched_pos

def generate_discipline_analysis(quotations, pos):
    """Generate discipline-level analysis comparing quoted vs ordered"""
    
    # Aggregate quotations by discipline
    quoted_by_discipline = defaultdict(lambda: {'value': 0, 'count': 0, 'entities': set()})
    for q in quotations:
        disc = q['discipline'] or 'General'
        quoted_by_discipline[disc]['value'] += q['quotedValue']
        quoted_by_discipline[disc]['count'] += 1
        quoted_by_discipline[disc]['entities'].add(q['entity'])
    
    # Aggregate POs by discipline
    ordered_by_discipline = defaultdict(lambda: {'value': 0, 'count': 0, 'suppliers': set()})
    for po in pos:
        disc = po.get('discipline', 'General')
        ordered_by_discipline[disc]['value'] += po['orderedValue']
        ordered_by_discipline[disc]['count'] += 1
        ordered_by_discipline[disc]['suppliers'].add(po['supplier'])
    
    # Combine into discipline cards
    all_disciplines = set(quoted_by_discipline.keys()) | set(ordered_by_discipline.keys())
    
    disciplines = []
    for disc in sorted(all_disciplines):
        quoted = quoted_by_discipline[disc]
        ordered = ordered_by_discipline[disc]
        
        quoted_value = quoted['value']
        ordered_value = ordered['value']
        utilization = (ordered_value / quoted_value * 100) if quoted_value > 0 else 0
        variance = ordered_value - quoted_value
        variance_pct = (variance / quoted_value * 100) if quoted_value > 0 else 0
        
        disciplines.append({
            'name': disc,
            'color': DISCIPLINE_COLORS.get(disc, '#605E5C'),
            'quotedValue': round(quoted_value, 2),
            'quotedCount': quoted['count'],
            'orderedValue': round(ordered_value, 2),
            'orderedCount': ordered['count'],
            'utilization': round(utilization, 1),
            'variance': round(variance, 2),
            'variancePct': round(variance_pct, 1),
            'entityCount': len(quoted['entities']),
            'supplierCount': len(ordered['suppliers'])
        })
    
    # Sort by quoted value descending
    disciplines.sort(key=lambda x: x['quotedValue'], reverse=True)
    
    return disciplines

def generate_entity_breakdown(quotations, pos):
    """Generate entity-level breakdown"""
    entity_data = defaultdict(lambda: {'quoted': 0, 'ordered': 0, 'quoteCount': 0, 'poCount': 0})
    
    for q in quotations:
        entity_data[q['entity']]['quoted'] += q['quotedValue']
        entity_data[q['entity']]['quoteCount'] += 1
    
    for po in pos:
        entity_data[po.get('entity', 'Unknown')]['ordered'] += po['orderedValue']
        entity_data[po.get('entity', 'Unknown')]['poCount'] += 1
    
    result = []
    for entity, data in sorted(entity_data.items(), key=lambda x: x[1]['quoted'], reverse=True):
        utilization = (data['ordered'] / data['quoted'] * 100) if data['quoted'] > 0 else 0
        result.append({
            'name': entity,
            'quotedValue': round(data['quoted'], 2),
            'orderedValue': round(data['ordered'], 2),
            'quoteCount': data['quoteCount'],
            'poCount': data['poCount'],
            'utilization': round(utilization, 1)
        })
    
    return result

def generate_monthly_trend(quotations, pos):
    """Generate monthly quoted vs ordered trend"""
    # For now, use aggregated data since we don't have reliable dates
    # Group by discipline for trend visualization
    trend = []
    
    disciplines = set(q['discipline'] for q in quotations)
    for disc in sorted(disciplines):
        quoted = sum(q['quotedValue'] for q in quotations if q['discipline'] == disc)
        ordered = sum(po['orderedValue'] for po in pos if po.get('discipline') == disc)
        
        if quoted > 0 or ordered > 0:
            trend.append({
                'discipline': disc,
                'quoted': round(quoted, 2),
                'ordered': round(ordered, 2)
            })
    
    return trend

def generate_summary(quotations, pos, disciplines):
    """Generate summary statistics"""
    total_quoted = sum(q['quotedValue'] for q in quotations)
    total_ordered = sum(po['orderedValue'] for po in pos)
    utilization = (total_ordered / total_quoted * 100) if total_quoted > 0 else 0
    
    entities = set(q['entity'] for q in quotations)
    suppliers = set(po['supplier'] for po in pos)
    
    return {
        'totalQuoted': round(total_quoted, 2),
        'totalOrdered': round(total_ordered, 2),
        'totalVariance': round(total_ordered - total_quoted, 2),
        'overallUtilization': round(utilization, 1),
        'quotationCount': len(quotations),
        'poCount': len(pos),
        'disciplineCount': len(disciplines),
        'entityCount': len(entities),
        'supplierCount': len(suppliers),
        'avgQuoteValue': round(total_quoted / len(quotations), 2) if quotations else 0,
        'avgPOValue': round(total_ordered / len(pos), 2) if pos else 0
    }

def generate_filters(quotations, pos, disciplines):
    """Generate filter options"""
    entities = sorted(set(q['entity'] for q in quotations))
    discipline_names = [d['name'] for d in disciplines]
    
    return {
        'entities': entities,
        'disciplines': discipline_names
    }

def main():
    print("🔄 Loading quotation data...")
    quotations = load_quotation_data()
    print(f"   Loaded {len(quotations)} quotations")
    
    print("🔄 Loading PO data...")
    pos = load_po_data()
    print(f"   Loaded {len(pos)} POs")
    
    print("🔄 Matching POs to quotations...")
    matched_pos = match_po_to_quotations(quotations, pos)
    
    print("📊 Generating discipline analysis...")
    disciplines = generate_discipline_analysis(quotations, matched_pos)
    
    print("📊 Generating entity breakdown...")
    entity_breakdown = generate_entity_breakdown(quotations, matched_pos)
    
    print("📊 Generating trend data...")
    trend = generate_monthly_trend(quotations, matched_pos)
    
    # Build complete data structure
    data = {
        'summary': generate_summary(quotations, matched_pos, disciplines),
        'disciplines': disciplines,
        'entityBreakdown': entity_breakdown,
        'trend': trend,
        'filters': generate_filters(quotations, matched_pos, disciplines),
        'quotations': quotations[:500],  # Sample for table
        'pos': [{'poNumber': p['poNumber'], 'supplier': p['supplier'], 
                 'value': p['orderedValue'], 'discipline': p.get('discipline', 'General')} 
                for p in matched_pos[:500]]  # Sample for table
    }
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    # Write JSON
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    file_size = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"\n✅ Generated: {OUTPUT_PATH}")
    print(f"📊 File size: {file_size:.1f} KB")
    
    print(f"\n📈 Summary:")
    print(f"   • Disciplines: {len(disciplines)}")
    print(f"   • Total Quoted: ${data['summary']['totalQuoted']:,.2f}")
    print(f"   • Total Ordered: ${data['summary']['totalOrdered']:,.2f}")
    print(f"   • Overall Utilization: {data['summary']['overallUtilization']}%")
    print(f"   • Entities: {data['summary']['entityCount']}")
    print(f"   • Suppliers: {data['summary']['supplierCount']}")

if __name__ == "__main__":
    main()
