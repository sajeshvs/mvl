"""
V8 Data Pipeline — Feb 20 2026 Excel Integration
=================================================
Reads the NEW Excel exports (PO_List + Quotation_Report fragments)
directly from v8/Re_ Main order XLS and Export feature ready for use/

NEW features over previous build:
  - Reads from .xls Excel files (xlrd) instead of old JSON
  - Adds Main Order ID (project number) and Order ID fields
  - Calculates change orders by Order ID (same OrderID, PO suffix 1,2,3…)
  - Detects quotation revisions (letter suffixes A,B,C,D…)
  - Handles blanks with "(Blank)" placeholders for filtering
  - Derives entity, material, materialCode from PO/quotation number structure
  - Filters to RFQ-only (no IQ records)

Input:  v8/Re_ Main order XLS and Export feature ready for use/*.xls
Output: v8/data/*.json (same structure scripts.js expects)
"""

import json
import os
import re
from collections import defaultdict
from datetime import datetime

import xlrd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
EXCEL_DIR = os.path.join(PARENT_DIR, 'Re_ Main order XLS and Export feature ready for use')

# ─── FX Rates ────────────────────────────────────────────────
FX_RATES = {
    'USD': 1, 'AED': 3.6725, 'SAR': 3.75, 'KWD': 0.3077,
    'QAR': 3.64, 'NPR': 133.5, 'EUR': 0.92, 'GBP': 0.79,
    'INR': 83, 'JPY': 149.5, 'BHD': 0.376, 'OMR': 0.385,
    'PKR': 278, 'EGP': 30.9, 'JOD': 0.709, 'LKR': 320
}

# ─── Material Code Map ──────────────────────────────────────
MATERIAL_CODE_MAP = {
    'sandwich panel': 'Architectural', 'accessories / connection for sandwich panel': 'Architectural',
    'steel coil': 'Architectural', 'doors': 'Architectural', 'windows': 'Architectural',
    'fit out project': 'Architectural', 'paints': 'Architectural',
    'sanitary and toilet accessories': 'Architectural',
    'polyurethane foam': 'Chemicals', 'chemicals': 'Chemicals',
    'electrical': 'Electrical',
    'firestop/ dc 315': 'Fire', 'firestop': 'Fire', 'fire': 'Fire',
    'fire alarm': 'Fire', 'fire fighting': 'Fire', 'fire suppression': 'Fire', 'fire protection': 'Fire',
    'transportation': 'Logistics', 'discount': 'Logistics', 'mhe': 'Logistics', 'logistics': 'Logistics',
    'machine / equipments': 'Mechanical', 'mechanical items': 'Mechanical',
    'computer peripherals': 'Office Assets',
    'ppe': 'Protection',
    'rental': 'Rental',
    'design': 'Services', 'construction': 'Services', 'lsa - life support area': 'Services',
    'subcontract': 'Services', 'services': 'Services',
    'tools': 'Tools',
    'containers': 'Various', 'building materials': 'Various', 'graco spares': 'Various',
    'misc.': 'Various', 'misc': 'Various', 'general': 'Various',
}

# PO code prefix → material category (from analysis: V=Various, M=Mechanical, etc.)
PO_CODE_PREFIX_MAP = {
    'A': 'Architectural', 'C': 'Chemicals', 'E': 'Electrical', 'F': 'Fire',
    'L': 'Logistics', 'M': 'Mechanical', 'O': 'Office Assets', 'P': 'Protection',
    'R': 'Rental', 'S': 'Services', 'T': 'Tools', 'V': 'Various',
}

# ─── Entity code map (loaded from previously built mapping) ──
ENTITY_CODE_MAP = {}
entity_map_path = os.path.join(BASE_DIR, 'entity_code_map.json')
if os.path.exists(entity_map_path):
    with open(entity_map_path, 'r', encoding='utf-8') as f:
        ENTITY_CODE_MAP = json.load(f)


def get_material_code(raw):
    """Map raw material name to one of 12 official Material Codes."""
    if not raw or not str(raw).strip():
        return 'Various'
    normalized = str(raw).strip().lower()
    if normalized in MATERIAL_CODE_MAP:
        return MATERIAL_CODE_MAP[normalized]
    for key, val in MATERIAL_CODE_MAP.items():
        if key in normalized or normalized in key:
            return val
    return 'Various'


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
    mapping = {
        'cancled': 'Cancelled', 'canceled': 'Cancelled', 'cancelled': 'Cancelled',
        'won': 'Order', 'order': 'Order', 'open': 'Quotation', 'quotation': 'Quotation',
        'lost': 'Lost', 'closed': 'Closed', 'pending': 'Waiting', 'waiting': 'Waiting',
        'budget': 'Budget', 'budgetary': 'Budget',
    }
    return mapping.get(s.lower(), s)


def clean_supplier_name(name):
    if not name or not str(name).strip() or str(name).strip() == '-':
        return 'Unspecified Supplier'
    return str(name).strip()


def blank_safe(val, label='(Blank)'):
    """Return label for blank/empty values for filter visibility."""
    if val is None:
        return label
    s = str(val).strip()
    return s if s else label


def parse_date_str(date_str):
    """Parse various date formats to datetime object."""
    if not date_str:
        return None
    s = str(date_str).strip()
    for fmt in ['%d %b %Y', '%d-%b-%Y', '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y',
                '%b %d, %Y', '%Y-%m-%dT%H:%M:%S', '%d %B %Y', '%d-%m-%Y']:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def parse_excel_date(cell, workbook):
    """Parse an xlrd date cell (may be float or string)."""
    if cell.ctype == xlrd.XL_CELL_DATE:
        try:
            dt_tuple = xlrd.xldate_as_tuple(cell.value, workbook.datemode)
            return datetime(*dt_tuple[:6])
        except Exception:
            return None
    elif cell.ctype == xlrd.XL_CELL_TEXT:
        return parse_date_str(cell.value)
    elif cell.ctype == xlrd.XL_CELL_NUMBER:
        try:
            dt_tuple = xlrd.xldate_as_tuple(cell.value, workbook.datemode)
            return datetime(*dt_tuple[:6])
        except Exception:
            return None
    return None


