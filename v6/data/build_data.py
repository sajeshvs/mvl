#!/usr/bin/env python3
"""
V6 Data Build Pipeline
======================
Reads raw V5 data files and produces clean, unified, deduplicated JSON data
for the V6 Supply Chain Intel Hub dashboard.

Fixes applied:
  1. Single source of truth — no duplicate records across files
  2. Consistent field naming (camelCase everywhere)
  3. Employee vs Supplier separation (V5 confused these)
  4. Proper Change Order tracking
  5. Status normalization ("Cancled" → "Cancelled")
  6. USD conversion for all monetary values
  7. Discipline consolidation (28 → 10 business categories)
  8. Blank supplier name cleanup
  9. Empty/padding record removal
  10. Real quotation-to-PO linkage via document numbers

Usage:
    cd v6/data
    python build_data.py
"""

import json
import os
import re
import sys
from datetime import datetime
from collections import defaultdict

# ─── Configuration ─────────────────────────────────────────────────────────────
V5_DATA_DIR = os.path.join('..', '..', 'v5', 'data')
OUTPUT_DIR = '.'

# Default FX rates (USD base)
FX_RATES = {
    'USD': 1.0, 'AED': 3.6725, 'SAR': 3.75, 'KWD': 0.3077,
    'QAR': 3.64, 'NPR': 133.5, 'EUR': 0.92, 'GBP': 0.79,
    'INR': 83.0, 'JPY': 149.5, 'BHD': 0.376, 'OMR': 0.385,
    'EGP': 30.9, 'PKR': 278.5, 'LBP': 89500, 'JOD': 0.709
}

