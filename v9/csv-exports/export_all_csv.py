#!/usr/bin/env python3
"""
MVL Dashboard — JSON → CSV Exporter
====================================
Reads all v8/data/*.json files and exports flattened CSV files
into v8/csv-exports/ with full documentation README.

Each CSV is self-contained and includes computed/derived fields
so analysts can trace how every value appears on the dashboard.

Run:
    python export_all_csv.py
"""

import json, csv, os, sys
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUT_DIR  = os.path.dirname(__file__)

def load(name):
    path = os.path.join(DATA_DIR, name)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────
# 1. GSA — Global Spend Analysis
# ─────────────────────────────────────────────────────────────
def export_gsa():
    data = load('gsa_data.json')

    # 1a. GSA Workbench — main PO records
    wb = data['workbench']
    fields = [
        'poNumber', 'poDate', 'poName', 'supplier',
        'originalValue', 'currency', 'valueUSD', 'poSpendUSD',
        'mainOrderId', 'orderId', 'entityCode', 'entity',
        'material', 'materialCode',
        'poVersion', 'isChangeOrder', 'poType',
        'changeOrderGroup', 'changeOrderTotal',
        'year', 'month', 'yearMonth', 'project'
    ]
    write_csv('01_GSA_PO_Workbench.csv', fields, wb)
    print(f"  ✅ 01_GSA_PO_Workbench.csv — {len(wb)} POs")

    # 1b. GSA Summary (single row)
    s = data['summary']
    write_csv('02_GSA_Summary.csv',
              list(s.keys()), [s])
    print(f"  ✅ 02_GSA_Summary.csv — summary KPIs")

    # 1c. Supplier Rankings — Top
    top = data.get('supplierRankings', {}).get('top', [])
    if top:
        write_csv('03_GSA_Supplier_Rankings_Top.csv',
                  list(top[0].keys()), top)
        print(f"  ✅ 03_GSA_Supplier_Rankings_Top.csv — {len(top)} suppliers")

    # 1d. Supplier Rankings — Bottom
    bot = data.get('supplierRankings', {}).get('bottom', [])
    if bot:
        write_csv('04_GSA_Supplier_Rankings_Bottom.csv',
                  list(bot[0].keys()), bot)
        print(f"  ✅ 04_GSA_Supplier_Rankings_Bottom.csv — {len(bot)} suppliers")

    # 1e. Entity Breakdown
    ent = data.get('entityBreakdown', [])
    if ent:
        write_csv('05_GSA_Entity_Breakdown.csv',
                  list(ent[0].keys()), ent)
        print(f"  ✅ 05_GSA_Entity_Breakdown.csv — {len(ent)} entities")

    # 1f. Material Breakdown
    mat = data.get('materialBreakdown', [])
    if mat:
        write_csv('06_GSA_Material_Breakdown.csv',
                  list(mat[0].keys()), mat)
        print(f"  ✅ 06_GSA_Material_Breakdown.csv — {len(mat)} materials")

    # 1g. Annual Trend
    at = data.get('annualTrend', [])
    if at:
        write_csv('07_GSA_Annual_Trend.csv',
                  list(at[0].keys()), at)
        print(f"  ✅ 07_GSA_Annual_Trend.csv — {len(at)} years")

    # 1h. Monthly Trend
    mt = data.get('monthlyTrend', [])
    if mt:
        write_csv('08_GSA_Monthly_Trend.csv',
                  list(mt[0].keys()), mt)
        print(f"  ✅ 08_GSA_Monthly_Trend.csv — {len(mt)} months")

    # 1i. PO Type Breakdown
    ptb = data.get('poTypeBreakdown', {})
    if ptb:
        rows = []
        for ptype, vals in ptb.items():
            row = {'poType': ptype}
            row.update(vals)
            rows.append(row)
        write_csv('09_GSA_PO_Type_Breakdown.csv',
                  list(rows[0].keys()), rows)
        print(f"  ✅ 09_GSA_PO_Type_Breakdown.csv — {len(rows)} types")

    # 1j. Change Order Details
    cod = data.get('changeOrderDetails', [])
    if cod:
        # Flatten poNumbers array to semicolon-separated string
        flat = []
        for r in cod:
            row = dict(r)
            row['poNumbers'] = '; '.join(r.get('poNumbers', []))
            flat.append(row)
        write_csv('10_GSA_Change_Order_Details.csv',
                  list(flat[0].keys()), flat)
        print(f"  ✅ 10_GSA_Change_Order_Details.csv — {len(flat)} CO groups")

    # 1k. Change Order Monthly
    com = data.get('changeOrderMonthly', [])
    if com:
        write_csv('11_GSA_Change_Order_Monthly.csv',
                  list(com[0].keys()), com)
        print(f"  ✅ 11_GSA_Change_Order_Monthly.csv — {len(com)} months")

    # 1l. Filters (reference lists)
    flt = data.get('filters', {})
    for key, vals in flt.items():
        rows = [{'value': v} for v in vals]
        fname = f'12_GSA_Filter_{key}.csv'
        write_csv(fname, ['value'], rows)
    print(f"  ✅ 12_GSA_Filter_*.csv — {len(flt)} filter lists")


