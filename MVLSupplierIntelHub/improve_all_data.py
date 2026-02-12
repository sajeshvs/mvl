import pandas as pd
import json
import os
import re
from datetime import datetime, timedelta
from geopy.geocoders import Nominatim
import time
import phonenumbers

BASE_PATH = r"g:\Rita\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data"
JSON_PATH = os.path.join(BASE_PATH, "json")
GEOCODING_DELAY = 1

geolocator = Nominatim(user_agent="mvl_supplier_intel_hub_v2.0")

def geocode_address(address_str, retry_count=0):
    """Geocode an address"""
    if not address_str:
        return None
    try:
        time.sleep(GEOCODING_DELAY)
        location = geolocator.geocode(address_str, exactly_one=True)
        if location:
            return {
                'latitude': location.latitude,
                'longitude': location.longitude,
                'formatted_address': location.address
            }
    except:
        pass
    return None

def extract_project_code(text):
    """Extract project codes from text"""
    if not text or pd.isna(text):
        return None
    
    # Common patterns: #XXX, Project-XXX, PR-XXX, etc.
    patterns = [
        r'#([A-Z0-9]+)',
        r'[Pp]roject[:\s-]+([A-Z0-9]+)',
        r'PR-([A-Z0-9]+)',
        r'PRJ-([A-Z0-9]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, str(text))
        if match:
            return match.group(1)
    return None

def clean_email(email):
    """Validate and clean email addresses"""
    if not email or pd.isna(email):
        return None
    
    email = str(email).strip().lower()
    
    # Basic email validation
    if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return email
    return None

def standardize_phone(phone):
    """Standardize phone number format"""
    if not phone or pd.isna(phone):
        return None
    
    try:
        parsed = phonenumbers.parse(str(phone), None)
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
    except:
        return str(phone).strip()

def calculate_po_status(po_date_str, current_date='2026-02-09'):
    """Calculate PO status based on date"""
    if not po_date_str:
        return 'unknown'
    
    try:
        po_date = datetime.strptime(po_date_str, '%Y-%m-%d')
        current = datetime.strptime(current_date, '%Y-%m-%d')
        
        days_diff = (current - po_date).days
        
        if days_diff < 0:
            return 'scheduled'
        elif days_diff <= 30:
            return 'recent'
        elif days_diff <= 90:
            return 'active'
        elif days_diff <= 365:
            return 'aging'
        else:
            return 'old'
    except:
        return 'unknown'

def extract_contact_parts(contact_name):
    """Extract first name, last name from contact"""
    if not contact_name or pd.isna(contact_name):
        return {'first_name': None, 'last_name': None, 'title': None}
    
    name = str(contact_name).strip()
    
    # Extract title if present
    titles = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Eng.', 'Manager', 'Director', 'Officer']
    title = None
    for t in titles:
        if t in name:
            title = t
            name = name.replace(t, '').strip()
    
    parts = name.split()
    if len(parts) >= 2:
        return {
            'first_name': parts[0],
            'last_name': ' '.join(parts[1:]),
            'title': title
        }
    return {
        'first_name': name,
        'last_name': None,
        'title': title
    }

def calculate_supplier_score(supplier):
    """Calculate comprehensive supplier score"""
    score = 0
    max_score = 100
    
    # Rating (30 points)
    if supplier.get('rating', {}).get('score'):
        score += (supplier['rating']['score'] / 5.0) * 30
    
    # Contact completeness (20 points)
    contact = supplier.get('contact', {})
    if contact.get('email'): score += 7
    if contact.get('phone'): score += 7
    if contact.get('primary_contact'): score += 6
    
    # Address completeness (20 points)
    address = supplier.get('address', {})
    if address.get('country_iso3'): score += 5
    if address.get('city'): score += 5
    if address.get('full_address'): score += 10
    
    # Location data (15 points)
    location = supplier.get('location', {})
    if location.get('latitude'): score += 15
    
    # Phone validation (15 points)
    phone_val = supplier.get('phone_validation', {})
    if phone_val.get('is_valid'): score += 10
    if phone_val.get('matches_address'): score += 5
    
    return round(score, 2)

def match_quotation_to_po(quot_number, quot_client, quot_project, pos_data):
    """Try to match quotation to PO"""
    for po in pos_data:
        po_desc = po.get('description', '')
        po_supplier = po.get('supplier', {}).get('name', '')
        
        if quot_number and po_desc and quot_number in po_desc:
            return po['po_number']
        
        if quot_client and po_supplier and quot_client.lower() in po_supplier.lower():
            if quot_project and po_desc and quot_project in po_desc:
                return po['po_number']
    
    return None

print("=" * 80)
print("MVL SUPPLY CHAIN INTEL HUB - COMPREHENSIVE DATA IMPROVEMENT")
print("=" * 80)
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# ============================================================================
# PHASE 1: IMPROVE SUPPLIER DATA
# ============================================================================
print("=" * 80)
print("PHASE 1: IMPROVING SUPPLIER DATA")
print("=" * 80)

with open(os.path.join(JSON_PATH, 'suppliers.json'), 'r', encoding='utf-8') as f:
    suppliers_data = json.load(f)

suppliers = suppliers_data['suppliers']
print(f"Loaded {len(suppliers)} suppliers")

improvements = {
    'emails_cleaned': 0,
    'phones_standardized': 0,
    'contacts_parsed': 0,
    'geocoded_new': 0,
    'scores_calculated': 0
}

print("\n1. Cleaning and validating contact information...")
for supplier in suppliers:
    # Clean email
    original_email = supplier['contact'].get('email')
    cleaned_email = clean_email(original_email)
    if cleaned_email != original_email and cleaned_email:
        supplier['contact']['email'] = cleaned_email
        improvements['emails_cleaned'] += 1
    
    # Standardize phone
    original_phone = supplier['contact'].get('phone')
    if original_phone:
        standardized = standardize_phone(original_phone)
        if standardized != original_phone:
            supplier['contact']['phone'] = standardized
            improvements['phones_standardized'] += 1
    
    # Parse contact name
    contact_name = supplier['contact'].get('primary_contact')
    if contact_name:
        parts = extract_contact_parts(contact_name)
        supplier['contact']['first_name'] = parts['first_name']
        supplier['contact']['last_name'] = parts['last_name']
        supplier['contact']['title'] = parts['title']
        improvements['contacts_parsed'] += 1

print(f"   ✓ Cleaned {improvements['emails_cleaned']} emails")
print(f"   ✓ Standardized {improvements['phones_standardized']} phone numbers")
print(f"   ✓ Parsed {improvements['contacts_parsed']} contact names")

print("\n2. Geocoding remaining suppliers (this may take 30+ minutes)...")
user_choice = input("   Geocode all remaining suppliers? (y/n) [n]: ").strip().lower()

if user_choice == 'y':
    to_geocode = [s for s in suppliers if not s['location'].get('latitude')]
    print(f"   Geocoding {len(to_geocode)} suppliers...")
    
    for idx, supplier in enumerate(to_geocode):
        if (idx + 1) % 50 == 0:
            print(f"   Progress: {idx + 1}/{len(to_geocode)} ({(idx+1)/len(to_geocode)*100:.1f}%)")
        
        # Build address
        address_parts = []
        addr = supplier['address']
        if addr.get('full_address'): address_parts.append(addr['full_address'])
        if addr.get('city'): address_parts.append(addr['city'])
        if addr.get('country_standardized'): address_parts.append(addr['country_standardized'])
        
        if address_parts:
            search_addr = ', '.join(address_parts)
            result = geocode_address(search_addr)
            if result:
                supplier['location']['latitude'] = result['latitude']
                supplier['location']['longitude'] = result['longitude']
                supplier['location']['formatted_address'] = result['formatted_address']
                supplier['location']['quality'] = 'high'
                improvements['geocoded_new'] += 1
    
    print(f"   ✓ Geocoded {improvements['geocoded_new']} new locations")
else:
    print("   Skipped geocoding")

print("\n3. Calculating supplier scores...")
for supplier in suppliers:
    supplier['supplier_score'] = calculate_supplier_score(supplier)
    improvements['scores_calculated'] += 1

print(f"   ✓ Calculated scores for {improvements['scores_calculated']} suppliers")

# Update metadata
suppliers_data['metadata']['last_improved'] = datetime.now().strftime('%Y-%m-%d')
suppliers_data['metadata']['improvements'] = improvements
suppliers_data['metadata']['geocoded_count'] = sum(1 for s in suppliers if s['location'].get('latitude'))

# Save improved suppliers
with open(os.path.join(JSON_PATH, 'suppliers_improved.json'), 'w', encoding='utf-8') as f:
    json.dump(suppliers_data, f, indent=2, ensure_ascii=False)

print("\n✓ Saved improved suppliers to suppliers_improved.json")

# ============================================================================
# PHASE 2: IMPROVE PURCHASE ORDER DATA
# ============================================================================
print("\n" + "=" * 80)
print("PHASE 2: IMPROVING PURCHASE ORDER DATA")
print("=" * 80)

with open(os.path.join(JSON_PATH, 'purchase_orders.json'), 'r', encoding='utf-8') as f:
    pos_data = json.load(f)

pos = pos_data['purchase_orders']
print(f"Loaded {len(pos)} purchase orders")

po_improvements = {
    'project_codes_extracted': 0,
    'statuses_calculated': 0,
    'categories_identified': 0,
    'delivery_dates_estimated': 0
}

print("\n1. Extracting project codes from descriptions...")
for po in pos:
    desc = po.get('description')
    if desc:
        project_code = extract_project_code(desc)
        if project_code:
            po['project']['project_code'] = project_code
            po_improvements['project_codes_extracted'] += 1

print(f"   ✓ Extracted {po_improvements['project_codes_extracted']} project codes")

print("\n2. Calculating PO status...")
for po in pos:
    po_date = po['dates'].get('po_date')
    if po_date:
        status = calculate_po_status(po_date)
        po['status'] = status
        po_improvements['statuses_calculated'] += 1
        
        # Estimate expected delivery (assume 30 days)
        if status in ['recent', 'active', 'scheduled']:
            try:
                po_dt = datetime.strptime(po_date, '%Y-%m-%d')
                expected = (po_dt + timedelta(days=30)).strftime('%Y-%m-%d')
                po['dates']['expected_delivery'] = expected
                po_improvements['delivery_dates_estimated'] += 1
            except:
                pass

print(f"   ✓ Calculated {po_improvements['statuses_calculated']} PO statuses")
print(f"   ✓ Estimated {po_improvements['delivery_dates_estimated']} delivery dates")

print("\n3. Identifying PO categories...")
for po in pos:
    po_num = po.get('po_number', '')
    components = po.get('po_components', {})
    category_code = components.get('category', '')
    
    # Map category codes to names
    category_mapping = {
        'M': 'Material',
        'O': 'Office',
        'V': 'Vehicle',
        'E': 'Equipment',
        'S': 'Service',
        'C': 'Construction'
    }
    
    if category_code and category_code[0] in category_mapping:
        po['category'] = category_mapping[category_code[0]]
        po_improvements['categories_identified'] += 1

print(f"   ✓ Identified {po_improvements['categories_identified']} PO categories")

# Calculate PO statistics
po_stats = {
    'by_status': {},
    'by_currency': {},
    'by_year': {},
    'total_value_by_currency': {}
}

for po in pos:
    # Status distribution
    status = po.get('status', 'unknown')
    po_stats['by_status'][status] = po_stats['by_status'].get(status, 0) + 1
    
    # Currency distribution
    currency = po['financial'].get('currency')
    if currency:
        po_stats['by_currency'][currency] = po_stats['by_currency'].get(currency, 0) + 1
        
        # Total value by currency
        amount = po['financial'].get('total_amount', 0)
        po_stats['total_value_by_currency'][currency] = po_stats['total_value_by_currency'].get(currency, 0) + amount
    
    # Year distribution
    po_date = po['dates'].get('po_date')
    if po_date:
        year = po_date[:4]
        po_stats['by_year'][year] = po_stats['by_year'].get(year, 0) + 1

pos_data['metadata']['improvements'] = po_improvements
pos_data['metadata']['statistics'] = po_stats
pos_data['metadata']['last_improved'] = datetime.now().strftime('%Y-%m-%d')

# Save improved POs
with open(os.path.join(JSON_PATH, 'purchase_orders_improved.json'), 'w', encoding='utf-8') as f:
    json.dump(pos_data, f, indent=2, ensure_ascii=False)

print("\n✓ Saved improved purchase orders to purchase_orders_improved.json")

# ============================================================================
# PHASE 3: IMPROVE QUOTATION DATA
# ============================================================================
print("\n" + "=" * 80)
print("PHASE 3: IMPROVING QUOTATION DATA")
print("=" * 80)

with open(os.path.join(JSON_PATH, 'quotations.json'), 'r', encoding='utf-8') as f:
    quots_data = json.load(f)

quots = quots_data['quotations']
print(f"Loaded {len(quots)} quotations")

quot_improvements = {
    'project_codes_extracted': 0,
    'pos_linked': 0,
    'clients_categorized': 0,
    'win_rates_calculated': 0,
    'dates_calculated': 0
}

print("\n1. Extracting project codes...")
for quot in quots:
    project_name = quot['project'].get('name')
    if project_name:
        project_code = extract_project_code(project_name)
        if project_code:
            quot['project']['project_code'] = project_code
            quot_improvements['project_codes_extracted'] += 1

print(f"   ✓ Extracted {quot_improvements['project_codes_extracted']} project codes")

print("\n2. Linking quotations to purchase orders...")
for quot in quots:
    if quot['outcome']['status_normalized'] == 'won':
        quot_num = quot.get('quotation_number')
        quot_client = quot['client'].get('name')
        quot_project = quot['project'].get('name')
        
        matched_po = match_quotation_to_po(quot_num, quot_client, quot_project, pos)
        if matched_po:
            quot['outcome']['po_number'] = matched_po
            quot_improvements['pos_linked'] += 1

print(f"   ✓ Linked {quot_improvements['pos_linked']} quotations to POs")

print("\n3. Categorizing clients...")
internal_keywords = ['MVL', 'Internal', 'Office', 'Warehouse']
for quot in quots:
    client_name = quot['client'].get('name', '')
    if client_name and any(kw.lower() in client_name.lower() for kw in internal_keywords):
        quot['client']['type'] = 'internal'
    elif client_name:
        quot['client']['type'] = 'external'
    else:
        quot['client']['type'] = 'unknown'
    quot_improvements['clients_categorized'] += 1

print(f"   ✓ Categorized {quot_improvements['clients_categorized']} clients")

print("\n4. Calculating business metrics...")

# Calculate metrics by MVL contact
contact_metrics = {}
for quot in quots:
    contact = quot['contact'].get('mvl_contact')
    if contact and contact.strip():
        if contact not in contact_metrics:
            contact_metrics[contact] = {
                'total_quotes': 0,
                'won': 0,
                'lost': 0,
                'total_value': 0,
                'won_value': 0
            }
        
        contact_metrics[contact]['total_quotes'] += 1
        
        value = quot['financial'].get('quoted_value') or 0
        contact_metrics[contact]['total_value'] += value
        
        if quot['outcome']['status_normalized'] == 'won':
            contact_metrics[contact]['won'] += 1
            contact_metrics[contact]['won_value'] += value
        elif quot['outcome']['status_normalized'] == 'lost':
            contact_metrics[contact]['lost'] += 1

# Calculate win rates
for contact, metrics in contact_metrics.items():
    if metrics['total_quotes'] > 0:
        metrics['win_rate'] = round(metrics['won'] / metrics['total_quotes'] * 100, 1)
    else:
        metrics['win_rate'] = 0

quot_improvements['win_rates_calculated'] = len(contact_metrics)

print(f"   ✓ Calculated win rates for {quot_improvements['win_rates_calculated']} contacts")

# Add metrics to quotations data
quots_data['metadata']['improvements'] = quot_improvements
quots_data['metadata']['contact_performance'] = contact_metrics
quots_data['metadata']['last_improved'] = datetime.now().strftime('%Y-%m-%d')

# Save improved quotations
with open(os.path.join(JSON_PATH, 'quotations_improved.json'), 'w', encoding='utf-8') as f:
    json.dump(quots_data, f, indent=2, ensure_ascii=False)

print("\n✓ Saved improved quotations to quotations_improved.json")

# ============================================================================
# PHASE 4: CREATE COMPREHENSIVE SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("PHASE 4: CREATING COMPREHENSIVE SUMMARY")
print("=" * 80)

summary = {
    'improvement_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'datasets': {
        'suppliers': {
            'total_records': len(suppliers),
            'improvements': improvements,
            'top_rated': sorted([{
                'id': s['id'],
                'name': s['name'],
                'score': s.get('supplier_score', 0),
                'rating': s['rating']['score']
            } for s in suppliers], key=lambda x: x['score'], reverse=True)[:10]
        },
        'purchase_orders': {
            'total_records': len(pos),
            'improvements': po_improvements,
            'statistics': po_stats
        },
        'quotations': {
            'total_records': len(quots),
            'improvements': quot_improvements,
            'top_performers': sorted([{
                'contact': k,
                'win_rate': v['win_rate'],
                'total_quotes': v['total_quotes'],
                'won_value': v['won_value']
            } for k, v in contact_metrics.items()], key=lambda x: x['win_rate'], reverse=True)[:10]
        }
    }
}

