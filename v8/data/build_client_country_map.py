"""
Build a client-to-country mapping using intelligent multi-source detection.

Priority chain:
  1. Exact name match in suppliers.json → address.country_standardized
  2. Exact name match in suppliers.json → phone_validation.phone_country
  3. Phone number prefix analysis (e.g. +1 → US, +971 → UAE)
  4. Email domain TLD (e.g. .ae → UAE, .uk → UK, .us → US)
  5. Entity-based mapping (most frequent entity for this client)
  6. Default: United Arab Emirates
"""
import json, re
from collections import defaultdict

# ── Entity to country mapping ──────────────────────────────────────────
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
    'MW-OCS': 'United Arab Emirates',
}

# ── Expanded country normalization (cities, states, regions, typos) ────
COUNTRY_NORMALIZE = {
    # --- UAE ---
    'Dubai': 'United Arab Emirates',
    'Dubai, UAE': 'United Arab Emirates',
    'Abu Dhabi': 'United Arab Emirates',
    'Abu dhabi': 'United Arab Emirates',
    'Sharjah': 'United Arab Emirates',
    'Sharjah, Ajman, Umm Al-Qaiwain': 'United Arab Emirates',
    'Ajman': 'United Arab Emirates',
    'RAK': 'United Arab Emirates',
    'Ras Al Khaimah': 'United Arab Emirates',
    'Ras Alkhaimah': 'United Arab Emirates',
    'Fujairah': 'United Arab Emirates',
    'Umm Al Quwain': 'United Arab Emirates',
    'Al Ain': 'United Arab Emirates',
    'UAE': 'United Arab Emirates',
    'U.A.E': 'United Arab Emirates',
    'U.A.E.': 'United Arab Emirates',
    'Unted Arab Emirates': 'United Arab Emirates',
    '...': 'United Arab Emirates',  # garbage entry → default
    # --- Saudi Arabia ---
    'KSA': 'Saudi Arabia',
    'Riyadh': 'Saudi Arabia',
    'Riyadh/Kharj': 'Saudi Arabia',
    'Dammam': 'Saudi Arabia',
    'Dammam/Khobar/Dahran': 'Saudi Arabia',
    'Dammam/khobar/Dahran': 'Saudi Arabia',
    'Jeddah': 'Saudi Arabia',
    'Makkah': 'Saudi Arabia',
    'Khobar': 'Saudi Arabia',
    'Dahran': 'Saudi Arabia',
    'Jubail': 'Saudi Arabia',
    'Kingdom of Sadui Arabia': 'Saudi Arabia',
    'Kingdom of Saudi Arabia': 'Saudi Arabia',
    # --- Turkey ---
    'TURKEY': 'Turkey',
    'Türkiye': 'Turkey',
    'Turkiye': 'Turkey',
    'Istanbul': 'Turkey',
    'Istanbul (Anatolia)': 'Turkey',
    'Istanbul (Europe)': 'Turkey',
    'Ankara': 'Turkey',
    'Manisa': 'Turkey',
    'Kocaeli': 'Turkey',
    'Izmir': 'Turkey',
    'Bursa': 'Turkey',
    # --- Greece ---
    'Athens': 'Greece',
    'Athens/Piraeus/Salamina': 'Greece',
    'Piraeus': 'Greece',
    'Salamina': 'Greece',
    'Thessaloniki': 'Greece',
    'Chania': 'Greece',
    'Heraklion': 'Greece',
    # --- United States ---
    'USA': 'United States',
    'U.S.A': 'United States',
    'U.S.A.': 'United States',
    'US': 'United States',
    'Guam': 'United States',
    'Puerto Rico': 'United States',
    # US states
    'Alabama': 'United States', 'Alaska': 'United States',
    'Arizona': 'United States', 'Arkansas': 'United States',
    'California': 'United States', 'Colorado': 'United States',
    'Connecticut': 'United States', 'Delaware': 'United States',
    'Florida': 'United States', 'Georgia': 'United States',
    'Hawaii': 'United States', 'Idaho': 'United States',
    'Illinois': 'United States', 'Indiana': 'United States',
    'Iowa': 'United States', 'Kansas': 'United States',
    'Kentucky': 'United States', 'Louisiana': 'United States',
    'Maine': 'United States', 'Maryland': 'United States',
    'Massachusetts': 'United States', 'Michigan': 'United States',
    'Minnesota': 'United States', 'Mississippi': 'United States',
    'Missouri': 'United States', 'Montana': 'United States',
    'Nebraska': 'United States', 'Nevada': 'United States',
    'New Hampshire': 'United States', 'New Jersey': 'United States',
    'New Mexico': 'United States', 'New York': 'United States',
    'North Carolina': 'United States', 'North Dakota': 'United States',
    'Ohio': 'United States', 'Oklahoma': 'United States',
    'Oregon': 'United States', 'Pennsylvania': 'United States',
    'Rhode Island': 'United States', 'South Carolina': 'United States',
    'South Dakota': 'United States', 'Tennessee': 'United States',
    'Texas': 'United States', 'Utah': 'United States',
    'Vermont': 'United States', 'Virginia': 'United States',
    'Washington': 'United States', 'West Virginia': 'United States',
    'Wisconsin': 'United States', 'Wyoming': 'United States',
    # US cities / address fragments
    'Compton, CA': 'United States',
    'Lafayette, LA': 'United States',
    'Honolulu, HI': 'United States',
    'Newport News, VA': 'United States',
    '4350 East-West Highway, Suite 550': 'United States',
    'New York City': 'United States',
    'Los Angeles': 'United States',
    'Houston': 'United States',
    'Chicago': 'United States',
    # --- United Kingdom ---
    'UK': 'United Kingdom',
    'U.K.': 'United Kingdom',
    'England': 'United Kingdom',
    'Scotland': 'United Kingdom',
    'Wales': 'United Kingdom',
    'London': 'United Kingdom',
    'Bolton': 'United Kingdom',
    'Canterbury': 'United Kingdom',
    'Aberdeen': 'United Kingdom',
    'Manchester': 'United Kingdom',
    'Birmingham': 'United Kingdom',
    # --- China ---
    'Guangzhou, Guangdong': 'China',
    'Guangdong': 'China',
    'Guangzhou': 'China',
    'Zhengzhou, Henan': 'China',
    'Zhengzhou/Henan': 'China',
    'Henan': 'China',
    'Ningbo, Zhejiang': 'China',
    'Ningbo/Zhejiang': 'China',
    'Zhejiang': 'China',
    'Zhuzhou/Changsha/Xiangtan, Hunan': 'China',
    'Hunan': 'China',
    'Shanghai': 'China',
    'Beijing': 'China',
    'Shenzhen': 'China',
    'Tianjin': 'China',
    'Chongqing': 'China',
    'Jiangsu': 'China',
    'Shandong': 'China',
    'Chengdu': 'China',
    'Dalian': 'China',
    'Wuhan': 'China',
    'Qingdao': 'China',
    'Hong Kong': 'Hong Kong',
    # --- India ---
    'Maharashtra': 'India',
    'Karnataka': 'India',
    'Tamil Nadu': 'India',
    'Delhi': 'India',
    'New Delhi': 'India',
    'Mumbai': 'India',
    'Bangalore': 'India',
    'Chennai': 'India',
    'Hyderabad': 'India',
    'Pune': 'India',
    'Kolkata': 'India',
    # --- Egypt ---
    'Cairo': 'Egypt',
    'Cairo/Giza/Qalyubia': 'Egypt',
    'Giza': 'Egypt',
    'Alexandria': 'Egypt',
    # --- Afghanistan ---
    'Kabul': 'Afghanistan',
    'Afghanistani': 'Afghanistan',
    # --- Pakistan ---
    'Pakisatn': 'Pakistan',
    'Islamabad': 'Pakistan',
    'Karachi': 'Pakistan',
    'Lahore': 'Pakistan',
    # --- China typos ---
    'Shina': 'China',
    # --- Japan ---
    'Naha, Okinawa': 'Japan',
    'Okinawa': 'Japan',
    'Tokyo': 'Japan',
    'Osaka': 'Japan',
    # --- Germany ---
    'Wittlich': 'Germany',
    'Rudolf-Diesel-Str. 20 54516 Wittlich/Germany': 'Germany',
    'Marburg': 'Germany',
    'Munich': 'Germany',
    'Berlin': 'Germany',
    'Frankfurt': 'Germany',
    'Hamburg': 'Germany',
    # --- Ukraine ---
    'Kyiv city': 'Ukraine',
    'Kyiv': 'Ukraine',
    'Kiev': 'Ukraine',
    # --- Canada ---
    'Abbotsford, BC': 'Canada',
    'Abbotsford BC': 'Canada',
    'Windsor, ON': 'Canada',
    'Ontario': 'Canada',
    'Toronto': 'Canada',
    'Vancouver': 'Canada',
    'British Columbia': 'Canada',
    'Alberta': 'Canada',
    'Quebec': 'Canada',
    'Montreal': 'Canada',
    # --- Others ---
    'Doha': 'Qatar',
    'Muscat': 'Oman',
    'Manama': 'Bahrain',
    'Amman': 'Jordan',
    'Beirut': 'Lebanon',
    'Kuwait City': 'Kuwait',
    'Kathmandu': 'Nepal',
    'Seoul': 'South Korea',
    'Busan': 'South Korea',
    'Singapore': 'Singapore',
    'Bangkok': 'Thailand',
    'Kuala Lumpur': 'Malaysia',
    'Jakarta': 'Indonesia',
    'Sydney': 'Australia',
    'Melbourne': 'Australia',
    'Paris': 'France',
    'Rome': 'Italy',
    'Milan': 'Italy',
    'Madrid': 'Spain',
    'Barcelona': 'Spain',
    'Amsterdam': 'Netherlands',
    'Rotterdam': 'Netherlands',
    'Brussels': 'Belgium',
    'Zurich': 'Switzerland',
    'Vienna': 'Austria',
    'Warsaw': 'Poland',
    'Prague': 'Czech Republic',
    'Lisbon': 'Portugal',
    'Stockholm': 'Sweden',
    'Oslo': 'Norway',
    'Copenhagen': 'Denmark',
    'Helsinki': 'Finland',
    'Dublin': 'Ireland',
}