# ─────────────────────────────────────────────────────────────
# 2. SM — Supplier Marketplace
# ─────────────────────────────────────────────────────────────
def export_sm():
    data = load('sm_data.json')

    # 2a. SM Workbench — RFQ quotation records
    wb = data['workbench']
    fields = [
        'id', 'QuotationNumber', 'QuotationType', 'Status',
        'ProjectName', 'Description', 'Material', 'MaterialCodeRaw', 'materialCode',
        'Entity', 'Client', 'QuotationValue', 'Currency', 'Contact',
        'Date', 'mainOrderId', 'orderId',
        'isRevision', 'revisionLetter', 'baseNumber'
    ]
    write_csv('13_SM_Quotation_Workbench.csv', fields, wb)
    print(f"  ✅ 13_SM_Quotation_Workbench.csv — {len(wb)} quotations")

    # 2b. SM Summary
    s = data['summary']
    # Flatten revisionLetters dict
    flat_s = dict(s)
    rl = flat_s.pop('revisionLetters', {})
    for letter, cnt in rl.items():
        flat_s[f'revisionLetter_{letter}'] = cnt
    write_csv('14_SM_Summary.csv',
              list(flat_s.keys()), [flat_s])
    print(f"  ✅ 14_SM_Summary.csv — summary KPIs")

    # 2c. Status Summary
    ss = data.get('statusSummary', [])
    if ss:
        write_csv('15_SM_Status_Summary.csv',
                  list(ss[0].keys()), ss)
        print(f"  ✅ 15_SM_Status_Summary.csv — {len(ss)} statuses")

    # 2d. Entity Breakdown
    ent = data.get('entities', [])
    if ent:
        write_csv('16_SM_Entity_Breakdown.csv',
                  list(ent[0].keys()), ent)
        print(f"  ✅ 16_SM_Entity_Breakdown.csv — {len(ent)} entities")

    # 2e. Materials by Discipline
    mbd = data.get('materialsByDiscipline', [])
    if mbd:
        write_csv('17_SM_Materials_By_Discipline.csv',
                  list(mbd[0].keys()), mbd)
        print(f"  ✅ 17_SM_Materials_By_Discipline.csv — {len(mbd)} disciplines")

    # 2f. SM Contacts/Buyers performance
    sup = data.get('suppliers', [])
    if sup:
        write_csv('18_SM_Contacts_Buyers.csv',
                  list(sup[0].keys()), sup)
        print(f"  ✅ 18_SM_Contacts_Buyers.csv — {len(sup)} contacts")

    # 2g. Funnel
    funnel = data.get('funnel', {})
    if funnel:
        rows = [{'stage': k, 'count': v} for k, v in funnel.items()]
        write_csv('19_SM_Funnel.csv',
                  ['stage', 'count'], rows)
        print(f"  ✅ 19_SM_Funnel.csv — {len(rows)} stages")

    # 2h. Filters
    flt = data.get('filters', {})
    for key, vals in flt.items():
        rows = [{'value': v} for v in vals]
        write_csv(f'20_SM_Filter_{key}.csv', ['value'], rows)
    print(f"  ✅ 20_SM_Filter_*.csv — {len(flt)} filter lists")


