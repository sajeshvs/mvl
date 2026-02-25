"""
V8 Dashboard — Export ALL JSON Data to CSV
===========================================
Exports every JSON data file used by the V8 dashboard into CSV format.
Each CSV is named clearly and placed in this folder (v8/data/export_csv/).

Run:
    cd v8/data/export_csv
    python export_all_data.py
"""

import json
import csv
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), '..')
OUT_DIR = os.path.dirname(__file__)


def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"  ⚠️  {filename} not found — skipping")
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_csv(filename, rows, fieldnames):
    path = os.path.join(OUT_DIR, filename)
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    print(f"  ✅ {filename} — {len(rows)} rows, {len(fieldnames)} columns")


def safe_get(obj, *keys, default=''):
    """Safely navigate nested dicts."""
    for k in keys:
        if isinstance(obj, dict):
            obj = obj.get(k, default)
        else:
            return default
    return obj if obj is not None else default


def flatten_list(val):
    """Convert a list to semicolon-separated string."""
    if isinstance(val, list):
        return '; '.join(str(v) for v in val)
    return val


# ============================================================
# 1. SM DATA — Supplier Marketplace (sm_data.json)
# ============================================================
def export_sm_data():
    print("\n📊 1. SM DATA (sm_data.json) — Supplier Marketplace Tab")
    data = load_json('sm_data.json')
    if not data:
        return

    # 1a. SM Workbench (quotations)
    wb = data.get('workbench', [])
    if wb:
        fields = ['QuotationNumber', 'QuotationType', 'Status', 'ProjectName',
                  'Description', 'Material', 'MaterialCodeRaw', 'materialCode',
                  'Entity', 'Client', 'QuotationValue', 'Currency', 'Contact',
                  'Date', 'mainOrderId', 'orderId', 'isRevision', 'revisionLetter',
                  'baseNumber', 'id']
        write_csv('01_SM_Workbench_Quotations.csv', wb, fields)

    # 1b. SM Summary
    summary = data.get('summary', {})
    if summary:
        rows = [{'Metric': k, 'Value': v} for k, v in summary.items()]
        write_csv('01_SM_Summary.csv', rows, ['Metric', 'Value'])

    # 1c. SM Status Summary
    ss = data.get('statusSummary', [])
    if ss:
        fields = list(ss[0].keys()) if ss else []
        write_csv('01_SM_Status_Summary.csv', ss, fields)

    # 1d. SM Entities breakdown
    ent = data.get('entities', [])
    if ent:
        fields = list(ent[0].keys()) if ent else []
        write_csv('01_SM_Entities.csv', ent, fields)

    # 1e. SM Materials by Discipline
    mbd = data.get('materialsByDiscipline', [])
    if mbd:
        fields = list(mbd[0].keys()) if mbd else []
        write_csv('01_SM_Materials_By_Discipline.csv', mbd, fields)

    # 1f. SM Top Suppliers
    sup = data.get('suppliers', [])
    if sup:
        rows = []
        for s in sup:
            row = {}
            for k, v in s.items():
                if isinstance(v, dict):
                    for sk, sv in v.items():
                        row[f"{k}_{sk}"] = sv
                elif isinstance(v, list):
                    row[k] = flatten_list(v)
                else:
                    row[k] = v
            rows.append(row)
        fields = list(rows[0].keys()) if rows else []
        write_csv('01_SM_Suppliers_Ranking.csv', rows, fields)

    # 1g. SM Filters
    filters = data.get('filters', {})
    if filters:
        for fname, fvals in filters.items():
            if isinstance(fvals, list):
                rows = [{'Value': v} for v in fvals]
                write_csv(f'01_SM_Filter_{fname}.csv', rows, ['Value'])

    # 1h. SM Funnel
    funnel = data.get('funnel', {})
    if funnel:
        rows = [{'Stage': k, 'Value': v} for k, v in funnel.items()]
        write_csv('01_SM_Funnel.csv', rows, ['Stage', 'Value'])


