"""Analyze the new data files with TAX fields."""
import xlrd, os, csv

FOLDER = os.path.join(os.path.dirname(__file__),
                      'Full data of Quotations and POs with TAX fields')

def analyze_file(path):
    fname = os.path.basename(path)
    wb = xlrd.open_workbook(path)
    sh = wb.sheet_by_index(0)
    print(f"\n{'='*70}")
    print(f"FILE: {fname}")
    print(f"  Rows: {sh.nrows}  |  Cols: {sh.ncols}")
    
    headers = []
    header_row = 0
    for r in range(min(5, sh.nrows)):
        vals = [str(sh.cell_value(r, c)).strip() for c in range(sh.ncols)]
        non_empty = [v for v in vals if v]
        if len(non_empty) >= 3:
            headers = vals
            header_row = r
            break
    
    print(f"  Header row: {header_row}")
    print(f"  Columns ({len([h for h in headers if h])}):")
    for i, h in enumerate(headers):
        if h:
            print(f"    [{i}] {h}")
    
    # Show 3 sample data rows
    print(f"  --- Sample rows ---")
    for r in range(header_row + 1, min(header_row + 4, sh.nrows)):
        vals = [sh.cell_value(r, c) for c in range(sh.ncols)]
        for i, (h, v) in enumerate(zip(headers, vals)):
            if h:
                print(f"    {h}: {repr(v)}")
        print(f"    ---")

    # Show last row too
    if sh.nrows > header_row + 4:
        print(f"  --- Last row (row {sh.nrows-1}) ---")
        vals = [sh.cell_value(sh.nrows-1, c) for c in range(sh.ncols)]
        for i, (h, v) in enumerate(zip(headers, vals)):
            if h:
                print(f"    {h}: {repr(v)}")
    
    return fname, headers, sh.nrows - header_row - 1

# Existing old PO CSV
print("EXISTING DATA:")
old_csv = os.path.join(os.path.dirname(__file__), 'Data-New', 'PO_List_Feb-25-2026.csv')
if os.path.exists(old_csv):
    with open(old_csv, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        old_po_headers = next(reader)
        row_count = sum(1 for _ in reader)
    print(f"  Old PO CSV: {len(old_po_headers)} cols, {row_count} rows")
    print(f"  Headers: {old_po_headers}")

# Check old quotation source
data_dir = os.path.join(os.path.dirname(__file__), 'data')
for f in sorted(os.listdir(data_dir)):
    if f.startswith('Quotation') and f.endswith(('.xls', '.xlsx')):
        print(f"  Old quotation: data/{f}")

# Old sm_data to check existing quotation count  
import json
sm = os.path.join(data_dir, 'sm_data.json')
if os.path.exists(sm):
    with open(sm, 'r') as f:
        d = json.load(f)
    print(f"  Current sm_data quotations: {len(d.get('workbench',[]))}")
    print(f"  Current sm_data summary: {d.get('summary',{})}")

print("\n" + "="*70)
print("NEW DATA FILES ANALYSIS")
print("="*70)

results = []
for f in sorted(os.listdir(FOLDER)):
    if f.endswith('.xls'):
        path = os.path.join(FOLDER, f)
        try:
            results.append(analyze_file(path))
        except Exception as e:
            print(f"\n⚠️  ERROR reading {f}: {e}")
            results.append((f, [], -1))

# Summary
print("\n" + "="*70)
print("SUMMARY")
print("="*70)
total_q_rows = 0
for fname, headers, rows in results:
    tag = "PO" if "PO" in fname else "Quotation"
    print(f"  [{tag}] {fname}: {rows} data rows, {len([h for h in headers if h])} columns")
    if 'Quotation' in fname:
        total_q_rows += rows
    
print(f"\n  Total Quotation rows across all files: {total_q_rows}")
po_rows = [r for f,h,r in results if 'PO' in f]
if po_rows:
    print(f"  PO rows: {po_rows[0]}")

# Identify NEW columns
old_po_cols = {'No', 'PO number', 'Po Date', 'PO Name', 'Supplier', 'Total', 'Cur.'}
for fname, headers, rows in results:
    if 'PO' in fname:
        active_headers = set(h for h in headers if h)
        new_cols = active_headers - old_po_cols
        print(f"\n  NEW PO columns vs old: {sorted(new_cols)}")
        break

# Check quotation columns too
for fname, headers, rows in results:
    if 'Quotation' in fname:
        active_headers = [h for h in headers if h]
        print(f"\n  Quotation columns: {active_headers}")
        break

# Check for TAX-related columns specifically
print(f"\n  TAX-related columns found:")
for fname, headers, rows in results:
    tax_cols = [h for h in headers if h and ('tax' in h.lower() or 'vat' in h.lower() or 'total' in h.lower() or 'amount' in h.lower() or 'net' in h.lower())]
    if tax_cols:
        tag = "PO" if "PO" in fname else "Q"
        print(f"    [{tag}] {fname}: {tax_cols}")