# ─────────────────────────────────────────────────────────────
# 3. M&D — Materials & Disciplines
# ─────────────────────────────────────────────────────────────
def export_md():
    data = load('md_data.json')

    # 3a. M&D Quotations
    quot = data.get('quotations', [])
    if quot:
        fields = list(quot[0].keys())
        write_csv('21_MD_Quotations.csv', fields, quot)
        print(f"  ✅ 21_MD_Quotations.csv — {len(quot)} quotations")

    # 3b. M&D Purchase Orders
    pos = data.get('pos', [])
    if pos:
        fields = list(pos[0].keys())
        write_csv('22_MD_Purchase_Orders.csv', fields, pos)
        print(f"  ✅ 22_MD_Purchase_Orders.csv — {len(pos)} POs")

    # 3c. M&D Summary
    s = data.get('summary', {})
    if s:
        write_csv('23_MD_Summary.csv',
                  list(s.keys()), [s])
        print(f"  ✅ 23_MD_Summary.csv — summary KPIs")

    # 3d. Discipline Breakdown
    disc = data.get('disciplines', [])
    if disc:
        write_csv('24_MD_Discipline_Breakdown.csv',
                  list(disc[0].keys()), disc)
        print(f"  ✅ 24_MD_Discipline_Breakdown.csv — {len(disc)} disciplines")

    # 3e. Entity Breakdown
    ent = data.get('entityBreakdown', [])
    if ent:
        write_csv('25_MD_Entity_Breakdown.csv',
                  list(ent[0].keys()), ent)
        print(f"  ✅ 25_MD_Entity_Breakdown.csv — {len(ent)} entities")

    # 3f. Trend
    trend = data.get('trend', [])
    if trend:
        write_csv('26_MD_Trend.csv',
                  list(trend[0].keys()), trend)
        print(f"  ✅ 26_MD_Trend.csv — {len(trend)} periods")

    # 3g. Filters
    flt = data.get('filters', {})
    for key, vals in flt.items():
        rows = [{'value': v} for v in vals]
        write_csv(f'27_MD_Filter_{key}.csv', ['value'], rows)
    print(f"  ✅ 27_MD_Filter_*.csv — {len(flt)} filter lists")


# ─────────────────────────────────────────────────────────────
# 4. Change Orders
# ─────────────────────────────────────────────────────────────
def export_change_orders():
    data = load('change_orders.json')

    # 4a. CO Summary
    summary = {
        'totalGroups': data.get('totalGroups', 0),
        'totalChangeOrderPOs': data.get('totalChangeOrderPOs', 0),
        'totalChangeOrderValue': data.get('totalChangeOrderValue', 0),
    }
    write_csv('28_CO_Summary.csv', list(summary.keys()), [summary])
    print(f"  ✅ 28_CO_Summary.csv — CO summary")

    # 4b. CO Details — flatten poNumbers
    details = data.get('details', [])
    flat = []
    for r in details:
        row = dict(r)
        row['poNumbers'] = '; '.join(r.get('poNumbers', []))
        row['poCount_in_group'] = len(r.get('poNumbers', []))
        flat.append(row)
    if flat:
        write_csv('29_CO_Group_Details.csv',
                  list(flat[0].keys()), flat)
        print(f"  ✅ 29_CO_Group_Details.csv — {len(flat)} CO groups")

    # 4c. CO Expanded — one row per PO in each group
    expanded = []
    for r in details:
        for po_num in r.get('poNumbers', []):
            expanded.append({
                'orderId': r['orderId'],
                'mainOrderId': r.get('mainOrderId', ''),
                'poNumber': po_num,
                'groupTotalValueUSD': r['totalValueUSD'],
                'groupPOCount': r['poCount'],
            })
    if expanded:
        write_csv('30_CO_Expanded_POs.csv',
                  list(expanded[0].keys()), expanded)
        print(f"  ✅ 30_CO_Expanded_POs.csv — {len(expanded)} individual CO POs")