# ============================================================
# 2. GSA DATA — Global Spend Analysis (gsa_data.json)
# ============================================================
def export_gsa_data():
    print("\n📊 2. GSA DATA (gsa_data.json) — Global Spend Analysis Tab")
    data = load_json('gsa_data.json')
    if not data:
        return

    # 2a. GSA Workbench (POs)
    wb = data.get('workbench', [])
    if wb:
        fields = ['poNumber', 'poDate', 'poName', 'supplier', 'originalValue',
                  'currency', 'mainOrderId', 'orderId', 'entityCode', 'entity',
                  'material', 'materialCode', 'poVersion', 'isChangeOrder', 'year',
                  'month', 'yearMonth', 'valueUSD', 'poSpendUSD', 'poType',
                  'changeOrderGroup', 'changeOrderTotal', 'project']
        write_csv('02_GSA_Workbench_POs.csv', wb, fields)

    # 2b. GSA Summary
    summary = data.get('summary', {})
    if summary:
        rows = [{'Metric': k, 'Value': v} for k, v in summary.items()]
        write_csv('02_GSA_Summary.csv', rows, ['Metric', 'Value'])

    # 2c. GSA Supplier Rankings
    sr = data.get('supplierRankings', data.get('supplierRanking', {}))
    if isinstance(sr, dict):
        # Has top/bottom sub-arrays
        for rank_type in ['top', 'bottom']:
            items = sr.get(rank_type, [])
            if items:
                fields = list(items[0].keys())
                write_csv(f'02_GSA_Supplier_Rankings_{rank_type.title()}.csv', items, fields)
    elif isinstance(sr, list) and sr:
        fields = list(sr[0].keys())
        write_csv('02_GSA_Supplier_Rankings.csv', sr, fields)

    # 2d. GSA Entity Breakdown
    eb = data.get('entityBreakdown', [])
    if eb:
        fields = list(eb[0].keys()) if eb else []
        write_csv('02_GSA_Entity_Breakdown.csv', eb, fields)

    # 2e. GSA Material Breakdown
    mb = data.get('materialBreakdown', [])
    if mb:
        fields = list(mb[0].keys()) if mb else []
        write_csv('02_GSA_Material_Breakdown.csv', mb, fields)

    # 2f. GSA Annual Trend
    at = data.get('annualTrend', [])
    if at:
        fields = list(at[0].keys()) if at else []
        write_csv('02_GSA_Annual_Trend.csv', at, fields)

    # 2g. GSA Monthly Trend
    mt = data.get('monthlyTrend', [])
    if mt:
        fields = list(mt[0].keys()) if mt else []
        write_csv('02_GSA_Monthly_Trend.csv', mt, fields)

    # 2h. GSA PO Type Breakdown
    ptb = data.get('poTypeBreakdown', {})
    if ptb:
        if isinstance(ptb, dict) and ptb and not isinstance(list(ptb.values())[0], (str, int, float)):
            rows = []
            for ptype, info in ptb.items():
                row = {'poType': ptype}
                if isinstance(info, dict):
                    row.update(info)
                else:
                    row['value'] = info
                rows.append(row)
            fields = list(rows[0].keys()) if rows else []
            write_csv('02_GSA_PO_Type_Breakdown.csv', rows, fields)
        elif isinstance(ptb, list) and ptb:
            fields = list(ptb[0].keys())
            write_csv('02_GSA_PO_Type_Breakdown.csv', ptb, fields)

    # 2i. GSA Change Order Details
    cod = data.get('changeOrderDetails', [])
    if cod:
        rows = []
        for c in cod:
            row = dict(c)
            if 'poNumbers' in row:
                row['poNumbers'] = flatten_list(row['poNumbers'])
            rows.append(row)
        fields = list(rows[0].keys()) if rows else []
        write_csv('02_GSA_Change_Order_Details.csv', rows, fields)

    # 2j. GSA Change Order Monthly
    com = data.get('changeOrderMonthly', [])
    if com:
        fields = list(com[0].keys()) if com else []
        write_csv('02_GSA_Change_Order_Monthly.csv', com, fields)

    # 2k. GSA Filters
    filters = data.get('filters', {})
    if filters:
        for fname, fvals in filters.items():
            if isinstance(fvals, list):
                rows = [{'Value': v} for v in fvals]
                write_csv(f'02_GSA_Filter_{fname}.csv', rows, ['Value'])