# ── Phone prefix → country (longest-prefix-first matching) ────────────
PHONE_PREFIX_COUNTRY = {
    '+1': 'United States',
    '+7': 'Russia',
    '+20': 'Egypt',
    '+27': 'South Africa',
    '+30': 'Greece',
    '+31': 'Netherlands',
    '+32': 'Belgium',
    '+33': 'France',
    '+34': 'Spain',
    '+36': 'Hungary',
    '+39': 'Italy',
    '+40': 'Romania',
    '+41': 'Switzerland',
    '+43': 'Austria',
    '+44': 'United Kingdom',
    '+45': 'Denmark',
    '+46': 'Sweden',
    '+47': 'Norway',
    '+48': 'Poland',
    '+49': 'Germany',
    '+51': 'Peru',
    '+52': 'Mexico',
    '+53': 'Cuba',
    '+54': 'Argentina',
    '+55': 'Brazil',
    '+56': 'Chile',
    '+57': 'Colombia',
    '+60': 'Malaysia',
    '+61': 'Australia',
    '+62': 'Indonesia',
    '+63': 'Philippines',
    '+64': 'New Zealand',
    '+65': 'Singapore',
    '+66': 'Thailand',
    '+81': 'Japan',
    '+82': 'South Korea',
    '+84': 'Vietnam',
    '+86': 'China',
    '+90': 'Turkey',
    '+91': 'India',
    '+92': 'Pakistan',
    '+93': 'Afghanistan',
    '+94': 'Sri Lanka',
    '+95': 'Myanmar',
    '+212': 'Morocco',
    '+213': 'Algeria',
    '+216': 'Tunisia',
    '+218': 'Libya',
    '+220': 'Gambia',
    '+234': 'Nigeria',
    '+249': 'Sudan',
    '+254': 'Kenya',
    '+255': 'Tanzania',
    '+256': 'Uganda',
    '+260': 'Zambia',
    '+351': 'Portugal',
    '+353': 'Ireland',
    '+358': 'Finland',
    '+370': 'Lithuania',
    '+371': 'Latvia',
    '+372': 'Estonia',
    '+380': 'Ukraine',
    '+381': 'Serbia',
    '+385': 'Croatia',
    '+386': 'Slovenia',
    '+420': 'Czech Republic',
    '+421': 'Slovakia',
    '+852': 'Hong Kong',
    '+853': 'Macau',
    '+855': 'Cambodia',
    '+856': 'Laos',
    '+880': 'Bangladesh',
    '+960': 'Maldives',
    '+961': 'Lebanon',
    '+962': 'Jordan',
    '+963': 'Syria',
    '+964': 'Iraq',
    '+965': 'Kuwait',
    '+966': 'Saudi Arabia',
    '+967': 'Yemen',
    '+968': 'Oman',
    '+970': 'Palestine',
    '+971': 'United Arab Emirates',
    '+972': 'Israel',
    '+973': 'Bahrain',
    '+974': 'Qatar',
    '+975': 'Bhutan',
    '+976': 'Mongolia',
    '+977': 'Nepal',
    '+992': 'Tajikistan',
    '+993': 'Turkmenistan',
    '+994': 'Azerbaijan',
    '+995': 'Georgia',
    '+996': 'Kyrgyzstan',
    '+998': 'Uzbekistan',
}