# ─────────────────────────────────────────────────────────────
# 5. Conversion Times
# ─────────────────────────────────────────────────────────────
def export_conversion_times():
    data = load('conversion_times.json')

    # 5a. Conversion Summary
    summary = {
        'totalLinked': data.get('totalLinked', 0),
        'avgDays': data.get('avgDays', 0),
    }
    write_csv('31_Conversion_Summary.csv', list(summary.keys()), [summary])
    print(f"  ✅ 31_Conversion_Summary.csv — conversion summary")

    # 5b. Individual records
    records = data.get('records', [])
    if records:
        write_csv('32_Conversion_Records.csv',
                  list(records[0].keys()), records)
        print(f"  ✅ 32_Conversion_Records.csv — {len(records)} RFQ→PO links")

    # 5c. Monthly averages
    monthly = data.get('monthlyAverage', [])
    if monthly:
        write_csv('33_Conversion_Monthly_Average.csv',
                  list(monthly[0].keys()), monthly)
        print(f"  ✅ 33_Conversion_Monthly_Average.csv — {len(monthly)} months")


# ─────────────────────────────────────────────────────────────
# 6. Suppliers (Master List)
# ─────────────────────────────────────────────────────────────
def export_suppliers():
    data = load('suppliers.json')

    # 6a. Supplier Metadata
    meta = data.get('metadata', {})
    if meta:
        # Flatten nested improvements
        flat_meta = {}
        for k, v in meta.items():
            if isinstance(v, dict):
                for sk, sv in v.items():
                    flat_meta[f'{k}_{sk}'] = sv
            else:
                flat_meta[k] = v
        write_csv('34_Supplier_Metadata.csv',
                  list(flat_meta.keys()), [flat_meta])
        print(f"  ✅ 34_Supplier_Metadata.csv — metadata")

    # 6b. Supplier Master List — fully flattened
    suppliers = data.get('suppliers', [])
    flat_rows = []
    for s in suppliers:
        row = {}
        row['id'] = s.get('id', '')
        row['legacy_no'] = s.get('legacy_no', '')
        row['name'] = s.get('name', '')
        row['material_category'] = s.get('material_category', '')
        row['status'] = s.get('status', '')
        row['supplier_score'] = s.get('supplier_score', '')

        # Contact
        c = s.get('contact', {})
        row['contact_primary'] = c.get('primary_contact', '')
        row['contact_first_name'] = c.get('first_name', '')
        row['contact_last_name'] = c.get('last_name', '')
        row['contact_title'] = c.get('title', '') or ''
        row['contact_email'] = c.get('email', '')
        row['contact_phone'] = c.get('phone', '')
        row['contact_fax'] = c.get('fax', '') or ''

        # Address
        a = s.get('address', {})
        row['address_full'] = a.get('full_address', '') or ''
        row['address_street'] = a.get('street', '') or ''
        row['address_city'] = a.get('city', '') or ''
        row['address_country'] = a.get('country', '') or ''
        row['address_country_iso3'] = a.get('country_iso3', '') or ''
        row['address_country_iso2'] = a.get('country_iso2', '') or ''
        row['address_country_standardized'] = a.get('country_standardized', '') or ''

        # Location
        loc = s.get('location', {})
        row['location_lat'] = loc.get('latitude', '') if loc.get('latitude') is not None else ''
        row['location_lng'] = loc.get('longitude', '') if loc.get('longitude') is not None else ''
        row['location_formatted'] = loc.get('formatted_address', '') or ''
        row['location_quality'] = loc.get('quality', '')
        row['location_quality_score'] = loc.get('quality_score', '')

        # Phone Validation
        pv = s.get('phone_validation', {})
        row['phone_country'] = pv.get('phone_country', '') or ''
        row['phone_country_code'] = pv.get('phone_country_code', '') or ''
        row['phone_is_valid'] = pv.get('is_valid', '')
        row['phone_matches_address'] = pv.get('matches_address', '')

        # Identifiers
        ids = s.get('identifiers', {})
        row['trn_number'] = ids.get('trn_number', '') or ''
        row['tax_id'] = ids.get('tax_id', '') or ''

        # Rating
        rat = s.get('rating', {})
        row['rating_score'] = rat.get('score', '')
        row['rating_scale'] = rat.get('scale', '')
        row['rating_last_updated'] = rat.get('last_updated', '') or ''

        # Metadata
        m = s.get('metadata', {})
        row['created_date'] = m.get('created_date', '') or ''
        row['last_updated'] = m.get('last_updated', '') or ''
        row['data_quality_score'] = m.get('data_quality_score', '')
        row['missing_fields'] = '; '.join(m.get('missing_fields', []))

        flat_rows.append(row)

    if flat_rows:
        write_csv('35_Supplier_Master_List.csv',
                  list(flat_rows[0].keys()), flat_rows)
        print(f"  ✅ 35_Supplier_Master_List.csv — {len(flat_rows)} suppliers")