# ============================================================
# 3. M&D DATA — Materials & Disciplines (md_data.json)
# ============================================================
def export_md_data():
    print("\n📊 3. M&D DATA (md_data.json) — Materials & Disciplines Tab")
    data = load_json('md_data.json')
    if not data:
        return

    # 3a. M&D Quotations
    quot = data.get('quotations', [])
    if quot:
        fields = ['number', 'type', 'status', 'entity', 'client', 'projectName',
                  'description', 'material', 'materialCode', 'quotedValue', 'currency',
                  'contact', 'date', 'mainOrderId', 'orderId']
        write_csv('03_MD_Quotations.csv', quot, fields)

    # 3b. M&D POs
    pos = data.get('pos', [])
    if pos:
        fields = ['poNumber', 'poDate', 'poName', 'supplier', 'entity', 'project',
                  'material', 'materialCode', 'value', 'currency', 'year', 'month',
                  'mainOrderId', 'orderId', 'poType']
        # Some POs may have additional fields
        extra_fields = set()
        for po in pos:
            extra_fields.update(po.keys())
        all_fields = fields + [f for f in sorted(extra_fields) if f not in fields]
        write_csv('03_MD_POs.csv', pos, all_fields)

    # 3c. M&D Summary
    summary = data.get('summary', {})
    if summary:
        rows = [{'Metric': k, 'Value': v} for k, v in summary.items()]
        write_csv('03_MD_Summary.csv', rows, ['Metric', 'Value'])

    # 3d. M&D Disciplines aggregation
    disc = data.get('disciplines', [])
    if disc:
        fields = list(disc[0].keys()) if disc else []
        write_csv('03_MD_Disciplines.csv', disc, fields)

    # 3e. M&D Entity Breakdown
    eb = data.get('entityBreakdown', [])
    if eb:
        fields = list(eb[0].keys()) if eb else []
        write_csv('03_MD_Entity_Breakdown.csv', eb, fields)

    # 3f. M&D Trend
    trend = data.get('trend', [])
    if trend:
        fields = list(trend[0].keys()) if trend else []
        write_csv('03_MD_Trend.csv', trend, fields)

    # 3g. M&D Filters
    filters = data.get('filters', {})
    if filters:
        for fname, fvals in filters.items():
            if isinstance(fvals, list):
                rows = [{'Value': v} for v in fvals]
                write_csv(f'03_MD_Filter_{fname}.csv', rows, ['Value'])