with open(os.path.join(JSON_PATH, 'improvement_summary.json'), 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print("\n✓ Created improvement summary")

# ============================================================================
# FINAL REPORT
# ============================================================================
print("\n" + "=" * 80)
print("IMPROVEMENT COMPLETE - SUMMARY")
print("=" * 80)

print(f"\n📊 SUPPLIERS - {len(suppliers)} records")
print(f"   ✓ Emails cleaned: {improvements['emails_cleaned']}")
print(f"   ✓ Phones standardized: {improvements['phones_standardized']}")
print(f"   ✓ Contacts parsed: {improvements['contacts_parsed']}")
print(f"   ✓ New geocoded: {improvements['geocoded_new']}")
print(f"   ✓ Scores calculated: {improvements['scores_calculated']}")

print(f"\n📋 PURCHASE ORDERS - {len(pos)} records")
print(f"   ✓ Project codes extracted: {po_improvements['project_codes_extracted']}")
print(f"   ✓ Statuses calculated: {po_improvements['statuses_calculated']}")
print(f"   ✓ Categories identified: {po_improvements['categories_identified']}")
print(f"   ✓ Delivery dates estimated: {po_improvements['delivery_dates_estimated']}")

print(f"\n💰 QUOTATIONS - {len(quots)} records")
print(f"   ✓ Project codes extracted: {quot_improvements['project_codes_extracted']}")
print(f"   ✓ POs linked: {quot_improvements['pos_linked']}")
print(f"   ✓ Clients categorized: {quot_improvements['clients_categorized']}")
print(f"   ✓ Win rates calculated: {quot_improvements['win_rates_calculated']}")

print(f"\n📁 Output Files:")
print(f"   {JSON_PATH}\\suppliers_improved.json")
print(f"   {JSON_PATH}\\purchase_orders_improved.json")
print(f"   {JSON_PATH}\\quotations_improved.json")
print(f"   {JSON_PATH}\\improvement_summary.json")

print("\n" + "=" * 80)
print("All data improvements completed successfully!")
print("=" * 80)
