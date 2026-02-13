import pandas as pd
import json
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import phonenumbers
from phonenumbers import geocoder, carrier
import pycountry

# Configuration
GEOCODING_DELAY = 1  # Seconds between requests (Nominatim requirement)
MAX_RETRIES = 2

# Initialize geocoder
geolocator = Nominatim(user_agent="mvl_supplier_intel_hub_v1.0")

def standardize_country_name(country_str):
    """Standardize country names to ISO codes and full names"""
    if pd.isna(country_str) or country_str == '':
        return None, None, None
    
    country_str = str(country_str).strip()
    
    # Manual mappings for common variations
    country_mappings = {
        'UAE': 'United Arab Emirates',
        'U.A.E': 'United Arab Emirates',
        'U.A.E.': 'United Arab Emirates',
        'United Arab Emirates': 'United Arab Emirates',
        'USA': 'United States',
        'U.S.A': 'United States',
        'US': 'United States',
        'UK': 'United Kingdom',
        'U.K': 'United Kingdom',
    }
    
    # Check manual mappings first
    if country_str in country_mappings:
        country_str = country_mappings[country_str]
    
    # Try to find country in pycountry
    try:
        # Try by name
        country = pycountry.countries.get(name=country_str)
        if not country:
            # Try case-insensitive search
            country = pycountry.countries.search_fuzzy(country_str)[0]
        
        return country.alpha_3, country.name, country.alpha_2
    except:
        # Return original if can't find
        return None, country_str, None

def parse_phone_number(phone_str):
    """Extract country and region information from phone number"""
    if pd.isna(phone_str) or phone_str == '':
        return None
    
    try:
        phone_str = str(phone_str).strip()
        parsed = phonenumbers.parse(phone_str, None)
        
        country_code = f"+{parsed.country_code}"
        country_name = geocoder.description_for_number(parsed, "en")
        region_code = phonenumbers.region_code_for_number(parsed)
        carrier_name = carrier.name_for_number(parsed, "en")
        
        return {
            'country_code': country_code,
            'country_name': country_name,
            'region_code': region_code,
            'carrier': carrier_name,
            'is_valid': phonenumbers.is_valid_number(parsed)
        }
    except:
        return None

def build_search_address(row):
    """Build best possible address string for geocoding"""
    parts = []
    
    # Add available address components
    if pd.notna(row.get('Address')) and row['Address']:
        parts.append(str(row['Address']))
    
    if pd.notna(row.get('Street')) and row['Street']:
        parts.append(str(row['Street']))
    
    if pd.notna(row.get('City')) and row['City']:
        parts.append(str(row['City']))
    
    if pd.notna(row.get('Country')) and row['Country']:
        parts.append(str(row['Country']))
    
    return ', '.join(parts) if parts else None

def geocode_address(address_str, retry_count=0):
    """Geocode an address to get coordinates and formatted details"""
    if not address_str or pd.isna(address_str):
        return None
    
    try:
        time.sleep(GEOCODING_DELAY)  # Respect rate limits
        location = geolocator.geocode(address_str, exactly_one=True)
        
        if location:
            return {
                'latitude': location.latitude,
                'longitude': location.longitude,
                'formatted_address': location.address,
                'raw': location.raw
            }
        return None
        
    except GeocoderTimedOut:
        if retry_count < MAX_RETRIES:
            time.sleep(2)
            return geocode_address(address_str, retry_count + 1)
        return None
    except GeocoderServiceError:
        return None
    except Exception as e:
        print(f"Error geocoding '{address_str}': {e}")
        return None

def calculate_location_quality(row):
    """Calculate quality score for location data"""
    score = 0
    max_score = 10
    
    # Has coordinates
    if pd.notna(row.get('latitude')) and pd.notna(row.get('longitude')):
        score += 4
    
    # Has full address
    if pd.notna(row.get('Address')) and row.get('Address'):
        score += 2
    
    # Has city
    if pd.notna(row.get('City')) and row.get('City'):
        score += 2
    
    # Has country
    if pd.notna(row.get('country_iso3')) and row.get('country_iso3'):
        score += 1
    
    # Phone validates country
    if row.get('phone_country_matches'):
        score += 1
    
    # Determine quality level
    quality = score / max_score
    if quality >= 0.8:
        return 'high', quality
    elif quality >= 0.5:
        return 'medium', quality
    else:
        return 'low', quality

