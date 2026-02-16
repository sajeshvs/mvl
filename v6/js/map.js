// ─── V6 Supply Chain Intel Hub — Leaflet Map Module ─────────────
// ES module: import { renderSupplierMap, destroyMap } from './map.js'

import { state } from './state.js';
import { formatCurrency, formatNumber } from './utils.js';

// ─── Map Instance ───────────────────────────────────────────────

let mapInstance = null;
let markersLayer = null;

// ─── Country Coordinates Lookup ─────────────────────────────────

const COUNTRY_COORDS = {
  'Afghanistan':        [33.93, 67.71],
  'Albania':            [41.15, 20.17],
  'Algeria':            [28.03, 1.66],
  'Argentina':          [-38.42, -63.62],
  'Australia':          [-25.27, 133.78],
  'Austria':            [47.52, 14.55],
  'Bahrain':            [26.07, 50.55],
  'Bangladesh':         [23.68, 90.36],
  'Belgium':            [50.50, 4.47],
  'Brazil':             [-14.24, -51.93],
  'Canada':             [56.13, -106.35],
  'Chile':              [-35.68, -71.54],
  'China':              [35.86, 104.20],
  'Colombia':           [4.57, -74.30],
  'Croatia':            [45.10, 15.20],
  'Cyprus':             [35.13, 33.43],
  'Czech Republic':     [49.82, 15.47],
  'Denmark':            [56.26, 9.50],
  'Egypt':              [26.82, 30.80],
  'Estonia':            [58.60, 25.01],
  'Ethiopia':           [9.15, 40.49],
  'Finland':            [61.92, 25.75],
  'France':             [46.23, 2.21],
  'Germany':            [51.17, 10.45],
  'Ghana':              [7.95, -1.02],
  'Greece':             [39.07, 21.82],
  'Hong Kong':          [22.40, 114.11],
  'Hungary':            [47.16, 19.50],
  'India':              [20.59, 78.96],
  'Indonesia':          [-0.79, 113.92],
  'Iran':               [32.43, 53.69],
  'Iraq':               [33.22, 43.68],
  'Ireland':            [53.14, -7.69],
  'Israel':             [31.05, 34.85],
  'Italy':              [41.87, 12.57],
  'Japan':              [36.20, 138.25],
  'Jordan':             [30.59, 36.24],
  'Kazakhstan':         [48.02, 66.92],
  'Kenya':              [-0.02, 37.91],
  'Kuwait':             [29.31, 47.48],
  'Latvia':             [56.88, 24.60],
  'Lebanon':            [33.85, 35.86],
  'Libya':              [26.34, 17.23],
  'Lithuania':          [55.17, 23.88],
  'Luxembourg':         [49.82, 6.13],
  'Malaysia':           [4.21, 101.98],
  'Mexico':             [23.63, -102.55],
  'Morocco':            [31.79, -7.09],
  'Nepal':              [28.39, 84.12],
  'Netherlands':        [52.13, 5.29],
  'New Zealand':        [-40.90, 174.89],
  'Nigeria':            [9.08, 8.68],
  'Norway':             [60.47, 8.47],
  'Oman':               [21.47, 55.98],
  'Pakistan':           [30.38, 69.35],
  'Peru':               [-9.19, -75.02],
  'Philippines':        [12.88, 121.77],
  'Poland':             [51.92, 19.15],
  'Portugal':           [39.40, -8.22],
  'Qatar':              [25.35, 51.18],
  'Romania':            [45.94, 24.97],
  'Russia':             [61.52, 105.32],
  'Saudi Arabia':       [23.89, 45.08],
  'Serbia':             [44.02, 21.01],
  'Singapore':          [1.35, 103.82],
  'Slovakia':           [48.67, 19.70],
  'Slovenia':           [46.15, 14.99],
  'South Africa':       [-30.56, 22.94],
  'South Korea':        [35.91, 127.77],
  'Spain':              [40.46, -3.75],
  'Sri Lanka':          [7.87, 80.77],
  'Sweden':             [60.13, 18.64],
  'Switzerland':        [46.82, 8.23],
  'Taiwan':             [23.70, 120.96],
  'Thailand':           [15.87, 100.99],
  'Tunisia':            [33.89, 9.54],
  'Turkey':             [38.96, 35.24],
  'UAE':                [23.42, 53.85],
  'United Arab Emirates': [23.42, 53.85],
  'Ukraine':            [48.38, 31.17],
  'United Kingdom':     [55.38, -3.44],
  'UK':                 [55.38, -3.44],
  'United States':      [37.09, -95.71],
  'USA':                [37.09, -95.71],
  'US':                 [37.09, -95.71],
  'Uruguay':            [-32.52, -55.77],
  'Uzbekistan':         [41.38, 64.59],
  'Venezuela':          [6.42, -66.59],
  'Vietnam':            [14.06, 108.28],
  'Yemen':              [15.55, 48.52],
  'Zambia':             [-13.13, 28.64],
  'Zimbabwe':           [-19.02, 29.15]
};

