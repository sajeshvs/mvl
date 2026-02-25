#!/usr/bin/env python3
"""
Rebuild md_data.json with proper project, entity, and supplier fields
Uses gsa_data.json as the source since it has complete PO information
"""

import json
from collections import defaultdict

# Load GSA data (complete PO source)
with open('gsa_data.json', 'r', encoding='utf-8') as f:
    gsa_data = json.load(f)

# Load SM data for quotations
with open('sm_data.json', 'r', encoding='utf-8') as f:
    sm_data = json.load(f)

# Extract all POs with discipline info
all_pos = gsa_data.get('workbench', [])
print(f"Total POs from GSA: {len(all_pos)}")

# Get all quotations from SM data
all_quotations = sm_data.get('workbench', [])
print(f"Total quotations from SM: {len(all_quotations)}")

# Build disciplines breakdown
discipline_data = defaultdict(lambda: {
    'name': '',
    'quotedValue': 0,
    'orderedValue': 0,
    'quotedCount': 0,
    'orderedCount': 0,
    'suppliers': set(),
    'projects': set()
})

# Process POs
for po in all_pos:
    material = po.get('material', 'General')
    if not material:
        material = 'General'
    
    discipline_data[material]['name'] = material
    discipline_data[material]['orderedValue'] += po.get('valueUSD', po.get('value', 0))
    discipline_data[material]['orderedCount'] += 1
    
    if po.get('supplier'):
        discipline_data[material]['suppliers'].add(po['supplier'])
    if po.get('project'):
        discipline_data[material]['projects'].add(po['project'])

# Process quotations
for q in all_quotations:
    material = q.get('Material', q.get('MaterialCode', 'General'))
    if not material:
        material = 'General'
    
    discipline_data[material]['name'] = material
    
    # Convert to USD if needed
    value = q.get('QuotationValue', 0)
    currency = q.get('Currency', 'USD')
    
    # Simple conversion (rates from appr)
    rates = {'AED': 3.67, 'SAR': 3.75, 'KWD': 0.31, 'QAR': 3.64, 'NPR': 133.5, 'INR': 84}
    if currency in rates:
        value = value / rates[currency]
    
    discipline_data[material]['quotedValue'] += value
    discipline_data[material]['quotedCount'] += 1
    
    if q.get('Client'):
        discipline_data[material]['suppliers'].add(q['Client'])
    if q.get('ProjectName'):
        discipline_data[material]['projects'].add(q['ProjectName'])

# Convert to list for JSON
disciplines = []
for name, data in discipline_data.items():
    disciplines.append({
        'name': name,
        'quotedValue': round(data['quotedValue'], 2),
        'orderedValue': round(data['orderedValue'], 2),
        'quotedCount': data['quotedCount'],
        'orderedCount': data['orderedCount'],
        'supplierCount': len(data['suppliers']),
        'projectCount': len(data['projects'])
    })

# Sort by ordered value
disciplines.sort(key=lambda x: x['orderedValue'], reverse=True)

# Build entity breakdown
entity_breakdown = defaultdict(lambda: {
    'name': '',
    'quotedValue': 0,
    'orderedValue': 0,
    'poCount': 0,
    'quoteCount': 0
})

for po in all_pos:
    entity = po.get('entity', 'Unknown')
    entity_breakdown[entity]['name'] = entity
    entity_breakdown[entity]['orderedValue'] += po.get('valueUSD', po.get('value', 0))
    entity_breakdown[entity]['poCount'] += 1

for q in all_quotations:
    entity = q.get('Entity', 'Unknown')
    value = q.get('QuotationValue', 0)
    currency = q.get('Currency', 'USD')
    rates = {'AED': 3.67, 'SAR': 3.75, 'KWD': 0.31, 'QAR': 3.64, 'NPR': 133.5, 'INR': 84}
    if currency in rates:
        value = value / rates[currency]
    
    entity_breakdown[entity]['name'] = entity
    entity_breakdown[entity]['quotedValue'] += value
    entity_breakdown[entity]['quoteCount'] += 1