# ============================================================
# 4. SUPPLIERS (suppliers.json) — All tabs
# ============================================================
def export_suppliers():
    print("\n📊 4. SUPPLIERS (suppliers.json) — Used on SM, GSA, M&D tabs")
    data = load_json('suppliers.json')
    if not data:
        return

    suppliers = data.get('suppliers', [])
    rows = []
    for s in suppliers:
        row = {
            'id': s.get('id', ''),
            'legacy_no': s.get('legacy_no', ''),
            'name': s.get('name', ''),
            'material_category': s.get('material_category', ''),
            'status': s.get('status', ''),
            'supplier_score': s.get('supplier_score', ''),
            # Contact (nested)
            'contact_primary': safe_get(s, 'contact', 'primary_contact'),
            'contact_email': safe_get(s, 'contact', 'email'),
            'contact_phone': safe_get(s, 'contact', 'phone'),
            'contact_fax': safe_get(s, 'contact', 'fax'),
            'contact_first_name': safe_get(s, 'contact', 'first_name'),
            'contact_last_name': safe_get(s, 'contact', 'last_name'),
            'contact_title': safe_get(s, 'contact', 'title'),
            # Address (nested)
            'address_full': safe_get(s, 'address', 'full_address'),
            'address_street': safe_get(s, 'address', 'street'),
            'address_city': safe_get(s, 'address', 'city'),
            'address_country': safe_get(s, 'address', 'country'),
            'address_country_iso3': safe_get(s, 'address', 'country_iso3'),
            'address_country_iso2': safe_get(s, 'address', 'country_iso2'),
            'address_country_standardized': safe_get(s, 'address', 'country_standardized'),
            # Location (nested)
            'location_latitude': safe_get(s, 'location', 'latitude'),
            'location_longitude': safe_get(s, 'location', 'longitude'),
            'location_formatted_address': safe_get(s, 'location', 'formatted_address'),
            'location_quality': safe_get(s, 'location', 'quality'),
            'location_quality_score': safe_get(s, 'location', 'quality_score'),
            # Phone validation (nested)
            'phone_country': safe_get(s, 'phone_validation', 'phone_country'),
            'phone_country_code': safe_get(s, 'phone_validation', 'phone_country_code'),
            'phone_is_valid': safe_get(s, 'phone_validation', 'is_valid'),
            'phone_matches_address': safe_get(s, 'phone_validation', 'matches_address'),
            # Identifiers (nested)
            'trn_number': safe_get(s, 'identifiers', 'trn_number'),
            'tax_id': safe_get(s, 'identifiers', 'tax_id'),
            # Rating (nested)
            'rating_score': safe_get(s, 'rating', 'score') if isinstance(s.get('rating'), dict) else s.get('rating', ''),
            'rating_scale': safe_get(s, 'rating', 'scale') if isinstance(s.get('rating'), dict) else '',
            'rating_last_updated': safe_get(s, 'rating', 'last_updated') if isinstance(s.get('rating'), dict) else '',
            # Metadata (nested)
            'created_date': safe_get(s, 'metadata', 'created_date'),
            'last_updated': safe_get(s, 'metadata', 'last_updated'),
            'data_quality_score': safe_get(s, 'metadata', 'data_quality_score'),
            'missing_fields': flatten_list(safe_get(s, 'metadata', 'missing_fields')),
        }
        rows.append(row)

    fields = list(rows[0].keys()) if rows else []
    write_csv('04_Suppliers.csv', rows, fields)

    # 4b. Metadata
    meta = data.get('metadata', {})
    if meta:
        rows = [{'Metric': k, 'Value': v} for k, v in meta.items()]
        write_csv('04_Suppliers_Metadata.csv', rows, ['Metric', 'Value'])


