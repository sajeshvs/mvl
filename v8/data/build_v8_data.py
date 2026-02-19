"""
V8 Data Cleanup Pipeline
========================
Reads V5 data files, cleans/deduplicates, and outputs files in the EXACT same
structure that V5's scripts.js expects, with Material Code enhancements.

Fixes applied (V7 baseline):
1. Remove 398 empty/padding records (no quotation number, zero value)
2. Normalize "Cancled" → "Cancelled" status
3. Label blank suppliers as "Unspecified Supplier"
4. Deduplicate quotation and PO records
5. Separate employee data from supplier data into employees.json
6. Map 30 raw materials → 12 official Material Codes (from Material and Material Codes.csv)
7. Fix CO Count/Value (properly separate base POs from change orders)
8. Recompute all summary KPIs from real data
9. Separate Q→PO conversion time into conversion_times.json
10. Fix poSpendUSD=0 bug on blank-supplier POs (use valueUSD instead)
11. Add materialCode field to every record (SM workbench, GSA POs, M&D)
12. Build materialCodes filter arrays (12 codes) + materials arrays (raw names)

Input: v8/data/ (copied from v5)
Output: v8/data/ (overwritten with clean versions)
"""

import json
import os
import re
from collections import defaultdict
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── FX Rates (same as V5) ──────────────────────────────────────
FX_RATES = {
    'USD': 1, 'AED': 3.6725, 'SAR': 3.75, 'KWD': 0.3077,
    'QAR': 3.64, 'NPR': 133.5, 'EUR': 0.92, 'GBP': 0.79,
    'INR': 83, 'JPY': 149.5, 'BHD': 0.376, 'OMR': 0.385,
    'PKR': 278, 'EGP': 30.9, 'JOD': 0.709, 'LKR': 320
}

# ─── Material Code Map (from official Material and Material Codes.csv) ──────
# Maps 30 raw material names → 12 official Material Codes
# Source: v7/Material and Material Codes.csv
MATERIAL_CODE_MAP = {
    # Architectural (8 materials)
    'sandwich panel':                           'Architectural',
    'accessories / connection for sandwich panel': 'Architectural',
    'steel coil':                               'Architectural',
    'doors':                                    'Architectural',
    'windows':                                  'Architectural',
    'fit out project':                          'Architectural',
    'paints':                                   'Architectural',
    'sanitary and toilet accessories':           'Architectural',

    # Chemicals (2 materials)
    'polyurethane foam':                        'Chemicals',
    'chemicals':                                'Chemicals',

    # Electrical (1 material)
    'electrical':                               'Electrical',

    # Fire (1 material)
    'firestop/ dc 315':                         'Fire',
    'firestop':                                 'Fire',
    'fire':                                     'Fire',
    'fire alarm':                               'Fire',
    'fire fighting':                            'Fire',
    'fire suppression':                         'Fire',
    'fire protection':                          'Fire',

    # Logistics (3 materials)
    'transportation':                           'Logistics',
    'discount':                                 'Logistics',
    'mhe':                                      'Logistics',

    # Mechanical (2 materials)
    'machine / equipments':                     'Mechanical',
    'mechanical items':                         'Mechanical',

    # Office Assets (1 material)
    'computer peripherals':                     'Office Assets',

    # Protection (1 material)
    'ppe':                                      'Protection',

    # Rental (1 material)
    'rental':                                   'Rental',

    # Services (5 materials)
    'design':                                   'Services',
    'construction':                             'Services',
    'lsa - life support area':                  'Services',
    'subcontract':                              'Services',
    'services':                                 'Services',

    # Tools (1 material)
    'tools':                                    'Tools',

    # Various (4 materials)
    'containers':                               'Various',
    'building materials':                       'Various',
    'graco spares':                             'Various',
    'misc.':                                    'Various',
    'misc':                                     'Various',
    'general':                                  'Various',
    'logistics':                                'Logistics',
}

def get_material_code(raw):
    """Map raw material name to one of 12 official Material Codes."""
    if not raw or not str(raw).strip():
        return 'Various'
    normalized = str(raw).strip().lower()
    # Direct match
    if normalized in MATERIAL_CODE_MAP:
        return MATERIAL_CODE_MAP[normalized]
    # Partial match (for edge cases like 'fire alarm systems')
    for key, val in MATERIAL_CODE_MAP.items():
        if key in normalized or normalized in key:
            return val
    return 'Various'  # Default fallback


def to_usd(value, currency):
    """Convert value to USD."""
    try:
        val = float(value) if value else 0
    except (ValueError, TypeError):
        val = 0
    if not currency or str(currency).strip().upper() == 'USD':
        return val
    rate = FX_RATES.get(str(currency).strip().upper(), 1)
    return round(val / rate, 2) if rate else val