entity_list = [
    {
        'name': data['name'],
        'quotedValue': round(data['quotedValue'], 2),
        'orderedValue': round(data['orderedValue'], 2),
        'poCount': data['poCount'],
        'quoteCount': data['quoteCount']
    }
    for data in entity_breakdown.values()
    if data['name'] and data['name'] != 'Unknown'
]
entity_list.sort(key=lambda x: x['orderedValue'], reverse=True)

# Build summary
total_quoted = sum(d['quotedValue'] for d in disciplines)
total_ordered = sum(d['orderedValue'] for d in disciplines)

all_suppliers = set()
all_projects = set()
for po in all_pos:
    if po.get('supplier'):
        all_suppliers.add(po['supplier'])
    if po.get('project'):
        all_projects.add(po['project'])

summary = {
    'disciplineCount': len(disciplines),
    'totalQuoted': round(total_quoted, 2),
    'totalOrdered': round(total_ordered, 2),
    'supplierCount': len(all_suppliers),
    'projectCount': len(all_projects),
    'entityCount': len(entity_list),
    'conversionRate': round((total_ordered / total_quoted * 100) if total_quoted > 0 else 0, 1)
}

# Build trend from gsa trend data
trend = gsa_data.get('trend', [])

# Build filters
filters = {
    'entities': sorted(list(set(po.get('entity', '') for po in all_pos if po.get('entity')))),
    'disciplines': sorted(list(set(d['name'] for d in disciplines if d['name']))),
    'projects': sorted(list(all_projects))[:100],  # Limit to 100 projects
    'suppliers': sorted(list(all_suppliers))[:200]  # Limit to 200 suppliers
}

# Build detailed POs with all fields
pos = []
for po in all_pos:
    pos.append({
        'poNumber': po.get('poNumber', ''),
        'poDate': po.get('poDate', ''),
        'poName': po.get('poName', ''),
        'supplier': po.get('supplier', ''),
        'entity': po.get('entity', ''),
        'project': po.get('project', ''),
        'material': po.get('material', 'General'),
        'discipline': po.get('material', 'General'),
        'value': po.get('valueUSD', po.get('value', 0)),
        'currency': 'USD',
        'year': po.get('year', 2024),
        'month': po.get('month', 1)
    })

# Build quotations with all fields
quotations = []
for q in all_quotations:
    value = q.get('QuotationValue', 0)
    currency = q.get('Currency', 'USD')
    rates = {'AED': 3.67, 'SAR': 3.75, 'KWD': 0.31, 'QAR': 3.64, 'NPR': 133.5, 'INR': 84}
    value_usd = value / rates[currency] if currency in rates else value
    
    quotations.append({
        'number': q.get('QuotationNumber', ''),
        'baseNumber': q.get('QuotationNumber', '').rsplit('-', 1)[0] if q.get('QuotationNumber') else '',
        'entity': q.get('Entity', ''),
        'project': q.get('ProjectName', ''),
        'material': q.get('Material', q.get('MaterialCode', '')),
        'discipline': q.get('Material', q.get('MaterialCode', '')),
        'supplier': q.get('Client', ''),
        'quotedValue': round(value_usd, 2),
        'currency': 'USD',
        'status': q.get('Status', ''),
        'type': q.get('QuotationType', 'RFQ'),
        'date': q.get('Date', '')
    })

# Assemble final data
md_data = {
    'summary': summary,
    'disciplines': disciplines,
    'entityBreakdown': entity_list,
    'trend': trend,
    'filters': filters,
    'quotations': quotations,
    'pos': pos
}

# Save
with open('md_data.json', 'w', encoding='utf-8') as f:
    json.dump(md_data, f, indent=2)

print(f"\n✅ md_data.json rebuilt successfully:")
print(f"   Disciplines: {len(disciplines)}")
print(f"   Entities: {len(entity_list)}")
print(f"   POs: {len(pos)}")
print(f"   Quotations: {len(quotations)}")
print(f"   Suppliers: {summary['supplierCount']}")
print(f"   Projects: {summary['projectCount']}")
print(f"   Total Ordered: ${summary['totalOrdered']:,.2f}")
print(f"   Total Quoted: ${summary['totalQuoted']:,.2f}")