# ============================================================
# 5. PURCHASE ORDERS (purchase_orders.json)
# ============================================================
def export_purchase_orders():
    print("\n📊 5. PURCHASE ORDERS (purchase_orders.json) — SM & M&D tabs")
    data = load_json('purchase_orders.json')
    if not data:
        return

    pos = data.get('purchase_orders', [])
    rows = []
    for po in pos:
        row = {
            'id': po.get('id', ''),
            'legacy_no': po.get('legacy_no', ''),
            'po_number': po.get('po_number', ''),
            'description': po.get('description', ''),
            'status': po.get('status', ''),
            'category': po.get('category', ''),
            # PO Components (nested)
            'components_prefix': safe_get(po, 'po_components', 'prefix'),
            'components_series': safe_get(po, 'po_components', 'series'),
            'components_category': safe_get(po, 'po_components', 'category'),
            'components_sequence': safe_get(po, 'po_components', 'sequence'),
            # Dates (nested)
            'po_date': safe_get(po, 'dates', 'po_date'),
            'po_date_original': safe_get(po, 'dates', 'po_date_original'),
            'created_date': safe_get(po, 'dates', 'created_date'),
            'approved_date': safe_get(po, 'dates', 'approved_date'),
            'expected_delivery': safe_get(po, 'dates', 'expected_delivery'),
            'actual_delivery': safe_get(po, 'dates', 'actual_delivery'),
            # Project (nested)
            'project_code': safe_get(po, 'project', 'project_code'),
            'project_name': safe_get(po, 'project', 'project_name'),
            # Supplier (nested)
            'supplier_name': safe_get(po, 'supplier', 'name'),
            'supplier_id': safe_get(po, 'supplier', 'supplier_id'),
            'supplier_matched': safe_get(po, 'supplier', 'matched'),
            # Financial (nested)
            'total_amount': safe_get(po, 'financial', 'total_amount'),
            'currency': safe_get(po, 'financial', 'currency'),
            'usd_equivalent': safe_get(po, 'financial', 'usd_equivalent'),
            'exchange_rate': safe_get(po, 'financial', 'exchange_rate'),
            # Metadata (nested)
            'has_supplier': safe_get(po, 'metadata', 'has_supplier'),
            'supplier_linked': safe_get(po, 'metadata', 'supplier_linked'),
            'data_quality_score': safe_get(po, 'metadata', 'data_quality_score'),
            'missing_fields': flatten_list(safe_get(po, 'metadata', 'missing_fields')),
        }
        rows.append(row)

    fields = list(rows[0].keys()) if rows else []
    write_csv('05_Purchase_Orders.csv', rows, fields)

    # 5b. Metadata
    meta = data.get('metadata', {})
    if meta:
        rows = [{'Metric': k, 'Value': v} for k, v in meta.items()]
        write_csv('05_Purchase_Orders_Metadata.csv', rows, ['Metric', 'Value'])


# ============================================================
# 6. QUOTATIONS (quotations.json) — Full detail
# ============================================================
def export_quotations():
    print("\n📊 6. QUOTATIONS (quotations.json) — SM & M&D tabs (12K+ records)")
    data = load_json('quotations.json')
    if not data:
        return

    quots = data.get('quotations', [])
    rows = []
    for q in quots:
        row = {
            'id': q.get('id', ''),
            'series_number': q.get('series_number', ''),
            'quotation_number': q.get('quotation_number', ''),
            'company': q.get('company', ''),
            'type': q.get('type', ''),
            'type_full': q.get('type_full', ''),
            'source_file': q.get('source_file', ''),
            # Components (nested)
            'components_prefix': safe_get(q, 'quotation_components', 'prefix'),
            'components_batch': safe_get(q, 'quotation_components', 'batch'),
            'components_code': safe_get(q, 'quotation_components', 'code'),
            # Dates (nested)
            'quotation_date': safe_get(q, 'dates', 'quotation_date'),
            'quotation_date_original': safe_get(q, 'dates', 'quotation_date_original'),
            'created_date': safe_get(q, 'dates', 'created_date'),
            'sent_date': safe_get(q, 'dates', 'sent_date'),
            'valid_until': safe_get(q, 'dates', 'valid_until'),
            'response_date': safe_get(q, 'dates', 'response_date'),
            # Client (nested)
            'client_name': safe_get(q, 'client', 'name'),
            'client_id': safe_get(q, 'client', 'client_id'),
            'client_type': safe_get(q, 'client', 'type'),
            # Project (nested)
            'project_name': safe_get(q, 'project', 'name'),
            'project_code': safe_get(q, 'project', 'project_code'),
            'project_category': safe_get(q, 'project', 'project_category'),
            # Details (nested)
            'description': safe_get(q, 'details', 'description'),
            'material_category': safe_get(q, 'details', 'material_category'),
            'material_code': safe_get(q, 'details', 'material_code'),
            'quantity': safe_get(q, 'details', 'quantity'),
            'unit': safe_get(q, 'details', 'unit'),
            # Financial (nested)
            'quoted_value': safe_get(q, 'financial', 'quoted_value'),
            'currency': safe_get(q, 'financial', 'currency'),
            'usd_equivalent': safe_get(q, 'financial', 'usd_equivalent'),
            'actual_po_value': safe_get(q, 'financial', 'actual_po_value'),
            'variance': safe_get(q, 'financial', 'variance'),
            # Contact (nested)
            'mvl_contact': safe_get(q, 'contact', 'mvl_contact'),
            'client_contact': safe_get(q, 'contact', 'client_contact'),
            # Outcome (nested)
            'status': safe_get(q, 'outcome', 'status'),
            'status_normalized': safe_get(q, 'outcome', 'status_normalized'),
            'converted_to_po': safe_get(q, 'outcome', 'converted_to_po'),
            'po_number': safe_get(q, 'outcome', 'po_number'),
            'reason_lost': safe_get(q, 'outcome', 'reason_lost'),
            'competitor': safe_get(q, 'outcome', 'competitor'),
            'follow_up_date': safe_get(q, 'outcome', 'follow_up_date'),
            # Metrics (nested)
            'days_to_response': safe_get(q, 'metrics', 'days_to_response'),
            'days_to_close': safe_get(q, 'metrics', 'days_to_close'),
            'success_probability': safe_get(q, 'metrics', 'success_probability'),
            # Metadata (nested)
            'data_quality_score': safe_get(q, 'metadata', 'data_quality_score'),
            'missing_fields': flatten_list(safe_get(q, 'metadata', 'missing_fields')),
        }
        rows.append(row)

    fields = list(rows[0].keys()) if rows else []
    write_csv('06_Quotations_Full.csv', rows, fields)

    # 6b. Metadata
    meta = data.get('metadata', {})
    if meta:
        rows = [{'Metric': k, 'Value': v} for k, v in meta.items()]
        write_csv('06_Quotations_Metadata.csv', rows, ['Metric', 'Value'])


