"""Deep change order analysis + letter suffix investigation."""
import xlrd
import os
import re
from collections import Counter, defaultdict

base = r'G:\Rita\mvl-powerbi-dashboards\v8\Re_ Main order XLS and Export feature ready for use'

# ============================================================
# LOAD PO DATA
# ============================================================
wb = xlrd.open_workbook(os.path.join(base, 'PO_List_Feb-20-2026.xls'), ignore_workbook_corruption=True)
sh = wb.sheet_by_index(0)
po_headers = [sh.cell_value(0, c) for c in range(sh.ncols)]
po_data = []
for r in range(1, sh.nrows):
    row = {po_headers[c]: sh.cell_value(r, c) for c in range(sh.ncols)}
    po_data.append(row)

# ============================================================
# LOAD QUOTATION DATA (RFQ only)
# ============================================================
q_files = sorted([f for f in os.listdir(base) if f.startswith('Quotation')])
all_quotes = []
q_headers = None
for qf in q_files:
    fp = os.path.join(base, qf)
    wb2 = xlrd.open_workbook(fp, ignore_workbook_corruption=True)
    sh2 = wb2.sheet_by_index(0)
    if q_headers is None:
        q_headers = [sh2.cell_value(1, c) for c in range(sh2.ncols)]
    for r in range(2, sh2.nrows):
        no_val = sh2.cell_value(r, 0)
        if isinstance(no_val, float) and no_val > 0:
            row = {q_headers[c]: sh2.cell_value(r, c) for c in range(sh2.ncols)}
            all_quotes.append(row)

rfq_only = [q for q in all_quotes if q.get('Type') == 'RFQ']
print(f"Total quotations: {len(all_quotes)}")
print(f"RFQ only: {len(rfq_only)}")
print(f"IQ: {len([q for q in all_quotes if q.get('Type') == 'IQ'])}")

# ============================================================
# PART 1: LETTER SUFFIXES IN QUOTATION NUMBERS
# ============================================================
print("\n" + "=" * 70)
print("PART 1: LETTER SUFFIXES IN QUOTATION NUMBERS")
print("=" * 70)

# Check for trailing letters (A, B, C, D) in quotation numbers
letter_suffix_quotes = []
no_letter_quotes = []
for q in all_quotes:
    num = q.get('Number', '')
    # Check if the code part ends with a letter
    match = re.match(r'^(Q|RFQ)-(\d+)-(.+)$', num)
    if match:
        code = match.group(3)
        trailing = re.search(r'([A-Za-z]+)$', code)
        if trailing:
            letter_suffix_quotes.append({
                'number': num,
                'code': code,
                'letter': trailing.group(1),
                'type': q.get('Type', ''),
                'status': q.get('Status', ''),
                'order_id': int(q['Order ID']) if q.get('Order ID') else 0,
                'main_order_id': int(q['Main Order ID']) if q.get('Main Order ID') else 0,
                'value': q.get('Quo. Value', 0),
                'cur': q.get('Cur.', ''),
                'date': q.get('Date', '')
            })
        else:
            no_letter_quotes.append(num)

print(f"\nQuotation numbers WITH trailing letter: {len(letter_suffix_quotes)}")
print(f"Quotation numbers WITHOUT trailing letter: {len(no_letter_quotes)}")

# Letter distribution
letter_counts = Counter(q['letter'] for q in letter_suffix_quotes)
print(f"\nLetter suffix distribution:")
for l, c in sorted(letter_counts.items()):
    print(f"  Suffix '{l}': {c} quotations")

# Show examples of letter suffixes
print(f"\nExamples of quotations WITH letter suffixes:")
# Group by base number (without letter) to see if they're revisions
base_groups = defaultdict(list)
for q in letter_suffix_quotes:
    # Remove trailing letters to get base
    base_num = re.sub(r'[A-Za-z]+$', '', q['number'])
    base_groups[base_num].append(q)

# Also check if the base (without letter) exists  
all_q_numbers = set(q.get('Number', '') for q in all_quotes)