# ── Email TLD → country ───────────────────────────────────────────────
EMAIL_TLD_COUNTRY = {
    '.ae': 'United Arab Emirates',
    '.us': 'United States',
    '.uk': 'United Kingdom',
    '.co.uk': 'United Kingdom',
    '.ca': 'Canada',
    '.au': 'Australia',
    '.nz': 'New Zealand',
    '.de': 'Germany',
    '.fr': 'France',
    '.es': 'Spain',
    '.it': 'Italy',
    '.nl': 'Netherlands',
    '.be': 'Belgium',
    '.at': 'Austria',
    '.ch': 'Switzerland',
    '.se': 'Sweden',
    '.no': 'Norway',
    '.dk': 'Denmark',
    '.fi': 'Finland',
    '.ie': 'Ireland',
    '.pt': 'Portugal',
    '.pl': 'Poland',
    '.cz': 'Czech Republic',
    '.gr': 'Greece',
    '.tr': 'Turkey',
    '.ru': 'Russia',
    '.ua': 'Ukraine',
    '.in': 'India',
    '.cn': 'China',
    '.jp': 'Japan',
    '.kr': 'South Korea',
    '.sg': 'Singapore',
    '.my': 'Malaysia',
    '.th': 'Thailand',
    '.id': 'Indonesia',
    '.ph': 'Philippines',
    '.vn': 'Vietnam',
    '.pk': 'Pakistan',
    '.bd': 'Bangladesh',
    '.lk': 'Sri Lanka',
    '.np': 'Nepal',
    '.af': 'Afghanistan',
    '.sa': 'Saudi Arabia',
    '.kw': 'Kuwait',
    '.qa': 'Qatar',
    '.om': 'Oman',
    '.bh': 'Bahrain',
    '.jo': 'Jordan',
    '.lb': 'Lebanon',
    '.eg': 'Egypt',
    '.ng': 'Nigeria',
    '.za': 'South Africa',
    '.ke': 'Kenya',
    '.br': 'Brazil',
    '.mx': 'Mexico',
    '.ar': 'Argentina',
    '.cl': 'Chile',
    '.co': 'Colombia',
    '.il': 'Israel',
    '.iq': 'Iraq',
    '.ir': 'Iran',
    '.hk': 'Hong Kong',
}

