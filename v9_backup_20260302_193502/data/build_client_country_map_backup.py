"""
Build a client-to-country mapping based on Entity association and other available data.
"""
import json
from collections import defaultdict

# Entity to country mapping
ENTITY_COUNTRY_MAP = {
    'MVL Abu Dhabi': 'United Arab Emirates',
    'MVL UAE': 'United Arab Emirates',
    'MVL Kuwait': 'Kuwait',
    'MVL Qatar': 'Qatar',
    'MVL Nepal': 'Nepal',
    'MVL Greece': 'Greece',
    'MVL Italy': 'Italy',
    'MVL Lebanon': 'Lebanon',
    'MVL USA JV LLC': 'United States',
    'MVL USA, INC': 'United States',
    'MVL-Al Othman': 'Saudi Arabia',
    'Yamauchi Gumi': 'Japan',
    'MACRO': 'United Arab Emirates',
    'MICRON': 'United Arab Emirates',
    'FIRESTOP': 'United Arab Emirates',
    'DEFENSE': 'United Arab Emirates',
    'Gov Svcs': 'United Arab Emirates',
    'MV LLC': 'United Arab Emirates',
    'MPG JV': 'United Arab Emirates',
    'MW-OCS': 'United Arab Emirates'
}

# Country name normalization
COUNTRY_NORMALIZE = {
    'Dubai': 'United Arab Emirates',
    'Dubai, UAE': 'United Arab Emirates',
    'Abu Dhabi': 'United Arab Emirates',
    'Sharjah': 'United Arab Emirates',
    'Sharjah, Ajman, Umm Al-Qaiwain': 'United Arab Emirates',
    'Ajman': 'United Arab Emirates',
    'RAK': 'United Arab Emirates',
    'Ras Al Khaimah': 'United Arab Emirates',
    'USA': 'United States',
    'UK': 'United Kingdom',
    'KSA': 'Saudi Arabia',
    # US States
    'Illinois': 'United States',
    'California': 'United States',
    'Texas': 'United States',
    'New York': 'United States',
    'Florida': 'United States',
    'Ohio': 'United States',
    'Pennsylvania': 'United States',
    'Arizona': 'United States',
    'Georgia': 'United States',
    'Michigan': 'United States',
    'Virginia': 'United States',
    'Washington': 'United States',
    'Colorado': 'United States',
    'Massachusetts': 'United States',
    'New Jersey': 'United States',
    'North Carolina': 'United States',
    # Chinese regions
    'Zhuzhou/Changsha/Xiangtan, Hunan': 'China',
    'Hunan': 'China',
    'Guangdong': 'China',
    'Shanghai': 'China',
    'Beijing': 'China',
    'Shenzhen': 'China',
    'Hong Kong': 'Hong Kong',
    # Indian regions
    'Maharashtra': 'India',
    'Karnataka': 'India',
    'Tamil Nadu': 'India',
    'Delhi': 'India',
    'Mumbai': 'India',
    # Others
    'Guam': 'United States',
    'Tianjin': 'China',
    'Chongqing': 'China',
    'Jiangsu': 'China',
    'Shandong': 'China',
    'Zhejiang': 'China',
}

# Load data
with open('sm_data.json', 'r', encoding='utf-8') as f:
    sm_data = json.load(f)

with open('suppliers.json', 'r', encoding='utf-8') as f:
    suppliers_data = json.load(f)

# Build client-entity frequency map
client_entity_freq = defaultdict(lambda: defaultdict(int))
client_total_value = defaultdict(float)

for q in sm_data['workbench']:
    client = q.get('Client')
    entity = q.get('Entity')
    value = q.get('QuotationValue', 0) or 0
    
    if client and entity:
        client_entity_freq[client][entity] += 1
        client_total_value[client] += value

# Determine country for each client based on primary entity
client_country_map = {}
for client, entities in client_entity_freq.items():
    # Get the most frequent entity for this client
    primary_entity = max(entities, key=entities.get)
    country = ENTITY_COUNTRY_MAP.get(primary_entity, 'United Arab Emirates')
    client_country_map[client] = {
        'country': country,
        'primary_entity': primary_entity,
        'entity_count': entities[primary_entity],
        'total_value': client_total_value[client]
    }

# Try to enrich with phone country from suppliers if name matches partially
supplier_phone_countries = {}
for s in suppliers_data['suppliers']:
    phone_country = s.get('phone_validation', {}).get('phone_country')
    addr_country = s.get('address', {}).get('country_standardized')
    if phone_country or addr_country:
        supplier_phone_countries[s['name'].lower()] = phone_country or addr_country

# Check for partial matches
matched_from_supplier = 0
for client in client_country_map:
    client_lower = client.lower()
    for sup_name, sup_country in supplier_phone_countries.items():
        # Check if any significant words match
        client_words = set(client_lower.replace('.', '').split())
        sup_words = set(sup_name.replace('.', '').split())
        common = client_words & sup_words
        if len(common) >= 1 and len(list(common)[0]) > 3:
            # Normalize the country name
            normalized_country = COUNTRY_NORMALIZE.get(sup_country, sup_country)
            client_country_map[client]['country'] = normalized_country
            client_country_map[client]['source'] = 'supplier_match'
            matched_from_supplier += 1
            break

# Normalize all country names
for client, info in client_country_map.items():
    country = info['country']
    info['country'] = COUNTRY_NORMALIZE.get(country, country)

# Statistics
countries = defaultdict(int)
for info in client_country_map.values():
    countries[info['country']] += 1

print(f"Total clients mapped: {len(client_country_map)}")
print(f"Matched from supplier data: {matched_from_supplier}")
print(f"\nCountry distribution:")
for country, count in sorted(countries.items(), key=lambda x: -x[1])[:15]:
    print(f"  {country}: {count}")

# Create simplified mapping (just client -> country)
# Use case-insensitive keys to avoid duplicates
simplified_map = {}
for client, info in client_country_map.items():
    # Keep original name as key but check for case-insensitive duplicates
    key = client
    simplified_map[key] = info['country']

# Save the mapping
with open('client_country_map.json', 'w', encoding='utf-8') as f:
    json.dump(simplified_map, f, indent=2, ensure_ascii=False)

print(f"\nSaved client_country_map.json with {len(simplified_map)} mappings")
