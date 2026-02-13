"""
Create refined data.json files for v4 dashboards.
Implements all business rules from HTML_DASHBOARD_UPDATE_INSTRUCTIONS.md:
- Filter out IQ quotations (RFQ only)
- Use improved JSON data with nested structure
- Calculate derived fields (win rate, order type, etc.)
- Consolidate 28 disciplines to 10
"""

import json
from datetime import datetime
from collections import defaultdict
import os

# Paths
BASE_PATH = "G:/Rita/mvl-powerbi-dashboards"
NEW_DATA_PATH = f"{BASE_PATH}/MVLSupplierIntelHub/MVL Supply Chain Intel Hub - Data/json"
V4_PATH = f"{BASE_PATH}/v4"

# Material code to letter mapping
LETTER_TO_MATERIAL_CODE = {
    'A': 'Architectural',
    'C': 'Chemicals',
    'E': 'Electrical',
    'F': 'Fire',
    'L': 'Logistics',
    'M': 'Mechanical',
    'P': 'Protection',
    'R': 'Rental',
    'S': 'Services',
    'T': 'Tools',
    'V': 'Various',
    'O': 'Office Assets'
}

# Discipline consolidation mapping (28 -> 10)
DISCIPLINE_CONSOLIDATION = {
    'Sandwich Panel': 'STRUCTURAL',
    'Steel Coil': 'STRUCTURAL',
    'Building Materials': 'STRUCTURAL',
    'Doors': 'ARCHITECTURAL',
    'Windows': 'ARCHITECTURAL',
    'Paints': 'ARCHITECTURAL',
    'Sanitary and Toilet Accessories': 'ARCHITECTURAL',
    'Accessories / Connection for Sandwich Panel': 'ARCHITECTURAL',
    'Machine / Equipments': 'EQUIPMENT & TOOLS',
    'Tools': 'EQUIPMENT & TOOLS',
    'Graco Spares': 'EQUIPMENT & TOOLS',
    'Mechanical Items': 'EQUIPMENT & TOOLS',
    'MHE': 'EQUIPMENT & TOOLS',
    'Electrical': 'MEP',
    'Firestop/ DC 315': 'SAFETY',
    'PPE': 'SAFETY',
    'Design': 'IT & SERVICES',
    'Services': 'IT & SERVICES',
    'Computer Peripherals': 'IT & SERVICES',
    'Subcontract': 'PROCUREMENT',
    'Construction': 'PROCUREMENT',
    'Transportation': 'LOGISTICS',
    'Containers': 'LOGISTICS',
    'Rental': 'RENTAL',
    'Chemicals': 'CONSUMABLES',
    'Polyurethane Foam': 'CONSUMABLES',
    'LSA - Life Support Area': 'SAFETY',
    'Misc.': 'EQUIPMENT & TOOLS',
    'General': 'EQUIPMENT & TOOLS'
}

DISCIPLINE_COLORS = {
    'STRUCTURAL': '#2E86AB',
    'ARCHITECTURAL': '#A23B72',
    'EQUIPMENT & TOOLS': '#F18F01',
    'MEP': '#C73E1D',
    'SAFETY': '#3B1F2B',
    'IT & SERVICES': '#95C623',
    'PROCUREMENT': '#5C4D7D',
    'LOGISTICS': '#1B998B',
    'RENTAL': '#E55934',
    'CONSUMABLES': '#9B2335'
}