# ── Known client→country overrides (from manual investigation) ────────
KNOWN_CLIENT_COUNTRY = {
    'Greetly': 'United States',
    'Lowes': 'United States',
    'Monje': 'United States',
    'Oriflow': 'United States',
    'Parsons': 'United States',
    'Rock-n-rescue': 'United States',
    'Sbs': 'United States',
    'Turtle': 'United States',
    'Uline': 'United States',
    'Asmatullah': 'Afghanistan',
    'Hamidullah': 'Afghanistan',
    'Jotun Afghanistan': 'Afghanistan',
    'Lutfudden': 'Afghanistan',
    'Rayan': 'Afghanistan',
    'Ael': 'United Kingdom',
    'Meka': 'Turkey',
    'Venco': 'Turkey',
    'Vents': 'Ukraine',
    'Powertech': 'Qatar',
    'Accura': 'United Arab Emirates',
    'Enventrol': 'United Arab Emirates',
    'Gasos': 'United Arab Emirates',
    'Getmax': 'United Arab Emirates',
    'Microless': 'United Arab Emirates',
    'Noon.com': 'United Arab Emirates',
    'Stationerydubai': 'United Arab Emirates',
    'Vortex': 'United Arab Emirates',
}


# ═══════════════════════════════════════════════════════════════════════
# Helper functions
# ═══════════════════════════════════════════════════════════════════════