# ============================================================
# 7. DASHBOARD DATA (dashboard_data.json) — Config/Template
# ============================================================
def export_dashboard_data():
    print("\n📊 7. DASHBOARD DATA (dashboard_data.json) — All tabs (config template)")
    data = load_json('dashboard_data.json')
    if not data:
        return

    # 7a. Summary KPIs
    summary = data.get('summary', {})
    if summary:
        rows = [{'Metric': k, 'Value': v} for k, v in summary.items()]
        write_csv('07_Dashboard_Summary_KPIs.csv', rows, ['Metric', 'Value'])

    # 7b. Filters
    filters = data.get('filters', {})
    if filters:
        for fname, fvals in filters.items():
            if isinstance(fvals, list):
                rows = [{'Value': v} for v in fvals]
                write_csv(f'07_Dashboard_Filter_{fname}.csv', rows, ['Value'])

    # 7c. SM config charts
    sm = data.get('supplierMarketplace', {})
    if sm:
        for key, val in sm.items():
            if isinstance(val, list) and val and isinstance(val[0], dict):
                fields = list(val[0].keys())
                write_csv(f'07_Dashboard_SM_{key}.csv', val, fields)
            elif isinstance(val, dict):
                rows = [{'Key': k, 'Value': v} for k, v in val.items() if not isinstance(v, (dict, list))]
                if rows:
                    write_csv(f'07_Dashboard_SM_{key}.csv', rows, ['Key', 'Value'])


# ============================================================
# 8. CLIENT COUNTRY MAP (client_country_map.json) — SM tab
# ============================================================
def export_client_country_map():
    print("\n📊 8. CLIENT COUNTRY MAP (client_country_map.json) — SM tab map")
    data = load_json('client_country_map.json')
    if not data:
        return

    rows = [{'Client': k, 'Country': v} for k, v in data.items()]
    write_csv('08_Client_Country_Map.csv', rows, ['Client', 'Country'])