def normalize_status(status):
    """Fix status typos and normalize."""
    if not status:
        return 'Unknown'
    s = str(status).strip()
    s_lower = s.lower()
    mapping = {
        'cancled': 'Cancelled',
        'canceled': 'Cancelled',
        'cancelled': 'Cancelled',
        'won': 'Order',
        'order': 'Order',
        'open': 'Quotation',
        'quotation': 'Quotation',
        'lost': 'Lost',
        'closed': 'Closed',
        'pending': 'Waiting',
        'waiting': 'Waiting',
        'budget': 'Budget',
        'budgetary': 'Budget',
    }
    return mapping.get(s_lower, s)


def clean_supplier_name(name):
    """Label blank/empty suppliers as Unspecified."""
    if not name or not str(name).strip() or str(name).strip() == '-':
        return 'Unspecified Supplier'
    return str(name).strip()


def parse_date_to_iso(date_str):
    """Try to parse various date formats to ISO."""
    if not date_str:
        return None
    s = str(date_str).strip()
    formats = [
        '%d %b %Y', '%d-%b-%Y', '%Y-%m-%d', '%m/%d/%Y',
        '%d/%m/%Y', '%b %d, %Y', '%Y-%m-%dT%H:%M:%S',
        '%d %B %Y', '%d-%m-%Y'
    ]
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def load_json(filename):
    """Load JSON file from data directory."""
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        print(f'  [SKIP] {filename} not found')
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data, filename):
    """Save JSON file to data directory."""
    path = os.path.join(BASE_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    size_kb = os.path.getsize(path) / 1024
    print(f'  [SAVED] {filename} ({size_kb:.1f} KB)')


def is_empty_record(q):
    """Check if a quotation record is an empty/padding row."""
    qnum = q.get('QuotationNumber', q.get('quotation_number', ''))
    if not qnum or not str(qnum).strip():
        return True
    entity = q.get('Entity', q.get('entity', ''))
    material = q.get('Material', q.get('MaterialCode', q.get('material', '')))
    value = q.get('QuotationValue', q.get('quotedValue', q.get('value', 0)))
    try:
        val = float(value) if value else 0
    except (ValueError, TypeError):
        val = 0
    if not entity and not material and val == 0:
        return True
    return False


def is_mvl_employee(name):
    """Check if a name looks like an MVL employee (contact) rather than a supplier company."""
    if not name:
        return False
    name_str = str(name).strip()
    # Employee names are typically short personal names, not company names
    # Company names usually contain: LLC, FZC, Ltd, Corp, Inc, Group, Co, Est, Trading, etc.
    company_indicators = ['llc', 'fzc', 'fze', 'ltd', 'corp', 'inc', 'group', 'co.', 'est',
                          'trading', 'services', 'solutions', 'enterprise', 'international',
                          'industries', 'company', 'contracting', 'engineering', 'supply',
                          'technical', 'general', 'middle east', 'gulf', 'al ', 'al-']
    lower = name_str.lower()
    for indicator in company_indicators:
        if indicator in lower:
            return False
    # If it's a short name (likely personal), and has a dot or single word
    if len(name_str.split()) <= 2 and ('.' in name_str or len(name_str) < 20):
        return True
    return False


# ═══════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════

def main():
    print('=' * 60)
    print('V8 Data Cleanup Pipeline')
    print('=' * 60)

    # ── 1. Load all V5 data files ────────────────────────────
    print('\n[1/8] Loading V5 data files...')
    sm_data = load_json('sm_data.json')
    gsa_data = load_json('gsa_data.json')
    md_data = load_json('md_data.json')
    dashboard_data = load_json('dashboard_data.json')
    suppliers_raw = load_json('suppliers.json')
    quotations_raw = load_json('quotations.json')
    purchase_orders_raw = load_json('purchase_orders.json')
    client_country_map = load_json('client_country_map.json')

    if not sm_data or not gsa_data:
        print('ERROR: Missing critical data files!')
        return

    # ── 2. Clean SM workbench (quotations) ───────────────────
    print('\n[2/8] Cleaning SM workbench quotations...')
    workbench = sm_data.get('workbench', [])
    print(f'  Original workbench records: {len(workbench)}')

    seen_qnums = set()
    clean_workbench = []
    removed_empty = 0
    removed_dup = 0
    removed_iq = 0
    status_fixed = 0

    for q in workbench:
        # Skip empty/padding records
        if is_empty_record(q):
            removed_empty += 1
            continue

        # Skip IQ (Internal Quotation) records — only keep RFQ records
        q_type = str(q.get('QuotationType', '')).strip().upper()
        if q_type == 'IQ':
            removed_iq += 1
            continue

        # Deduplicate by quotation number
        qnum = str(q.get('QuotationNumber', '')).strip()
        if qnum in seen_qnums:
            removed_dup += 1
            continue
        seen_qnums.add(qnum)

        # Fix "Cancled" status
        old_status = q.get('Status', '')
        new_status = normalize_status(old_status)
        if old_status != new_status:
            status_fixed += 1
        q['Status'] = new_status

        # Clean supplier if present
        if 'SupplierName' in q:
            q['SupplierName'] = clean_supplier_name(q['SupplierName'])

        # Add materialCode from raw material name
        raw_mat = q.get('MaterialCode', q.get('Material', ''))
        q['materialCode'] = get_material_code(raw_mat)

        clean_workbench.append(q)

    print(f'  Removed empty/padding: {removed_empty}')
    print(f'  Removed IQ records: {removed_iq}')
    print(f'  Removed duplicates: {removed_dup}')
    print(f'  Status fixed: {status_fixed}')
    print(f'  Clean workbench records (RFQ only): {len(clean_workbench)}')

    sm_data['workbench'] = clean_workbench

    # ── 3. Clean GSA workbench (POs) ─────────────────────────
    print('\n[3/8] Cleaning GSA workbench POs...')
    gsa_workbench = gsa_data.get('workbench', [])
    print(f'  Original PO records: {len(gsa_workbench)}')

    seen_pos = set()
    clean_pos = []
    po_removed_empty = 0
    po_removed_dup = 0
    po_supplier_fixed = 0
    po_value_fixed = 0

    for po in gsa_workbench:
        po_num = str(po.get('poNumber', '')).strip()
        if not po_num:
            po_removed_empty += 1
            continue

        if po_num in seen_pos:
            po_removed_dup += 1
            continue
        seen_pos.add(po_num)

        # Fix blank supplier
        old_sup = po.get('supplier', '')
        po['supplier'] = clean_supplier_name(old_sup)
        if old_sup != po['supplier']:
            po_supplier_fixed += 1

        # Fix poSpendUSD = 0 bug (use valueUSD or originalValue)
        spend = float(po.get('poSpendUSD', 0) or 0)
        if spend == 0:
            value_usd = float(po.get('valueUSD', 0) or 0)
            orig_val = float(po.get('originalValue', 0) or 0)
            currency = po.get('currency', 'USD')
            if value_usd > 0:
                po['poSpendUSD'] = value_usd
                po_value_fixed += 1
            elif orig_val > 0:
                po['poSpendUSD'] = to_usd(orig_val, currency)
                po_value_fixed += 1

        # Add materialCode from raw material name
        po['materialCode'] = get_material_code(po.get('material', ''))

        clean_pos.append(po)

    print(f'  Removed empty: {po_removed_empty}')
    print(f'  Removed duplicates: {po_removed_dup}')
    print(f'  Supplier names fixed: {po_supplier_fixed}')
    print(f'  poSpendUSD values fixed: {po_value_fixed}')
    print(f'  Clean PO records: {len(clean_pos)}')

    gsa_data['workbench'] = clean_pos

    # ── 4. Recompute GSA summary & aggregations ──────────────
    print('\n[4/8] Recomputing GSA summary and aggregations...')

    # Recompute summary
    total_spend = sum(float(po.get('poSpendUSD', 0) or 0) for po in clean_pos)
    base_pos = [po for po in clean_pos if str(po.get('poType', '')).lower().startswith('base')]
    change_orders = [po for po in clean_pos if str(po.get('poType', '')).lower().startswith('change')]
    base_value = sum(float(po.get('poSpendUSD', 0) or 0) for po in base_pos)
    co_value = sum(float(po.get('poSpendUSD', 0) or 0) for po in change_orders)
    unique_suppliers = set(po.get('supplier', '') for po in clean_pos if po.get('supplier', '') != 'Unspecified Supplier')
    unique_entities = set(po.get('entity', '') for po in clean_pos if po.get('entity', ''))

    gsa_data['summary'] = {
        'totalSpendUSD': round(total_spend, 2),
        'totalPOs': len(clean_pos),
        'basePOs': len(base_pos),
        'changeOrders': len(change_orders),
        'changeOrderValue': round(co_value, 2),
        'basePOValue': round(base_value, 2),
        'supplierCount': len(unique_suppliers),
        'entityCount': len(unique_entities)
    }

    # Recompute supplier rankings
    supplier_spend = defaultdict(lambda: {'valueUSD': 0, 'poCount': 0, 'basePOs': 0, 'changeOrders': 0})
    for po in clean_pos:
        s = po.get('supplier', 'Unspecified Supplier')
        val = float(po.get('poSpendUSD', 0) or 0)
        supplier_spend[s]['valueUSD'] += val
        supplier_spend[s]['poCount'] += 1
        if str(po.get('poType', '')).lower().startswith('base'):
            supplier_spend[s]['basePOs'] += 1
        elif str(po.get('poType', '')).lower().startswith('change'):
            supplier_spend[s]['changeOrders'] += 1

    ranked = sorted(supplier_spend.items(), key=lambda x: x[1]['valueUSD'], reverse=True)
    # Filter out "Unspecified Supplier" from rankings
    ranked_real = [(name, d) for name, d in ranked if name != 'Unspecified Supplier']

    top_suppliers = [{'name': n, 'valueUSD': round(d['valueUSD'], 2),
                      'poCount': d['poCount'], 'basePOs': d['basePOs'],
                      'changeOrders': d['changeOrders']}
                     for n, d in ranked_real[:20]]
    bottom_suppliers = [{'name': n, 'valueUSD': round(d['valueUSD'], 2),
                         'poCount': d['poCount']}
                        for n, d in ranked_real[-10:]]

    gsa_data['supplierRankings'] = {'top': top_suppliers, 'bottom': bottom_suppliers}

    # Recompute entity breakdown
    entity_spend = defaultdict(lambda: {'valueUSD': 0, 'poCount': 0, 'baseValue': 0, 'changeValue': 0})
    for po in clean_pos:
        e = po.get('entity', 'Unknown')
        val = float(po.get('poSpendUSD', 0) or 0)
        entity_spend[e]['valueUSD'] += val
        entity_spend[e]['poCount'] += 1
        if str(po.get('poType', '')).lower().startswith('base'):
            entity_spend[e]['baseValue'] += val
        else:
            entity_spend[e]['changeValue'] += val

    gsa_data['entityBreakdown'] = [
        {'name': e, 'valueUSD': round(d['valueUSD'], 2), 'poCount': d['poCount'],
         'baseValue': round(d['baseValue'], 2), 'changeValue': round(d['changeValue'], 2)}
        for e, d in sorted(entity_spend.items(), key=lambda x: x[1]['valueUSD'], reverse=True)
    ]

    # Recompute material breakdown
    mat_spend = defaultdict(lambda: {'valueUSD': 0, 'poCount': 0})
    for po in clean_pos:
        m = po.get('material', 'Unknown')
        val = float(po.get('poSpendUSD', 0) or 0)
        mat_spend[m]['valueUSD'] += val
        mat_spend[m]['poCount'] += 1
    gsa_data['materialBreakdown'] = [
        {'name': m, 'valueUSD': round(d['valueUSD'], 2), 'poCount': d['poCount']}
        for m, d in sorted(mat_spend.items(), key=lambda x: x[1]['valueUSD'], reverse=True)
    ]

    # Recompute annual trend
    year_data = defaultdict(lambda: {'baseValue': 0, 'changeValue': 0, 'totalValue': 0, 'poCount': 0, 'suppliers': set()})
    for po in clean_pos:
        yr = po.get('year')
        if not yr:
            continue
        val = float(po.get('poSpendUSD', 0) or 0)
        year_data[yr]['totalValue'] += val
        year_data[yr]['poCount'] += 1
        year_data[yr]['suppliers'].add(po.get('supplier', ''))
        if str(po.get('poType', '')).lower().startswith('base'):
            year_data[yr]['baseValue'] += val
        else:
            year_data[yr]['changeValue'] += val

    gsa_data['annualTrend'] = [
        {'year': yr, 'baseValue': round(d['baseValue'], 2), 'changeValue': round(d['changeValue'], 2),
         'totalValue': round(d['totalValue'], 2), 'poCount': d['poCount'],
         'supplierCount': len(d['suppliers'])}
        for yr, d in sorted(year_data.items())
    ]

    # Recompute monthly trend
    month_data = defaultdict(lambda: {'value': 0, 'count': 0})
    for po in clean_pos:
        ym = po.get('yearMonth')
        if not ym:
            continue
        val = float(po.get('poSpendUSD', 0) or 0)
        month_data[ym]['value'] += val
        month_data[ym]['count'] += 1
    gsa_data['monthlyTrend'] = [
        {'yearMonth': ym, 'value': round(d['value'], 2), 'count': d['count']}
        for ym, d in sorted(month_data.items())
    ]

    # Recompute PO type breakdown
    gsa_data['poTypeBreakdown'] = {
        'basePO': {'count': len(base_pos), 'valueUSD': round(base_value, 2)},
        'changeOrder': {'count': len(change_orders), 'valueUSD': round(co_value, 2)}
    }

    # Recompute filters
    gsa_data['filters'] = {
        'entities': sorted(set(po.get('entity', '') for po in clean_pos if po.get('entity', ''))),
        'suppliers': sorted(set(po.get('supplier', '') for po in clean_pos if po.get('supplier', ''))),
        'materials': sorted(set(po.get('material', '') for po in clean_pos if po.get('material', ''))),
        'materialCodes': sorted(set(po.get('materialCode', '') for po in clean_pos if po.get('materialCode', ''))),
        'poTypes': sorted(set(po.get('poType', '') for po in clean_pos if po.get('poType', ''))),
        'years': sorted(set(po.get('year') for po in clean_pos if po.get('year'))),
        'currencies': sorted(set(po.get('currency', '') for po in clean_pos if po.get('currency', '')))
    }

    print(f'  Total Spend: ${total_spend:,.2f}')
    print(f'  Base POs: {len(base_pos)} (${base_value:,.2f})')
    print(f'  Change Orders: {len(change_orders)} (${co_value:,.2f})')
    print(f'  Unique Suppliers: {len(unique_suppliers)}')
    print(f'  Unique Entities: {len(unique_entities)}')

    # ── 5. Recompute SM summary & aggregations ───────────────
    print('\n[5/8] Recomputing SM summary...')

    total_quotations = len(clean_workbench)
    orders = [q for q in clean_workbench if q.get('Status') == 'Order']
    total_orders = len(orders)
    win_rate = round((total_orders / total_quotations * 100), 1) if total_quotations else 0
    total_quote_value = sum(to_usd(q.get('QuotationValue', 0), q.get('Currency', 'USD')) for q in clean_workbench)
    total_order_value = sum(to_usd(q.get('QuotationValue', 0), q.get('Currency', 'USD')) for q in orders)
    unique_clients = set(q.get('Client', '') for q in clean_workbench if q.get('Client', ''))
    unique_sm_entities = set(q.get('Entity', '') for q in clean_workbench if q.get('Entity', ''))
    unique_contacts = set(q.get('Contact', '') for q in clean_workbench if q.get('Contact', ''))

    sm_data['summary'] = {
        'totalQuotations': total_quotations,
        'totalPOs': total_orders,
        'winRate': win_rate,
        'totalQuotationValueUSD': round(total_quote_value, 2),
        'totalPOSpendUSD': round(total_order_value, 2)
    }

    # Recompute status summary
    status_counts = defaultdict(lambda: {'Count': 0, 'TotalValueUSD': 0})
    for q in clean_workbench:
        s = q.get('Status', 'Unknown')
        status_counts[s]['Count'] += 1
        status_counts[s]['TotalValueUSD'] += to_usd(q.get('QuotationValue', 0), q.get('Currency', 'USD'))

    sm_data['statusSummary'] = [
        {'Status': s, 'Count': d['Count'], 'TotalValueUSD': round(d['TotalValueUSD'], 2)}
        for s, d in sorted(status_counts.items(), key=lambda x: x[1]['Count'], reverse=True)
    ]

    # Recompute entity breakdown for SM
    sm_entity_map = defaultdict(lambda: {'QuotationCount': 0, 'TotalValueUSD': 0})
    for q in clean_workbench:
        e = q.get('Entity', 'Unknown')
        sm_entity_map[e]['QuotationCount'] += 1
        sm_entity_map[e]['TotalValueUSD'] += to_usd(q.get('QuotationValue', 0), q.get('Currency', 'USD'))
    sm_data['entities'] = [
        {'Entity': e, 'QuotationCount': d['QuotationCount'], 'TotalValueUSD': round(d['TotalValueUSD'], 2)}
        for e, d in sorted(sm_entity_map.items(), key=lambda x: x[1]['TotalValueUSD'], reverse=True)
    ]

    # Recompute material/discipline breakdown for SM — use materialCode
    sm_mat_map = defaultdict(lambda: {'QuotationNumber': 0, 'QuotationValueUSD': 0})
    for q in clean_workbench:
        m = q.get('materialCode', get_material_code(q.get('MaterialCode', q.get('Material', 'Various'))))
        sm_mat_map[m]['QuotationNumber'] += 1
        sm_mat_map[m]['QuotationValueUSD'] += to_usd(q.get('QuotationValue', 0), q.get('Currency', 'USD'))
    sm_data['materialsByDiscipline'] = [
        {'MaterialCode': m, 'QuotationNumber': d['QuotationNumber'], 'QuotationValueUSD': round(d['QuotationValueUSD'], 2)}
        for m, d in sorted(sm_mat_map.items(), key=lambda x: x[1]['QuotationValueUSD'], reverse=True)
    ]

    # Separate employees from SM suppliers list
    print('\n[5b/8] Separating employees from supplier data...')
    sm_suppliers = sm_data.get('suppliers', [])
    employees = []
    real_sm_suppliers = []
    for s in sm_suppliers:
        name = s.get('SupplierName', '')
        if is_mvl_employee(name):
            employees.append(s)
        else:
            if name and name.strip():
                s['SupplierName'] = clean_supplier_name(name)
                real_sm_suppliers.append(s)

    # Keep the original suppliers list for now (scripts.js uses it as "Responsible Employees")
    # But also save a separate employees.json
    employee_records = []
    for emp in employees:
        name = emp.get('SupplierName', '')
        # Find quotations by this contact
        emp_quotations = [q for q in clean_workbench if q.get('Contact', '') == name]
        emp_orders = [q for q in emp_quotations if q.get('Status') == 'Order']
        emp_value = sum(to_usd(q.get('QuotationValue', 0), q.get('Currency', 'USD')) for q in emp_quotations)
        order_value = sum(to_usd(q.get('QuotationValue', 0), q.get('Currency', 'USD')) for q in emp_orders)
        employee_records.append({
            'name': name,
            'quotationCount': len(emp_quotations),
            'orderCount': len(emp_orders),
            'winRate': round(len(emp_orders) / len(emp_quotations) * 100, 1) if emp_quotations else 0,
            'totalQuotedUSD': round(emp_value, 2),
            'totalOrderedUSD': round(order_value, 2),
            'POCount': emp.get('POCount', 0),
            'TotalSpendUSD': emp.get('TotalSpendUSD', 0)
        })

    print(f'  Employees separated: {len(employee_records)}')
    print(f'  SM supplier entries: {len(real_sm_suppliers)}')

    # Recompute SM funnel
    quotation_status = status_counts.get('Quotation', {'Count': 0})
    sm_data['funnel'] = {
        'Quotation': quotation_status['Count']
    }

    print(f'  Total Quotations: {total_quotations}')
    print(f'  Orders (won): {total_orders}')
    print(f'  Win Rate: {win_rate}%')
    print(f'  Quote Value: ${total_quote_value:,.2f}')
    print(f'  Order Value: ${total_order_value:,.2f}')

    # ── 6. Clean M&D data ────────────────────────────────────
    print('\n[6/8] Cleaning M&D data...')

    md_quotations = md_data.get('quotations', [])
    md_pos_raw = md_data.get('pos', [])
    print(f'  Original M&D quotations: {len(md_quotations)}')
    print(f'  Original M&D POs: {len(md_pos_raw)}')

    # Clean M&D quotations — apply material code mapping, exclude IQ records
    seen_md_q = set()
    clean_md_q = []
    md_removed_iq = 0
    for q in md_quotations:
        qnum = q.get('number', q.get('quotationNumber', ''))
        if not qnum or not str(qnum).strip():
            continue

        # Skip IQ (Internal Quotation) records — only keep RFQ records
        q_type = str(q.get('type', '')).strip().upper()
        if q_type == 'IQ':
            md_removed_iq += 1
            continue

        if str(qnum) in seen_md_q:
            continue
        seen_md_q.add(str(qnum))

        # Fix status
        if 'status' in q:
            q['status'] = normalize_status(q['status'])

        # Fix supplier (note: in quotations, "supplier" IS the client/customer)
        if 'supplier' in q:
            q['supplier'] = clean_supplier_name(q['supplier'])

        # Apply material code mapping from raw material name
        raw_material = q.get('material', q.get('discipline', ''))
        q['materialCode'] = get_material_code(raw_material)
        # Preserve raw material name
        if not q.get('material'):
            q['material'] = raw_material

        clean_md_q.append(q)

    # Clean M&D POs - use GSA workbench as source (already cleaned)
    # Apply material code mapping from material name
    clean_md_pos = []
    seen_md_po = set()
    for po in clean_pos:  # Use the already-cleaned GSA POs
        pnum = str(po.get('poNumber', '')).strip()
        if pnum in seen_md_po:
            continue
        seen_md_po.add(pnum)

        raw_material = po.get('material', '')
        md_po = {
            'poNumber': pnum,
            'poDate': po.get('poDate', ''),
            'poName': po.get('poName', ''),
            'supplier': po.get('supplier', 'Unspecified Supplier'),
            'entity': po.get('entity', ''),
            'project': po.get('project', ''),
            'material': raw_material,
            'materialCode': get_material_code(raw_material),
            'value': float(po.get('poSpendUSD', po.get('valueUSD', 0)) or 0),
            'currency': 'USD',
            'year': po.get('year'),
            'month': po.get('month')
        }
        clean_md_pos.append(md_po)

    print(f'  Clean M&D quotations (RFQ only): {len(clean_md_q)} (removed {md_removed_iq} IQ records)')
    print(f'  Clean M&D POs: {len(clean_md_pos)}')

    # Recompute M&D summary
    # IMPORTANT: Suppliers and Projects are counted from POs only (not quotations)
    md_material_codes = set()
    md_raw_materials = set()
    md_total_quoted = 0
    md_total_ordered = 0
    md_po_suppliers = set()
    md_po_projects = set()
    md_entities_set = set()

    for q in clean_md_q:
        mc = q.get('materialCode', 'Various')
        md_material_codes.add(mc)
        if q.get('material'):
            md_raw_materials.add(q['material'])
        val = float(q.get('quotedValue', q.get('value', q.get('amount', 0))) or 0)
        md_total_quoted += val
        if q.get('entity'):
            md_entities_set.add(q['entity'])

    for po in clean_md_pos:
        md_total_ordered += float(po.get('value', 0) or 0)
        if po.get('supplier') and po['supplier'] != 'Unspecified Supplier':
            md_po_suppliers.add(po['supplier'])
        if po.get('project'):
            md_po_projects.add(po['project'])
        if po.get('entity'):
            md_entities_set.add(po['entity'])
        md_material_codes.add(po.get('materialCode', 'Various'))
        if po.get('material'):
            md_raw_materials.add(po['material'])

    conversion_rate = round(md_total_ordered / md_total_quoted * 100, 1) if md_total_quoted else 0

    # Recompute material code breakdown
    mc_data = defaultdict(lambda: {
        'quotedValue': 0, 'orderedValue': 0,
        'quotedCount': 0, 'orderedCount': 0,
        'suppliers': set(), 'projects': set()
    })
    for q in clean_md_q:
        d = q.get('materialCode', 'Various')
        val = float(q.get('quotedValue', q.get('value', 0)) or 0)
        mc_data[d]['quotedValue'] += val
        mc_data[d]['quotedCount'] += 1
        if q.get('supplier'):
            mc_data[d]['suppliers'].add(q['supplier'])

    for po in clean_md_pos:
        d = po.get('materialCode', 'Various')
        val = float(po.get('value', 0) or 0)
        mc_data[d]['orderedValue'] += val
        mc_data[d]['orderedCount'] += 1
        if po.get('supplier'):
            mc_data[d]['suppliers'].add(po['supplier'])
        if po.get('project'):
            mc_data[d]['projects'].add(po['project'])

    md_material_codes_list = [
        {'name': d, 'quotedValue': round(v['quotedValue'], 2), 'orderedValue': round(v['orderedValue'], 2),
         'quotedCount': v['quotedCount'], 'orderedCount': v['orderedCount'],
         'supplierCount': len(v['suppliers']), 'projectCount': len(v['projects'])}
        for d, v in sorted(mc_data.items(), key=lambda x: x[1]['quotedValue'], reverse=True)
    ]

    # Recompute entity breakdown for M&D
    md_entity_data = defaultdict(lambda: {'quotedValue': 0, 'orderedValue': 0, 'poCount': 0, 'quoteCount': 0})
    for q in clean_md_q:
        e = q.get('entity', 'Unknown')
        md_entity_data[e]['quotedValue'] += float(q.get('quotedValue', q.get('value', 0)) or 0)
        md_entity_data[e]['quoteCount'] += 1
    for po in clean_md_pos:
        e = po.get('entity', 'Unknown')
        md_entity_data[e]['orderedValue'] += float(po.get('value', 0) or 0)
        md_entity_data[e]['poCount'] += 1

    md_entity_list = [
        {'name': e, 'quotedValue': round(v['quotedValue'], 2), 'orderedValue': round(v['orderedValue'], 2),
         'poCount': v['poCount'], 'quoteCount': v['quoteCount']}
        for e, v in sorted(md_entity_data.items(), key=lambda x: x[1]['quotedValue'], reverse=True)
    ]

    md_data['quotations'] = clean_md_q
    md_data['pos'] = clean_md_pos
    md_data['summary'] = {
        'materialCodeCount': len(md_material_codes),
        'materialCount': len(md_raw_materials),
        'totalQuoted': round(md_total_quoted, 2),
        'totalOrdered': round(md_total_ordered, 2),
        'supplierCount': len(md_po_suppliers),
        'projectCount': len(md_po_projects),
        'entityCount': len(md_entities_set),
        'conversionRate': conversion_rate
    }
    md_data['disciplines'] = md_material_codes_list
    md_data['entityBreakdown'] = md_entity_list

    # Filters: materialCodes (12 consolidated), materials (raw names),
    # plus entities, projects, suppliers from POs
    po_entity_set = set(po.get('entity', '') for po in clean_md_pos if po.get('entity', ''))
    md_data['filters'] = {
        'entities': sorted(po_entity_set),
        'materialCodes': sorted(md_material_codes),
        'materials': sorted(md_raw_materials),
        'disciplines': sorted(md_material_codes),  # backward compat alias
        'projects': sorted(list(md_po_projects)),
        'suppliers': sorted(list(md_po_suppliers))
    }

    # Generate M&D trend data (monthly quotation + PO aggregation)
    md_trend = defaultdict(lambda: {'quotedValue': 0, 'orderedValue': 0, 'quoteCount': 0, 'poCount': 0})
    for q in clean_md_q:
        dt = parse_date_to_iso(q.get('date', ''))
        if dt:
            ym = dt.strftime('%Y-%m')
            val = float(q.get('quotedValue', q.get('value', 0)) or 0)
            md_trend[ym]['quotedValue'] += val
            md_trend[ym]['quoteCount'] += 1
    for po in clean_md_pos:
        yr = po.get('year')
        mo = po.get('month')
        if yr and mo:
            ym = f'{yr}-{int(mo):02d}'
            md_trend[ym]['orderedValue'] += float(po.get('value', 0) or 0)
            md_trend[ym]['poCount'] += 1
    md_data['trend'] = [
        {'yearMonth': ym, 'quotedValue': round(d['quotedValue'], 2),
         'orderedValue': round(d['orderedValue'], 2),
         'quoteCount': d['quoteCount'], 'poCount': d['poCount']}
        for ym, d in sorted(md_trend.items())
    ]

    print(f'  Material Codes: {len(md_material_codes)} ({sorted(md_material_codes)})')
    print(f'  Raw Materials: {len(md_raw_materials)}')
    print(f'  Total Quoted: ${md_total_quoted:,.2f}')
    print(f'  Total Ordered: ${md_total_ordered:,.2f}')
    print(f'  Conversion Rate: {conversion_rate}%')
    print(f'  PO Suppliers: {len(md_po_suppliers)}')
    print(f'  PO Projects: {len(md_po_projects)}')
    print(f'  Trend months: {len(md_data["trend"])}')

    # ── 7. Build Q→PO conversion times (separate file) ──────
    print('\n[7/8] Building conversion times data...')

    # Try to link quotations to POs by quotation number patterns
    po_dates = {}
    for po in clean_pos:
        pnum = str(po.get('poNumber', '')).strip()
        pdate = parse_date_to_iso(po.get('poDate', ''))
        if pnum and pdate:
            # Extract base number (e.g., RFPO-1234 from RFPO-1234-V1234-1)
            parts = pnum.split('-')
            if len(parts) >= 2:
                base = f'{parts[0]}-{parts[1]}'
                po_dates[base] = pdate

    conversion_times = []
    for q in clean_workbench:
        if q.get('Status') != 'Order':
            continue
        qnum = str(q.get('QuotationNumber', '')).strip()
        qdate = parse_date_to_iso(q.get('Date', ''))
        if not qnum or not qdate:
            continue

        # Try to find matching PO
        parts = qnum.split('-')
        if len(parts) >= 2:
            base = f'{parts[0]}-{parts[1]}'
            if base in po_dates:
                days = (po_dates[base] - qdate).days
                if 0 <= days <= 365:  # Reasonable range
                    conversion_times.append({
                        'quotationNumber': qnum,
                        'quotationDate': qdate.strftime('%Y-%m-%d'),
                        'poDate': po_dates[base].strftime('%Y-%m-%d'),
                        'daysToConvert': days,
                        'month': qdate.strftime('%Y-%m')
                    })

    # Aggregate by month for the chart
    month_avg = defaultdict(lambda: {'totalDays': 0, 'count': 0})
    for ct in conversion_times:
        m = ct['month']
        month_avg[m]['totalDays'] += ct['daysToConvert']
        month_avg[m]['count'] += 1

    conversion_summary = {
        'records': conversion_times,
        'monthlyAverage': [
            {'month': m, 'avgDays': round(d['totalDays'] / d['count'], 1), 'count': d['count']}
            for m, d in sorted(month_avg.items())
        ],
        'totalLinked': len(conversion_times),
        'avgDays': round(sum(ct['daysToConvert'] for ct in conversion_times) / len(conversion_times), 1) if conversion_times else 0
    }

    print(f'  Q→PO links found: {len(conversion_times)}')
    print(f'  Avg conversion days: {conversion_summary["avgDays"]}')

    # ── 8. Save all cleaned files ────────────────────────────
    print('\n[8/8] Saving cleaned data files...')

    save_json(sm_data, 'sm_data.json')
    save_json(gsa_data, 'gsa_data.json')
    save_json(md_data, 'md_data.json')
    save_json(employee_records, 'employees.json')
    save_json(conversion_summary, 'conversion_times.json')

    # Don't touch: dashboard_data.json (enriched at runtime), suppliers.json,
    # quotations.json, purchase_orders.json, client_country_map.json

    # ── Summary ──────────────────────────────────────────────
    print('\n' + '=' * 60)
    print('V8 DATA CLEANUP COMPLETE')
    print('=' * 60)
    print(f'\nSM Workbench:     {len(clean_workbench)} quotations (was {len(workbench)})')
    print(f'GSA Workbench:    {len(clean_pos)} POs')
    print(f'M&D Quotations:   {len(clean_md_q)}')
    print(f'M&D POs:          {len(clean_md_pos)}')
    print(f'Employees:        {len(employee_records)}')
    print(f'Conversion Times: {len(conversion_times)} linked Q→PO records')
    print(f'\nFiles saved: sm_data.json, gsa_data.json, md_data.json, employees.json, conversion_times.json')


if __name__ == '__main__':
    main()