def normalize_country(raw):
    """Normalize a raw country/city/state string to a proper country name."""
    if not raw or not isinstance(raw, str):
        return None
    raw = raw.strip()
    if not raw:
        return None
    # Exact match first
    if raw in COUNTRY_NORMALIZE:
        return COUNTRY_NORMALIZE[raw]
    # Case-insensitive match
    raw_lower = raw.lower()
    for key, val in COUNTRY_NORMALIZE.items():
        if key.lower() == raw_lower:
            return val
    # If it already looks like a proper country name, keep it
    if len(raw) > 3 and raw[0].isupper() and ',' not in raw and '/' not in raw:
        return raw
    return raw  # return as-is; will be checked later


def detect_country_from_phone(phone_str):
    """Detect country from a phone number string by prefix matching."""
    if not phone_str or not isinstance(phone_str, str):
        return None
    phone = phone_str.strip().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    if not phone.startswith('+'):
        return None
    # Try longest prefix first for specificity
    sorted_prefixes = sorted(PHONE_PREFIX_COUNTRY.keys(), key=len, reverse=True)
    for prefix in sorted_prefixes:
        if phone.startswith(prefix):
            return PHONE_PREFIX_COUNTRY[prefix]
    return None


def detect_country_from_email(email_str):
    """Detect country from email domain TLD."""
    if not email_str or not isinstance(email_str, str):
        return None
    email = email_str.strip().lower()
    if '@' not in email:
        return None
    domain = email.split('@')[-1]
    # Try longest TLD first (e.g., .co.uk before .uk)
    sorted_tlds = sorted(EMAIL_TLD_COUNTRY.keys(), key=len, reverse=True)
    for tld in sorted_tlds:
        if domain.endswith(tld):
            return EMAIL_TLD_COUNTRY[tld]
    return None


def build_supplier_lookup(suppliers_data):
    """Build a multi-key lookup dict: various name forms → supplier record."""
    lookup = {}
    for s in suppliers_data.get('suppliers', []):
        name = s.get('name', '')
        if not name:
            continue
        # Exact name
        lookup[name] = s
        # Lowercase
        lookup[name.lower()] = s
        # Stripped (no punctuation)
        stripped = re.sub(r'[^a-z0-9\s]', '', name.lower()).strip()
        if stripped:
            lookup[stripped] = s
        # First word (for single-word supplier matches like "Uline", "Parsons")
        first_word = name.split()[0].lower() if name.split() else ''
        if first_word and len(first_word) > 3 and first_word not in lookup:
            lookup[first_word] = s
    return lookup


def get_supplier_country(supplier):
    """
    Determine country from a supplier record using priority chain:
      1. address.country_standardized
      2. phone_validation.phone_country
      3. Phone number prefix detection
      4. Email TLD detection
    Returns (country, source) or (None, None).
    """
    # 1. Address country
    addr = supplier.get('address', {}) or {}
    addr_country = addr.get('country_standardized') or addr.get('country')
    if addr_country:
        normalized = normalize_country(addr_country)
        if normalized:
            return normalized, 'address'

    # 2. Phone validation country
    pv = supplier.get('phone_validation', {}) or {}
    pv_country = pv.get('phone_country')
    if pv_country:
        normalized = normalize_country(pv_country)
        if normalized:
            return normalized, 'phone_validation'

    # 3. Phone prefix detection
    phone = supplier.get('phone') or ''
    if phone:
        detected = detect_country_from_phone(phone)
        if detected:
            return detected, 'phone_prefix'

    # 4. Email TLD detection
    email = supplier.get('email') or ''
    if email:
        detected = detect_country_from_email(email)
        if detected:
            return detected, 'email_tld'

    return None, None


# ═══════════════════════════════════════════════════════════════════════
# Main Pipeline
# ═══════════════════════════════════════════════════════════════════════