# ─────────────────────────────────────────────────────────────
# 7. Client → Country Map
# ─────────────────────────────────────────────────────────────
def export_client_country():
    data = load('client_country_map.json')
    rows = [{'client': k, 'country': v} for k, v in data.items()]
    write_csv('36_Client_Country_Map.csv',
              ['client', 'country'], rows)
    print(f"  ✅ 36_Client_Country_Map.csv — {len(rows)} client→country mappings")


# ─────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────
def write_csv(filename, fields, rows):
    path = os.path.join(OUT_DIR, filename)
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


# ─────────────────────────────────────────────────────────────
# README generator
# ─────────────────────────────────────────────────────────────
def generate_readme():
    readme = f"""# MVL Dashboard — CSV Data Exports
> Auto-generated {datetime.now().strftime('%Y-%m-%d %H:%M')}

This folder contains CSV exports of **every JSON data file** used by the MVL Supply Chain Intel Hub v8 dashboard.
Each CSV is a flattened, analyst-friendly view of the underlying data with all nested objects expanded.

---

## Source → Dashboard Tab Mapping

| Source JSON | Dashboard Tab | Description |
|-------------|--------------|-------------|
| `gsa_data.json` | **Global Spend Analysis** (Orange tab) | All Purchase Orders with spend, entities, materials, change orders |
| `sm_data.json` | **Supplier Marketplace** (Blue tab) | RFQ Quotations with status, clients, contacts |
| `md_data.json` | **Materials & Disciplines** (Dark Blue tab) | Combined RFQs + POs by material/discipline |
| `change_orders.json` | GSA → Change Orders section | Change order groups and PO linkages |
| `conversion_times.json` | SM → Conversion analysis | RFQ-to-PO conversion days |
| `suppliers.json` | All tabs → Supplier profiles | Master supplier list (2,189 suppliers) |
| `client_country_map.json` | SM → Map / Geo analysis | Client name → Country mapping (1,098 entries) |

---

## CSV File Index

### 📊 GSA — Global Spend Analysis (Tab 2)

| # | File | Records | Description |
|---|------|---------|-------------|
| 01 | `01_GSA_PO_Workbench.csv` | ~3,746 | **Main PO list** — every purchase order with values, entities, materials, CO status |
| 02 | `02_GSA_Summary.csv` | 1 | Aggregate KPIs: total spend, PO count, supplier count, CO stats |
| 03 | `03_GSA_Supplier_Rankings_Top.csv` | ~10 | Top suppliers by USD spend with PO breakdown |
| 04 | `04_GSA_Supplier_Rankings_Bottom.csv` | ~10 | Lowest-spend suppliers |
| 05 | `05_GSA_Entity_Breakdown.csv` | ~18 | Spend per MVL entity (MACRO, VENTURES, etc.) |
| 06 | `06_GSA_Material_Breakdown.csv` | ~12 | Spend per material category |
| 07 | `07_GSA_Annual_Trend.csv` | ~14 | Year-by-year spend trend (base vs change order) |
| 08 | `08_GSA_Monthly_Trend.csv` | ~100+ | Month-by-month PO count and value |
| 09 | `09_GSA_PO_Type_Breakdown.csv` | 2 | Base PO vs Change Order summary |
| 10 | `10_GSA_Change_Order_Details.csv` | ~192 | CO groups: order ID, PO count, total value, linked POs |
| 11 | `11_GSA_Change_Order_Monthly.csv` | ~50+ | Monthly change order trend |
| 12 | `12_GSA_Filter_*.csv` | varies | Pre-computed filter option lists (entities, suppliers, materials, etc.) |

### 🔵 SM — Supplier Marketplace (Tab 1)

| # | File | Records | Description |
|---|------|---------|-------------|
| 13 | `13_SM_Quotation_Workbench.csv` | ~3,921 | **Main quotation list** — every RFQ with status, client, value |
| 14 | `14_SM_Summary.csv` | 1 | Aggregate KPIs: total quotations, POs, win rate, revision counts |
| 15 | `15_SM_Status_Summary.csv` | ~5 | Quotation status distribution (Order, Quotation, etc.) |
| 16 | `16_SM_Entity_Breakdown.csv` | ~27 | Quotation count and value per entity |
| 17 | `17_SM_Materials_By_Discipline.csv` | ~12 | Quotation count and value per material code |
| 18 | `18_SM_Contacts_Buyers.csv` | varies | MVL contact/buyer performance (PO count, spend) |
| 19 | `19_SM_Funnel.csv` | ~1 | Sales funnel: quotations still in "Quotation" status |
| 20 | `20_SM_Filter_*.csv` | varies | Pre-computed filter option lists |

### 🔷 M&D — Materials & Disciplines (Tab 3)

| # | File | Records | Description |
|---|------|---------|-------------|
| 21 | `21_MD_Quotations.csv` | ~3,921 | RFQ records for M&D view (value in USD) |
| 22 | `22_MD_Purchase_Orders.csv` | ~3,746 | PO records for M&D view (value in USD) |
| 23 | `23_MD_Summary.csv` | 1 | Aggregates: material/discipline counts, total quoted vs ordered |
| 24 | `24_MD_Discipline_Breakdown.csv` | ~12 | Per-discipline quoted/ordered values and counts |
| 25 | `25_MD_Entity_Breakdown.csv` | ~27 | Per-entity quoted/ordered values |
| 26 | `26_MD_Trend.csv` | ~100+ | Time-series trend data |
| 27 | `27_MD_Filter_*.csv` | varies | Pre-computed filter option lists |

### 🔄 Change Orders

| # | File | Records | Description |
|---|------|---------|-------------|
| 28 | `28_CO_Summary.csv` | 1 | Total CO groups, PO count, value |
| 29 | `29_CO_Group_Details.csv` | ~192 | Each CO group with linked PO numbers (semicolon-separated) |
| 30 | `30_CO_Expanded_POs.csv` | ~450+ | **Expanded**: one row per PO in each CO group for easy filtering |

### ⏱️ Conversion Times

| # | File | Records | Description |
|---|------|---------|-------------|
| 31 | `31_Conversion_Summary.csv` | 1 | Total linked RFQ→PO pairs, average conversion days |
| 32 | `32_Conversion_Records.csv` | ~180 | Individual RFQ→PO links with conversion days |
| 33 | `33_Conversion_Monthly_Average.csv` | ~50+ | Monthly average conversion days |

### 👥 Suppliers (Master List)

| # | File | Records | Description |
|---|------|---------|-------------|
| 34 | `34_Supplier_Metadata.csv` | 1 | Source file info, extraction date, improvement stats |
| 35 | `35_Supplier_Master_List.csv` | ~2,189 | **Fully flattened** supplier data: contact, address, location, phone validation, rating, quality score |

### 🌍 Client → Country Mapping

| # | File | Records | Description |
|---|------|---------|-------------|
| 36 | `36_Client_Country_Map.csv` | ~1,098 | Client abbreviation → Country name |

---

## Key Field Definitions & Calculations

### Currency Conversion
All `valueUSD` / `poSpendUSD` / `quotedValue` (in M&D) fields are converted to USD using these FX rates:
| Currency | Rate (1 USD = X) |
|----------|-----------------|
| USD | 1.0 |
| AED | 3.6725 |
| SAR | 3.75 |
| QAR | 3.64 |
| KWD | 0.307 |
| OMR | 0.385 |
| BHD | 0.376 |
| EUR | 0.92 |
| EURO | 0.92 |
| GBP | 0.79 |
| INR | 83.0 |
| PKR | 278 |
| EGP | 30.9 |
| JOD | 0.709 |
| LKR | 320 |
| NPR | 133.5 |
| JPY | 149.5 |
| ZAR | 18.5 |
| SGD | 1.34 |

**Formula:** `valueUSD = originalValue / FX_RATE`

### Change Order Classification (3-Tier Logic)
PO numbers follow pattern: `PREFIX-NUMBER_ENTITY-REVISION`

| Tier | Rule | poType | isChangeOrder |
|------|------|--------|---------------|
| **Standard CO** | PO/RFPO prefix, revision 2–6 | `"Change Order"` | `true` |
| **Independent** | PO/RFPO prefix, revision ≥ 7 | `"Base PO"` | `false` |
| **Standalone** | Any other prefix (RFQ, RFCE, etc.) | `"Base PO"` | `false` |

- `poVersion`: The revision number parsed from the PO number suffix
- `changeOrderGroup`: How many POs share the same base group key
- `changeOrderTotal`: Total POs in the group (base + change orders)
- `orderId`: Base group key (PO number without revision suffix)

### Entity Code → Entity Name Mapping
`entityCode` (e.g., "E6831") is parsed from PO number and mapped to entity name (e.g., "MACRO") via a 29-entry mapping table in the pipeline.

### Supplier Count
- `supplierCount`: Total from `suppliers.json` master list (2,189) — represents all known suppliers
- `activeSupplierCount`: Unique suppliers appearing in actual PO data (1,133) — suppliers with at least one PO

### SM Win Rate
`winRate = (totalPOs / totalQuotations) × 100`

### Conversion Days
`daysToConvert = poDate - quotationDate` (in calendar days, matched by orderId)

### Material vs Material Code
- `material`: Specific material name (e.g., "Bare Copper Grounding Cable") — 30+ unique names
- `materialCode`: Broader category (e.g., "Electrical") — 12 categories

---

## How to Regenerate
```bash
cd v8/csv-exports
python export_all_csv.py
```

Or with specific Python path:
```bash
& "C:\\Users\\Sajesh V S\\AppData\\Local\\Programs\\Python\\Python312\\python.exe" export_all_csv.py
```
"""
    with open(os.path.join(OUT_DIR, 'README.md'), 'w', encoding='utf-8') as f:
        f.write(readme)
    print(f"  ✅ README.md — field documentation")


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("MVL Dashboard — JSON → CSV Export")
    print("=" * 60)

    print("\n📊 GSA — Global Spend Analysis")
    export_gsa()

    print("\n🔵 SM — Supplier Marketplace")
    export_sm()

    print("\n🔷 M&D — Materials & Disciplines")
    export_md()

    print("\n🔄 Change Orders")
    export_change_orders()

    print("\n⏱️  Conversion Times")
    export_conversion_times()

    print("\n👥 Suppliers (Master List)")
    export_suppliers()

    print("\n🌍 Client → Country Map")
    export_client_country()

    print("\n📄 README")
    generate_readme()

    # Count outputs
    csv_files = [f for f in os.listdir(OUT_DIR) if f.endswith('.csv')]
    print(f"\n{'=' * 60}")
    print(f"✅ Done! {len(csv_files)} CSV files + README.md")
    print(f"   Output: {os.path.abspath(OUT_DIR)}")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    main()