def enrich_supplier_location(df, sample_size=None):
    """
    Add location data to supplier dataframe
    
    Args:
        df: Supplier dataframe
        sample_size: If provided, only process this many rows (for testing)
    """
    # Work on copy
    df = df.copy()
    
    print("=" * 80)
    print("SUPPLIER LOCATION ENRICHMENT")
    print("=" * 80)
    
    # Step 1: Standardize country names
    print("\n1. Standardizing country names...")
    country_data = df['Country'].apply(standardize_country_name)
    df['country_iso3'] = country_data.apply(lambda x: x[0] if x else None)
    df['country_standardized'] = country_data.apply(lambda x: x[1] if x else None)
    df['country_iso2'] = country_data.apply(lambda x: x[2] if x else None)
    
    unique_countries = df['country_standardized'].value_counts()
    print(f"   Found {len(unique_countries)} unique countries")
    print(f"   Top 5: {list(unique_countries.head().index)}")
    
    # Step 2: Parse phone numbers
    print("\n2. Parsing phone numbers for location validation...")
    df['phone_location'] = df['Phone'].apply(parse_phone_number)
    df['phone_country'] = df['phone_location'].apply(
        lambda x: x['country_name'] if x and x.get('country_name') else None
    )
    df['phone_country_code'] = df['phone_location'].apply(
        lambda x: x['country_code'] if x and x.get('country_code') else None
    )
    df['phone_valid'] = df['phone_location'].apply(
        lambda x: x['is_valid'] if x else False
    )
    
    # Check if phone country matches address country
    df['phone_country_matches'] = df.apply(
        lambda row: (
            pd.notna(row['phone_country']) and 
            pd.notna(row['country_standardized']) and 
            row['phone_country'].lower() in row['country_standardized'].lower()
        ) if pd.notna(row['phone_country']) else False,
        axis=1
    )
    
    phone_valid_count = df['phone_valid'].sum()
    phone_match_count = df['phone_country_matches'].sum()
    print(f"   Valid phone numbers: {phone_valid_count} ({phone_valid_count/len(df)*100:.1f}%)")
    print(f"   Phone-country matches: {phone_match_count} ({phone_match_count/len(df)*100:.1f}%)")
    
    # Step 3: Build search addresses
    print("\n3. Building geocoding addresses...")
    df['search_address'] = df.apply(build_search_address, axis=1)
    addressable_count = df['search_address'].notna().sum()
    print(f"   Suppliers with geocodable addresses: {addressable_count} ({addressable_count/len(df)*100:.1f}%)")
    
    # Step 4: Geocode addresses (with sample limit if specified)
    if sample_size:
        print(f"\n4. Geocoding addresses (SAMPLE: first {sample_size} with addresses)...")
        geocode_df = df[df['search_address'].notna()].head(sample_size)
        print(f"   Processing {len(geocode_df)} addresses...")
    else:
        print(f"\n4. Geocoding all {addressable_count} addresses...")
        print("   ⚠️  This will take approximately {:.1f} minutes".format(addressable_count * GEOCODING_DELAY / 60))
        print("   Press Ctrl+C to cancel if needed")
        geocode_df = df[df['search_address'].notna()]
    
    # Geocode
    geocoded_results = []
    for idx, row in geocode_df.iterrows():
        if (idx + 1) % 10 == 0:
            print(f"   Progress: {idx + 1}/{len(geocode_df)} ({(idx+1)/len(geocode_df)*100:.1f}%)")
        
        result = geocode_address(row['search_address'])
        geocoded_results.append({
            'index': idx,
            'result': result
        })
    
    # Apply geocoding results back to dataframe
    for item in geocoded_results:
        idx = item['index']
        result = item['result']
        if result:
            df.at[idx, 'latitude'] = result['latitude']
            df.at[idx, 'longitude'] = result['longitude']
            df.at[idx, 'formatted_address'] = result['formatted_address']
    
    geocoded_count = df['latitude'].notna().sum()
    print(f"\n   Successfully geocoded: {geocoded_count}/{len(geocode_df)} addresses")
    print(f"   Success rate: {geocoded_count/len(geocode_df)*100:.1f}%")
    
    # Step 5: Calculate location quality
    print("\n5. Calculating location quality scores...")
    quality_data = df.apply(calculate_location_quality, axis=1)
    df['location_quality'] = quality_data.apply(lambda x: x[0])
    df['location_quality_score'] = quality_data.apply(lambda x: x[1])
    
    quality_dist = df['location_quality'].value_counts()
    print(f"   Quality distribution:")
    for quality, count in quality_dist.items():
        print(f"     {quality:10s}: {count:4d} ({count/len(df)*100:.1f}%)")
    
    # Summary statistics
    print("\n" + "=" * 80)
    print("ENRICHMENT SUMMARY")
    print("=" * 80)
    print(f"Total suppliers: {len(df)}")
    print(f"Standardized countries: {df['country_iso3'].notna().sum()} ({df['country_iso3'].notna().sum()/len(df)*100:.1f}%)")
    print(f"Valid phone numbers: {phone_valid_count} ({phone_valid_count/len(df)*100:.1f}%)")
    print(f"Geocoded locations: {geocoded_count} ({geocoded_count/len(df)*100:.1f}%)")
    print(f"High quality locations: {(df['location_quality'] == 'high').sum()}")
    print(f"Medium quality locations: {(df['location_quality'] == 'medium').sum()}")
    print(f"Low quality locations: {(df['location_quality'] == 'low').sum()}")
    
    return df

