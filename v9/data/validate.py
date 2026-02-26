"""Quick validation of V7 data cross-tab consistency."""
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))

sm = json.load(open(os.path.join(BASE, 'sm_data.json'), 'r', encoding='utf-8'))
gsa = json.load(open(os.path.join(BASE, 'gsa_data.json'), 'r', encoding='utf-8'))
md = json.load(open(os.path.join(BASE, 'md_data.json'), 'r', encoding='utf-8'))

print('========== CROSS-TAB VALIDATION ==========')
print()

s = sm['summary']
print('--- SM Tab KPIs ---')
print(f"  Quotations: {s['totalQuotations']}")
print(f"  Orders (won): {s['totalPOs']}")
print(f"  Win Rate: {s['winRate']}%")
print(f"  Quote Value: ${s['totalQuotationValueUSD']:,.2f}")
print(f"  Order Value: ${s['totalPOSpendUSD']:,.2f}")
print(f"  Entities: {len(sm.get('entities', []))}")
print(f"  Materials: {len(sm.get('materialsByDiscipline', []))}")

g = gsa['summary']
print()
print('--- GSA Tab KPIs ---')
print(f"  Total POs: {g['totalPOs']}")
print(f"  Total Spend: ${g['totalSpendUSD']:,.2f}")
print(f"  Base POs: {g['basePOs']}")
print(f"  Change Orders: {g['changeOrders']}")
print(f"  CO Value: ${g['changeOrderValue']:,.2f}")
print(f"  Suppliers: {g['supplierCount']}")
print(f"  Entities: {g['entityCount']}")

m = md['summary']
print()
print('--- M&D Tab KPIs ---')
print(f"  Disciplines: {m['disciplineCount']}")
print(f"  Total Quoted: ${m['totalQuoted']:,.2f}")
print(f"  Total Ordered: ${m['totalOrdered']:,.2f}")
print(f"  Suppliers (PO): {m['supplierCount']}")
print(f"  Projects (PO): {m['projectCount']}")
print(f"  Entities: {m['entityCount']}")
print(f"  Conversion Rate: {m['conversionRate']}%")

print()
print('--- Cross-tab consistency ---')
print(f"  GSA PO records: {len(gsa['workbench'])}")
print(f"  M&D PO records: {len(md['pos'])}")
print(f"  SM quotation records: {len(sm['workbench'])}")
print(f"  M&D quotation records: {len(md['quotations'])}")
print(f"  GSA entities = M&D filter entities: {g['entityCount']} vs {len(md['filters']['entities'])}")
print(f"  GSA suppliers = M&D suppliers: {g['supplierCount']} vs {m['supplierCount']}")
print(f"  GSA spend = M&D ordered: ${g['totalSpendUSD']:,.2f} vs ${m['totalOrdered']:,.2f}")

# Check filter dropdown sanity
print()
print('--- Filter dropdowns ---')
print(f"  GSA filter entities: {len(gsa['filters']['entities'])}")
print(f"  GSA filter suppliers: {len(gsa['filters']['suppliers'])}")
print(f"  M&D filter entities: {len(md['filters']['entities'])}")
print(f"  M&D filter suppliers: {len(md['filters']['suppliers'])}")
print(f"  M&D filter projects: {len(md['filters']['projects'])}")
print(f"  M&D filter disciplines: {md['filters']['disciplines']}")

# Check M&D PO field names match scripts.js
po = md['pos'][0]
print()
print('--- M&D PO field names ---')
print(f"  Fields: {list(po.keys())}")
print(f"  poNumber: {po.get('poNumber', 'MISSING')}")
print(f"  poDate: {po.get('poDate', 'MISSING')}")
print(f"  value: {po.get('value', 'MISSING')}")
print(f"  discipline: {po.get('discipline', 'MISSING')}")
print(f"  material: {po.get('material', 'MISSING')}")

# Verify all passes
passes = 0
fails = 0

def check(name, actual, expected):
    global passes, fails
    if actual == expected:
        passes += 1
        print(f"  PASS: {name} = {actual}")
    else:
        fails += 1
        print(f"  FAIL: {name} = {actual}, expected {expected}")

print()
print('--- Automated checks ---')
check("GSA POs = M&D POs", len(gsa['workbench']), len(md['pos']))
check("SM quotations = M&D quotations", len(sm['workbench']), len(md['quotations']))
check("GSA suppliers = M&D suppliers", g['supplierCount'], m['supplierCount'])
check("M&D disciplines = 7", m['disciplineCount'], 7)
check("M&D projects = 98", m['projectCount'], 98)
check("GSA entities = M&D filter entities", g['entityCount'], len(md['filters']['entities']))

print(f"\n  Results: {passes} passed, {fails} failed")