# Discipline consolidation: V5 has 28, business wants ~12
DISCIPLINE_MAP = {
    # Firestop & Fire Protection
    'Fire': 'Fire Protection', 'Firestop': 'Fire Protection',
    'fire': 'Fire Protection', 'Firestop/ DC 315': 'Fire Protection',
    # Construction & Building
    'Construction': 'Construction', 'Building Materials': 'Construction',
    'Doors': 'Construction', 'Fit Out Project': 'Construction',
    # Mechanical & Equipment
    'Mechanical Items': 'Mechanical', 'Machine / Equipments': 'Mechanical',
    'Rental': 'Mechanical',
    # Electrical
    'Electrical': 'Electrical',
    # Services & Subcontracting
    'Services': 'Services', 'Subcontract': 'Services',
    # General / Misc
    'General': 'General', 'Misc.': 'General', 'Various': 'General',
    'PPE': 'General', 'Computer Peripherals': 'General',
    # Logistics
    'Logistics': 'Logistics', 'Tools': 'Logistics',
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def to_usd(amount, currency):
    """Convert any currency amount to USD."""
    if amount is None or amount == 0:
        return 0.0
    currency = (currency or 'USD').upper().strip()
    rate = FX_RATES.get(currency, 1.0)
    return round(amount / rate, 2)


def parse_date(date_str):
    """Parse various date formats to ISO string."""
    if not date_str:
        return None
    # Already ISO format
    if re.match(r'^\d{4}-\d{2}-\d{2}', date_str):
        return date_str[:10]
    # "23 Jan 2026" format
    for fmt in ['%d %b %Y', '%d-%b-%Y', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d']:
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return date_str


def normalize_status(status):
    """Normalize quotation status."""
    if not status:
        return 'Unknown'
    s = status.strip().lower()
    mapping = {
        'order': 'Order', 'won': 'Order',
        'quotation': 'Quotation', 'open': 'Quotation', 'pending': 'Quotation',
        'waiting': 'Waiting',
        'cancelled': 'Cancelled', 'cancled': 'Cancelled', 'canceled': 'Cancelled',
        'closed': 'Closed', 'lost': 'Closed',
    }
    return mapping.get(s, status.strip())


def get_discipline(material_code, material_desc=''):
    """Map material code/description to consolidated discipline."""
    if material_code and material_code in DISCIPLINE_MAP:
        return DISCIPLINE_MAP[material_code]
    if material_desc:
        for key, disc in DISCIPLINE_MAP.items():
            if key.lower() in material_desc.lower():
                return disc
    return 'General'


def clean_supplier_name(name):
    """Clean supplier name — remove blanks, trim."""
    if not name or name.strip() == '' or name.strip() == '-':
        return 'Unspecified Supplier'
    return name.strip()


def extract_entity_code(po_number):
    """Extract entity code from PO number like RFPO-5829-M4004-1."""
    if not po_number:
        return None
    parts = po_number.split('-')
    if len(parts) >= 3:
        return parts[2]
    return None


def load_json(filename, encoding='utf-8'):
    """Load a JSON file from V5 data directory."""
    path = os.path.join(V5_DATA_DIR, filename)
    if not os.path.exists(path):
        print(f'  WARNING: {filename} not found at {path}')
        return None
    with open(path, 'r', encoding=encoding) as f:
        return json.load(f)


def save_json(data, filename):
    """Save JSON to output directory."""
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    size_kb = os.path.getsize(path) / 1024
    print(f'  ✓ {filename} ({size_kb:.1f} KB)')


# ─── Data Loading ─────────────────────────────────────────────────────────────

def load_raw_data():
    """Load all raw V5 data files."""
    print('Loading V5 raw data...')
    data = {}

    data['quotations_raw'] = load_json('quotations.json')
    data['purchase_orders_raw'] = load_json('purchase_orders.json')
    data['suppliers_raw'] = load_json('suppliers.json')
    data['client_country_map'] = load_json('client_country_map.json')
    data['material_codes'] = load_json('material_codes.json')

    # Also load pre-calculated V5 data for reference / fallback
    data['sm_data'] = load_json('sm_data.json')
    data['gsa_data'] = load_json('gsa_data.json')
    data['md_data'] = load_json('md_data.json')

    return data


# ─── Quotation Processing ────────────────────────────────────────────────────

def build_quotations(raw):
    """Build clean quotation records from raw quotations.json."""
    print('Building quotations...')
    quotations_src = raw.get('quotations_raw', {})
    if isinstance(quotations_src, dict):
        items = quotations_src.get('quotations', [])
    else:
        items = []

    # Also use sm_data.workbench as a richer source with more records
    sm_workbench = []
    if raw.get('sm_data'):
        sm_workbench = raw['sm_data'].get('workbench', [])

    # Build from sm_data.workbench (12,532 records — most complete)
    quotations = []
    seen_numbers = set()

    for item in sm_workbench:
        qnum = item.get('QuotationNumber', '')
        if not qnum or qnum in seen_numbers:
            continue
        seen_numbers.add(qnum)

        value = item.get('QuotationValue', 0) or 0
        currency = item.get('Currency', 'AED')
        value_usd = to_usd(value, currency)
        status = normalize_status(item.get('Status', ''))
        date_str = parse_date(item.get('Date', ''))
        material_code = item.get('MaterialCode', '')
        material = item.get('Material', '')
        entity = item.get('Entity', '')

        # Skip empty/padding records
        if not qnum or (not entity and not material and value == 0):
            continue

        quotations.append({
            'quotationNumber': qnum,
            'quotationType': item.get('QuotationType', ''),
            'status': status,
            'entity': entity,
            'client': item.get('Client', ''),
            'projectName': item.get('ProjectName', ''),
            'description': item.get('Description', ''),
            'materialCode': material_code,
            'material': material,
            'discipline': get_discipline(material_code, material),
            'value': value,
            'currency': currency,
            'valueUSD': value_usd,
            'contact': item.get('Contact', ''),
            'date': date_str,
            'year': int(date_str[:4]) if date_str and len(date_str) >= 4 else None,
            'month': int(date_str[5:7]) if date_str and len(date_str) >= 7 else None,
            'yearMonth': date_str[:7] if date_str and len(date_str) >= 7 else None,
        })

    # Enrich with fields from raw quotations.json where available
    raw_lookup = {}
    for item in items:
        qnum = item.get('quotation_number', '')
        if qnum:
            raw_lookup[qnum] = item

    for q in quotations:
        raw_q = raw_lookup.get(q['quotationNumber'])
        if raw_q:
            # Add enriched fields
            outcome = raw_q.get('outcome', {})
            q['statusNormalized'] = outcome.get('status_normalized', '')
            q['convertedToPO'] = outcome.get('converted_to_po', False)
            q['linkedPONumber'] = outcome.get('po_number')

            metrics = raw_q.get('metrics', {})
            q['daysToResponse'] = metrics.get('days_to_response')
            q['daysToClose'] = metrics.get('days_to_close')

            client_info = raw_q.get('client', {})
            if isinstance(client_info, dict):
                q['clientType'] = client_info.get('type', '')

    print(f'  Built {len(quotations)} quotations')
    return quotations


# ─── Purchase Order Processing ────────────────────────────────────────────────

def build_purchase_orders(raw):
    """Build clean PO records from raw data."""
    print('Building purchase orders...')

    # Primary source: gsa_data.workbench (3,539 records — pre-calculated with USD)
    gsa_workbench = []
    if raw.get('gsa_data'):
        gsa_workbench = raw['gsa_data'].get('workbench', [])

    # Enrichment source: purchase_orders.json (detailed fields)
    po_raw_items = []
    if raw.get('purchase_orders_raw') and isinstance(raw['purchase_orders_raw'], dict):
        po_raw_items = raw['purchase_orders_raw'].get('purchase_orders', [])

    # Build lookup from raw POs
    raw_po_lookup = {}
    for item in po_raw_items:
        po_num = item.get('po_number', '')
        if po_num:
            raw_po_lookup[po_num] = item

    purchase_orders = []
    seen_numbers = set()

    for item in gsa_workbench:
        po_num = item.get('poNumber', '')
        if not po_num or po_num in seen_numbers:
            continue
        seen_numbers.add(po_num)

        value = item.get('originalValue', 0) or 0
        currency = item.get('currency', 'AED')
        value_usd = item.get('valueUSD', 0) or to_usd(value, currency)
        po_type = item.get('poType', 'Base PO')
        is_change_order = po_type.lower().startswith('change')

        po = {
            'poNumber': po_num,
            'poDate': parse_date(item.get('poDate', '')),
            'poDateOriginal': item.get('poDate', ''),
            'poName': item.get('poName', ''),
            'supplier': clean_supplier_name(item.get('supplier', '')),
            'value': value,
            'currency': currency,
            'valueUSD': value_usd,
            'poType': po_type,
            'isChangeOrder': is_change_order,
            'entity': item.get('entity', ''),
            'entityCode': item.get('entityCode', ''),
            'project': item.get('project', ''),
            'material': item.get('material', ''),
            'discipline': get_discipline(item.get('material', '')),
            'year': item.get('year'),
            'month': item.get('month'),
            'yearMonth': item.get('yearMonth', ''),
        }

        # Enrich from raw POs
        raw_po = raw_po_lookup.get(po_num)
        if raw_po:
            dates = raw_po.get('dates', {})
            po['expectedDelivery'] = dates.get('expected_delivery')
            po['actualDelivery'] = dates.get('actual_delivery')

            supplier_info = raw_po.get('supplier', {})
            if isinstance(supplier_info, dict):
                po['supplierId'] = supplier_info.get('supplier_id')
                po['supplierMatched'] = supplier_info.get('matched', False)

            meta = raw_po.get('metadata', {})
            po['dataQualityScore'] = meta.get('data_quality_score', 0)

            po['category'] = raw_po.get('category', '')

        purchase_orders.append(po)

    print(f'  Built {len(purchase_orders)} purchase orders')
    return purchase_orders


# ─── Supplier Processing ──────────────────────────────────────────────────────

def build_suppliers(raw, quotations, purchase_orders):
    """Build clean supplier records with linked PO/quotation stats."""
    print('Building suppliers...')

    suppliers_src = raw.get('suppliers_raw', {})
    if isinstance(suppliers_src, dict):
        supplier_items = suppliers_src.get('suppliers', [])
    else:
        supplier_items = []

    # Build PO spend per supplier
    po_by_supplier = defaultdict(lambda: {'poCount': 0, 'totalSpendUSD': 0, 'basePOs': 0, 'changeOrders': 0})
    for po in purchase_orders:
        s = po['supplier']
        po_by_supplier[s]['poCount'] += 1
        po_by_supplier[s]['totalSpendUSD'] += po['valueUSD']
        if po['isChangeOrder']:
            po_by_supplier[s]['changeOrders'] += 1
        else:
            po_by_supplier[s]['basePOs'] += 1

    # Build quotation stats per supplier (using client as proxy since suppliers aren't in quotations)
    # In quotations, "Client" is the external client, "Contact" is the MVL employee

    suppliers = []
    for item in supplier_items:
        name = clean_supplier_name(item.get('name', ''))
        if name == 'Unspecified Supplier':
            continue

        contact = item.get('contact', {})
        address = item.get('address', {})
        location = item.get('location', {})
        phone_val = item.get('phone_validation', {})
        rating = item.get('rating', {})

        po_stats = po_by_supplier.get(name, {'poCount': 0, 'totalSpendUSD': 0, 'basePOs': 0, 'changeOrders': 0})

        suppliers.append({
            'id': item.get('id', ''),
            'name': name,
            'materialCategory': item.get('material_category', ''),
            'discipline': get_discipline(item.get('material_category', '')),
            'contactName': contact.get('primary_contact', ''),
            'email': contact.get('email', ''),
            'phone': contact.get('phone', ''),
            'country': address.get('country') or phone_val.get('phone_country', ''),
            'city': address.get('city', ''),
            'fullAddress': address.get('full_address', ''),
            'latitude': location.get('latitude'),
            'longitude': location.get('longitude'),
            'locationQuality': location.get('quality', 'low'),
            'ratingScore': rating.get('score', 0),
            'status': item.get('status', 'active'),
            'supplierScore': item.get('supplier_score', 0),
            'poCount': po_stats['poCount'],
            'totalSpendUSD': round(po_stats['totalSpendUSD'], 2),
            'basePOs': po_stats['basePOs'],
            'changeOrders': po_stats['changeOrders'],
        })

    # Sort by total spend descending
    suppliers.sort(key=lambda s: s['totalSpendUSD'], reverse=True)

    print(f'  Built {len(suppliers)} suppliers')
    return suppliers


# ─── MVL Employees (separated from suppliers) ────────────────────────────────

def build_employees(quotations):
    """Build MVL employee performance data from quotation contacts."""
    print('Building employee performance...')

    emp_stats = defaultdict(lambda: {
        'quotationCount': 0, 'orderCount': 0, 'totalValueUSD': 0, 'orderValueUSD': 0
    })

    for q in quotations:
        contact = q.get('contact', '')
        if not contact or contact.strip() == '':
            continue
        emp_stats[contact]['quotationCount'] += 1
        emp_stats[contact]['totalValueUSD'] += q['valueUSD']
        if q['status'] == 'Order':
            emp_stats[contact]['orderCount'] += 1
            emp_stats[contact]['orderValueUSD'] += q['valueUSD']

    employees = []
    for name, stats in emp_stats.items():
        win_rate = round(stats['orderCount'] / stats['quotationCount'] * 100, 1) if stats['quotationCount'] > 0 else 0
        employees.append({
            'name': name,
            'quotationCount': stats['quotationCount'],
            'orderCount': stats['orderCount'],
            'totalValueUSD': round(stats['totalValueUSD'], 2),
            'orderValueUSD': round(stats['orderValueUSD'], 2),
            'winRate': win_rate,
        })

    employees.sort(key=lambda e: e['orderValueUSD'], reverse=True)
    print(f'  Built {len(employees)} employee records')
    return employees


# ─── Pre-calculated Aggregations ──────────────────────────────────────────────

def build_aggregations(quotations, purchase_orders, suppliers, employees):
    """Build all pre-calculated breakdowns used by each tab."""
    print('Building aggregations...')

    agg = {}

    # ─── SM Tab Aggregations ─────────────────────────────────────────
    # Status summary
    status_counts = defaultdict(lambda: {'count': 0, 'totalValueUSD': 0})
    for q in quotations:
        s = q['status']
        status_counts[s]['count'] += 1
        status_counts[s]['totalValueUSD'] += q['valueUSD']

    agg['statusSummary'] = [
        {'status': s, 'count': d['count'], 'totalValueUSD': round(d['totalValueUSD'], 2)}
        for s, d in sorted(status_counts.items(), key=lambda x: x[1]['count'], reverse=True)
    ]

    # Entity quotation breakdown
    entity_quotes = defaultdict(lambda: {'quotationCount': 0, 'totalValueUSD': 0})
    for q in quotations:
        e = q['entity']
        if e:
            entity_quotes[e]['quotationCount'] += 1
            entity_quotes[e]['totalValueUSD'] += q['valueUSD']

    # Entity PO spend
    entity_po_spend = defaultdict(lambda: {'poCount': 0, 'totalSpendUSD': 0, 'baseValue': 0, 'changeValue': 0})
    for po in purchase_orders:
        e = po['entity']
        if e:
            entity_po_spend[e]['poCount'] += 1
            entity_po_spend[e]['totalSpendUSD'] += po['valueUSD']
            if po['isChangeOrder']:
                entity_po_spend[e]['changeValue'] += po['valueUSD']
            else:
                entity_po_spend[e]['baseValue'] += po['valueUSD']

    all_entities = sorted(set(list(entity_quotes.keys()) + list(entity_po_spend.keys())))
    agg['entityBreakdown'] = []
    for e in all_entities:
        q_data = entity_quotes.get(e, {'quotationCount': 0, 'totalValueUSD': 0})
        p_data = entity_po_spend.get(e, {'poCount': 0, 'totalSpendUSD': 0, 'baseValue': 0, 'changeValue': 0})
        agg['entityBreakdown'].append({
            'entity': e,
            'quotationCount': q_data['quotationCount'],
            'quotationValueUSD': round(q_data['totalValueUSD'], 2),
            'poCount': p_data['poCount'],
            'poSpendUSD': round(p_data['totalSpendUSD'], 2),
            'baseValue': round(p_data['baseValue'], 2),
            'changeValue': round(p_data['changeValue'], 2),
        })

    agg['entityBreakdown'].sort(key=lambda x: x['poSpendUSD'], reverse=True)

    # Material / Discipline breakdown
    disc_quotes = defaultdict(lambda: {'quotationCount': 0, 'totalValueUSD': 0})
    for q in quotations:
        d = q['discipline']
        disc_quotes[d]['quotationCount'] += 1
        disc_quotes[d]['totalValueUSD'] += q['valueUSD']

    disc_pos = defaultdict(lambda: {'poCount': 0, 'totalSpendUSD': 0})
    for po in purchase_orders:
        d = po['discipline']
        disc_pos[d]['poCount'] += 1
        disc_pos[d]['totalSpendUSD'] += po['valueUSD']

    all_disciplines = sorted(set(list(disc_quotes.keys()) + list(disc_pos.keys())))
    agg['disciplineBreakdown'] = []
    for d in all_disciplines:
        q_data = disc_quotes.get(d, {'quotationCount': 0, 'totalValueUSD': 0})
        p_data = disc_pos.get(d, {'poCount': 0, 'totalSpendUSD': 0})
        agg['disciplineBreakdown'].append({
            'discipline': d,
            'quotationCount': q_data['quotationCount'],
            'quotedValueUSD': round(q_data['totalValueUSD'], 2),
            'poCount': p_data['poCount'],
            'orderedValueUSD': round(p_data['totalSpendUSD'], 2),
        })

    agg['disciplineBreakdown'].sort(key=lambda x: x['orderedValueUSD'], reverse=True)

    # ─── GSA Tab Aggregations ────────────────────────────────────────

    # Supplier rankings
    supplier_spend = defaultdict(lambda: {'poCount': 0, 'totalSpendUSD': 0, 'basePOs': 0, 'changeOrders': 0})
    for po in purchase_orders:
        s = po['supplier']
        supplier_spend[s]['poCount'] += 1
        supplier_spend[s]['totalSpendUSD'] += po['valueUSD']
        if po['isChangeOrder']:
            supplier_spend[s]['changeOrders'] += 1
        else:
            supplier_spend[s]['basePOs'] += 1

    ranked = sorted(supplier_spend.items(), key=lambda x: x[1]['totalSpendUSD'], reverse=True)
    agg['supplierRankings'] = {
        'top': [{'name': name, 'poCount': d['poCount'], 'totalSpendUSD': round(d['totalSpendUSD'], 2),
                 'basePOs': d['basePOs'], 'changeOrders': d['changeOrders']}
                for name, d in ranked[:20]],
        'bottom': [{'name': name, 'poCount': d['poCount'], 'totalSpendUSD': round(d['totalSpendUSD'], 2),
                    'basePOs': d['basePOs'], 'changeOrders': d['changeOrders']}
                   for name, d in ranked[-20:] if d['totalSpendUSD'] > 0],
    }

    # Annual trend
    year_spend = defaultdict(lambda: {'baseValue': 0, 'changeValue': 0, 'totalValue': 0, 'poCount': 0, 'suppliers': set()})
    for po in purchase_orders:
        y = po.get('year')
        if y:
            year_spend[y]['poCount'] += 1
            year_spend[y]['totalValue'] += po['valueUSD']
            year_spend[y]['suppliers'].add(po['supplier'])
            if po['isChangeOrder']:
                year_spend[y]['changeValue'] += po['valueUSD']
            else:
                year_spend[y]['baseValue'] += po['valueUSD']

    agg['annualTrend'] = []
    for y in sorted(year_spend.keys()):
        d = year_spend[y]
        agg['annualTrend'].append({
            'year': y,
            'baseValue': round(d['baseValue'], 2),
            'changeValue': round(d['changeValue'], 2),
            'totalValue': round(d['totalValue'], 2),
            'poCount': d['poCount'],
            'supplierCount': len(d['suppliers']),
        })

    # Monthly trend
    month_spend = defaultdict(lambda: {'value': 0, 'count': 0})
    for po in purchase_orders:
        ym = po.get('yearMonth', '')
        if ym:
            month_spend[ym]['value'] += po['valueUSD']
            month_spend[ym]['count'] += 1

    agg['monthlyTrend'] = [
        {'yearMonth': ym, 'value': round(d['value'], 2), 'count': d['count']}
        for ym, d in sorted(month_spend.items())
    ]

    # Quotation monthly trend (for SM tab)
    q_month = defaultdict(lambda: {'quotes': 0, 'orders': 0, 'cancelled': 0, 'quoteValue': 0, 'orderValue': 0})
    for q in quotations:
        ym = q.get('yearMonth', '')
        if ym:
            q_month[ym]['quotes'] += 1
            q_month[ym]['quoteValue'] += q['valueUSD']
            if q['status'] == 'Order':
                q_month[ym]['orders'] += 1
                q_month[ym]['orderValue'] += q['valueUSD']
            elif q['status'] == 'Cancelled':
                q_month[ym]['cancelled'] += 1

    agg['quotationTrend'] = [
        {'yearMonth': ym, 'quotes': d['quotes'], 'orders': d['orders'],
         'cancelled': d['cancelled'], 'quoteValueUSD': round(d['quoteValue'], 2),
         'orderValueUSD': round(d['orderValue'], 2)}
        for ym, d in sorted(q_month.items())
    ]

    # Project breakdown
    project_spend = defaultdict(lambda: {'poCount': 0, 'totalSpendUSD': 0})
    for po in purchase_orders:
        p = po.get('project', '')
        if p:
            project_spend[p]['poCount'] += 1
            project_spend[p]['totalSpendUSD'] += po['valueUSD']

    project_ranked = sorted(project_spend.items(), key=lambda x: x[1]['totalSpendUSD'], reverse=True)
    agg['projectBreakdown'] = [
        {'project': name, 'poCount': d['poCount'], 'totalSpendUSD': round(d['totalSpendUSD'], 2)}
        for name, d in project_ranked[:30]
    ]

    # Material breakdown for GSA
    mat_spend = defaultdict(lambda: {'poCount': 0, 'totalSpendUSD': 0})
    for po in purchase_orders:
        m = po.get('material', '') or 'Unspecified'
        mat_spend[m]['poCount'] += 1
        mat_spend[m]['totalSpendUSD'] += po['valueUSD']

    agg['materialBreakdown'] = [
        {'material': m, 'poCount': d['poCount'], 'totalSpendUSD': round(d['totalSpendUSD'], 2)}
        for m, d in sorted(mat_spend.items(), key=lambda x: x[1]['totalSpendUSD'], reverse=True)
    ]

    print('  ✓ Aggregations complete')
    return agg


# ─── Summary Stats ────────────────────────────────────────────────────────────

def build_summary(quotations, purchase_orders, suppliers, employees):
    """Build dashboard summary KPIs."""
    print('Building summary KPIs...')

    total_quote_value = sum(q['valueUSD'] for q in quotations)
    order_quotes = [q for q in quotations if q['status'] == 'Order']
    total_order_value = sum(q['valueUSD'] for q in order_quotes)
    total_po_spend = sum(po['valueUSD'] for po in purchase_orders)
    base_pos = [po for po in purchase_orders if not po['isChangeOrder']]
    change_orders = [po for po in purchase_orders if po['isChangeOrder']]

    unique_clients = len(set(q['client'] for q in quotations if q['client']))
    unique_entities = len(set(q['entity'] for q in quotations if q['entity']))
    unique_projects_q = len(set(q['projectName'] for q in quotations if q['projectName']))
    unique_projects_po = len(set(po['project'] for po in purchase_orders if po['project']))
    active_suppliers = len([s for s in suppliers if s['poCount'] > 0])

    win_rate = round(len(order_quotes) / len(quotations) * 100, 1) if quotations else 0

    summary = {
        # SM KPIs
        'totalQuotations': len(quotations),
        'totalOrders': len(order_quotes),
        'winRate': win_rate,
        'totalQuotationValueUSD': round(total_quote_value, 2),
        'totalOrderValueUSD': round(total_order_value, 2),
        'totalClients': unique_clients,
        'totalEntities': unique_entities,
        'totalEmployees': len(employees),

        # GSA KPIs
        'totalPOs': len(purchase_orders),
        'totalPOSpendUSD': round(total_po_spend, 2),
        'basePOCount': len(base_pos),
        'basePOValueUSD': round(sum(po['valueUSD'] for po in base_pos), 2),
        'changeOrderCount': len(change_orders),
        'changeOrderValueUSD': round(sum(po['valueUSD'] for po in change_orders), 2),
        'changeOrderRatio': round(len(change_orders) / len(purchase_orders) * 100, 1) if purchase_orders else 0,
        'avgPOValueUSD': round(total_po_spend / len(purchase_orders), 2) if purchase_orders else 0,
        'activeSupplierCount': active_suppliers,
        'totalSupplierCount': len(suppliers),
        'totalProjects': max(unique_projects_q, unique_projects_po),
    }

    print(f'  ✓ Summary: {summary["totalQuotations"]} quotations, {summary["totalPOs"]} POs, {summary["totalSupplierCount"]} suppliers')
    return summary


# ─── Filter Options ───────────────────────────────────────────────────────────

def build_filter_options(quotations, purchase_orders, suppliers):
    """Build all unique filter option lists for dropdowns."""
    print('Building filter options...')

    filters = {
        # Shared filters
        'entities': sorted(set(
            [q['entity'] for q in quotations if q['entity']] +
            [po['entity'] for po in purchase_orders if po['entity']]
        )),
        'disciplines': sorted(set(
            [q['discipline'] for q in quotations if q['discipline']] +
            [po['discipline'] for po in purchase_orders if po['discipline']]
        )),
        'materials': sorted(set(
            [q['material'] for q in quotations if q['material']] +
            [po['material'] for po in purchase_orders if po['material']]
        )),

        # SM-specific
        'statuses': sorted(set(q['status'] for q in quotations if q['status'])),
        'clients': sorted(set(q['client'] for q in quotations if q['client'])),
        'contacts': sorted(set(q['contact'] for q in quotations if q['contact'])),
        'projects': sorted(set(
            [q['projectName'] for q in quotations if q['projectName']] +
            [po['project'] for po in purchase_orders if po['project']]
        )),

        # GSA-specific
        'suppliers': sorted(set(po['supplier'] for po in purchase_orders if po['supplier'])),
        'poTypes': sorted(set(po['poType'] for po in purchase_orders if po['poType'])),
        'years': sorted(set(
            [q['year'] for q in quotations if q['year']] +
            [po['year'] for po in purchase_orders if po['year']]
        )),
        'currencies': sorted(set(
            [q['currency'] for q in quotations if q['currency']] +
            [po['currency'] for po in purchase_orders if po['currency']]
        )),

        # Supplier countries
        'countries': sorted(set(s['country'] for s in suppliers if s['country'])),
    }

    print(f'  ✓ Filters: {len(filters["entities"])} entities, {len(filters["suppliers"])} suppliers, {len(filters["disciplines"])} disciplines')
    return filters


# ─── Output Files ─────────────────────────────────────────────────────────────

def save_all(quotations, purchase_orders, suppliers, employees, aggregations, summary, filters, client_country_map):
    """Save all V6 data files."""
    print('\nSaving V6 data files...')

    # 1. Unified dashboard data (single source of truth)
    dashboard = {
        'version': 'v6',
        'buildDate': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'summary': summary,
        'filters': filters,
        'aggregations': aggregations,
    }
    save_json(dashboard, 'dashboard.json')

    # 2. Quotations (SM tab primary data)
    save_json({
        'metadata': {
            'version': 'v6',
            'buildDate': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'totalRecords': len(quotations),
        },
        'records': quotations,
    }, 'quotations.json')

    # 3. Purchase Orders (GSA tab primary data)
    save_json({
        'metadata': {
            'version': 'v6',
            'buildDate': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'totalRecords': len(purchase_orders),
        },
        'records': purchase_orders,
    }, 'purchase_orders.json')

    # 4. Suppliers
    save_json({
        'metadata': {
            'version': 'v6',
            'buildDate': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'totalRecords': len(suppliers),
        },
        'records': suppliers,
    }, 'suppliers.json')

    # 5. Employees (MVL contacts — properly separated from suppliers)
    save_json({
        'metadata': {
            'version': 'v6',
            'buildDate': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'totalRecords': len(employees),
        },
        'records': employees,
    }, 'employees.json')

    # 6. Client-Country mapping (passthrough from V5)
    if client_country_map:
        save_json(client_country_map, 'client_country_map.json')


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print('=' * 60)
    print('  V6 Data Build Pipeline')
    print('=' * 60)

    raw = load_raw_data()

    quotations = build_quotations(raw)
    purchase_orders = build_purchase_orders(raw)
    suppliers = build_suppliers(raw, quotations, purchase_orders)
    employees = build_employees(quotations)
    aggregations = build_aggregations(quotations, purchase_orders, suppliers, employees)
    summary = build_summary(quotations, purchase_orders, suppliers, employees)
    filters = build_filter_options(quotations, purchase_orders, suppliers)

    client_country_map = raw.get('client_country_map')
    save_all(quotations, purchase_orders, suppliers, employees, aggregations, summary, filters, client_country_map)

    print('\n' + '=' * 60)
    print('  V6 Data Build Complete!')
    print('=' * 60)
    print(f'  Quotations:      {len(quotations):>6,}')
    print(f'  Purchase Orders: {len(purchase_orders):>6,}')
    print(f'  Suppliers:       {len(suppliers):>6,}')
    print(f'  Employees:       {len(employees):>6,}')
    print(f'  Entities:        {len(filters["entities"]):>6,}')
    print(f'  Disciplines:     {len(filters["disciplines"]):>6,}')
    print('=' * 60)


if __name__ == '__main__':
    main()