# ============================================================
# 9. CONVERSION TIMES (conversion_times.json) — SM tab
# ============================================================
def export_conversion_times():
    print("\n📊 9. CONVERSION TIMES (conversion_times.json) — SM tab chart")
    data = load_json('conversion_times.json')
    if not data:
        return

    # 9a. Individual records
    records = data.get('records', [])
    if records:
        fields = ['quotationNumber', 'quotationDate', 'poDate', 'daysToConvert', 'month', 'orderId']
        write_csv('09_Conversion_Times_Records.csv', records, fields)

    # 9b. Monthly averages
    monthly = data.get('monthlyAverage', [])
    if monthly:
        fields = ['month', 'avgDays', 'count']
        write_csv('09_Conversion_Times_Monthly_Avg.csv', monthly, fields)

    # 9c. Summary
    rows = [
        {'Metric': 'totalLinked', 'Value': data.get('totalLinked', '')},
        {'Metric': 'avgDays', 'Value': data.get('avgDays', '')}
    ]
    write_csv('09_Conversion_Times_Summary.csv', rows, ['Metric', 'Value'])


# ============================================================
# 10. CHANGE ORDERS (change_orders.json) — GSA tab
# ============================================================
def export_change_orders():
    print("\n📊 10. CHANGE ORDERS (change_orders.json) — GSA tab")
    data = load_json('change_orders.json')
    if not data:
        return

    # 10a. Details
    details = data.get('details', [])
    if details:
        rows = []
        for d in details:
            row = dict(d)
            row['poNumbers'] = flatten_list(d.get('poNumbers', []))
            rows.append(row)
        fields = ['orderId', 'mainOrderId', 'poCount', 'totalValueUSD', 'poNumbers']
        write_csv('10_Change_Orders_Details.csv', rows, fields)

    # 10b. Summary
    rows = [
        {'Metric': 'totalGroups', 'Value': data.get('totalGroups', '')},
        {'Metric': 'totalChangeOrderPOs', 'Value': data.get('totalChangeOrderPOs', '')},
        {'Metric': 'totalChangeOrderValue', 'Value': data.get('totalChangeOrderValue', '')}
    ]
    write_csv('10_Change_Orders_Summary.csv', rows, ['Metric', 'Value'])


# ============================================================
# 11. MATERIAL CODES (material_codes.json) — Pipeline reference
# ============================================================
def export_material_codes():
    print("\n📊 11. MATERIAL CODES (material_codes.json) — Pipeline reference data")
    data = load_json('material_codes.json')
    if not data:
        return

    materials = data.get('materials', data if isinstance(data, list) else [])
    if materials and isinstance(materials, list):
        fields = list(materials[0].keys()) if materials else []
        write_csv('11_Material_Codes.csv', materials, fields)
    elif isinstance(data, dict):
        # Might be a dict
        rows = [{'Code': k, 'Name': v} for k, v in data.items() if not isinstance(v, (dict, list))]
        if rows:
            write_csv('11_Material_Codes.csv', rows, ['Code', 'Name'])


# ============================================================
# 12. ENTITY CODE MAP (entity_code_map.json) — Pipeline reference
# ============================================================
def export_entity_code_map():
    print("\n📊 12. ENTITY CODE MAP (entity_code_map.json) — Pipeline reference")
    data = load_json('entity_code_map.json')
    if not data:
        return

    rows = [{'EntityCode': k, 'EntityName': v} for k, v in data.items()]
    write_csv('12_Entity_Code_Map.csv', rows, ['EntityCode', 'EntityName'])


# ============================================================
# 13. EMPLOYEES (employees.json) — Pipeline reference
# ============================================================
def export_employees():
    print("\n📊 13. EMPLOYEES (employees.json) — Pipeline reference")
    data = load_json('employees.json')
    if not data:
        return

    employees = data if isinstance(data, list) else data.get('employees', [])
    if employees:
        fields = list(employees[0].keys()) if employees else []
        write_csv('13_Employees.csv', employees, fields)