def load_json(filename):
    """Load JSON file with UTF-8 encoding."""
    filepath = f"{NEW_DATA_PATH}/{filename}"
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, filepath):
    """Save JSON file with UTF-8 encoding."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved: {filepath}")

def get_consolidated_discipline(material_category):
    """Map material category to consolidated discipline."""
    if material_category in DISCIPLINE_CONSOLIDATION:
        return DISCIPLINE_CONSOLIDATION[material_category]
    # Default mapping based on first word
    for key in DISCIPLINE_CONSOLIDATION:
        if key.lower() in str(material_category).lower():
            return DISCIPLINE_CONSOLIDATION[key]
    return 'EQUIPMENT & TOOLS'  # Default

def parse_po_type(po_number):
    """Parse PO number to determine Base vs Change order."""
    if not po_number:
        return 'Unknown', 0
    parts = str(po_number).split('-')
    if len(parts) >= 4:
        try:
            sequence = int(parts[-1])
            return ('Base PO' if sequence == 1 else f'Change Order #{sequence-1}'), sequence
        except:
            pass
    return 'Base PO', 1

def create_supplier_marketplace_data():
    """Create refined data for Supplier Marketplace dashboard."""
    print("\n=== Creating Supplier Marketplace Data ===")
    
    # Load data
    quotations_data = load_json("quotations_improved.json")
    suppliers_data = load_json("suppliers_improved.json")
    
    quotations = quotations_data.get('quotations', [])
    suppliers = {s['name']: s for s in suppliers_data.get('suppliers', [])}
    
    # Filter RFQ only (exclude IQ)
    rfq_quotations = [q for q in quotations if q.get('type') == 'RFQ']
    print(f"Total quotations: {len(quotations)}, RFQ only: {len(rfq_quotations)}")
    
    # Build workbench data
    workbench = []
    status_counts = defaultdict(int)
    status_values = defaultdict(float)
    entity_data = defaultdict(lambda: {'count': 0, 'value': 0})
    material_data = defaultdict(lambda: {'count': 0, 'value': 0})
    supplier_stats = defaultdict(lambda: {'quotations': 0, 'orders': 0, 'value': 0, 'contact': None, 'rating': 3.0})
    
    for q in rfq_quotations:
        status = q.get('outcome', {}).get('status', 'Unknown')
        value = q.get('financial', {}).get('quoted_value', 0) or 0
        client_name = q.get('client', {}).get('name', 'Unknown')
        material = q.get('details', {}).get('material_category', 'Unknown')
        company = q.get('company', 'Unknown')
        
        # Workbench entry
        workbench.append({
            'quotationNumber': q.get('quotation_number', ''),
            'quotationDate': q.get('dates', {}).get('quotation_date', ''),
            'type': 'RFQ',
            'status': status,
            'statusNormalized': q.get('outcome', {}).get('status_normalized', 'pending'),
            'client': client_name,
            'project': q.get('project', {}).get('name', ''),
            'material': material,
            'materialCode': q.get('details', {}).get('material_code', ''),
            'discipline': get_consolidated_discipline(material),
            'value': value,
            'currency': q.get('financial', {}).get('currency', 'AED'),
            'contact': q.get('contact', {}).get('mvl_contact', ''),
            'company': company,
            'convertedToPO': q.get('outcome', {}).get('converted_to_po', False),
            'poNumber': q.get('outcome', {}).get('po_number', None)
        })
        
        # Aggregations
        status_counts[status] += 1
        status_values[status] += value
        entity_data[company]['count'] += 1
        entity_data[company]['value'] += value
        material_data[material]['count'] += 1
        material_data[material]['value'] += value
        
        # Supplier stats
        supplier_stats[client_name]['quotations'] += 1
        if status == 'Order':
            supplier_stats[client_name]['orders'] += 1
        supplier_stats[client_name]['value'] += value
        
        # Get supplier details if available
        if client_name in suppliers:
            s = suppliers[client_name]
            supplier_stats[client_name]['contact'] = s.get('contact', {})
            supplier_stats[client_name]['rating'] = s.get('rating', {}).get('score', 3.0)
    
    # Calculate funnel
    funnel = {
        'Quotation': status_counts.get('Quotation', 0),
        'Waiting': status_counts.get('Waiting', 0),
        'Order': status_counts.get('Order', 0),
        'Cancelled': status_counts.get('Cancelled', 0)
    }
    
    # Status summary
    status_summary = [
        {'status': s, 'count': status_counts[s], 'value': status_values[s]}
        for s in ['Order', 'Quotation', 'Waiting', 'Cancelled']
        if status_counts[s] > 0
    ]
    
    # Top suppliers with profiles
    supplier_list = []
    for name, stats in sorted(supplier_stats.items(), key=lambda x: x[1]['value'], reverse=True)[:50]:
        win_rate = (stats['orders'] / stats['quotations'] * 100) if stats['quotations'] > 0 else 0
        supplier_list.append({
            'name': name,
            'quotations': stats['quotations'],
            'orders': stats['orders'],
            'winRate': round(win_rate, 1),
            'totalValue': stats['value'],
            'rating': stats['rating'],
            'contact': stats['contact']
        })
    
    # Entity breakdown
    entities = [
        {'name': e, 'count': d['count'], 'value': d['value']}
        for e, d in sorted(entity_data.items(), key=lambda x: x[1]['value'], reverse=True)
    ]
    
    # Material breakdown
    materials = [
        {'name': m, 'count': d['count'], 'value': d['value'], 'discipline': get_consolidated_discipline(m)}
        for m, d in sorted(material_data.items(), key=lambda x: x[1]['value'], reverse=True)
    ]
    
    # Summary
    total_quotations = len(rfq_quotations)
    total_orders = status_counts.get('Order', 0)
    total_value = sum(w['value'] for w in workbench)
    total_order_value = status_values.get('Order', 0)
    
    data = {
        'lastRefresh': datetime.now().strftime('%a %d %b %Y %I:%M %p'),
        'summary': {
            'totalQuotations': total_quotations,
            'totalOrders': total_orders,
            'winRate': round(total_orders / total_quotations * 100, 1) if total_quotations > 0 else 0,
            'totalQuotationValue': total_value,
            'totalOrderValue': total_order_value,
            'supplierCount': len(supplier_stats),
            'entityCount': len(entity_data),
            'conversionRate': round(total_orders / total_quotations * 100, 1) if total_quotations > 0 else 0,
            'openQuotes': status_counts.get('Quotation', 0) + status_counts.get('Waiting', 0)
        },
        'funnel': funnel,
        'statusSummary': status_summary,
        'suppliers': supplier_list,
        'entities': entities,
        'materials': materials,
        'workbench': workbench
    }
    
    save_json(data, f"{V4_PATH}/supplier-marketplace/data.json")
    print(f"  Summary: {total_quotations} RFQ quotations, {len(supplier_list)} suppliers")
    return data

def create_global_spend_data():
    """Create refined data for Global Spend Analysis dashboard."""
    print("\n=== Creating Global Spend Analysis Data ===")
    
    # Load data
    po_data = load_json("purchase_orders_improved.json")
    suppliers_data = load_json("suppliers_improved.json")
    
    purchase_orders = po_data.get('purchase_orders', [])
    suppliers = {s['name']: s for s in suppliers_data.get('suppliers', [])}
    
    print(f"Total POs: {len(purchase_orders)}")
    
    # Build workbench and aggregations
    workbench = []
    annual_trend = defaultdict(lambda: {'basePO': 0, 'changeOrder': 0, 'total': 0, 'count': 0})
    monthly_trend = defaultdict(lambda: {'value': 0, 'count': 0})
    supplier_spend = defaultdict(lambda: {'value': 0, 'count': 0})
    entity_spend = defaultdict(lambda: {'value': 0, 'count': 0})
    project_spend = defaultdict(lambda: {'value': 0, 'count': 0})
    material_spend = defaultdict(lambda: {'value': 0, 'count': 0})
    
    total_spend = 0
    base_po_count = 0
    base_po_value = 0
    change_order_count = 0
    change_order_value = 0
    
    for po in purchase_orders:
        po_number = po.get('po_number', '')
        po_type, sequence = parse_po_type(po_number)
        amount = po.get('financial', {}).get('total_amount', 0) or 0
        currency = po.get('financial', {}).get('currency', 'AED')
        
        # Convert to USD (approximate)
        usd_value = amount / 3.67 if currency == 'AED' else amount
        
        supplier_name = po.get('supplier', {}).get('name', 'Unknown')
        po_date = po.get('dates', {}).get('po_date', '')
        description = po.get('description', '')
        category = po.get('category', 'Unknown')
        project_name = po.get('project', {}).get('project_name', '') or ''
        
        # Extract entity from PO components
        components = po.get('po_components', {})
        entity_code = components.get('category', 'Unknown')
        
        # Parse year/month
        year = None
        month = None
        if po_date:
            try:
                dt = datetime.strptime(po_date, '%Y-%m-%d')
                year = dt.year
                month = dt.month
                year_month = f"{year}-{month:02d}"
            except:
                year_month = 'Unknown'
        else:
            year_month = 'Unknown'
        
        # Workbench entry
        workbench.append({
            'poNumber': po_number,
            'poDate': po_date,
            'poDateFormatted': po.get('dates', {}).get('po_date_original', po_date),
            'description': description,
            'supplier': supplier_name,
            'supplierId': po.get('supplier', {}).get('supplier_id', ''),
            'originalValue': amount,
            'currency': currency,
            'valueUSD': round(usd_value, 2),
            'poType': po_type,
            'sequence': sequence,
            'entityCode': entity_code,
            'project': project_name,
            'material': category,
            'discipline': get_consolidated_discipline(category),
            'year': year,
            'month': month,
            'yearMonth': year_month,
            'expectedDelivery': po.get('dates', {}).get('expected_delivery', '')
        })
        
        # Aggregations
        total_spend += usd_value
        
        if sequence == 1:
            base_po_count += 1
            base_po_value += usd_value
        else:
            change_order_count += 1
            change_order_value += usd_value
        
        if year:
            annual_trend[year]['total'] += usd_value
            annual_trend[year]['count'] += 1
            if sequence == 1:
                annual_trend[year]['basePO'] += usd_value
            else:
                annual_trend[year]['changeOrder'] += usd_value
        
        monthly_trend[year_month]['value'] += usd_value
        monthly_trend[year_month]['count'] += 1
        
        supplier_spend[supplier_name]['value'] += usd_value
        supplier_spend[supplier_name]['count'] += 1
        
        entity_spend[entity_code]['value'] += usd_value
        entity_spend[entity_code]['count'] += 1
        
        if project_name:
            project_spend[project_name]['value'] += usd_value
            project_spend[project_name]['count'] += 1
        
        material_spend[category]['value'] += usd_value
        material_spend[category]['count'] += 1
    
    # Sort and format aggregations
    annual_trend_list = [
        {'year': y, 'basePO': round(d['basePO'], 2), 'changeOrder': round(d['changeOrder'], 2), 
         'total': round(d['total'], 2), 'count': d['count']}
        for y, d in sorted(annual_trend.items())
    ]
    
    monthly_trend_list = [
        {'yearMonth': ym, 'value': round(d['value'], 2), 'count': d['count']}
        for ym, d in sorted(monthly_trend.items()) if ym != 'Unknown'
    ]
    
    # Top 10 and Bottom 10 suppliers
    sorted_suppliers = sorted(supplier_spend.items(), key=lambda x: x[1]['value'], reverse=True)
    top_10_suppliers = [
        {'name': s, 'value': round(d['value'], 2), 'count': d['count']}
        for s, d in sorted_suppliers[:10]
    ]
    bottom_10_suppliers = [
        {'name': s, 'value': round(d['value'], 2), 'count': d['count']}
        for s, d in sorted_suppliers[-10:] if d['value'] > 0
    ]
    
    # Entity breakdown
    entity_breakdown = [
        {'code': e, 'value': round(d['value'], 2), 'count': d['count']}
        for e, d in sorted(entity_spend.items(), key=lambda x: x[1]['value'], reverse=True)
    ]
    
    # Project breakdown (top 20)
    project_breakdown = [
        {'name': p, 'value': round(d['value'], 2), 'count': d['count']}
        for p, d in sorted(project_spend.items(), key=lambda x: x[1]['value'], reverse=True)[:20]
    ]
    
    # Material breakdown
    material_breakdown = [
        {'name': m, 'value': round(d['value'], 2), 'count': d['count'], 'discipline': get_consolidated_discipline(m)}
        for m, d in sorted(material_spend.items(), key=lambda x: x[1]['value'], reverse=True)
    ]
    
    # Filters
    years = sorted([y for y in annual_trend.keys() if y], reverse=True)
    
    data = {
        'lastRefresh': datetime.now().strftime('%a %d %b %Y %I:%M %p'),
        'dateRange': {
            'start': '2000-01-01',
            'end': datetime.now().strftime('%Y-%m-%d')
        },
        'summary': {
            'totalSpendUSD': round(total_spend, 2),
            'totalPOs': len(purchase_orders),
            'basePOs': base_po_count,
            'basePOValue': round(base_po_value, 2),
            'changeOrders': change_order_count,
            'changeOrderValue': round(change_order_value, 2),
            'changeOrderRatio': round(change_order_count / len(purchase_orders) * 100, 1) if purchase_orders else 0,
            'supplierCount': len(supplier_spend),
            'projectCount': len(project_spend),
            'entityCount': len(entity_spend),
            'avgPOValue': round(total_spend / len(purchase_orders), 2) if purchase_orders else 0
        },
        'annualTrend': annual_trend_list,
        'monthlyTrend': monthly_trend_list,
        'supplierRankings': {
            'top10': top_10_suppliers,
            'bottom10': bottom_10_suppliers
        },
        'entityBreakdown': entity_breakdown,
        'projectBreakdown': project_breakdown,
        'materialBreakdown': material_breakdown,
        'poTypeBreakdown': {
            'basePO': {'count': base_po_count, 'value': round(base_po_value, 2)},
            'changeOrder': {'count': change_order_count, 'value': round(change_order_value, 2)}
        },
        'filters': {
            'years': years,
            'entities': list(entity_spend.keys()),
            'suppliers': [s for s, _ in sorted_suppliers[:100]],
            'materials': list(material_spend.keys())
        },
        'workbench': workbench
    }
    
    save_json(data, f"{V4_PATH}/global-spend-analysis/data.json")
    print(f"  Summary: {len(purchase_orders)} POs, ${total_spend:,.2f} total spend")
    return data

def create_disciplines_data():
    """Create refined data for Disciplines Consolidated dashboard."""
    print("\n=== Creating Disciplines Consolidated Data ===")
    
    # Load all data
    quotations_data = load_json("quotations_improved.json")
    po_data = load_json("purchase_orders_improved.json")
    suppliers_data = load_json("suppliers_improved.json")
    
    quotations = [q for q in quotations_data.get('quotations', []) if q.get('type') == 'RFQ']
    purchase_orders = po_data.get('purchase_orders', [])
    
    print(f"RFQ quotations: {len(quotations)}, POs: {len(purchase_orders)}")
    
    # Aggregate by consolidated discipline
    discipline_data = defaultdict(lambda: {
        'quotedValue': 0, 'quotedCount': 0,
        'orderedValue': 0, 'orderedCount': 0,
        'materials': set(), 'suppliers': set(), 'entities': set()
    })
    
    # Process quotations
    for q in quotations:
        material = q.get('details', {}).get('material_category', 'Unknown')
        discipline = get_consolidated_discipline(material)
        value = q.get('financial', {}).get('quoted_value', 0) or 0
        company = q.get('company', '')
        
        discipline_data[discipline]['quotedValue'] += value
        discipline_data[discipline]['quotedCount'] += 1
        discipline_data[discipline]['materials'].add(material)
        if company:
            discipline_data[discipline]['entities'].add(company)
    
    # Process POs
    for po in purchase_orders:
        material = po.get('category', 'Unknown')
        discipline = get_consolidated_discipline(material)
        amount = po.get('financial', {}).get('total_amount', 0) or 0
        currency = po.get('financial', {}).get('currency', 'AED')
        usd_value = amount / 3.67 if currency == 'AED' else amount
        
        supplier_name = po.get('supplier', {}).get('name', '')
        
        discipline_data[discipline]['orderedValue'] += usd_value
        discipline_data[discipline]['orderedCount'] += 1
        discipline_data[discipline]['materials'].add(material)
        if supplier_name:
            discipline_data[discipline]['suppliers'].add(supplier_name)
    
    # Build discipline list (10 consolidated)
    disciplines = []
    total_quoted = 0
    total_ordered = 0
    total_materials = set()
    
    for disc_name in DISCIPLINE_COLORS.keys():
        d = discipline_data.get(disc_name, {
            'quotedValue': 0, 'quotedCount': 0, 'orderedValue': 0, 'orderedCount': 0,
            'materials': set(), 'suppliers': set(), 'entities': set()
        })
        
        quoted = d['quotedValue']
        ordered = d['orderedValue']
        variance = ordered - quoted
        utilization = (ordered / quoted * 100) if quoted > 0 else 0
        
        total_quoted += quoted
        total_ordered += ordered
        total_materials.update(d['materials'])
        
        disciplines.append({
            'name': disc_name,
            'color': DISCIPLINE_COLORS[disc_name],
            'quotedValue': round(quoted, 2),
            'quotedCount': d['quotedCount'],
            'orderedValue': round(ordered, 2),
            'orderedCount': d['orderedCount'],
            'variance': round(variance, 2),
            'variancePct': round((variance / quoted * 100), 1) if quoted > 0 else 0,
            'utilization': round(utilization, 1),
            'materialCount': len(d['materials']),
            'materials': list(d['materials']),
            'supplierCount': len(d['suppliers']),
            'entityCount': len(d['entities'])
        })
    
    # Sort by ordered value
    disciplines.sort(key=lambda x: x['orderedValue'], reverse=True)
    
    # MEP breakdown
    mep_disciplines = ['MEP']
    mep_data = {
        'electrical': {'value': 0, 'count': 0, 'items': []},
        'mechanical': {'value': 0, 'count': 0, 'items': []},
        'plumbing': {'value': 0, 'count': 0, 'items': []}
    }
    
    for po in purchase_orders:
        material = po.get('category', '').lower()
        amount = po.get('financial', {}).get('total_amount', 0) or 0
        currency = po.get('financial', {}).get('currency', 'AED')
        usd_value = amount / 3.67 if currency == 'AED' else amount
        
        if 'electrical' in material or 'cable' in material:
            mep_data['electrical']['value'] += usd_value
            mep_data['electrical']['count'] += 1
        elif 'mechanical' in material or 'hvac' in material or 'pump' in material:
            mep_data['mechanical']['value'] += usd_value
            mep_data['mechanical']['count'] += 1
        elif 'plumb' in material or 'sanitary' in material or 'water' in material:
            mep_data['plumbing']['value'] += usd_value
            mep_data['plumbing']['count'] += 1
    
    # Safety breakdown
    safety_data = {
        'firestop': {'value': 0, 'count': 0, 'compliance': 100},
        'ppe': {'value': 0, 'count': 0, 'compliance': 100},
        'lsa': {'value': 0, 'count': 0, 'compliance': 100}
    }
    
    for po in purchase_orders:
        material = po.get('category', '').lower()
        amount = po.get('financial', {}).get('total_amount', 0) or 0
        currency = po.get('financial', {}).get('currency', 'AED')
        usd_value = amount / 3.67 if currency == 'AED' else amount
        
        if 'firestop' in material or 'dc 315' in material:
            safety_data['firestop']['value'] += usd_value
            safety_data['firestop']['count'] += 1
        elif 'ppe' in material or 'protection' in material:
            safety_data['ppe']['value'] += usd_value
            safety_data['ppe']['count'] += 1
        elif 'lsa' in material or 'life' in material:
            safety_data['lsa']['value'] += usd_value
            safety_data['lsa']['count'] += 1
    
    # Procurement breakdown
    procurement_data = {
        'subcontract': {'value': 0, 'vendorCount': 0},
        'rental': {'value': 0, 'unitCount': 0}
    }
    
    subcontract_vendors = set()
    rental_count = 0
    
    for po in purchase_orders:
        material = po.get('category', '').lower()
        amount = po.get('financial', {}).get('total_amount', 0) or 0
        currency = po.get('financial', {}).get('currency', 'AED')
        usd_value = amount / 3.67 if currency == 'AED' else amount
        supplier = po.get('supplier', {}).get('name', '')
        
        if 'subcontract' in material or 'contract' in material:
            procurement_data['subcontract']['value'] += usd_value
            if supplier:
                subcontract_vendors.add(supplier)
        elif 'rental' in material:
            procurement_data['rental']['value'] += usd_value
            rental_count += 1
    
    procurement_data['subcontract']['vendorCount'] = len(subcontract_vendors)
    procurement_data['rental']['unitCount'] = rental_count
    
    # Entity breakdown for disciplines
    entity_breakdown = defaultdict(lambda: defaultdict(float))
    for po in purchase_orders:
        components = po.get('po_components', {})
        entity = components.get('category', 'Unknown')
        material = po.get('category', 'Unknown')
        discipline = get_consolidated_discipline(material)
        amount = po.get('financial', {}).get('total_amount', 0) or 0
        currency = po.get('financial', {}).get('currency', 'AED')
        usd_value = amount / 3.67 if currency == 'AED' else amount
        
        entity_breakdown[entity][discipline] += usd_value
    
    entity_breakdown_list = []
    for entity, disc_values in entity_breakdown.items():
        entity_breakdown_list.append({
            'entity': entity,
            'disciplines': {d: round(v, 2) for d, v in disc_values.items()},
            'total': round(sum(disc_values.values()), 2)
        })
    entity_breakdown_list.sort(key=lambda x: x['total'], reverse=True)
    
    # Build output
    overall_variance = total_ordered - total_quoted
    overall_utilization = (total_ordered / total_quoted * 100) if total_quoted > 0 else 0
    
    data = {
        'lastRefresh': datetime.now().strftime('%a %d %b %Y %I:%M %p'),
        'summary': {
            'totalQuoted': round(total_quoted, 2),
            'totalOrdered': round(total_ordered, 2),
            'totalVariance': round(overall_variance, 2),
            'overallUtilization': round(overall_utilization, 1),
            'quotationCount': len(quotations),
            'poCount': len(purchase_orders),
            'disciplineCount': 10,
            'materialCount': len(total_materials),
            'budgetUtilization': round(min(overall_utilization, 100), 1)
        },
        'disciplines': disciplines,
        'mepIntegration': {
            'electrical': {'value': round(mep_data['electrical']['value'], 2), 'count': mep_data['electrical']['count']},
            'mechanical': {'value': round(mep_data['mechanical']['value'], 2), 'count': mep_data['mechanical']['count']},
            'plumbing': {'value': round(mep_data['plumbing']['value'], 2), 'count': mep_data['plumbing']['count']},
            'total': round(sum(v['value'] for v in mep_data.values()), 2)
        },
        'safetyCompliance': {
            'firestop': {'value': round(safety_data['firestop']['value'], 2), 'count': safety_data['firestop']['count'], 'compliance': 100},
            'ppe': {'value': round(safety_data['ppe']['value'], 2), 'count': safety_data['ppe']['count'], 'compliance': 100},
            'lsa': {'value': round(safety_data['lsa']['value'], 2), 'count': safety_data['lsa']['count'], 'compliance': 100},
            'total': round(sum(v['value'] for v in safety_data.values()), 2),
            'overallCompliance': 100,
            'nonCompliances': 0
        },
        'procurement': {
            'subcontract': {'value': round(procurement_data['subcontract']['value'], 2), 'vendorCount': procurement_data['subcontract']['vendorCount']},
            'rental': {'value': round(procurement_data['rental']['value'], 2), 'unitCount': procurement_data['rental']['unitCount']}
        },
        'entityBreakdown': entity_breakdown_list[:20],
        'filters': {
            'disciplines': list(DISCIPLINE_COLORS.keys()),
            'entities': list(entity_breakdown.keys())
        }
    }
    
    save_json(data, f"{V4_PATH}/disciplines-consolidated/data.json")
    print(f"  Summary: 10 disciplines, ${total_ordered:,.2f} total ordered")
    return data

if __name__ == "__main__":
    print("=" * 60)
    print("Creating V4 Dashboard Data Files")
    print("=" * 60)
    
    create_supplier_marketplace_data()
    create_global_spend_data()
    create_disciplines_data()
    
    print("\n" + "=" * 60)
    print("V4 Data Creation Complete!")
    print("=" * 60)