def main():
    # Load data
    with open('sm_data.json', 'r', encoding='utf-8') as f:
        sm_data = json.load(f)
    with open('suppliers.json', 'r', encoding='utf-8') as f:
        suppliers_data = json.load(f)

    # Build supplier lookup (multi-key)
    supplier_lookup = build_supplier_lookup(suppliers_data)

    # Build client-entity frequency map from SM data
    client_entity_freq = defaultdict(lambda: defaultdict(int))
    client_total_value = defaultdict(float)

    for q in sm_data.get('workbench', []):
        client = q.get('Client')
        entity = q.get('Entity')
        value = q.get('QuotationValue', 0) or 0
        if client and entity:
            client_entity_freq[client][entity] += 1
            client_total_value[client] += value

    # Get all unique clients
    all_clients = set(client_entity_freq.keys())
    print(f"Total unique clients in SM data: {len(all_clients)}")

    # Stats
    stats = defaultdict(int)
    client_country_map = {}

    for client in sorted(all_clients):
        country = None
        source = 'default'

        # ── Step 0: Known overrides ──
        # Check known client overrides first (case-insensitive)
        for known_name, known_country in KNOWN_CLIENT_COUNTRY.items():
            if client.lower() == known_name.lower() or client.lower().startswith(known_name.lower()):
                country = known_country
                source = 'known_override'
                break

        # ── Step 1: Supplier data match ──
        if not country:
            sup = (supplier_lookup.get(client) or
                   supplier_lookup.get(client.lower()) or
                   supplier_lookup.get(re.sub(r'[^a-z0-9\s]', '', client.lower()).strip()))

            # Also try first-word match if no exact match
            if not sup and client.split():
                first = client.split()[0].lower()
                if len(first) > 3:
                    sup = supplier_lookup.get(first)

            if sup:
                country, source = get_supplier_country(sup)

        # ── Step 2: Entity-based fallback ──
        if not country:
            entities = client_entity_freq.get(client, {})
            if entities:
                primary_entity = max(entities, key=entities.get)
                entity_country = ENTITY_COUNTRY_MAP.get(primary_entity)
                if entity_country:
                    country = entity_country
                    source = 'entity'

        # ── Step 3: Default to UAE ──
        if not country:
            country = 'United Arab Emirates'
            source = 'default'

        # Final normalization pass
        country = normalize_country(country) or country

        client_country_map[client] = country
        stats[source] += 1

    # ── Print statistics ──
    print(f"\nTotal clients mapped: {len(client_country_map)}")
    print(f"\nSource breakdown:")
    for src, count in sorted(stats.items(), key=lambda x: -x[1]):
        print(f"  {src}: {count}")

    # Country distribution
    country_dist = defaultdict(int)
    for c in client_country_map.values():
        country_dist[c] += 1
    print(f"\nCountry distribution (top 20):")
    for country, count in sorted(country_dist.items(), key=lambda x: -x[1])[:20]:
        print(f"  {country}: {count}")

    # Check for any remaining non-standard values
    standard_countries = {
        'United Arab Emirates', 'United States', 'United Kingdom', 'Saudi Arabia',
        'Turkey', 'Greece', 'Italy', 'China', 'India', 'Japan', 'Germany',
        'France', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
        'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal',
        'Poland', 'Czech Republic', 'Ukraine', 'Russia', 'Canada', 'Australia',
        'New Zealand', 'South Korea', 'Singapore', 'Malaysia', 'Thailand',
        'Indonesia', 'Philippines', 'Vietnam', 'Pakistan', 'Bangladesh',
        'Sri Lanka', 'Nepal', 'Afghanistan', 'Kuwait', 'Qatar', 'Oman',
        'Bahrain', 'Jordan', 'Lebanon', 'Iraq', 'Iran', 'Israel', 'Palestine',
        'Egypt', 'Nigeria', 'South Africa', 'Kenya', 'Brazil', 'Mexico',
        'Argentina', 'Chile', 'Colombia', 'Hong Kong', 'Taiwan', 'Hungary',
        'Romania', 'Croatia', 'Serbia', 'Slovenia', 'Slovakia', 'Lithuania',
        'Latvia', 'Estonia', 'Bulgaria', 'Morocco', 'Algeria', 'Tunisia',
        'Libya', 'Sudan', 'Syria', 'Yemen', 'Myanmar', 'Cambodia', 'Laos',
        'Mongolia', 'Georgia', 'Azerbaijan', 'Armenia', 'Uzbekistan',
        'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Maldives', 'Bhutan',
        'Cuba', 'Peru', 'Macau',
        'Central African Republic', 'Ethiopia', 'Uganda',
        'Niger', 'Marshall Islands',
    }
    non_standard = {c for c in country_dist if c not in standard_countries}
    if non_standard:
        print(f"\n⚠ Non-standard country values still present:")
        for c in sorted(non_standard):
            print(f"  '{c}' ({country_dist[c]} clients)")
    else:
        print(f"\n✓ All country values are standard!")

    # Save the mapping
    with open('client_country_map.json', 'w', encoding='utf-8') as f:
        json.dump(client_country_map, f, indent=2, ensure_ascii=False)
    print(f"\nSaved client_country_map.json with {len(client_country_map)} mappings")


if __name__ == '__main__':
    main()