def cell_str(cell):
    """Get cell value as stripped string."""
    if cell.ctype == xlrd.XL_CELL_EMPTY:
        return ''
    if cell.ctype == xlrd.XL_CELL_NUMBER:
        if cell.value == int(cell.value):
            return str(int(cell.value))
        return str(cell.value)
    return str(cell.value).strip()


def cell_float(cell):
    """Get cell value as float."""
    if cell.ctype == xlrd.XL_CELL_NUMBER:
        return float(cell.value)
    try:
        return float(str(cell.value).replace(',', ''))
    except (ValueError, TypeError):
        return 0.0


def parse_po_number(po_num):
    """Parse PO number structure: RFPO-{mainOrderId}-{code}-{version}
    or older format: PO-{mainOrderId}-{code}-{version}
    Returns dict with: mainOrderId, entityCode, codePrefix, version, isChangeOrder
    """
    parts = str(po_num).strip().split('-')
    result = {'mainOrderId': '', 'entityCode': '', 'codePrefix': '', 'version': 1, 'isChangeOrder': False}
    if len(parts) >= 4:
        result['mainOrderId'] = parts[1]
        result['entityCode'] = parts[2]
        result['codePrefix'] = parts[2][0] if parts[2] else ''
        try:
            result['version'] = int(parts[3])
            result['isChangeOrder'] = result['version'] > 1
        except ValueError:
            result['version'] = 1
    elif len(parts) == 3:
        result['mainOrderId'] = parts[1]
        result['entityCode'] = parts[2]
        result['codePrefix'] = parts[2][0] if parts[2] else ''
    return result


def parse_quotation_number(q_num):
    """Parse quotation number: RFQ-{mainOrderId}-{code}[A-P]?
    Returns dict with: mainOrderId, entityCode, revisionLetter, isRevision, baseNumber
    """
    s = str(q_num).strip()
    result = {'mainOrderId': '', 'entityCode': '', 'revisionLetter': '', 'isRevision': False, 'baseNumber': s}
    parts = s.split('-')
    if len(parts) >= 3:
        result['mainOrderId'] = parts[1]
        code = parts[2]
        # Check for trailing letter suffix (revision)
        match = re.match(r'^([A-Z]?\d+)([A-Z])$', code, re.IGNORECASE)
        if match:
            result['entityCode'] = match.group(1)
            result['revisionLetter'] = match.group(2).upper()
            result['isRevision'] = True
            result['baseNumber'] = f'{parts[0]}-{parts[1]}-{match.group(1)}'
        else:
            result['entityCode'] = code
    elif len(parts) == 2:
        result['mainOrderId'] = parts[1]
    return result


def is_mvl_employee(name):
    """Check if a name looks like an MVL employee rather than a supplier company."""
    if not name:
        return False
    name_str = str(name).strip()
    company_indicators = ['llc', 'fzc', 'fze', 'ltd', 'corp', 'inc', 'group', 'co.', 'est',
                          'trading', 'services', 'solutions', 'enterprise', 'international',
                          'industries', 'company', 'contracting', 'engineering', 'supply',
                          'technical', 'general', 'middle east', 'gulf', 'al ', 'al-']
    lower = name_str.lower()
    for indicator in company_indicators:
        if indicator in lower:
            return False
    if len(name_str.split()) <= 2 and ('.' in name_str or len(name_str) < 20):
        return True
    return False