// ─── Render Supplier Map ────────────────────────────────────────

export function renderSupplierMap(filteredQuotations) {
  const container = document.getElementById('supplierMap');
  if (!container) return;

  // Aggregate quotations by country via client → country lookup
  const countryAgg = {};
  const clientCountryMap = state.clientCountryMap || {};

  (filteredQuotations || []).forEach(q => {
    const client = q.client || '';
    const country = clientCountryMap[client] || clientCountryMap[client.toLowerCase()] || null;
    if (!country) return;

    const key = country;
    if (!countryAgg[key]) {
      countryAgg[key] = {
        country: key,
        clients: new Set(),
        quotationCount: 0,
        totalValueUSD: 0
      };
    }
    countryAgg[key].clients.add(client);
    countryAgg[key].quotationCount++;
    countryAgg[key].totalValueUSD += Number(q.valueUSD) || 0;
  });

  const countryData = Object.values(countryAgg).map(c => ({
    country:        c.country,
    supplierCount:  c.clients.size,
    quotationCount: c.quotationCount,
    totalValueUSD:  c.totalValueUSD
  }));

  // ── Create or update map ──────────────────────────────────────
  if (!mapInstance) {
    // Ensure container has a height
    if (!container.style.height && container.offsetHeight < 100) {
      container.style.height = '400px';
    }

    mapInstance = L.map(container, {
      center: [25, 50],
      zoom: 3,
      scrollWheelZoom: true,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(mapInstance);

    // Fix Leaflet tile rendering after container resize
    setTimeout(() => mapInstance.invalidateSize(), 200);
  }

  // Clear existing markers
  if (markersLayer) {
    mapInstance.removeLayer(markersLayer);
  }
  markersLayer = L.layerGroup().addTo(mapInstance);

  // ── Place markers ─────────────────────────────────────────────
  if (countryData.length === 0) return;

  const maxValue = Math.max(...countryData.map(c => c.totalValueUSD), 1);

  countryData.forEach(c => {
    const coords = lookupCoords(c.country);
    if (!coords) return;

    // Proportional radius: min 6, max 35
    const ratio = c.totalValueUSD / maxValue;
    const radius = 6 + ratio * 29;

    const marker = L.circleMarker(coords, {
      radius,
      fillColor: '#004578',
      color: '#003460',
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: 0.55
    });

    marker.bindPopup(`
      <div style="min-width:160px;">
        <strong style="font-size:14px;color:#004578;">${c.country}</strong>
        <hr style="margin:6px 0;border-color:#e0e0e0;">
        <div style="font-size:12px;line-height:1.8;">
          <div>📋 Quotations: <strong>${formatNumber(c.quotationCount)}</strong></div>
          <div>💰 Total Value: <strong>${formatCurrency(c.totalValueUSD)}</strong></div>
          <div>🏢 Clients: <strong>${formatNumber(c.supplierCount)}</strong></div>
        </div>
      </div>
    `);

    marker.addTo(markersLayer);
  });

  // ── Legend ────────────────────────────────────────────────────
  addLegend();
}

// ─── Destroy Map ────────────────────────────────────────────────

export function destroyMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markersLayer = null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function lookupCoords(country) {
  if (!country) return null;

  // Direct match
  if (COUNTRY_COORDS[country]) return COUNTRY_COORDS[country];

  // Case-insensitive match
  const lower = country.toLowerCase();
  for (const [key, coords] of Object.entries(COUNTRY_COORDS)) {
    if (key.toLowerCase() === lower) return coords;
  }

  // Partial match (e.g., "United Arab Emirates" → "UAE")
  for (const [key, coords] of Object.entries(COUNTRY_COORDS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return coords;
    }
  }

  return null;
}

function addLegend() {
  // Remove existing legend
  const existing = document.querySelector('.map-legend');
  if (existing) existing.remove();

  // Only add if map container exists
  const container = document.getElementById('supplierMap');
  if (!container) return;

  const legend = document.createElement('div');
  legend.className = 'map-legend';
  legend.style.cssText = `
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(255,255,255,0.92);
    padding: 10px 14px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-size: 11px;
    line-height: 1.6;
    z-index: 1000;
    pointer-events: auto;
  `;

  legend.innerHTML = `
    <div style="font-weight:700;margin-bottom:4px;color:#004578;">Supplier Map</div>
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#004578;opacity:0.55;"></span>
      <span>Circle size = Total Value (USD)</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#004578;opacity:0.55;"></span>
      Small &nbsp;
      <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#004578;opacity:0.55;"></span>
      Large
    </div>
  `;

  // Position relative to map container
  container.style.position = 'relative';
  container.appendChild(legend);
}