# ============================================================
# 14. ORDERS (orders.json) — Pipeline reference
# ============================================================
def export_orders():
    print("\n📊 14. ORDERS (orders.json) — Pipeline reference data")
    data = load_json('orders.json')
    if not data:
        return

    orders = data if isinstance(data, list) else data.get('orders', [])
    if orders:
        rows = []
        for o in orders:
            row = {}
            for k, v in o.items():
                if isinstance(v, (dict, list)):
                    row[k] = flatten_list(v) if isinstance(v, list) else str(v)
                else:
                    row[k] = v
            rows.append(row)
        fields = list(rows[0].keys()) if rows else []
        write_csv('14_Orders.csv', rows, fields)


# ============================================================
# 15. DATA METADATA (data_metadata.json) — Build info
# ============================================================
def export_data_metadata():
    print("\n📊 15. DATA METADATA (data_metadata.json) — Build pipeline info")
    data = load_json('data_metadata.json')
    if not data:
        return

    rows = []
    for k, v in data.items():
        if isinstance(v, dict):
            for sk, sv in v.items():
                rows.append({'Category': k, 'Metric': sk, 'Value': sv})
        elif isinstance(v, list):
            rows.append({'Category': '', 'Metric': k, 'Value': flatten_list(v)})
        else:
            rows.append({'Category': '', 'Metric': k, 'Value': v})
    write_csv('15_Data_Metadata.csv', rows, ['Category', 'Metric', 'Value'])


# ============================================================
# 16. IMPROVEMENT SUMMARY (improvement_summary.json)
# ============================================================
def export_improvement_summary():
    print("\n📊 16. IMPROVEMENT SUMMARY (improvement_summary.json)")
    data = load_json('improvement_summary.json')
    if not data:
        return

    rows = []
    date = data.get('improvement_date', '')
    datasets = data.get('datasets', {})
    for ds_name, ds_info in datasets.items():
        if isinstance(ds_info, dict):
            for k, v in ds_info.items():
                rows.append({
                    'Date': date,
                    'Dataset': ds_name,
                    'Metric': k,
                    'Value': flatten_list(v) if isinstance(v, list) else v
                })
    if rows:
        write_csv('16_Improvement_Summary.csv', rows, ['Date', 'Dataset', 'Metric', 'Value'])


# ============================================================
# 17. LOCATION ENRICHMENT SUMMARY
# ============================================================
def export_location_enrichment():
    print("\n📊 17. LOCATION ENRICHMENT (location_enrichment_summary.json)")
    data = load_json('location_enrichment_summary.json')
    if not data:
        return

    rows = []
    for k, v in data.items():
        if isinstance(v, dict):
            for sk, sv in v.items():
                rows.append({'Category': k, 'Metric': sk, 'Value': sv})
        elif isinstance(v, list):
            rows.append({'Category': '', 'Metric': k, 'Value': flatten_list(v)})
        else:
            rows.append({'Category': '', 'Metric': k, 'Value': v})
    write_csv('17_Location_Enrichment_Summary.csv', rows, ['Category', 'Metric', 'Value'])


# ============================================================
# MAIN
# ============================================================
if __name__ == '__main__':
    print("=" * 60)
    print("V8 DASHBOARD — COMPLETE DATA EXPORT TO CSV")
    print("=" * 60)
    print(f"Source: {DATA_DIR}")
    print(f"Output: {OUT_DIR}")

    export_sm_data()
    export_gsa_data()
    export_md_data()
    export_suppliers()
    export_purchase_orders()
    export_quotations()
    export_dashboard_data()
    export_client_country_map()
    export_conversion_times()
    export_change_orders()
    export_material_codes()
    export_entity_code_map()
    export_employees()
    export_orders()
    export_data_metadata()
    export_improvement_summary()
    export_location_enrichment()

    # Count total CSVs
    csv_count = len([f for f in os.listdir(OUT_DIR) if f.endswith('.csv')])
    print(f"\n{'=' * 60}")
    print(f"✅ EXPORT COMPLETE — {csv_count} CSV files generated")
    print(f"{'=' * 60}")