revision_count = 0
for base_num, variants in sorted(base_groups.items())[:20]:
    has_base = base_num in all_q_numbers
    variants_sorted = sorted(variants, key=lambda x: x['letter'])
    letters = [v['letter'] for v in variants_sorted]
    print(f"\n  Base: {base_num}")
    print(f"    Original (no letter) exists: {'YES' if has_base else 'NO'}")
    for v in variants_sorted:
        print(f"    {v['number']}  OrderID={v['order_id']}  Status={v['status']}  {v['cur']} {v['value']}  Date={v['date']}")
    if has_base:
        revision_count += 1
        # Find the original
        for q in all_quotes:
            if q.get('Number') == base_num:
                oid = int(q['Order ID']) if q.get('Order ID') else 0
                print(f"    {base_num} (original)  OrderID={oid}  Status={q['Status']}  {q['Cur.']} {q.get('Quo. Value',0)}  Date={q.get('Date','')}")
                break

print(f"\n\nSummary: {revision_count} out of {len(base_groups)} letter-suffixed groups have an original (no-letter) version")

# Check if letter suffixed quotes share Order ID with original
print("\n--- Do letter-suffixed quotations share Order ID with original? ---")
shared_oid = 0
diff_oid = 0
for base_num, variants in base_groups.items():
    if base_num in all_q_numbers:
        for q in all_quotes:
            if q.get('Number') == base_num:
                orig_oid = int(q['Order ID']) if q.get('Order ID') else 0
                for v in variants:
                    if v['order_id'] == orig_oid:
                        shared_oid += 1
                    else:
                        diff_oid += 1
                break
print(f"  Same Order ID as original: {shared_oid}")
print(f"  Different Order ID: {diff_oid}")

# ============================================================
# PART 2: PO CHANGE ORDERS BY ORDER ID
# ============================================================
print("\n" + "=" * 70)
print("PART 2: PO CHANGE ORDERS — GROUPED BY ORDER ID")
print("=" * 70)

# Group POs by Order ID
po_by_order_id = defaultdict(list)
for p in po_data:
    oid = p.get('Order ID')
    if oid:
        pn = p['PO number']
        parts = pn.split('-')
        suffix = parts[-1] if len(parts) >= 4 else '?'
        po_by_order_id[int(oid)].append({
            'po_number': pn,
            'suffix': suffix,
            'order_id': int(oid),
            'main_order_id': int(p['Main Order ID']) if p.get('Main Order ID') else 0,
            'total': p.get('Total', 0),
            'cur': p.get('Cur.', ''),
            'supplier': p.get('Supplier', ''),
            'date': p.get('Po Date', '')
        })

# Find Order IDs with multiple POs (change orders)
multi_po_orders = {k: sorted(v, key=lambda x: (int(x['suffix']) if x['suffix'].isdigit() else 999))
                   for k, v in po_by_order_id.items() if len(v) > 1}

print(f"\nOrder IDs with single PO: {len(po_by_order_id) - len(multi_po_orders)}")
print(f"Order IDs with MULTIPLE POs (change orders): {len(multi_po_orders)}")
print(f"Total PO lines in change order groups: {sum(len(v) for v in multi_po_orders.values())}")

# Distribution of change order counts
co_dist = Counter(len(v) for v in multi_po_orders.values())
print(f"\nChange order group size distribution:")
for size, cnt in sorted(co_dist.items()):
    print(f"  {size} POs per Order ID: {cnt} groups")

# Detailed examples
print(f"\n--- Detailed Change Order Examples (by Order ID) ---")
shown = 0
for oid, pos in sorted(multi_po_orders.items(), key=lambda x: -len(x[1])):
    if shown >= 15:
        break
    shown += 1
    print(f"\n  Order ID = {oid} ({len(pos)} POs)  Project={pos[0]['main_order_id']}")
    
    # Also find matching RFQ
    matching_rfqs = [q for q in rfq_only if q.get('Order ID') and int(q['Order ID']) == oid]
    
    for p in pos:
        print(f"    [{p['suffix']}] {p['po_number']}  {p['cur']} {p['total']:,.2f}  {p['date']}  Supplier={p['supplier'][:35]}")
    
    if matching_rfqs:
        for q in matching_rfqs:
            print(f"    → RFQ: {q['Number']}  Status={q['Status']}  {q['Cur.']} {q.get('Quo. Value',0):,.2f}")
    else:
        # Check IQ too
        matching_iqs = [q for q in all_quotes if q.get('Type') == 'IQ' and q.get('Order ID') and int(q['Order ID']) == oid]
        if matching_iqs:
            print(f"    → (linked to IQ, not RFQ)")

