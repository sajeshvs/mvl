import pandas as pd
import json
import os
from datetime import datetime
import re
import hashlib

# Configuration
BASE_PATH = r"g:\Rita\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data"
OUTPUT_PATH = os.path.join(BASE_PATH, "json")
os.makedirs(OUTPUT_PATH, exist_ok=True)

# Files
SUPPLIER_FILE = os.path.join(BASE_PATH, "MVL_Suppliers_List_ENRICHED.xlsx")
PO_FILE = os.path.join(BASE_PATH, "PO_List_Jan-23-2026.xlsx")
QUOTATION_FOLDER = os.path.join(BASE_PATH, "Quotation Reports")

def generate_id(prefix, number):
    """Generate consistent ID with prefix"""
    return f"{prefix}-{str(number).zfill(4)}"

def parse_date_to_iso(date_str):
    """Convert various date formats to ISO 8601"""
    if pd.isna(date_str):
        return None
    
    date_str = str(date_str).strip()
    
    # Try different date formats
    formats = [
        "%d %b %Y",      # 23 Jan 2026
        "%d %B %Y",      # 23 January 2026
        "%Y-%m-%d",      # 2026-01-23
        "%d-%m-%Y",      # 23-01-2026
        "%d/%m/%Y",      # 23/01/2026
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except:
            continue
    
    return date_str  # Return original if can't parse

def parse_po_number(po_num):
    """Parse PO number into components"""
    if pd.isna(po_num):
        return {}
    
    # Pattern: RFPO-####-X####-#
    match = re.match(r'([A-Z]+)-(\d+)-([A-Z]\d+)-(\d+)', str(po_num))
    if match:
        return {
            'prefix': match.group(1),
            'series': match.group(2),
            'category': match.group(3),
            'sequence': match.group(4)
        }
    return {}

def parse_quotation_number(quot_num):
    """Parse quotation number into components"""
    if pd.isna(quot_num):
        return {}
    
    # Pattern: Q-####-X#####
    match = re.match(r'([A-Z]+)-(\d+)-([A-Z]\d+[A-Z]?)', str(quot_num))
    if match:
        return {
            'prefix': match.group(1),
            'batch': match.group(2),
            'code': match.group(3)
        }
    return {}

def calculate_data_quality(row, required_fields, optional_fields):
    """Calculate data quality score based on field completeness"""
    required_filled = sum(1 for f in required_fields if pd.notna(row.get(f)) and row.get(f) != '')
    optional_filled = sum(1 for f in optional_fields if pd.notna(row.get(f)) and row.get(f) != '')
    
    required_score = required_filled / len(required_fields) if required_fields else 1
    optional_score = optional_filled / len(optional_fields) if optional_fields else 0
    
    # Weighted: 70% required, 30% optional
    total_score = (required_score * 0.7) + (optional_score * 0.3)
    return round(total_score, 2)

def get_missing_fields(row, all_fields):
    """Get list of missing fields"""
    return [f for f in all_fields if pd.isna(row.get(f)) or row.get(f) == '']

def safe_float(value):
    """Safely convert to float, return None if invalid"""
    if pd.isna(value):
        return None
    try:
        return float(value)
    except:
        return None

def safe_int(value):
    """Safely convert to int, return None if invalid"""
    if pd.isna(value):
        return None
    try:
        return int(value)
    except:
        return None

def safe_str(value):
    """Safely convert to string, return None if empty"""
    if pd.isna(value) or value == '':
        return None
    return str(value).strip()

print("=" * 80)
print("MVL SUPPLY CHAIN INTEL HUB - JSON CONVERSION")
print("=" * 80)
print(f"Extraction Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Output Directory: {OUTPUT_PATH}")

# ============================================================================
# 1. PROCESS SUPPLIERS
# ============================================================================
print("\n" + "=" * 80)
print("1. PROCESSING SUPPLIER DATA")
print("=" * 80)

supplier_df = pd.read_excel(SUPPLIER_FILE)
print(f"Loaded {len(supplier_df)} suppliers")

suppliers_list = []
for idx, row in supplier_df.iterrows():
    # Calculate quality
    required = ['No', 'Name', 'Material']
    optional = ['Contact Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Rating']
    quality_score = calculate_data_quality(row, required, optional)
    missing = get_missing_fields(row, required + optional)
    
    supplier = {
        'id': generate_id('SUP', row['No']),
        'legacy_no': safe_int(row['No']),
        'name': safe_str(row['Name']),
        'material_category': safe_str(row.get('Material')),
        'contact': {
            'primary_contact': safe_str(row.get('Contact Name')),
            'email': safe_str(row.get('Email')),
            'phone': safe_str(row.get('Phone')),
            'fax': safe_str(row.get('Fax_Number'))
        },
        'address': {
            'full_address': safe_str(row.get('Address')),
            'street': safe_str(row.get('Street')),
            'city': safe_str(row.get('City')),
            'country': safe_str(row.get('Country')),
            'country_iso3': safe_str(row.get('country_iso3')),
            'country_iso2': safe_str(row.get('country_iso2')),
            'country_standardized': safe_str(row.get('country_standardized'))
        },
        'location': {
            'latitude': safe_float(row.get('latitude')),
            'longitude': safe_float(row.get('longitude')),
            'formatted_address': safe_str(row.get('formatted_address')),
            'quality': safe_str(row.get('location_quality')),
            'quality_score': safe_float(row.get('location_quality_score'))
        },
        'phone_validation': {
            'phone_country': safe_str(row.get('phone_country')),
            'phone_country_code': safe_str(row.get('phone_country_code')),
            'is_valid': bool(row.get('phone_valid', False)),
            'matches_address': bool(row.get('phone_country_matches', False))
        },
        'identifiers': {
            'trn_number': safe_str(row.get('TRN No')),
            'tax_id': None
        },
        'rating': {
            'score': safe_float(row.get('Rating')),
            'scale': '0-5',
            'last_updated': None
        },
        'status': 'active',
        'metadata': {
            'created_date': None,
            'last_updated': '2026-02-05',
            'data_quality_score': quality_score,
            'missing_fields': missing
        }
    }
    suppliers_list.append(supplier)

suppliers_json = {
    'metadata': {
        'source_file': 'MVL_Suppliers_List_ENRICHED.xlsx',
        'extraction_date': datetime.now().strftime('%Y-%m-%d'),
        'total_records': len(suppliers_list),
        'version': '1.0',
        'has_location_data': True,
        'geocoded_count': sum(1 for s in suppliers_list if s['location']['latitude'] is not None)
    },
    'suppliers': suppliers_list
}

# Save suppliers
supplier_output = os.path.join(OUTPUT_PATH, 'suppliers.json')
with open(supplier_output, 'w', encoding='utf-8') as f:
    json.dump(suppliers_json, f, indent=2, ensure_ascii=False)

print(f"✓ Exported {len(suppliers_list)} suppliers to suppliers.json")
print(f"  - Geocoded locations: {suppliers_json['metadata']['geocoded_count']}")
print(f"  - Countries standardized: {sum(1 for s in suppliers_list if s['address']['country_iso3'])}")

# ============================================================================
# 2. PROCESS PURCHASE ORDERS
# ============================================================================
print("\n" + "=" * 80)
print("2. PROCESSING PURCHASE ORDER DATA")
print("=" * 80)

po_df = pd.read_excel(PO_FILE)
print(f"Loaded {len(po_df)} purchase orders")

# Create supplier name to ID mapping for linking
supplier_lookup = {s['name'].lower(): s['id'] for s in suppliers_list if s['name']}

pos_list = []
for idx, row in po_df.iterrows():
    # Try to match supplier
    supplier_name = safe_str(row.get('Supplier'))
    supplier_id = None
    if supplier_name:
        supplier_id = supplier_lookup.get(supplier_name.lower())
    
    # Calculate quality
    required = ['No', 'PO number', 'Po Date', 'Total', 'Cur.']
    optional = ['PO Name', 'Supplier']
    quality_score = calculate_data_quality(row, required, optional)
    missing = get_missing_fields(row, required + optional)
    
    po = {
        'id': generate_id('PO', row['No']),
        'legacy_no': safe_int(row['No']),
        'po_number': safe_str(row.get('PO number')),
        'po_components': parse_po_number(row.get('PO number')),
        'dates': {
            'po_date': parse_date_to_iso(row.get('Po Date')),
            'po_date_original': safe_str(row.get('Po Date')),
            'created_date': None,
            'approved_date': None,
            'expected_delivery': None,
            'actual_delivery': None
        },
        'description': safe_str(row.get('PO Name')),
        'project': {
            'project_code': None,
            'project_name': None
        },
        'supplier': {
            'name': supplier_name,
            'supplier_id': supplier_id,
            'matched': supplier_id is not None
        },
        'financial': {
            'total_amount': safe_float(row.get('Total')),
            'currency': safe_str(row.get('Cur.')),
            'usd_equivalent': None,
            'exchange_rate': None
        },
        'status': 'unknown',
        'metadata': {
            'has_supplier': supplier_name is not None,
            'supplier_linked': supplier_id is not None,
            'data_quality_score': quality_score,
            'missing_fields': missing
        }
    }
    pos_list.append(po)

pos_json = {
    'metadata': {
        'source_file': 'PO_List_Jan-23-2026.xlsx',
        'extraction_date': datetime.now().strftime('%Y-%m-%d'),
        'total_records': len(pos_list),
        'version': '1.0',
        'currencies': list(set(p['financial']['currency'] for p in pos_list if p['financial']['currency'])),
        'date_range': {
            'earliest': min((p['dates']['po_date'] for p in pos_list if p['dates']['po_date']), default=None),
            'latest': max((p['dates']['po_date'] for p in pos_list if p['dates']['po_date']), default=None)
        },
        'supplier_match_stats': {
            'total_with_supplier': sum(1 for p in pos_list if p['supplier']['name']),
            'successfully_matched': sum(1 for p in pos_list if p['supplier']['matched']),
            'match_rate': round(sum(1 for p in pos_list if p['supplier']['matched']) / 
                               max(sum(1 for p in pos_list if p['supplier']['name']), 1) * 100, 1)
        }
    },
    'purchase_orders': pos_list
}

# Save POs
po_output = os.path.join(OUTPUT_PATH, 'purchase_orders.json')
with open(po_output, 'w', encoding='utf-8') as f:
    json.dump(pos_json, f, indent=2, ensure_ascii=False)

print(f"✓ Exported {len(pos_list)} purchase orders to purchase_orders.json")
print(f"  - Date range: {pos_json['metadata']['date_range']['earliest']} to {pos_json['metadata']['date_range']['latest']}")
print(f"  - Suppliers matched: {pos_json['metadata']['supplier_match_stats']['successfully_matched']}/{pos_json['metadata']['supplier_match_stats']['total_with_supplier']} ({pos_json['metadata']['supplier_match_stats']['match_rate']}%)")

# ============================================================================
# 3. PROCESS QUOTATIONS
# ============================================================================
print("\n" + "=" * 80)
print("3. PROCESSING QUOTATION DATA")
print("=" * 80)

# Read all quotation files
quotation_files = [f for f in os.listdir(QUOTATION_FOLDER) if f.endswith('.xlsx')]
print(f"Found {len(quotation_files)} quotation files")

all_quotations = []
for qfile in quotation_files:
    qpath = os.path.join(QUOTATION_FOLDER, qfile)
    qdf = pd.read_excel(qpath)
    
    # Skip header row (first row contains column names as data)
    if len(qdf) > 0 and qdf.iloc[0, 0] == 'No':
        qdf = qdf.iloc[1:].reset_index(drop=True)
    
    # Set proper column names
    qdf.columns = [
        'series_number', 'quotation_number', 'company', 'date', 'type',
        'client', 'project_name', 'description', 'material_category',
        'material_code', 'quoted_value', 'currency', 'mvl_contact', 'status'
    ]
    
    # Add source file tracking
    qdf['source_file'] = qfile
    
    all_quotations.append(qdf)
    print(f"  - {qfile}: {len(qdf)} quotations")

# Combine all quotation files
quotations_df = pd.concat(all_quotations, ignore_index=True)
print(f"\nCombined total: {len(quotations_df)} quotations")

# Remove duplicates based on series_number
quotations_df = quotations_df.drop_duplicates(subset=['series_number'], keep='first')
print(f"After deduplication: {len(quotations_df)} unique quotations")

# Normalize status values
status_mapping = {
    'Order': 'won',
    'order': 'won',
    'Lost': 'lost',
    'lost': 'lost',
    'Pending': 'pending',
    'pending': 'pending'
}

quotations_list = []
for idx, row in quotations_df.iterrows():
    status_original = safe_str(row.get('status'))
    status_normalized = status_mapping.get(status_original, 'unknown') if status_original else 'unknown'
    
    # Calculate quality
    required = ['series_number', 'quotation_number', 'date', 'client', 'quoted_value', 'currency']
    optional = ['company', 'project_name', 'description', 'material_category', 'mvl_contact', 'status']
    quality_score = calculate_data_quality(row, required, optional)
    missing = get_missing_fields(row, required + optional)
    
    quotation = {
        'id': generate_id('QUOT', row['series_number']),
        'series_number': safe_int(row.get('series_number')),
        'quotation_number': safe_str(row.get('quotation_number')),
        'quotation_components': parse_quotation_number(row.get('quotation_number')),
        'company': safe_str(row.get('company')),
        'dates': {
            'quotation_date': parse_date_to_iso(row.get('date')),
            'quotation_date_original': safe_str(row.get('date')),
            'created_date': None,
            'sent_date': None,
            'valid_until': None,
            'response_date': None
        },
        'type': safe_str(row.get('type')),
        'type_full': 'Internal Quotation' if row.get('type') == 'IQ' else safe_str(row.get('type')),
        'client': {
            'name': safe_str(row.get('client')),
            'client_id': None,
            'type': None
        },
        'project': {
            'name': safe_str(row.get('project_name')),
            'project_code': None,
            'project_category': None
        },
        'details': {
            'description': safe_str(row.get('description')),
            'material_category': safe_str(row.get('material_category')),
            'material_code': safe_str(row.get('material_code')),
            'quantity': None,
            'unit': None
        },
        'financial': {
            'quoted_value': safe_float(row.get('quoted_value')),
            'currency': safe_str(row.get('currency')),
            'usd_equivalent': None,
            'actual_po_value': None,
            'variance': None
        },
        'contact': {
            'mvl_contact': safe_str(row.get('mvl_contact')),
            'client_contact': None
        },
        'outcome': {
            'status': status_original,
            'status_normalized': status_normalized,
            'converted_to_po': status_normalized == 'won',
            'po_number': None,
            'reason_lost': None,
            'competitor': None,
            'follow_up_date': None
        },
        'metrics': {
            'days_to_response': None,
            'days_to_close': None,
            'success_probability': None
        },
        'source_file': safe_str(row.get('source_file')),
        'metadata': {
            'data_quality_score': quality_score,
            'missing_fields': missing
        }
    }
    quotations_list.append(quotation)

# Calculate series range
series_numbers = [q['series_number'] for q in quotations_list if q['series_number']]
quotations_json = {
    'metadata': {
        'source_files': quotation_files,
        'extraction_date': datetime.now().strftime('%Y-%m-%d'),
        'total_records': len(quotations_list),
        'version': '1.0',
        'series_range': {
            'start': min(series_numbers) if series_numbers else None,
            'end': max(series_numbers) if series_numbers else None
        },
        'status_distribution': {
            'won': sum(1 for q in quotations_list if q['outcome']['status_normalized'] == 'won'),
            'lost': sum(1 for q in quotations_list if q['outcome']['status_normalized'] == 'lost'),
            'pending': sum(1 for q in quotations_list if q['outcome']['status_normalized'] == 'pending'),
            'unknown': sum(1 for q in quotations_list if q['outcome']['status_normalized'] == 'unknown')
        },
        'currencies': list(set(q['financial']['currency'] for q in quotations_list if q['financial']['currency']))
    },
    'quotations': quotations_list
}

# Save quotations
quot_output = os.path.join(OUTPUT_PATH, 'quotations.json')
with open(quot_output, 'w', encoding='utf-8') as f:
    json.dump(quotations_json, f, indent=2, ensure_ascii=False)

print(f"✓ Exported {len(quotations_list)} quotations to quotations.json")
print(f"  - Series range: {quotations_json['metadata']['series_range']['start']} to {quotations_json['metadata']['series_range']['end']}")
print(f"  - Status: Won={quotations_json['metadata']['status_distribution']['won']}, Lost={quotations_json['metadata']['status_distribution']['lost']}, Pending={quotations_json['metadata']['status_distribution']['pending']}")

# ============================================================================
# 4. CREATE COMBINED METADATA
# ============================================================================
print("\n" + "=" * 80)
print("4. CREATING COMBINED METADATA")
print("=" * 80)

combined_metadata = {
    'project': 'MVL Supply Chain Intel Hub',
    'extraction_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'version': '1.0',
    'datasets': {
        'suppliers': {
            'file': 'suppliers.json',
            'records': len(suppliers_list),
            'source': 'MVL_Suppliers_List_ENRICHED.xlsx',
            'has_location_data': True
        },
        'purchase_orders': {
            'file': 'purchase_orders.json',
            'records': len(pos_list),
            'source': 'PO_List_Jan-23-2026.xlsx',
            'linked_to_suppliers': True
        },
        'quotations': {
            'file': 'quotations.json',
            'records': len(quotations_list),
            'source': f'{len(quotation_files)} quotation report files',
            'merged_and_deduplicated': True
        }
    },
    'improvements_applied': [
        'ISO 8601 date formatting',
        'Country name standardization with ISO codes',
        'Phone number validation and country matching',
        'Geocoding with latitude/longitude coordinates',
        'Location quality scoring',
        'Supplier-PO linkage via name matching',
        'PO number component parsing',
        'Quotation number component parsing',
        'Status value normalization',
        'Data quality score calculation',
        'Missing field tracking',
        'Nested object structures for related data',
        'Unique ID generation for all records',
        'Metadata enrichment'
    ],
    'data_quality': {
        'suppliers': {
            'avg_quality_score': round(sum(s['metadata']['data_quality_score'] for s in suppliers_list) / len(suppliers_list), 2),
            'high_quality': sum(1 for s in suppliers_list if s['metadata']['data_quality_score'] >= 0.8),
            'medium_quality': sum(1 for s in suppliers_list if 0.5 <= s['metadata']['data_quality_score'] < 0.8),
            'low_quality': sum(1 for s in suppliers_list if s['metadata']['data_quality_score'] < 0.5)
        },
        'purchase_orders': {
            'avg_quality_score': round(sum(p['metadata']['data_quality_score'] for p in pos_list) / len(pos_list), 2),
            'high_quality': sum(1 for p in pos_list if p['metadata']['data_quality_score'] >= 0.8),
            'medium_quality': sum(1 for p in pos_list if 0.5 <= p['metadata']['data_quality_score'] < 0.8),
            'low_quality': sum(1 for p in pos_list if p['metadata']['data_quality_score'] < 0.5)
        },
        'quotations': {
            'avg_quality_score': round(sum(q['metadata']['data_quality_score'] for q in quotations_list) / len(quotations_list), 2),
            'high_quality': sum(1 for q in quotations_list if q['metadata']['data_quality_score'] >= 0.8),
            'medium_quality': sum(1 for q in quotations_list if 0.5 <= q['metadata']['data_quality_score'] < 0.8),
            'low_quality': sum(1 for q in quotations_list if q['metadata']['data_quality_score'] < 0.5)
        }
    }
}

metadata_output = os.path.join(OUTPUT_PATH, 'metadata.json')
with open(metadata_output, 'w', encoding='utf-8') as f:
    json.dump(combined_metadata, f, indent=2, ensure_ascii=False)

print(f"✓ Created combined metadata file")

# ============================================================================
# 5. SUMMARY REPORT
# ============================================================================
print("\n" + "=" * 80)
print("CONVERSION COMPLETE - SUMMARY")
print("=" * 80)
print(f"\n📊 Records Processed:")
print(f"   Suppliers:        {len(suppliers_list):,}")
print(f"   Purchase Orders:  {len(pos_list):,}")
print(f"   Quotations:       {len(quotations_list):,}")
print(f"   TOTAL:            {len(suppliers_list) + len(pos_list) + len(quotations_list):,}")

print(f"\n✨ Data Quality Scores:")
print(f"   Suppliers:        {combined_metadata['data_quality']['suppliers']['avg_quality_score']}")
print(f"   Purchase Orders:  {combined_metadata['data_quality']['purchase_orders']['avg_quality_score']}")
print(f"   Quotations:       {combined_metadata['data_quality']['quotations']['avg_quality_score']}")

print(f"\n📁 Output Files Created:")
print(f"   {OUTPUT_PATH}\\suppliers.json")
print(f"   {OUTPUT_PATH}\\purchase_orders.json")
print(f"   {OUTPUT_PATH}\\quotations.json")
print(f"   {OUTPUT_PATH}\\metadata.json")

print(f"\n🎯 Key Improvements:")
for imp in combined_metadata['improvements_applied']:
    print(f"   ✓ {imp}")

print("\n" + "=" * 80)
print("JSON conversion completed successfully!")
print("=" * 80)
