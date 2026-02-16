import json

# Load data
with open('c:/Users/Sajesh/Documents/Apps/Rita/PowerBI/v2/disciplines-consolidated/data.json') as f:
    data = json.load(f)

print("=" * 60)
print("DISCIPLINES CONSOLIDATED - DATA ANALYSIS")
print("=" * 60)

# Summary
summary = data.get('summary', {})
print("\n📊 SUMMARY:")
print(f"  Total Quoted:      ${summary.get('totalQuoted', 0):,.2f}")
print(f"  Total Ordered:     ${summary.get('totalOrdered', 0):,.2f}")
print(f"  Overall Util:      {summary.get('overallUtilization', 0):.1f}%")
print(f"  Disciplines:       {summary.get('disciplineCount', 0)}")
print(f"  Entities:          {summary.get('entityCount', 0)}")
print(f"  Quotations:        {summary.get('quotationCount', 0)}")
print(f"  POs:               {summary.get('poCount', 0)}")

# Disciplines
print("\n🔧 TOP 10 DISCIPLINES BY QUOTED VALUE:")
disciplines = sorted(data.get('disciplines', []), key=lambda x: x['quotedValue'], reverse=True)[:10]
for d in disciplines:
    print(f"  {d['name'][:30]:30} | Quoted: ${d['quotedValue']/1e6:8.2f}M | Ordered: ${d['orderedValue']/1e6:8.2f}M | Util: {d['utilization']:5.1f}%")

# Entities
print("\n🏢 TOP 10 ENTITIES BY ORDERED VALUE:")
entities = sorted(data.get('entityBreakdown', []), key=lambda x: x['orderedValue'], reverse=True)[:10]
for e in entities:
    print(f"  {e['name'][:30]:30} | Ordered: ${e['orderedValue']/1e6:8.2f}M | Util: {e['utilization']:5.1f}%")

# Trend
print("\n📈 TREND DATA:")
trend = data.get('trend', [])
print(f"  Years covered: {len(trend)}")
if trend:
    print(f"  Sample: {trend[0]}")

# Filters
print("\n🎛️ AVAILABLE FILTERS:")
filters = data.get('filters', {})
print(f"  Entities: {len(filters.get('entities', []))}")
print(f"  Disciplines: {len(filters.get('disciplines', []))}")

print("\n" + "=" * 60)
print("DATA ANALYSIS COMPLETE")
print("=" * 60)