# ============================================================
# PART 3: CHECK FOR LETTER SUFFIXES IN PO NUMBERS
# ============================================================
print("\n" + "=" * 70)
print("PART 3: LETTER SUFFIXES IN PO NUMBERS")
print("=" * 70)

po_letter_suffixes = []
po_numeric_suffixes = []
for p in po_data:
    pn = p['PO number']
    parts = pn.split('-')
    if len(parts) >= 4:
        suffix = parts[-1]
        if suffix.isdigit():
            po_numeric_suffixes.append(suffix)
        else:
            po_letter_suffixes.append({'po_number': pn, 'suffix': suffix, 
                                       'order_id': int(p['Order ID']) if p.get('Order ID') else 0})

print(f"\nPO numbers with numeric suffix: {len(po_numeric_suffixes)}")
print(f"PO numbers with NON-numeric suffix: {len(po_letter_suffixes)}")

if po_letter_suffixes:
    print(f"\nPOs with letter/mixed suffixes:")
    for p in po_letter_suffixes[:20]:
        print(f"  {p['po_number']}  suffix='{p['suffix']}'  OrderID={p['order_id']}")

# Also check the CODE part (3rd segment) for letters
print("\n--- PO Code segment (3rd part) analysis ---")
code_prefixes = Counter()
for p in po_data:
    pn = p['PO number']
    parts = pn.split('-')
    if len(parts) >= 4:
        code = parts[2]
        # Extract letter prefix
        letter_prefix = re.match(r'^([A-Za-z]+)', code)
        if letter_prefix:
            code_prefixes[letter_prefix.group(1)] += 1

print("PO code letter prefixes (3rd segment):")
for prefix, cnt in sorted(code_prefixes.items(), key=lambda x: -x[1]):
    print(f"  {prefix}: {cnt} POs")

# ============================================================
# PART 4: RFQ-ONLY CROSS-REFERENCE WITH PO
# ============================================================
print("\n" + "=" * 70)
print("PART 4: RFQ-ONLY CROSS-REFERENCE WITH PO VIA ORDER ID")
print("=" * 70)

rfq_order_ids = set()
for q in rfq_only:
    oid = q.get('Order ID')
    if oid:
        rfq_order_ids.add(int(oid))

po_oids = set()
for p in po_data:
    oid = p.get('Order ID')
    if oid:
        po_oids.add(int(oid))

shared = rfq_order_ids & po_oids
print(f"\nRFQ Order IDs: {len(rfq_order_ids)}")
print(f"PO Order IDs: {len(po_oids)}")
print(f"Shared (RFQ has matching PO): {len(shared)}")
print(f"RFQ-only (no PO): {len(rfq_order_ids - po_oids)}")
print(f"PO-only (no RFQ): {len(po_oids - rfq_order_ids)}")

# RFQ status for those with matching POs
rfq_with_po_status = Counter()
rfq_without_po_status = Counter()
for q in rfq_only:
    oid = q.get('Order ID')
    if oid and int(oid) in shared:
        rfq_with_po_status[q.get('Status', '')] += 1
    else:
        rfq_without_po_status[q.get('Status', '')] += 1

print(f"\nRFQ status when PO EXISTS:")
for s, c in sorted(rfq_with_po_status.items(), key=lambda x: -x[1]):
    print(f"  {s}: {c}")

print(f"\nRFQ status when NO PO:")
for s, c in sorted(rfq_without_po_status.items(), key=lambda x: -x[1]):
    print(f"  {s}: {c}")

# Show some linked RFQ→PO examples
print(f"\n--- RFQ → PO Linked Examples ---")
count = 0
for oid in sorted(shared):
    if count >= 10:
        break
    rfqs = [q for q in rfq_only if q.get('Order ID') and int(q['Order ID']) == oid]
    pos_list = [p for p in po_data if p.get('Order ID') and int(p['Order ID']) == oid]
    if rfqs and pos_list:
        count += 1
        print(f"\n  Order ID = {oid}:")
        for q in rfqs:
            print(f"    RFQ: {q['Number']}  {q['Cur.']} {q.get('Quo. Value',0):,.2f}  Status={q['Status']}  Contact={q.get('MVL Contact','')}")
        for p in pos_list:
            parts = p['PO number'].split('-')
            suffix = parts[-1] if len(parts) >= 4 else '?'
            print(f"    PO:  {p['PO number']} [v{suffix}]  {p['Cur.']} {p['Total']:,.2f}  Supplier={p['Supplier'][:30]}")