def main():
    # Load supplier data
    base_path = r"g:\Rita\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data"
    supplier_file = f"{base_path}\\MVL_Suppliers_List_Feb-05-2026 .xlsx"
    
    print("Loading supplier data...")
    df = pd.read_excel(supplier_file)
    print(f"Loaded {len(df)} suppliers")
    
    # Ask user for sample or full processing
    print("\n" + "=" * 80)
    print("GEOCODING OPTIONS")
    print("=" * 80)
    print("Geocoding all suppliers will take significant time.")
    print(f"Estimated time for all {len(df)} suppliers: ~{len(df) * GEOCODING_DELAY / 60:.1f} minutes")
    print("\nOptions:")
    print("  1. Process SAMPLE (first 50 with addresses) - ~1 minute")
    print("  2. Process SAMPLE (first 200 with addresses) - ~4 minutes")
    print("  3. Process ALL suppliers - ~30+ minutes")
    print("  4. Skip geocoding, only enrich phone/country data")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == '1':
        enriched_df = enrich_supplier_location(df, sample_size=50)
    elif choice == '2':
        enriched_df = enrich_supplier_location(df, sample_size=200)
    elif choice == '3':
        enriched_df = enrich_supplier_location(df, sample_size=None)
    elif choice == '4':
        # Only do non-geocoding enrichment
        print("\nProcessing phone and country data only...")
        enriched_df = df.copy()
        
        # Standardize countries
        country_data = enriched_df['Country'].apply(standardize_country_name)
        enriched_df['country_iso3'] = country_data.apply(lambda x: x[0] if x else None)
        enriched_df['country_standardized'] = country_data.apply(lambda x: x[1] if x else None)
        enriched_df['country_iso2'] = country_data.apply(lambda x: x[2] if x else None)
        
        # Parse phones
        enriched_df['phone_location'] = enriched_df['Phone'].apply(parse_phone_number)
        enriched_df['phone_country'] = enriched_df['phone_location'].apply(
            lambda x: x['country_name'] if x and x.get('country_name') else None
        )
        
        print(f"✓ Enriched {len(enriched_df)} suppliers with country and phone data")
    else:
        print("Invalid choice. Exiting.")
        return
    
    # Save enriched data
    output_file = f"{base_path}\\MVL_Suppliers_List_ENRICHED.xlsx"
    enriched_df.to_excel(output_file, index=False)
    print(f"\n✓ Saved enriched data to: {output_file}")
    
    # Display sample of enriched data
    print("\n" + "=" * 80)
    print("SAMPLE OF ENRICHED DATA (First 5 with locations)")
    print("=" * 80)
    
    sample = enriched_df[enriched_df['latitude'].notna()].head(5)
    if len(sample) > 0:
        display_cols = ['No', 'Name', 'country_standardized', 'latitude', 'longitude', 
                       'location_quality', 'phone_country', 'phone_country_matches']
        print(sample[display_cols].to_string(index=False))
    else:
        print("No geocoded locations in this sample")
    
    # Save location summary
    location_summary = {
        'total_suppliers': len(enriched_df),
        'geocoded_count': int(enriched_df['latitude'].notna().sum()),
        'countries_standardized': int(enriched_df['country_iso3'].notna().sum()),
        'valid_phones': int(enriched_df['phone_valid'].sum()) if 'phone_valid' in enriched_df else 0,
        'quality_distribution': enriched_df['location_quality'].value_counts().to_dict() if 'location_quality' in enriched_df else {},
        'top_countries': enriched_df['country_standardized'].value_counts().head(10).to_dict()
    }
    
    summary_file = f"{base_path}\\location_enrichment_summary.json"
    with open(summary_file, 'w') as f:
        json.dump(location_summary, f, indent=2)
    
    print(f"\n✓ Saved summary to: {summary_file}")

if __name__ == "__main__":
    main()