def save_json(data, filename):
    path = os.path.join(BASE_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    size_kb = os.path.getsize(path) / 1024
    print(f'  [SAVED] {filename} ({size_kb:.1f} KB)')


# ═══════════════════════════════════════════════════════════════
# DATA LOADING FROM EXCEL
# ═══════════════════════════════════════════════════════════════

def load_po_excel():
    """Load PO data from PO_List_Feb-20-2026.xls.
    Columns: No, PO number, Po Date, PO Name, Supplier, Total, Cur., Main Order ID, Order ID
    """
    po_file = os.path.join(EXCEL_DIR, 'PO_List_Feb-20-2026.xls')
    print(f'  Loading: {os.path.basename(po_file)}')
    wb = xlrd.open_workbook(po_file, ignore_workbook_corruption=True)
    sheet = wb.sheet_by_index(0)

    # Read header row
    headers = [cell_str(sheet.cell(0, c)) for c in range(sheet.ncols)]
    print(f'  Columns: {headers}')

    records = []
    for r in range(1, sheet.nrows):
        row_cells = [sheet.cell(r, c) for c in range(sheet.ncols)]
        po_num = cell_str(row_cells[1])  # PO number
        if not po_num:
            continue

        # Parse date
        dt = parse_excel_date(row_cells[2], wb)
        date_str = dt.strftime('%d %b %Y') if dt else ''

        # Parse PO number structure
        po_parsed = parse_po_number(po_num)

        # Derive entity from entity code map
        entity_code = po_parsed['entityCode']
        full_code = entity_code  # e.g., M4004
        entity_name = ENTITY_CODE_MAP.get(full_code, '')
        if not entity_name:
            entity_name = 'Unknown'

        # Derive material category from code prefix
        code_prefix = po_parsed['codePrefix']
        material_from_prefix = PO_CODE_PREFIX_MAP.get(code_prefix, 'Various')

        # Get Main Order ID and Order ID from Excel
        main_order_id = cell_str(row_cells[7]) if sheet.ncols > 7 else ''
        order_id = cell_str(row_cells[8]) if sheet.ncols > 8 else ''

        if not main_order_id:
            main_order_id = po_parsed['mainOrderId']

        records.append({
            'poNumber': po_num,
            'poDate': date_str,
            'poName': cell_str(row_cells[3]),
            'supplier': clean_supplier_name(cell_str(row_cells[4])),
            'originalValue': cell_float(row_cells[5]),
            'currency': cell_str(row_cells[6]).strip().upper() or 'AED',
            'mainOrderId': main_order_id,
            'orderId': order_id,
            'entityCode': entity_code,
            'entity': entity_name,
            'material': material_from_prefix,
            'materialCode': material_from_prefix,
            'poVersion': po_parsed['version'],
            'isChangeOrder': po_parsed['isChangeOrder'],
            'year': dt.year if dt else None,
            'month': dt.month if dt else None,
            'yearMonth': dt.strftime('%Y-%m') if dt else None,
            '_dt': dt,
        })

    print(f'  Loaded {len(records)} PO records')
    return records


def load_quotation_excel():
    """Load Quotation data from 5 fragment files.
    Columns: No, Number, Company, Date, Type, Client, Project Name, Description,
             Material, Material Code, Quo. Value, Cur., MVL Contact, Status,
             Main Order ID, Order ID
    """
    fragments = sorted([
        f for f in os.listdir(EXCEL_DIR)
        if f.startswith('Quotation_Report_') and f.endswith('.xls')
    ])
    print(f'  Found {len(fragments)} quotation fragment files')

    all_records = []
    for fname in fragments:
        fpath = os.path.join(EXCEL_DIR, fname)
        print(f'    Loading: {fname}')
        wb = xlrd.open_workbook(fpath, ignore_workbook_corruption=True)
        sheet = wb.sheet_by_index(0)

        # Auto-detect header row (might be row 0 or row 1 if row 0 is a title)
        data_start = 1
        row0_first = cell_str(sheet.cell(0, 0)).lower()
        if 'quotation report' in row0_first or 'report' in row0_first:
            # Row 0 is a title row; row 1 is headers; data starts at row 2
            data_start = 2
            headers = [cell_str(sheet.cell(1, c)) for c in range(sheet.ncols)]
        else:
            headers = [cell_str(sheet.cell(0, c)) for c in range(sheet.ncols)]
        if not all_records:
            print(f'    Columns: {headers}')
            print(f'    Data starts at row: {data_start}')

        for r in range(data_start, sheet.nrows):
            row_cells = [sheet.cell(r, c) for c in range(sheet.ncols)]
            q_num = cell_str(row_cells[1])  # Number
            if not q_num:
                continue
            # Skip header rows mistakenly in data range
            if q_num.lower() in ('number', 'no', 'no.', '#'):
                continue

            # Parse date
            dt = parse_excel_date(row_cells[3], wb)
            date_str = dt.strftime('%d %b %Y') if dt else ''

            # Parse quotation number
            q_parsed = parse_quotation_number(q_num)

            # Get Main Order ID and Order ID from Excel
            main_order_id = cell_str(row_cells[14]) if sheet.ncols > 14 else ''
            order_id = cell_str(row_cells[15]) if sheet.ncols > 15 else ''
            if not main_order_id:
                main_order_id = q_parsed['mainOrderId']

            raw_material = cell_str(row_cells[8])
            raw_mat_code = cell_str(row_cells[9])
            material_code = get_material_code(raw_material)

            company = cell_str(row_cells[2])
            q_type = cell_str(row_cells[4]).strip().upper()
            client = cell_str(row_cells[5])
            project_name = cell_str(row_cells[6])
            description = cell_str(row_cells[7])
            quo_value = cell_float(row_cells[10])
            currency = cell_str(row_cells[11]).strip().upper() or 'AED'
            contact = cell_str(row_cells[12])
            status = cell_str(row_cells[13])

            all_records.append({
                'QuotationNumber': q_num,
                'QuotationType': q_type,
                'Status': normalize_status(status),
                'ProjectName': blank_safe(project_name),
                'Description': blank_safe(description),
                'Material': blank_safe(raw_material),
                'MaterialCodeRaw': blank_safe(raw_mat_code),
                'materialCode': material_code,
                'Entity': blank_safe(company),
                'Client': blank_safe(client),
                'QuotationValue': quo_value,
                'Currency': currency,
                'Contact': blank_safe(contact),
                'Date': date_str,
                'mainOrderId': main_order_id,
                'orderId': order_id,
                'isRevision': q_parsed['isRevision'],
                'revisionLetter': q_parsed['revisionLetter'],
                'baseNumber': q_parsed['baseNumber'],
                '_dt': dt,
            })

    print(f'  Loaded {len(all_records)} total quotation records')
    return all_records


# ═══════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════

def main():
    print('=' * 60)
    print('V8 Data Pipeline — Feb 20 2026 Excel Integration')
    print('=' * 60)

    # ── 1. Load Excel data ───────────────────────────────────
    print('\n[1/9] Loading Excel data files...')
    raw_pos = load_po_excel()
    raw_quotes = load_quotation_excel()

    # ── 2. Filter & deduplicate quotations (RFQ only) ────────
    print('\n[2/9] Filtering quotations (RFQ only, deduplicate)...')
    seen_qnums = set()
    clean_quotes = []
    removed_iq = 0
    removed_dup = 0
    removed_empty = 0

    for q in raw_quotes:
        q_type = q['QuotationType']
        if q_type == 'IQ':
            removed_iq += 1
            continue

        qnum = q['QuotationNumber']
        if not qnum:
            removed_empty += 1
            continue

        if q['QuotationValue'] == 0 and q['Entity'] == '(Blank)' and q['Material'] == '(Blank)':
            removed_empty += 1
            continue

        if qnum in seen_qnums:
            removed_dup += 1
            continue
        seen_qnums.add(qnum)

        clean_quotes.append(q)

    print(f'  Removed IQ: {removed_iq}')
    print(f'  Removed empty: {removed_empty}')
    print(f'  Removed duplicates: {removed_dup}')
    print(f'  Clean RFQ quotations: {len(clean_quotes)}')

    # ── 3. Deduplicate POs ───────────────────────────────────
    print('\n[3/9] Deduplicating POs...')
    seen_pos = set()
    clean_pos = []
    po_dup = 0

    for po in raw_pos:
        pnum = po['poNumber']
        if pnum in seen_pos:
            po_dup += 1
            continue
        seen_pos.add(pnum)

        val_usd = to_usd(po['originalValue'], po['currency'])
        po['valueUSD'] = val_usd
        po['poSpendUSD'] = val_usd
        po['poType'] = 'Change Order' if po['isChangeOrder'] else 'Base PO'

        clean_pos.append(po)

    print(f'  Removed duplicates: {po_dup}')
    print(f'  Clean POs: {len(clean_pos)}')

    # ── 4. Change Order Calculation by Order ID ──────────────
    print('\n[4/9] Calculating change orders by Order ID...')

    po_by_order_id = defaultdict(list)
    for po in clean_pos:
        oid = po.get('orderId', '')
        if oid:
            po_by_order_id[oid].append(po)

    single_po_orders = 0
    change_order_groups = 0
    total_change_order_pos = 0
    change_order_details = []

    for oid, po_list in po_by_order_id.items():
        if len(po_list) == 1:
            single_po_orders += 1
            po_list[0]['changeOrderGroup'] = 1
            po_list[0]['changeOrderTotal'] = 1
        else:
            change_order_groups += 1
            po_list.sort(key=lambda p: p.get('poVersion', 1))
            for i, po in enumerate(po_list):
                po['changeOrderGroup'] = len(po_list)
                po['changeOrderTotal'] = len(po_list)
                if po['poVersion'] == 1:
                    po['poType'] = 'Base PO'
                else:
                    po['poType'] = 'Change Order'
                    total_change_order_pos += 1

            group_total = sum(p['poSpendUSD'] for p in po_list)
            change_order_details.append({
                'orderId': oid,
                'poCount': len(po_list),
                'totalValueUSD': round(group_total, 2),
                'poNumbers': [p['poNumber'] for p in po_list],
                'mainOrderId': po_list[0].get('mainOrderId', ''),
            })

    no_oid_count = sum(1 for po in clean_pos if not po.get('orderId'))
    for po in clean_pos:
        if not po.get('orderId'):
            po['changeOrderGroup'] = 1
            po['changeOrderTotal'] = 1

    print(f'  Single-PO Order IDs: {single_po_orders}')
    print(f'  Change order groups (multi-PO): {change_order_groups}')
    print(f'  Total change order POs: {total_change_order_pos}')
    print(f'  POs without Order ID: {no_oid_count}')

    # ── 5. Enrich POs with material from quotation linkage ───
    print('\n[5/9] Enriching POs via quotation linkage...')

    q_by_order_id = defaultdict(list)
    for q in clean_quotes:
        oid = q.get('orderId', '')
        if oid:
            q_by_order_id[oid].append(q)

    enriched_count = 0
    for po in clean_pos:
        oid = po.get('orderId', '')
        if oid and oid in q_by_order_id:
            matching_q = q_by_order_id[oid]
            if po['material'] in PO_CODE_PREFIX_MAP.values():
                q_mat = matching_q[0].get('Material', '')
                if q_mat and q_mat != '(Blank)':
                    po['material'] = q_mat
                    po['materialCode'] = get_material_code(q_mat)
                    enriched_count += 1
            if not po.get('project') or po.get('project') == '':
                q_proj = matching_q[0].get('ProjectName', '')
                if q_proj and q_proj != '(Blank)':
                    po['project'] = q_proj

        if not po.get('project'):
            po['project'] = po.get('poName', '')

    print(f'  POs enriched with quotation material: {enriched_count}')

    # ── 6. Build SM data (Supplier Marketplace) ──────────────
    print('\n[6/9] Building SM data...')

    for q in clean_quotes:
        q.pop('_dt', None)
        q.pop('id', None)
    for i, q in enumerate(clean_quotes):
        q['id'] = i + 1

    total_quotations = len(clean_quotes)
    orders = [q for q in clean_quotes if q['Status'] == 'Order']
    total_orders = len(orders)
    win_rate = round((total_orders / total_quotations * 100), 1) if total_quotations else 0
    total_quote_value = sum(to_usd(q['QuotationValue'], q['Currency']) for q in clean_quotes)
    total_order_value = sum(to_usd(q['QuotationValue'], q['Currency']) for q in orders)

    status_counts = defaultdict(lambda: {'Count': 0, 'TotalValueUSD': 0})
    for q in clean_quotes:
        s = q['Status']
        status_counts[s]['Count'] += 1
        status_counts[s]['TotalValueUSD'] += to_usd(q['QuotationValue'], q['Currency'])

    sm_entity_map = defaultdict(lambda: {'QuotationCount': 0, 'TotalValueUSD': 0})
    for q in clean_quotes:
        e = q['Entity']
        sm_entity_map[e]['QuotationCount'] += 1
        sm_entity_map[e]['TotalValueUSD'] += to_usd(q['QuotationValue'], q['Currency'])

    sm_mat_map = defaultdict(lambda: {'QuotationNumber': 0, 'QuotationValueUSD': 0})
    for q in clean_quotes:
        m = q['materialCode']
        sm_mat_map[m]['QuotationNumber'] += 1
        sm_mat_map[m]['QuotationValueUSD'] += to_usd(q['QuotationValue'], q['Currency'])

    contact_set = set(q.get('Contact', '') for q in clean_quotes if q.get('Contact', '') and q.get('Contact') != '(Blank)')
    employee_records = []
    for contact in sorted(contact_set):
        emp_quotes = [q for q in clean_quotes if q.get('Contact') == contact]
        emp_orders = [q for q in emp_quotes if q['Status'] == 'Order']
        emp_value = sum(to_usd(q['QuotationValue'], q['Currency']) for q in emp_quotes)
        order_value = sum(to_usd(q['QuotationValue'], q['Currency']) for q in emp_orders)
        employee_records.append({
            'name': contact,
            'quotationCount': len(emp_quotes),
            'orderCount': len(emp_orders),
            'winRate': round(len(emp_orders) / len(emp_quotes) * 100, 1) if emp_quotes else 0,
            'totalQuotedUSD': round(emp_value, 2),
            'totalOrderedUSD': round(order_value, 2),
        })

    sm_suppliers = [{'SupplierName': e['name'], 'POCount': e['orderCount'],
                     'TotalSpendUSD': e['totalOrderedUSD']} for e in employee_records]

    revision_count = sum(1 for q in clean_quotes if q.get('isRevision'))
    revision_letters = defaultdict(int)
    for q in clean_quotes:
        if q.get('isRevision') and q.get('revisionLetter'):
            revision_letters[q['revisionLetter']] += 1

    sm_filters = {
        'entities': sorted(set(q['Entity'] for q in clean_quotes if q['Entity'])),
        'statuses': sorted(set(q['Status'] for q in clean_quotes if q['Status'])),
        'contacts': sorted(set(q['Contact'] for q in clean_quotes if q['Contact'] and q['Contact'] != '(Blank)')),
        'materials': sorted(set(q['Material'] for q in clean_quotes if q['Material'])),
        'materialCodes': sorted(set(q['materialCode'] for q in clean_quotes if q['materialCode'])),
        'currencies': sorted(set(q['Currency'] for q in clean_quotes if q['Currency'])),
    }

    sm_data = {
        'workbench': clean_quotes,
        'summary': {
            'totalQuotations': total_quotations,
            'totalPOs': total_orders,
            'winRate': win_rate,
            'totalQuotationValueUSD': round(total_quote_value, 2),
            'totalPOSpendUSD': round(total_order_value, 2),
            'revisionCount': revision_count,
            'revisionLetters': dict(revision_letters),
        },
        'statusSummary': [
            {'Status': s, 'Count': d['Count'], 'TotalValueUSD': round(d['TotalValueUSD'], 2)}
            for s, d in sorted(status_counts.items(), key=lambda x: x[1]['Count'], reverse=True)
        ],
        'entities': [
            {'Entity': e, 'QuotationCount': d['QuotationCount'], 'TotalValueUSD': round(d['TotalValueUSD'], 2)}
            for e, d in sorted(sm_entity_map.items(), key=lambda x: x[1]['TotalValueUSD'], reverse=True)
        ],
        'materialsByDiscipline': [
            {'MaterialCode': m, 'QuotationNumber': d['QuotationNumber'], 'QuotationValueUSD': round(d['QuotationValueUSD'], 2)}
            for m, d in sorted(sm_mat_map.items(), key=lambda x: x[1]['QuotationValueUSD'], reverse=True)
        ],
        'suppliers': sm_suppliers,
        'filters': sm_filters,
        'funnel': {'Quotation': status_counts.get('Quotation', {'Count': 0})['Count']},
    }

    print(f'  Total Quotations: {total_quotations}')
    print(f'  Orders (won): {total_orders}')
    print(f'  Win Rate: {win_rate}%')
    print(f'  Revisions: {revision_count}')

    # ── 7. Build GSA data (Global Spend Analysis) ────────────
    print('\n[7/9] Building GSA data...')

    for po in clean_pos:
        po.pop('_dt', None)

    total_spend = sum(po['poSpendUSD'] for po in clean_pos)
    base_pos = [po for po in clean_pos if po['poType'] == 'Base PO']
    change_orders_list = [po for po in clean_pos if po['poType'] == 'Change Order']
    base_value = sum(po['poSpendUSD'] for po in base_pos)
    co_value = sum(po['poSpendUSD'] for po in change_orders_list)
    unique_suppliers = set(po['supplier'] for po in clean_pos if po['supplier'] != 'Unspecified Supplier')
    unique_entities = set(po['entity'] for po in clean_pos if po['entity'] and po['entity'] != 'Unknown')

    supplier_spend = defaultdict(lambda: {'valueUSD': 0, 'poCount': 0, 'basePOs': 0, 'changeOrders': 0})
    for po in clean_pos:
        s = po['supplier']
        supplier_spend[s]['valueUSD'] += po['poSpendUSD']
        supplier_spend[s]['poCount'] += 1
        if po['poType'] == 'Base PO':
            supplier_spend[s]['basePOs'] += 1
        else:
            supplier_spend[s]['changeOrders'] += 1

    ranked = sorted(supplier_spend.items(), key=lambda x: x[1]['valueUSD'], reverse=True)
    ranked_real = [(n, d) for n, d in ranked if n != 'Unspecified Supplier']

    top_suppliers = [{'name': n, 'valueUSD': round(d['valueUSD'], 2),
                      'poCount': d['poCount'], 'basePOs': d['basePOs'],
                      'changeOrders': d['changeOrders']}
                     for n, d in ranked_real[:20]]
    bottom_suppliers = [{'name': n, 'valueUSD': round(d['valueUSD'], 2),
                         'poCount': d['poCount']}
                        for n, d in ranked_real[-10:]]

    entity_spend = defaultdict(lambda: {'valueUSD': 0, 'poCount': 0, 'baseValue': 0, 'changeValue': 0})
    for po in clean_pos:
        e = blank_safe(po.get('entity', ''))
        entity_spend[e]['valueUSD'] += po['poSpendUSD']
        entity_spend[e]['poCount'] += 1
        if po['poType'] == 'Base PO':
            entity_spend[e]['baseValue'] += po['poSpendUSD']
        else:
            entity_spend[e]['changeValue'] += po['poSpendUSD']

    mat_spend = defaultdict(lambda: {'valueUSD': 0, 'poCount': 0})
    for po in clean_pos:
        m = blank_safe(po.get('material', ''))
        mat_spend[m]['valueUSD'] += po['poSpendUSD']
        mat_spend[m]['poCount'] += 1

    year_data = defaultdict(lambda: {'baseValue': 0, 'changeValue': 0, 'totalValue': 0, 'poCount': 0, 'suppliers': set()})
    for po in clean_pos:
        yr = po.get('year')
        if not yr:
            continue
        year_data[yr]['totalValue'] += po['poSpendUSD']
        year_data[yr]['poCount'] += 1
        year_data[yr]['suppliers'].add(po['supplier'])
        if po['poType'] == 'Base PO':
            year_data[yr]['baseValue'] += po['poSpendUSD']
        else:
            year_data[yr]['changeValue'] += po['poSpendUSD']

    month_data = defaultdict(lambda: {'value': 0, 'count': 0})
    for po in clean_pos:
        ym = po.get('yearMonth')
        if not ym:
            continue
        month_data[ym]['value'] += po['poSpendUSD']
        month_data[ym]['count'] += 1

    co_monthly = defaultdict(lambda: {'count': 0, 'value': 0})
    for po in change_orders_list:
        ym = po.get('yearMonth')
        if ym:
            co_monthly[ym]['count'] += 1
            co_monthly[ym]['value'] += po['poSpendUSD']

    gsa_filters = {
        'entities': sorted(set(blank_safe(po.get('entity', '')) for po in clean_pos)),
        'suppliers': sorted(set(po['supplier'] for po in clean_pos if po['supplier'])),
        'materials': sorted(set(blank_safe(po.get('material', '')) for po in clean_pos)),
        'materialCodes': sorted(set(blank_safe(po.get('materialCode', '')) for po in clean_pos)),
        'poTypes': sorted(set(po['poType'] for po in clean_pos if po['poType'])),
        'years': sorted(set(po['year'] for po in clean_pos if po.get('year'))),
        'currencies': sorted(set(po['currency'] for po in clean_pos if po.get('currency'))),
    }

    gsa_data = {
        'workbench': clean_pos,
        'summary': {
            'totalSpendUSD': round(total_spend, 2),
            'totalPOs': len(clean_pos),
            'basePOs': len(base_pos),
            'changeOrders': len(change_orders_list),
            'changeOrderValue': round(co_value, 2),
            'basePOValue': round(base_value, 2),
            'supplierCount': len(unique_suppliers),
            'entityCount': len(unique_entities),
            'changeOrderGroups': change_order_groups,
        },
        'supplierRankings': {'top': top_suppliers, 'bottom': bottom_suppliers},
        'entityBreakdown': [
            {'name': e, 'valueUSD': round(d['valueUSD'], 2), 'poCount': d['poCount'],
             'baseValue': round(d['baseValue'], 2), 'changeValue': round(d['changeValue'], 2)}
            for e, d in sorted(entity_spend.items(), key=lambda x: x[1]['valueUSD'], reverse=True)
        ],
        'materialBreakdown': [
            {'name': m, 'valueUSD': round(d['valueUSD'], 2), 'poCount': d['poCount']}
            for m, d in sorted(mat_spend.items(), key=lambda x: x[1]['valueUSD'], reverse=True)
        ],
        'annualTrend': [
            {'year': yr, 'baseValue': round(d['baseValue'], 2), 'changeValue': round(d['changeValue'], 2),
             'totalValue': round(d['totalValue'], 2), 'poCount': d['poCount'],
             'supplierCount': len(d['suppliers'])}
            for yr, d in sorted(year_data.items())
        ],
        'monthlyTrend': [
            {'yearMonth': ym, 'value': round(d['value'], 2), 'count': d['count']}
            for ym, d in sorted(month_data.items())
        ],
        'poTypeBreakdown': {
            'basePO': {'count': len(base_pos), 'valueUSD': round(base_value, 2)},
            'changeOrder': {'count': len(change_orders_list), 'valueUSD': round(co_value, 2)}
        },
        'changeOrderDetails': sorted(change_order_details, key=lambda x: x['poCount'], reverse=True)[:50],
        'changeOrderMonthly': [
            {'yearMonth': ym, 'count': d['count'], 'value': round(d['value'], 2)}
            for ym, d in sorted(co_monthly.items())
        ],
        'filters': gsa_filters,
    }

    print(f'  Total Spend: ${total_spend:,.2f}')
    print(f'  Base POs: {len(base_pos)} (${base_value:,.2f})')
    print(f'  Change Orders: {len(change_orders_list)} (${co_value:,.2f})')
    print(f'  Change Order Groups: {change_order_groups}')
    print(f'  Unique Suppliers: {len(unique_suppliers)}')
    print(f'  Unique Entities: {len(unique_entities)}')

    # ── 8. Build M&D data ────────────────────────────────────
    print('\n[8/9] Building M&D data...')

    md_quotations = []
    for q in clean_quotes:
        val_usd = to_usd(q['QuotationValue'], q['Currency'])
        md_q = {
            'number': q['QuotationNumber'],
            'type': q['QuotationType'],
            'status': q['Status'],
            'entity': q['Entity'],
            'client': q['Client'],
            'projectName': q['ProjectName'],
            'description': q['Description'],
            'material': q['Material'],
            'materialCode': q['materialCode'],
            'quotedValue': val_usd,
            'currency': 'USD',
            'contact': q['Contact'],
            'date': q['Date'],
            'mainOrderId': q.get('mainOrderId', ''),
            'orderId': q.get('orderId', ''),
        }
        md_quotations.append(md_q)

    md_pos = []
    for po in clean_pos:
        md_po = {
            'poNumber': po['poNumber'],
            'poDate': po['poDate'],
            'poName': po['poName'],
            'supplier': po['supplier'],
            'entity': po['entity'],
            'project': po.get('project', po['poName']),
            'material': po['material'],
            'materialCode': po['materialCode'],
            'value': po['poSpendUSD'],
            'currency': 'USD',
            'year': po.get('year'),
            'month': po.get('month'),
            'mainOrderId': po.get('mainOrderId', ''),
            'orderId': po.get('orderId', ''),
            'poType': po['poType'],
        }
        md_pos.append(md_po)

    md_material_codes = set()
    md_raw_materials = set()
    md_total_quoted = 0
    md_total_ordered = 0
    md_po_suppliers = set()
    md_po_projects = set()
    md_entities_set = set()

    for q in md_quotations:
        md_material_codes.add(q['materialCode'])
        if q['material'] and q['material'] != '(Blank)':
            md_raw_materials.add(q['material'])
        md_total_quoted += q['quotedValue']
        if q['entity'] and q['entity'] != '(Blank)':
            md_entities_set.add(q['entity'])

    for po in md_pos:
        md_total_ordered += po['value']
        if po['supplier'] and po['supplier'] != 'Unspecified Supplier':
            md_po_suppliers.add(po['supplier'])
        if po.get('project'):
            md_po_projects.add(po['project'])
        if po['entity'] and po['entity'] != 'Unknown':
            md_entities_set.add(po['entity'])
        md_material_codes.add(po['materialCode'])
        if po['material'] and po['material'] != '(Blank)':
            md_raw_materials.add(po['material'])

    conversion_rate = round(md_total_ordered / md_total_quoted * 100, 1) if md_total_quoted else 0

    mc_data = defaultdict(lambda: {'quotedValue': 0, 'orderedValue': 0, 'quotedCount': 0, 'orderedCount': 0,
                                   'suppliers': set(), 'projects': set()})
    for q in md_quotations:
        d = q['materialCode']
        mc_data[d]['quotedValue'] += q['quotedValue']
        mc_data[d]['quotedCount'] += 1
    for po in md_pos:
        d = po['materialCode']
        mc_data[d]['orderedValue'] += po['value']
        mc_data[d]['orderedCount'] += 1
        if po['supplier']:
            mc_data[d]['suppliers'].add(po['supplier'])
        if po.get('project'):
            mc_data[d]['projects'].add(po['project'])

    md_disciplines = [
        {'name': d, 'quotedValue': round(v['quotedValue'], 2), 'orderedValue': round(v['orderedValue'], 2),
         'quotedCount': v['quotedCount'], 'orderedCount': v['orderedCount'],
         'supplierCount': len(v['suppliers']), 'projectCount': len(v['projects'])}
        for d, v in sorted(mc_data.items(), key=lambda x: x[1]['quotedValue'], reverse=True)
    ]

    md_entity_data = defaultdict(lambda: {'quotedValue': 0, 'orderedValue': 0, 'poCount': 0, 'quoteCount': 0})
    for q in md_quotations:
        e = q['entity']
        md_entity_data[e]['quotedValue'] += q['quotedValue']
        md_entity_data[e]['quoteCount'] += 1
    for po in md_pos:
        e = blank_safe(po['entity'])
        md_entity_data[e]['orderedValue'] += po['value']
        md_entity_data[e]['poCount'] += 1

    md_trend = defaultdict(lambda: {'quotedValue': 0, 'orderedValue': 0, 'quoteCount': 0, 'poCount': 0})
    for q in md_quotations:
        dt = parse_date_str(q['date'])
        if dt:
            ym = dt.strftime('%Y-%m')
            md_trend[ym]['quotedValue'] += q['quotedValue']
            md_trend[ym]['quoteCount'] += 1
    for po in md_pos:
        yr = po.get('year')
        mo = po.get('month')
        if yr and mo:
            ym = f'{yr}-{int(mo):02d}'
            md_trend[ym]['orderedValue'] += po['value']
            md_trend[ym]['poCount'] += 1

    po_entity_set = set(blank_safe(po['entity']) for po in md_pos)
    md_filters = {
        'entities': sorted(po_entity_set),
        'materialCodes': sorted(md_material_codes),
        'materials': sorted(md_raw_materials),
        'disciplines': sorted(md_material_codes),
        'projects': sorted(list(md_po_projects)[:200]),
        'suppliers': sorted(list(md_po_suppliers)),
    }

    md_data = {
        'quotations': md_quotations,
        'pos': md_pos,
        'summary': {
            'materialCodeCount': len(md_material_codes),
            'materialCount': len(md_raw_materials),
            'totalQuoted': round(md_total_quoted, 2),
            'totalOrdered': round(md_total_ordered, 2),
            'supplierCount': len(md_po_suppliers),
            'projectCount': len(md_po_projects),
            'entityCount': len(md_entities_set),
            'conversionRate': conversion_rate,
        },
        'disciplines': md_disciplines,
        'entityBreakdown': [
            {'name': e, 'quotedValue': round(v['quotedValue'], 2), 'orderedValue': round(v['orderedValue'], 2),
             'poCount': v['poCount'], 'quoteCount': v['quoteCount']}
            for e, v in sorted(md_entity_data.items(), key=lambda x: x[1]['quotedValue'], reverse=True)
        ],
        'trend': [
            {'yearMonth': ym, 'quotedValue': round(d['quotedValue'], 2),
             'orderedValue': round(d['orderedValue'], 2),
             'quoteCount': d['quoteCount'], 'poCount': d['poCount']}
            for ym, d in sorted(md_trend.items())
        ],
        'filters': md_filters,
    }

    print(f'  M&D Quotations: {len(md_quotations)}')
    print(f'  M&D POs: {len(md_pos)}')
    print(f'  Material Codes: {len(md_material_codes)}')
    print(f'  Raw Materials: {len(md_raw_materials)}')

    # ── 9. Build Q→PO Conversion Times & Save ───────────────
    print('\n[9/9] Building conversion times and saving...')

    po_dates_by_oid = {}
    for po in clean_pos:
        oid = po.get('orderId', '')
        dt = parse_date_str(po.get('poDate', ''))
        if oid and dt:
            if oid not in po_dates_by_oid or dt < po_dates_by_oid[oid]:
                po_dates_by_oid[oid] = dt

    conversion_times = []
    for q in clean_quotes:
        if q['Status'] != 'Order':
            continue
        oid = q.get('orderId', '')
        q_dt = parse_date_str(q.get('Date', ''))
        if not oid or not q_dt:
            continue
        if oid in po_dates_by_oid:
            po_dt = po_dates_by_oid[oid]
            days = (po_dt - q_dt).days
            if 0 <= days <= 730:
                conversion_times.append({
                    'quotationNumber': q['QuotationNumber'],
                    'quotationDate': q_dt.strftime('%Y-%m-%d'),
                    'poDate': po_dt.strftime('%Y-%m-%d'),
                    'daysToConvert': days,
                    'month': q_dt.strftime('%Y-%m'),
                    'orderId': oid,
                })

    po_dates_by_base = {}
    for po in clean_pos:
        pnum = po['poNumber']
        parts = pnum.split('-')
        if len(parts) >= 2:
            base = f'{parts[0]}-{parts[1]}'
            dt = parse_date_str(po.get('poDate', ''))
            if dt:
                po_dates_by_base[base] = dt

    linked_oids = set(ct.get('orderId', '') for ct in conversion_times)
    for q in clean_quotes:
        if q['Status'] != 'Order':
            continue
        oid = q.get('orderId', '')
        if oid in linked_oids:
            continue
        qnum = q['QuotationNumber']
        q_dt = parse_date_str(q.get('Date', ''))
        if not qnum or not q_dt:
            continue
        parts = qnum.split('-')
        if len(parts) >= 2:
            base = f'{parts[0]}-{parts[1]}'
            rfpo_base = base.replace('RFQ', 'RFPO')
            if rfpo_base in po_dates_by_base:
                po_dt = po_dates_by_base[rfpo_base]
                days = (po_dt - q_dt).days
                if 0 <= days <= 365:
                    conversion_times.append({
                        'quotationNumber': qnum,
                        'quotationDate': q_dt.strftime('%Y-%m-%d'),
                        'poDate': po_dt.strftime('%Y-%m-%d'),
                        'daysToConvert': days,
                        'month': q_dt.strftime('%Y-%m'),
                        'orderId': oid,
                    })

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
        'avgDays': round(sum(ct['daysToConvert'] for ct in conversion_times) / len(conversion_times), 1) if conversion_times else 0,
    }

    print(f'  Q→PO links: {len(conversion_times)}')
    print(f'  Avg conversion days: {conversion_summary["avgDays"]}')

    # ── Save all files ───────────────────────────────────────
    print('\n  Saving all data files...')
    save_json(sm_data, 'sm_data.json')
    save_json(gsa_data, 'gsa_data.json')
    save_json(md_data, 'md_data.json')
    save_json(employee_records, 'employees.json')
    save_json(conversion_summary, 'conversion_times.json')

    save_json({
        'totalGroups': change_order_groups,
        'totalChangeOrderPOs': total_change_order_pos,
        'totalChangeOrderValue': round(co_value, 2),
        'details': change_order_details,
    }, 'change_orders.json')

    metadata = {
        'sourceFiles': {
            'po': 'PO_List_Feb-20-2026.xls',
            'quotations': [f for f in sorted(os.listdir(EXCEL_DIR)) if f.startswith('Quotation_Report_')],
        },
        'exportDate': '2026-02-20',
        'buildDate': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'counts': {
            'rawPOs': len(raw_pos),
            'cleanPOs': len(clean_pos),
            'rawQuotations': len(raw_quotes),
            'cleanRFQs': len(clean_quotes),
            'removedIQ': removed_iq,
            'basePOs': len(base_pos),
            'changeOrders': len(change_orders_list),
            'changeOrderGroups': change_order_groups,
            'revisions': revision_count,
            'employees': len(employee_records),
            'conversionLinks': len(conversion_times),
        },
    }
    save_json(metadata, 'data_metadata.json')

    print('\n' + '=' * 60)
    print('V8 DATA PIPELINE COMPLETE')
    print('=' * 60)
    print(f'\nSM (Quotations):  {len(clean_quotes)} RFQ records')
    print(f'GSA (POs):        {len(clean_pos)} PO records')
    print(f'  Base POs:       {len(base_pos)}')
    print(f'  Change Orders:  {len(change_orders_list)} ({change_order_groups} groups)')
    print(f'M&D Quotations:   {len(md_quotations)}')
    print(f'M&D POs:          {len(md_pos)}')
    print(f'Employees:        {len(employee_records)}')
    print(f'Conversions:      {len(conversion_times)} linked')
    print(f'Revisions:        {revision_count} quotation revisions')


if __name__ == '__main__':
    main()
