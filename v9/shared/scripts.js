/**
 * V8 Supply Chain Intel Hub - Main JavaScript
 * Unified dashboard with Excel-based data pipeline
 */

// ============================================
// GLOBAL STATE
// ============================================
let dashboardData = null;
let selectedSupplier = null;
let suppliersData = null;
let purchaseOrdersData = null;
let quotationsData = null;
let gsaData = null;
let smData = null;
let mdData = null;
let clientCountryMap = null;

// Chart instances (for Chart.js)
let trendChartInstance = null;
let quotationTimeChartInstance = null;
let entityChartInstance = null;
let materialChartInstance = null;
let supplierMap = null;

// Chart state
let currentEntityView = 'quote';
let currentMaterialChartType = 'bar';

// Global FX Rates (for currency conversion)
let fxRates = {
    USD: 1.00,
    AED: 3.67,
    EUR: 0.92,
    EURO: 0.92,
    GBP: 0.79,
    SAR: 3.75,
    INR: 83.12,
    QAR: 3.64,
    BHD: 0.38,
    KWD: 0.31,
    OMR: 0.38,
    NPR: 133.5,
    JPY: 149.5,
    ZAR: 18.5,
    SGD: 1.34,
    PKR: 278,
    EGP: 30.9,
    JOD: 0.709,
    LKR: 320
};

// ============================================
// FX RATES - LIVE CURRENCY CONVERSION
// ============================================

// Convert any currency amount to USD using current rates
function convertToUSD(amount, currency) {
    if (!amount || isNaN(amount)) return 0;

    // Normalize currency code
    const curr = (currency || 'USD').toUpperCase().trim();

    // If already USD, return as is
    if (curr === 'USD' || curr === 'US$' || curr === '$') {
        return parseFloat(amount);
    }

    // Get rate (how many of that currency = 1 USD)
    const rate = fxRates[curr];

    if (rate) {
        // Convert: amount in foreign currency / rate = USD
        return parseFloat(amount) / rate;
    }

    // If unknown currency, assume it's already USD
    console.warn(`Unknown currency: ${curr}, treating as USD`);
    return parseFloat(amount);
}

// Format currency with conversion to USD
function formatCurrencyUSD(amount, sourceCurrency) {
    const usdAmount = convertToUSD(amount, sourceCurrency);
    return formatCurrencyShort(usdAmount);
}
async function refreshFxRates() {
    const refreshBtn = document.querySelector('.fx-refresh-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('fx-loading');
    }

    try {
        // Using free exchangerate.host API (no API key required)
        // Alternative: https://open.er-api.com/v6/latest/USD
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();

        if (data && data.rates) {
            const rates = data.rates;

            // Store all rates globally for conversion use
            fxRates = {
                USD: 1.00,
                AED: rates.AED || 3.67,
                EUR: rates.EUR || 0.92,
                GBP: rates.GBP || 0.79,
                SAR: rates.SAR || 3.75,
                INR: rates.INR || 83.12,
                QAR: rates.QAR || 3.64,
                BHD: rates.BHD || 0.38,
                KWD: rates.KWD || 0.31,
                OMR: rates.OMR || 0.38
            };

            // Update display values
            const usdAed = document.getElementById('fxUsdAed');
            const eurUsd = document.getElementById('fxEurUsd');
            const gbpUsd = document.getElementById('fxGbpUsd');
            const sarUsd = document.getElementById('fxSarUsd');

            // USD to AED
            if (usdAed && rates.AED) {
                usdAed.textContent = rates.AED.toFixed(2);
            }

            // EUR to USD (we need 1/rates.EUR since API gives USD as base)
            if (eurUsd && rates.EUR) {
                const eurToUsd = (1 / rates.EUR).toFixed(2);
                eurUsd.textContent = eurToUsd;
            }

            // GBP to USD
            if (gbpUsd && rates.GBP) {
                const gbpToUsd = (1 / rates.GBP).toFixed(2);
                gbpUsd.textContent = gbpToUsd;
            }

            // SAR to USD
            if (sarUsd && rates.SAR) {
                const sarToUsd = (1 / rates.SAR).toFixed(2);
                sarUsd.textContent = sarToUsd;
            }

            console.log('💱 FX rates updated from API:', fxRates);

            // Refresh all tab displays with new rates
            refreshAllTabsWithNewRates();
        }
    } catch (error) {
        console.warn('⚠️ Could not fetch live FX rates, using defaults:', error.message);
        // Keep default values if API fails
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('fx-loading');
        }
    }
}

// Refresh all tabs when FX rates change
function refreshAllTabsWithNewRates() {
    // Get active tab
    const activeTab = document.querySelector('.nav-tab.active');
    if (!activeTab) return;

    const tabId = activeTab.dataset.tab;

    // Refresh based on active tab
    if (tabId === 'supplier-marketplace' && dashboardData) {
        renderSupplierMarketplace();
    } else if (tabId === 'global-spend' && gsaData) {
        initGlobalSpendAnalysis();
    } else if (tabId === 'materials-disciplines' && mdData) {
        initMaterialsDisciplines();
    }

    console.log('🔄 Refreshed displays with new FX rates');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Supply Chain Intel Hub v8 initializing...');

    // Load all data sources
    await loadAllData();

    // Initialize UI
    initNavigationTabs();
    initFilters();
    initBottomTabs();

    // Render initial view
    if (dashboardData) {
        renderSupplierMarketplace();
    }

    // Load live FX rates
    refreshFxRates();

    console.log('✅ Dashboard initialized');
});

// ============================================
// DATA LOADING
// ============================================
async function loadAllData() {
    try {
        // Load all data files in parallel
        const [suppliersRes, posRes, quotesRes, dashRes, gsaRes, smRes, mdRes] = await Promise.all([
            fetch('data/suppliers.json'),
            fetch('data/purchase_orders.json'),
            fetch('data/quotations.json'),
            fetch('data/dashboard_data.json'),
            fetch('data/gsa_data.json'),
            fetch('data/sm_data.json'),
            fetch('data/md_data.json')
        ]);

        // Load client country map separately (optional file)
        let clientMapRes = null;
        try {
            clientMapRes = await fetch('data/client_country_map.json');
            if (clientMapRes.ok) {
                clientCountryMap = await clientMapRes.json();
            } else {
                clientCountryMap = {};
            }
        } catch (e) {
            clientCountryMap = {};
        }

        suppliersData = await suppliersRes.json();
        purchaseOrdersData = await posRes.json();
        quotationsData = await quotesRes.json();
        dashboardData = await dashRes.json();
        gsaData = await gsaRes.json();
        smData = await smRes.json();
        mdData = await mdRes.json();
        console.log('📊 Loaded client country map:', Object.keys(clientCountryMap || {}).length, 'mappings');

        // Load conversion times data (optional)
        try {
            const ctRes = await fetch('data/conversion_times.json');
            if (ctRes.ok) {
                window._conversionTimes = await ctRes.json();
                console.log('📊 Loaded conversion times:', window._conversionTimes?.totalLinked || 0, 'linked records');
            }
        } catch (e) {
            window._conversionTimes = null;
        }

        // Load change orders data (optional)
        try {
            const coRes = await fetch('data/change_orders.json');
            if (coRes.ok) {
                window._changeOrders = await coRes.json();
                console.log('📊 Loaded change orders:', window._changeOrders?.totalGroups || 0, 'groups');
            }
        } catch (e) {
            window._changeOrders = null;
        }

        console.log('📊 Loaded suppliers:', suppliersData?.metadata?.total_records || 0);
        console.log('📊 Loaded POs:', purchaseOrdersData?.metadata?.total_records || 0);
        console.log('📊 Loaded quotations:', quotationsData?.metadata?.total_records || 0);
        console.log('📊 Loaded GSA data:', gsaData?.workbench?.length || 0, 'POs');
        console.log('📊 Loaded SM data:', smData?.summary?.totalQuotations || 0, 'quotations');
        console.log('📊 Loaded MD data:', mdData?.summary?.materialCodeCount || 0, 'material codes');

        // Process and enrich dashboard data with real data
        enrichDashboardWithRealData();

        // Update last refresh
        document.getElementById('lastRefresh').textContent =
            new Date().toLocaleString('en-US', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

    } catch (error) {
        console.error('❌ Failed to load data:', error);
        // Try loading just dashboard data as fallback
        try {
            const response = await fetch('data/dashboard_data.json');
            dashboardData = await response.json();
        } catch (e) {
            dashboardData = getFallbackData();
        }
    }
}

function enrichDashboardWithRealData() {
    // Use smData (v3 supplier marketplace data) if available
    if (smData && smData.summary) {
        console.log('📊 Using pre-calculated Supplier Marketplace data from smData');

        // Summary KPIs from smData — PO/CO values sourced from gsaData to match GSA tab (Q1-Q3)
        // Q4: Quote value includes tax
        const quoteValueWithTax = (smData.summary.totalQuotationValueUSD || 0) + (smData.summary.totalQuotationTaxUSD || 0);
        dashboardData.summary = {
            rfqCount: smData.summary.totalQuotations || 0,
            quoteValue: quoteValueWithTax,
            poCount: gsaData?.summary?.totalPOs || smData.summary.totalPOs || 0,
            poValue: gsaData?.summary?.totalSpendUSD || smData.summary.totalPOSpendUSD || 0,
            winRate: smData.summary.winRate || 0,
            coCount: gsaData?.summary?.changeOrders || 0,
            coValue: gsaData?.summary?.changeOrderValue || 0,
            openQuotes: smData.funnel?.Quotation || 0,
            conversionRate: smData.summary.winRate || 0,
            totalQuotationTaxUSD: smData.summary.totalQuotationTaxUSD || 0
        };

        // Status chart from statusSummary
        if (smData.statusSummary) {
            dashboardData.supplierMarketplace.statusChart = smData.statusSummary.map(s => ({
                status: s.Status,
                count: s.Count,
                color: s.Status === 'Order' ? '#4CAF50' :
                    s.Status === 'Quotation' ? '#2196F3' :
                        s.Status === 'Waiting' ? '#FFC107' :
                            s.Status === 'Cancelled' ? '#F44336' : '#9E9E9E'
            }));
        }

        // Top suppliers from gsaData.supplierRankings.top (actual company names)
        // smData.suppliers contains MVL employees, not actual supplier companies
        if (gsaData?.supplierRankings?.top) {
            dashboardData.supplierMarketplace.topSuppliers = gsaData.supplierRankings.top
                .slice(0, 10)
                .map((s, i) => ({
                    rank: i + 1,
                    name: s.name,
                    poCount: s.poCount || 0,
                    spend: s.valueUSD || 0
                }));
        }

        // Entity comparison from smData.entities with PO spend from gsaData.entityBreakdown
        if (smData.entities) {
            const entityColors = ['#0066CC', '#339933', '#FF9900', '#9966CC', '#CC6699', '#FF6600', '#3399FF', '#66CC66'];

            // Build a lookup map for PO spend from gsaData.entityBreakdown
            const poSpendByEntity = {};
            if (gsaData?.entityBreakdown) {
                gsaData.entityBreakdown.forEach(e => {
                    poSpendByEntity[e.name] = e.valueUSD || 0;
                    // Also try normalized name
                    poSpendByEntity[e.name?.toLowerCase()] = e.valueUSD || 0;
                });
            }

            dashboardData.supplierMarketplace.entityComparison = smData.entities
                .map((e, i) => {
                    // Try to match entity name with PO spend data
                    const entityName = e.Entity;
                    const poSpend = poSpendByEntity[entityName] || poSpendByEntity[entityName?.toLowerCase()] || 0;

                    return {
                        entity: entityName,
                        quoteValue: e.TotalValueUSD || 0,
                        quoteCount: e.QuotationCount || 0,
                        poSpend: poSpend,
                        color: entityColors[i % entityColors.length]
                    };
                });

            console.log('📊 Entity comparison with PO spend:', dashboardData.supplierMarketplace.entityComparison.map(e => ({ entity: e.entity, quote: e.quoteValue, po: e.poSpend })));
        }

        // Material distribution from smData.materialsByDiscipline
        if (smData.materialsByDiscipline) {
            const materialColors = ['#0066CC', '#3399FF', '#339933', '#66CC66', '#FF9900', '#FF6600', '#9966CC', '#CC6699', '#2B4257', '#06B6D4', '#EF4444', '#8B5CF6'];
            dashboardData.supplierMarketplace.materialDistribution = smData.materialsByDiscipline
                .map((m, i) => ({
                    material: m.MaterialCode,
                    value: m.QuotationValueUSD || 0,
                    count: m.QuotationNumber || 0,
                    color: materialColors[i % materialColors.length]
                }));
        }

        // Responsible employees - smData.suppliers contains MVL employee performance data
        // These are the procurement contacts (e.g., "Lince M.", "Marman I.") not supplier companies
        if (smData.suppliers) {
            dashboardData.supplierMarketplace.responsibleEmployees = smData.suppliers
                .map((s, i) => ({
                    rank: i + 1,
                    name: (s.SupplierName && s.SupplierName.trim()) ? s.SupplierName.trim() : 'Unassigned',
                    poCount: s.POCount || 0,
                    totalSpend: s.TotalSpendUSD || 0,
                    winRate: 100
                }));
        }

        // Use last refresh from smData  
        if (smData.lastRefresh) {
            document.getElementById('lastRefresh').textContent = smData.lastRefresh;
        }

        console.log('📊 Enriched dashboard data from smData:', {
            summary: dashboardData.summary,
            topSuppliers: dashboardData.supplierMarketplace.topSuppliers?.length,
            entities: dashboardData.supplierMarketplace.entityComparison?.length
        });
        return;
    }

    // Fallback: enrich from raw data files
    if (!suppliersData || !purchaseOrdersData || !quotationsData) {
        console.warn('⚠️ Missing data sources:', {
            suppliers: !!suppliersData,
            pos: !!purchaseOrdersData,
            quotes: !!quotationsData
        });
        return;
    }

    const suppliers = suppliersData.suppliers || [];
    const pos = purchaseOrdersData.purchase_orders || [];
    const quotes = quotationsData.quotations || [];

    console.log('📊 Processing data from raw files:', { suppliers: suppliers.length, pos: pos.length, quotes: quotes.length });

    // Calculate real summary KPIs
    const totalPOValue = pos.reduce((sum, po) => sum + (po.financial?.total_amount || 0), 0);
    const totalQuoteValue = quotes.reduce((sum, q) => sum + (q.financial?.quoted_value || 0), 0);

    dashboardData.summary = {
        rfqCount: quotationsData.metadata.total_records,
        quoteValue: totalQuoteValue,
        poCount: purchaseOrdersData.metadata.total_records,
        poValue: totalPOValue,
        winRate: ((quotationsData.metadata.status_distribution?.won || 0) / quotationsData.metadata.total_records * 100).toFixed(1),
        coCount: gsaData?.summary?.changeOrders || 0,
        coValue: gsaData?.summary?.changeOrderValue || 0,
        openQuotes: quotationsData.metadata.status_distribution?.unknown || 0,
        conversionRate: purchaseOrdersData.metadata.supplier_match_stats?.match_rate || 98.9
    };

    // Build top suppliers from real PO data
    const supplierSpend = {};
    pos.forEach(po => {
        const name = po.supplier?.name || 'Unknown';
        if (!supplierSpend[name]) {
            supplierSpend[name] = { name, poCount: 0, spend: 0 };
        }
        supplierSpend[name].poCount++;
        supplierSpend[name].spend += po.financial?.total_amount || 0;
    });

    const topSuppliers = Object.values(supplierSpend)
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 10)
        .map((s, i) => ({ rank: i + 1, ...s }));

    dashboardData.supplierMarketplace.topSuppliers = topSuppliers;

    // Build supplier locations from real data (suppliers with geocoding)
    const supplierLocations = suppliers
        .filter(s => s.location?.latitude && s.location?.longitude)
        .map(s => ({
            name: s.name,
            lat: s.location.latitude,
            lng: s.location.longitude,
            country: normalizeCountry(s.address?.country_standardized || s.address?.country) || 'Unknown',
            poCount: supplierSpend[s.name]?.poCount || 0,
            spend: supplierSpend[s.name]?.spend || 0
        }));

    // Add more locations from PO data by country
    const countryLocations = {};
    pos.forEach(po => {
        const country = po.supplier?.country || 'Unknown';
        if (country === 'Unknown') return;
        if (!countryLocations[country]) {
            countryLocations[country] = { suppliers: new Set(), poCount: 0, spend: 0 };
        }
        countryLocations[country].suppliers.add(po.supplier?.name);
        countryLocations[country].poCount++;
        countryLocations[country].spend += po.financial?.total_amount || 0;
    });

    dashboardData.supplierMarketplace.supplierLocations = supplierLocations.length > 0
        ? supplierLocations
        : dashboardData.supplierMarketplace.supplierLocations;

    // Build status chart from quotation data
    const statusDist = quotationsData.metadata.status_distribution;
    dashboardData.supplierMarketplace.statusChart = [
        { status: 'Order', count: statusDist?.won || 0, color: '#4CAF50' },
        { status: 'Quotation', count: statusDist?.unknown || 0, color: '#2196F3' },
        { status: 'Waiting', count: statusDist?.pending || 0, color: '#FFC107' },
        { status: 'Cancelled', count: statusDist?.lost || 0, color: '#F44336' },
        { status: 'Closed', count: 0, color: '#9E9E9E' }
    ];

    // Build entity comparison from quotations (by company)
    const entityData = {};
    quotes.forEach(q => {
        const company = q.company || 'Unknown';
        if (!entityData[company]) {
            entityData[company] = { entity: company, quoteValue: 0, quoteCount: 0, poSpend: 0, poCount: 0 };
        }
        entityData[company].quoteValue += q.financial?.quoted_value || 0;
        entityData[company].quoteCount++;
    });

    // Add PO data to entities (create if doesn't exist from quotes)
    pos.forEach(po => {
        const company = po.company || po.entity || 'Unknown';
        if (!entityData[company]) {
            entityData[company] = { entity: company, quoteValue: 0, quoteCount: 0, poSpend: 0, poCount: 0 };
        }
        entityData[company].poSpend += po.financial?.total_amount || 0;
        entityData[company].poCount++;
    });

    const entityColors = ['#0066CC', '#339933', '#FF9900', '#9966CC', '#CC6699', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A4', '#D4A574'];
    // Sort by total value (quote + po) to get most active entities — show ALL
    const entityComparison = Object.values(entityData)
        .sort((a, b) => (b.quoteValue + b.poSpend) - (a.quoteValue + a.poSpend))
        .map((e, i) => ({ ...e, color: entityColors[i % entityColors.length] }));

    console.log('📊 Entity comparison built:', entityComparison.map(e => ({ entity: e.entity, quoteValue: e.quoteValue, poSpend: e.poSpend })));

    if (entityComparison.length > 0) {
        dashboardData.supplierMarketplace.entityComparison = entityComparison;
    }

    // Build employee performance from quotation data
    const contactPerf = quotationsData.metadata.contact_performance || {};
    const employeeList = Object.entries(contactPerf)
        .map(([name, data]) => ({
            name: name === 'Unknown' ? 'Unassigned' : name,
            poCount: data.won || 0,
            totalSpend: data.won_value || 0,
            winRate: data.win_rate || 0
        }))
        .sort((a, b) => b.totalSpend - a.totalSpend)
        .map((e, i) => ({ rank: i + 1, ...e }));

    if (employeeList.length > 0) {
        dashboardData.supplierMarketplace.responsibleEmployees = employeeList;
    }

    // Build monthly trend from PO data
    const monthlyData = {};
    pos.forEach(po => {
        const date = po.dates?.po_date;
        if (!date) return;
        const month = date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = { quotes: 0, orders: 0, cos: 0 };
        }
        monthlyData[month].orders++;
    });

    quotes.forEach(q => {
        const date = q.dates?.submission_date;
        if (!date) return;
        const month = date.substring(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { quotes: 0, orders: 0, cos: 0 };
        }
        monthlyData[month].quotes++;
    });

    // Get last 12 months
    const sortedMonths = Object.keys(monthlyData).sort().slice(-12);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build CO count from GSA data by yearMonth
    const gsaCOsByMonth = {};
    if (gsaData?.workbench) {
        gsaData.workbench.forEach(po => {
            if (po.poType === 'Change Order' && po.yearMonth) {
                gsaCOsByMonth[po.yearMonth] = (gsaCOsByMonth[po.yearMonth] || 0) + 1;
            }
        });
    }

    if (sortedMonths.length > 0) {
        dashboardData.supplierMarketplace.monthlyTrend = sortedMonths.map(m => {
            const monthNum = parseInt(m.split('-')[1]) - 1;
            const yearSuffix = " '" + m.split('-')[0].slice(-2);
            return {
                month: monthNames[monthNum] + yearSuffix,
                quotes: monthlyData[m].quotes,
                orders: monthlyData[m].orders,
                cos: gsaCOsByMonth[m] || 0
            };
        });
    }

    // Build approved materials from supplier material categories
    const materialCategories = {};
    suppliers.forEach(s => {
        const cat = s.material_category;
        if (cat && cat !== 'null' && cat !== 'undefined') {
            if (!materialCategories[cat]) {
                materialCategories[cat] = { materials: [] };
            }
            materialCategories[cat].materials.push({
                supplier: s.name,
                material: cat
            });
        }
    });

    // Build material distribution from supplier categories
    const materialCounts = {};
    suppliers.forEach(s => {
        const cat = s.material_category;
        if (cat && cat !== 'null') {
            if (!materialCounts[cat]) materialCounts[cat] = 0;
            materialCounts[cat]++;
        }
    });

    const materialColors = ['#0066CC', '#3399FF', '#339933', '#66CC66', '#FF9900', '#FF6600', '#9966CC', '#CC6699'];
    const materialDist = Object.entries(materialCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([material, count], i) => ({
            material,
            value: count * 10000000, // Scale for visualization
            color: materialColors[i % materialColors.length]
        }));

    if (materialDist.length > 0) {
        dashboardData.supplierMarketplace.materialDistribution = materialDist;
    }

    // Build approved materials by top suppliers
    const approvedMaterials = topSuppliers.slice(0, 5).map(sup => {
        const matchingSupplier = suppliers.find(s => s.name === sup.name);
        return {
            supplier: sup.name,
            materials: [{
                material: matchingSupplier?.material_category || 'Various',
                spec: 'MVL-STD-001',
                leadTime: '14 days'
            }]
        };
    });

    dashboardData.supplierMarketplace.approvedMaterials = approvedMaterials;

    // Build filter dropdown options from real data
    const entities = [...new Set(quotes.map(q => q.company).filter(Boolean))].sort();
    const projects = [...new Set(quotes.map(q => q.project?.name).filter(Boolean))].sort();
    const supplierNames = [...new Set(suppliers.map(s => s.name).filter(Boolean))].sort();
    const materials = [...new Set(suppliers.map(s => s.material_category).filter(c => c && c !== 'null'))].sort();

    dashboardData.filters = {
        entities: entities,
        projects: projects,
        suppliers: supplierNames,
        materials: materials
    };

    console.log('✅ Dashboard enriched with real data');
    console.log('📋 Built filters:', {
        entities: entities.length,
        projects: projects.length,
        suppliers: supplierNames.length,
        materials: materials.length
    });
}

async function loadDashboardData() {
    // Legacy function - now handled by loadAllData
    await loadAllData();
}

function getFallbackData() {
    // Fallback with zero values — all real values come from data pipeline
    // This ensures the UI renders structure even if data fetch fails
    console.warn('⚠️ Using fallback data — real data files did not load');
    return {
        summary: {
            rfqCount: 0,
            quoteValue: 0,
            poCount: 0,
            poValue: 0,
            winRate: 0,
            coCount: 0,
            coValue: 0,
            openQuotes: 0,
            conversionRate: 0
        },
        supplierMarketplace: {
            statusChart: [
                { status: 'Order', count: 0, color: '#c6f6d5' },
                { status: 'Quotation', count: 0, color: '#cce5ff' },
                { status: 'Waiting', count: 0, color: '#fff4ce' },
                { status: 'Cancelled', count: 0, color: '#ffe0e0' },
                { status: 'Closed', count: 0, color: '#e5e5e5' }
            ],
            entityComparison: [],
            topSuppliers: [],
            materialDistribution: [],
            responsibleEmployees: [],
            monthlyTrend: [],
            quotationToPoTime: [],
            approvedMaterials: [],
            supplierLocations: []
        }
    };
}

// ============================================
// NAVIGATION TABS
// ============================================
function initNavigationTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            tab.classList.add('active');

            // Switch content
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Show selected tab content
    const tabContent = document.getElementById(`tab-${tabId}`);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Initialize tab-specific content
    if (tabId === 'global-spend') {
        initGlobalSpendAnalysis();
    } else if (tabId === 'materials-disciplines') {
        initMaterialsDisciplines();
    }

    console.log(`📑 Switched to tab: ${tabId}`);
}

// ============================================
// BOTTOM TABS & PAGINATION
// ============================================
let bottomTableState = {
    currentTab: 'workbench',
    currentPage: 1,
    pageSize: 50,
    searchTerm: '',
    statusFilter: '',
    materialFilter: '',
    countryFilter: '',
    filteredData: []
};

function initBottomTabs() {
    const bottomTabs = document.querySelectorAll('.bottom-tab');
    bottomTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            bottomTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabType = tab.dataset.bottomTab;
            bottomTableState.currentTab = tabType;
            bottomTableState.currentPage = 1;
            bottomTableState.searchTerm = '';
            bottomTableState.statusFilter = '';
            bottomTableState.materialFilter = '';
            bottomTableState.countryFilter = '';

            // Clear filter inputs
            document.getElementById('bottomSearch').value = '';
            document.getElementById('bottomFilterStatus').value = '';
            document.getElementById('bottomFilterMaterial').value = '';
            document.getElementById('bottomFilterCountry').value = '';

            // Show/hide appropriate filters
            updateBottomFilterVisibility(tabType);
            populateBottomFilters(tabType);
            renderBottomTable(tabType);
        });
    });

    // Initialize filter dropdowns
    populateBottomFilters('workbench');
}

function updateBottomFilterVisibility(tabType) {
    const statusFilter = document.getElementById('bottomFilterStatus');
    const materialFilter = document.getElementById('bottomFilterMaterial');
    const countryFilter = document.getElementById('bottomFilterCountry');

    if (tabType === 'supplier-list') {
        statusFilter.style.display = 'none';
        materialFilter.style.display = 'block';
        countryFilter.style.display = 'block';
    } else {
        statusFilter.style.display = 'block';
        materialFilter.style.display = 'block';
        countryFilter.style.display = 'none';
    }
}

function populateBottomFilters(tabType) {
    const statusSelect = document.getElementById('bottomFilterStatus');
    const materialSelect = document.getElementById('bottomFilterMaterial');
    const countrySelect = document.getElementById('bottomFilterCountry');

    if (tabType === 'supplier-list') {
        // Populate country filter from suppliers
        const countries = new Set();
        const materials = new Set();
        (suppliersData?.suppliers || []).forEach(s => {
            const c = normalizeCountry(s.address?.country_standardized || s.address?.country);
            if (c) countries.add(c);
            if (s.material_category) materials.add(s.material_category);
        });

        countrySelect.innerHTML = '<option value="">All Countries</option>' +
            [...countries].sort().map(c => `<option value="${c}">${c}</option>`).join('');
        materialSelect.innerHTML = '<option value="">All Materials</option>' +
            [...materials].sort().map(m => `<option value="${m}">${m}</option>`).join('');
    } else {
        // Populate status and material from quotations
        const statuses = new Set();
        const materials = new Set();
        (quotationsData?.quotations || []).forEach(q => {
            if (q.outcome?.status) {
                const st = q.outcome.status === 'Cancled' ? 'Cancelled' : q.outcome.status;
                statuses.add(st);
            }
            if (q.details?.material_category) materials.add(q.details.material_category);
        });

        statusSelect.innerHTML = '<option value="">All Status</option>' +
            [...statuses].sort().map(s => `<option value="${s}">${s}</option>`).join('');
        materialSelect.innerHTML = '<option value="">All Materials</option>' +
            [...materials].sort().map(m => `<option value="${m}">${m}</option>`).join('');
    }
}

function filterBottomTable() {
    bottomTableState.searchTerm = (document.getElementById('bottomSearch').value || '').toLowerCase();
    bottomTableState.statusFilter = document.getElementById('bottomFilterStatus').value;
    bottomTableState.materialFilter = document.getElementById('bottomFilterMaterial').value;
    bottomTableState.countryFilter = document.getElementById('bottomFilterCountry').value;
    bottomTableState.currentPage = 1;

    renderBottomTable(bottomTableState.currentTab);
}

function clearBottomFilters() {
    document.getElementById('bottomSearch').value = '';
    document.getElementById('bottomFilterStatus').value = '';
    document.getElementById('bottomFilterMaterial').value = '';
    document.getElementById('bottomFilterCountry').value = '';
    bottomTableState.searchTerm = '';
    bottomTableState.statusFilter = '';
    bottomTableState.materialFilter = '';
    bottomTableState.countryFilter = '';
    bottomTableState.currentPage = 1;

    renderBottomTable(bottomTableState.currentTab);
}

function changeBottomPageSize() {
    bottomTableState.pageSize = parseInt(document.getElementById('bottomPageSize').value);
    bottomTableState.currentPage = 1;
    renderBottomTable(bottomTableState.currentTab);
}

function goToBottomPage(action) {
    const totalPages = Math.ceil(bottomTableState.filteredData.length / bottomTableState.pageSize);

    if (action === 'first') {
        bottomTableState.currentPage = 1;
    } else if (action === 'prev' && bottomTableState.currentPage > 1) {
        bottomTableState.currentPage--;
    } else if (action === 'next' && bottomTableState.currentPage < totalPages) {
        bottomTableState.currentPage++;
    } else if (action === 'last') {
        bottomTableState.currentPage = totalPages;
    } else if (typeof action === 'number') {
        bottomTableState.currentPage = action;
    }

    renderBottomTable(bottomTableState.currentTab);
}

function renderBottomTable(type) {
    const tbody = document.getElementById('workbenchTable');
    const thead = document.getElementById('bottomTableHead');
    const pagination = document.getElementById('tablePagination');
    if (!tbody) return;

    // Update tab state
    bottomTableState.currentTab = type;

    if (type === 'supplier-list') {
        // Update headers for supplier list
        if (thead) {
            thead.innerHTML = `
                <tr>
                    <th>SUPPLIER NAME</th>
                    <th>CONTACT</th>
                    <th>EMAIL</th>
                    <th>PHONE</th>
                    <th>COUNTRY</th>
                    <th>CATEGORY</th>
                </tr>
            `;
        }
        // Show real supplier list with filtering and pagination
        const { rows, total, filtered } = generateSupplierListRowsPaginated();
        tbody.innerHTML = rows;
        updateBottomPagination(total, filtered);

        // Update supplier count in tab
        const countSpan = document.getElementById('supplierCount');
        if (countSpan) countSpan.textContent = filtered;
    } else {
        // Update headers for workbench
        if (thead) {
            thead.innerHTML = `
                <tr>
                    <th>QUOTATION</th>
                    <th>STATUS</th>
                    <th>MATERIAL</th>
                    <th>PROJECT</th>
                    <th>VALUE</th>
                    <th>TAX</th>
                    <th>CONTACT</th>
                </tr>
            `;
        }
        // Workbench - show quotation/PO data with filtering and pagination
        const { rows, total, filtered } = generateWorkbenchRowsPaginated();
        tbody.innerHTML = rows;
        updateBottomPagination(total, filtered);
    }
}

function updateBottomPagination(total, filtered) {
    const pagination = document.getElementById('tablePagination');
    const pageNumbers = document.getElementById('pageNumbers');
    const { currentPage, pageSize } = bottomTableState;
    const totalPages = Math.ceil(filtered / pageSize);

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, filtered);

    if (pagination) {
        const typeLabel = bottomTableState.currentTab === 'supplier-list' ? 'suppliers' : 'quotations';
        if (filtered < total) {
            pagination.textContent = `Showing ${start}-${end} of ${filtered.toLocaleString()} filtered (${total.toLocaleString()} total ${typeLabel})`;
        } else {
            pagination.textContent = `Showing ${start}-${end} of ${total.toLocaleString()} ${typeLabel}`;
        }
    }

    // Generate page number buttons
    if (pageNumbers) {
        let pageHtml = '';
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            pageHtml += `<span class="page-number" onclick="goToBottomPage(1)">1</span>`;
            if (startPage > 2) pageHtml += `<span style="padding:0 4px;">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            pageHtml += `<span class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToBottomPage(${i})">${i}</span>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pageHtml += `<span style="padding:0 4px;">...</span>`;
            pageHtml += `<span class="page-number" onclick="goToBottomPage(${totalPages})">${totalPages}</span>`;
        }

        pageNumbers.innerHTML = pageHtml;
    }
}

function generateSupplierListRowsPaginated() {
    if (!suppliersData || !suppliersData.suppliers) {
        return { rows: '<tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">Loading suppliers...</td></tr>', total: 0, filtered: 0 };
    }

    const allSuppliers = suppliersData.suppliers;
    const { searchTerm, materialFilter, countryFilter, currentPage, pageSize } = bottomTableState;

    // Q9: Build set of supplier names matching top-level SM filters (entity/project/supplier/material)
    const hasTopFilter = Object.values(currentFilters).some(v => v !== null && v !== '');
    let topFilteredSupplierNames = null;
    if (hasTopFilter && smData && smData.workbench) {
        const filteredQuotes = smData.workbench.filter(q => {
            if (currentFilters.entity && q.Entity !== currentFilters.entity) return false;
            if (currentFilters.project && q.ProjectName !== currentFilters.project) return false;
            if (currentFilters.supplier && q.Client !== currentFilters.supplier) return false;
            if (currentFilters.material && q.Material !== currentFilters.material) return false;
            if (currentFilters.materialCode && q.materialCode !== currentFilters.materialCode) return false;
            if (currentFilters.status && q.Status !== currentFilters.status) return false;
            return true;
        });
        topFilteredSupplierNames = new Set(filteredQuotes.map(q => q.Client).filter(Boolean));
    }

    // Apply filters
    let filtered = allSuppliers.filter(s => {
        // Q9: Cross-filter with top-level SM filters
        if (topFilteredSupplierNames && !topFilteredSupplierNames.has(s.name)) return false;
        if (searchTerm) {
            const searchFields = [
                s.name,
                s.contact?.primary_contact,
                s.contact?.email,
                normalizeCountry(s.address?.country_standardized),
                s.material_category
            ].filter(Boolean).join(' ').toLowerCase();
            if (!searchFields.includes(searchTerm)) return false;
        }
        if (countryFilter && normalizeCountry(s.address?.country_standardized || '') !== countryFilter) return false;
        if (materialFilter && (s.material_category || '') !== materialFilter) return false;
        return true;
    });

    // Store for pagination
    bottomTableState.filteredData = filtered;

    // Apply pagination
    const start = (currentPage - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    const rows = paged.map(s => `
        <tr onclick="selectSupplierByName('${s.name.replace(/'/g, "\\'")}')" style="cursor:pointer;" title="Click to view ${s.name} details">
            <td><strong>${s.name}</strong></td>
            <td>${s.contact?.primary_contact || '-'}</td>
            <td><a href="mailto:${s.contact?.email || ''}" onclick="event.stopPropagation();">${s.contact?.email || '-'}</a></td>
            <td>${s.contact?.phone || '-'}</td>
            <td>${normalizeCountry(s.address?.country_standardized || s.address?.country) || '-'}</td>
            <td><span class="material-tag">${s.material_category || '-'}</span></td>
        </tr>
    `).join('');

    return {
        rows: rows || '<tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">No suppliers match filters</td></tr>',
        total: allSuppliers.length,
        filtered: filtered.length
    };
}

function selectSupplierByName(name) {
    const suppliers = dashboardData.supplierMarketplace.topSuppliers;
    const index = suppliers.findIndex(s => s.name === name);
    if (index >= 0) {
        selectSupplier(index);
    } else {
        // Find in full supplier list
        const fullSupplier = suppliersData?.suppliers?.find(s => s.name === name);
        if (fullSupplier) {
            selectedSupplier = {
                name: fullSupplier.name,
                poCount: 0,
                spend: 0
            };
            document.getElementById('supplierName').textContent = fullSupplier.name;
            document.getElementById('supplierLocation').textContent = normalizeCountry(fullSupplier.address?.country_standardized || fullSupplier.address?.country) || '-';
            document.getElementById('supplierAvatar').textContent = fullSupplier.name.charAt(0);
            document.getElementById('supplierContact').textContent = fullSupplier.contact?.primary_contact || '-';
            document.getElementById('supplierEmail').textContent = fullSupplier.contact?.email || '-';
            document.getElementById('supplierPhone').textContent = fullSupplier.contact?.phone || '-';
            renderApprovedMaterialsFromCategory(fullSupplier.material_category);
        }
    }
}

function renderApprovedMaterialsFromCategory(category) {
    const tbody = document.getElementById('approvedMaterialTable');
    if (!tbody) return;

    if (!category || category === 'null') {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">No approved materials</td></tr>';
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td>${category}</td>
            <td>MVL-STD-001</td>
            <td>14 days</td>
        </tr>
    `;
}

function generateWorkbenchRowsPaginated() {
    // Use smData.workbench if available (from v3 data)
    if (smData && smData.workbench && smData.workbench.length > 0) {
        const allQuotes = smData.workbench;
        const { searchTerm, statusFilter, materialFilter, currentPage, pageSize } = bottomTableState;

        // Apply filters (including top-level filters from currentFilters)
        let filtered = allQuotes.filter(q => {
            // Top-level entity filter
            if (currentFilters.entity && q.Entity !== currentFilters.entity) return false;
            // Top-level project filter
            if (currentFilters.project && q.ProjectName !== currentFilters.project) return false;
            // Top-level supplier filter (using Client field)
            if (currentFilters.supplier && q.Client !== currentFilters.supplier) return false;
            // Top-level material filter
            if (currentFilters.material && q.Material !== currentFilters.material) return false;
            // Top-level material code filter
            if (currentFilters.materialCode && q.materialCode !== currentFilters.materialCode) return false;
            // Top-level status filter  
            if (currentFilters.status && q.Status !== currentFilters.status) return false;

            // Bottom table search
            if (searchTerm) {
                const searchFields = [
                    q.QuotationNumber,
                    q.Entity,
                    q.ProjectName,
                    q.Description,
                    q.Contact,
                    q.Status,
                    q.MaterialCode,
                    q.Client,
                    q.orderId,
                    q.mainOrderId
                ].filter(Boolean).join(' ').toLowerCase();
                if (!searchFields.includes(searchTerm)) return false;
            }
            // Bottom table specific filters
            if (statusFilter && (q.Status || '') !== statusFilter) return false;
            if (materialFilter && (q.MaterialCode || '') !== materialFilter) return false;
            return true;
        });

        // Store for pagination
        bottomTableState.filteredData = filtered;

        // Apply pagination
        const start = (currentPage - 1) * pageSize;
        const paged = filtered.slice(start, start + pageSize);

        const rows = paged.map(q => {
            const status = q.Status || 'Quotation';
            const statusClass = status.toLowerCase().replace(/\s+/g, '-');
            const currency = q.Currency || 'USD';
            const rawValue = q.QuotationValue || 0;
            // Convert to USD using FX rates
            const valueInUSD = convertToUSD(rawValue, currency);
            const value = rawValue ? formatCurrencyShort(valueInUSD) : '-';
            const rawTax = q.Tax || 0;
            const taxInUSD = convertToUSD(rawTax, currency);
            const tax = rawTax ? formatCurrencyShort(taxInUSD) : '-';
            const material = q.Material || q.MaterialCode || '-';
            const project = q.ProjectName || '-';
            const contact = q.Contact || '-';

            return `
                <tr title="Quote: ${q.QuotationNumber} | ${q.Entity || 'Unknown'}">
                    <td><strong>${q.QuotationNumber || q.id || '-'}</strong></td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>${truncateText(material, 20)}</td>
                    <td title="${project}">${truncateText(project, 30)}</td>
                    <td>${value}</td>
                    <td>${tax}</td>
                    <td>${contact}</td>
                </tr>
            `;
        }).join('');

        return {
            rows: rows || '<tr><td colspan="7" style="text-align:center; padding:40px; color:#888;">No quotations match filters</td></tr>',
            total: allQuotes.length,
            filtered: filtered.length
        };
    }

    // Fallback to quotationsData
    if (!quotationsData || !quotationsData.quotations) {
        return { rows: '<tr><td colspan="7" style="text-align:center; padding:40px; color:#888;">Loading quotations...</td></tr>', total: 0, filtered: 0 };
    }

    const allQuotes = quotationsData.quotations;
    const { searchTerm, statusFilter, materialFilter, currentPage, pageSize } = bottomTableState;

    // Apply filters
    let filtered = allQuotes.filter(q => {
        if (searchTerm) {
            const searchFields = [
                q.quotation_number,
                q.company,
                q.project?.name,
                q.details?.description,
                q.contact?.mvl_contact,
                q.outcome?.status
            ].filter(Boolean).join(' ').toLowerCase();
            if (!searchFields.includes(searchTerm)) return false;
        }
        if (statusFilter && (q.outcome?.status || '') !== statusFilter) return false;
        if (materialFilter && (q.details?.material_category || '') !== materialFilter) return false;
        return true;
    });

    // Store for pagination
    bottomTableState.filteredData = filtered;

    // Apply pagination
    const start = (currentPage - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    const rows = paged.map(q => {
        const status = q.outcome?.status || 'Quotation';
        const statusClass = status.toLowerCase().replace(/\s+/g, '-');
        const currency = q.financial?.currency || 'USD';
        const rawValue = q.financial?.quoted_value || 0;
        // Convert to USD using FX rates
        const valueInUSD = convertToUSD(rawValue, currency);
        const value = rawValue ? formatCurrencyShort(valueInUSD) : '-';
        const rawTax = q.financial?.tax || 0;
        const taxInUSD = convertToUSD(rawTax, currency);
        const tax = rawTax ? formatCurrencyShort(taxInUSD) : '-';
        const material = q.details?.material_code || q.details?.material_category || '-';
        const project = q.project?.name || q.project?.project_code || '-';
        const contact = q.contact?.mvl_contact || '-';

        return `
            <tr title="Quote: ${q.quotation_number} | ${q.company || 'Unknown'}">
                <td><strong>${q.quotation_number || q.id || '-'}</strong></td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${truncateText(material, 20)}</td>
                <td title="${project}">${truncateText(project, 30)}</td>
                <td>${value}</td>
                <td>${tax}</td>
                <td>${contact}</td>
            </tr>
        `;
    }).join('');

    return {
        rows: rows || '<tr><td colspan="7" style="text-align:center; padding:40px; color:#888;">No quotations match filters</td></tr>',
        total: allQuotes.length,
        filtered: filtered.length
    };
}

function truncateText(text, maxLen) {
    if (!text) return '-';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

// ============================================
// FILTERS
// ============================================
let currentFilters = {
    entity: null,
    project: null,
    supplier: null,
    status: null,
    material: null,
    materialCode: null,
    search: '',
    dateFrom: null,
    dateTo: null
};

function initFilters() {
    // Use smData filters if available, otherwise fall back to dashboardData
    let filters;

    if (smData && smData.entities) {
        console.log('📋 Using filters from smData and gsaData');

        // Get actual supplier company names from gsaData (not smData.suppliers which are employees)
        let supplierNames = ['All Suppliers'];
        if (gsaData?.filters?.suppliers) {
            // Use pre-built supplier list from GSA data (no cap, sorted)
            supplierNames = ['All Suppliers', ...gsaData.filters.suppliers.filter(s => s && s.trim()).sort()];
        } else if (gsaData?.supplierRankings?.top) {
            // Fall back to top suppliers from ranking
            supplierNames = ['All Suppliers', ...gsaData.supplierRankings.top.map(s => s.name).filter(Boolean)];
        }

        // Extract meaningful projects from SM workbench (those with 2+ quotations are real tracked projects)
        let projectNames = ['All Projects'];
        if (smData.workbench) {
            const projectCounts = {};
            smData.workbench.forEach(q => {
                const name = q.ProjectName;
                if (name && name.trim()) {
                    projectCounts[name] = (projectCounts[name] || 0) + 1;
                }
            });
            // Only include projects with multiple quotations (reduces 7700+ to ~860 meaningful projects)
            const meaningfulProjects = Object.entries(projectCounts)
                .filter(([name, count]) => count >= 2)
                .sort((a, b) => a[0].localeCompare(b[0]))  // Sort alphabetically
                .map(([name]) => name);
            projectNames = ['All Projects', ...meaningfulProjects];
            console.log(`📁 Using ${meaningfulProjects.length} projects with 2+ quotations from SM data`);
        }

        // Build filters from smData (for entities, materials) and gsaData (for suppliers)
        filters = {
            entities: ['All Entities', ...smData.entities.map(e => e.Entity).filter(Boolean).sort()],
            projects: projectNames,
            suppliers: supplierNames,
            statuses: ['All Statuses', 'Order', 'Quotation', 'Waiting', 'Cancelled'],
            materials: ['All Materials', ...(smData.filters?.materials || smData.materialsByDiscipline?.map(m => m.MaterialCode) || []).filter(Boolean).sort()],
            materialCodes: ['All Material Codes', ...(smData.filters?.materialCodes || []).filter(Boolean).sort()]
        };
    } else if (dashboardData && dashboardData.filters) {
        filters = dashboardData.filters;
    } else {
        console.warn('⚠️ No filters available in dashboardData or smData');
        return;
    }

    console.log('📋 Loading filters:', {
        entities: filters.entities?.length || 0,
        projects: filters.projects?.length || 0,
        suppliers: filters.suppliers?.length || 0,
        materials: filters.materials?.length || 0
    });

    // Populate dropdowns
    populateSelect('filterEntity', filters.entities || []);
    populateSelect('filterProject', filters.projects || []);
    populateSelect('filterSupplier', filters.suppliers || []);
    populateSelect('filterMaterial', filters.materials || []);
    populateSelect('filterMaterialCode', filters.materialCodes || []);

    // Search input handler
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Add change handlers to all filter dropdowns
    ['filterEntity', 'filterProject', 'filterSupplier', 'filterStatus', 'filterMaterial', 'filterMaterialCode'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', handleFilterChange);
        }
    });

    // Add date range filter handlers
    ['filterDateFrom', 'filterDateTo'].forEach(id => {
        const dateInput = document.getElementById(id);
        if (dateInput) {
            dateInput.addEventListener('change', function () {
                currentFilters.dateFrom = document.getElementById('filterDateFrom')?.value || null;
                currentFilters.dateTo = document.getElementById('filterDateTo')?.value || null;
                console.log(`📅 Date filter: ${currentFilters.dateFrom} → ${currentFilters.dateTo}`);
                applyFilters();
            });
        }
    });
}

function populateSelect(id, options) {
    const select = document.getElementById(id);
    if (!select) {
        console.warn(`⚠️ Select element not found: ${id}`);
        return;
    }

    // Keep first option (All)
    const firstOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(firstOption);

    options.forEach(opt => {
        if (opt && opt !== firstOption.value) {
            const option = document.createElement('option');
            option.value = opt;
            // Truncate display text if too long
            option.textContent = opt.length > 30 ? opt.substring(0, 30) + '...' : opt;
            option.title = opt; // Show full text on hover
            select.appendChild(option);
        }
    });

    console.log(`✓ Populated ${id}: ${options.length} options`);
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    currentFilters.search = query;
    applyFilters();
    // SM-Q6: Show search feedback indicator
    const indicator = document.getElementById('searchFeedback');
    if (indicator) {
        if (query) {
            const total = smData?.workbench?.length || 0;
            const filtered = document.getElementById('kpiRfqCount')?.textContent || '0';
            indicator.textContent = `Showing ${filtered} of ${total.toLocaleString()} for "${event.target.value}"`;
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    }
}

function handleFilterChange(event) {
    const id = event.target.id;
    const value = event.target.value;

    // Map select IDs to filter keys
    const filterMap = {
        'filterEntity': 'entity',
        'filterProject': 'project',
        'filterSupplier': 'supplier',
        'filterStatus': 'status',
        'filterMaterial': 'material',
        'filterMaterialCode': 'materialCode'
    };

    const filterKey = filterMap[id];
    if (filterKey) {
        // Check if "All" option is selected
        currentFilters[filterKey] = value.startsWith('All ') ? null : value;
        console.log(`🔧 Filter changed: ${filterKey} = ${currentFilters[filterKey]}`);
        applyFilters();
    }
}

function getFilteredData() {
    const quotes = quotationsData?.quotations || [];
    const pos = purchaseOrdersData?.purchase_orders || [];
    const suppliers = suppliersData?.suppliers || [];

    // Filter quotations
    let filteredQuotes = quotes.filter(q => {
        if (currentFilters.entity && q.company !== currentFilters.entity) return false;
        if (currentFilters.project && q.project?.name !== currentFilters.project) return false;
        if (currentFilters.status && q.outcome?.status !== currentFilters.status) return false;
        if (currentFilters.search) {
            const searchFields = [
                q.quotation_number,
                q.company,
                q.project?.name,
                q.details?.description,
                q.contact?.mvl_contact
            ].filter(Boolean).join(' ').toLowerCase();
            if (!searchFields.includes(currentFilters.search)) return false;
        }
        return true;
    });

    // Filter POs
    let filteredPOs = pos.filter(po => {
        if (currentFilters.entity && po.company !== currentFilters.entity && po.entity !== currentFilters.entity) return false;
        if (currentFilters.supplier && po.supplier?.name !== currentFilters.supplier) return false;
        if (currentFilters.material && po.details?.material_category !== currentFilters.material) return false;
        return true;
    });

    // Filter suppliers
    let filteredSuppliers = suppliers.filter(s => {
        if (currentFilters.supplier && s.name !== currentFilters.supplier) return false;
        if (currentFilters.material && s.material_category !== currentFilters.material) return false;
        return true;
    });

    return { quotes: filteredQuotes, pos: filteredPOs, suppliers: filteredSuppliers };
}

function applyFilters() {
    console.log('🔄 Applying filters:', currentFilters);

    // Check if any filter is active
    const hasActiveFilter = Object.values(currentFilters).some(v => v !== null && v !== '');

    // If using smData.workbench (v3 data structure), update from there
    if (smData && smData.workbench && smData.workbench.length > 0) {
        let filtered = smData.workbench;

        // Apply filters
        if (hasActiveFilter) {
            filtered = smData.workbench.filter(q => {
                if (currentFilters.entity && q.Entity !== currentFilters.entity) return false;
                if (currentFilters.project && q.ProjectName !== currentFilters.project) return false;
                if (currentFilters.supplier && q.Client !== currentFilters.supplier) return false;
                if (currentFilters.material && q.Material !== currentFilters.material) return false;
                if (currentFilters.materialCode && q.materialCode !== currentFilters.materialCode) return false;
                if (currentFilters.status && q.Status !== currentFilters.status) return false;
                if (currentFilters.search) {
                    const searchFields = [q.QuotationNumber, q.Entity, q.ProjectName, q.Description, q.Client].filter(Boolean).join(' ').toLowerCase();
                    if (!searchFields.includes(currentFilters.search)) return false;
                }
                // Date range filter — parse "11 Nov 2022" format
                if (currentFilters.dateFrom || currentFilters.dateTo) {
                    if (!q.Date) return false;
                    const qDate = new Date(q.Date);
                    if (isNaN(qDate)) return false;
                    if (currentFilters.dateFrom) {
                        const fromDate = new Date(currentFilters.dateFrom);
                        if (qDate < fromDate) return false;
                    }
                    if (currentFilters.dateTo) {
                        const toDate = new Date(currentFilters.dateTo);
                        toDate.setHours(23, 59, 59, 999); // Include the entire "to" day
                        if (qDate > toDate) return false;
                    }
                }
                return true;
            });
        }

        // Calculate KPIs from filtered smData
        // PO count/value from GSA data to match GSA tab (Q1-Q3, Q7)
        const smTotalPOs = gsaData?.summary?.totalPOs || 0;
        const smTotalPOSpend = gsaData?.summary?.totalSpendUSD || 0;
        const totalQuoteValue = filtered.reduce((sum, q) => {
            const val = q.QuotationValue || 0;
            const curr = q.Currency || 'USD';
            return sum + convertToUSD(val, curr);
        }, 0);
        // Q4: Include tax in quote value
        const totalQuoteTax = filtered.reduce((sum, q) => {
            const t = q.Tax || 0;
            const c = q.Currency || 'USD';
            return sum + convertToUSD(t, c);
        }, 0);
        const totalQuoteValueWithTax = totalQuoteValue + totalQuoteTax;
        const winRate = filtered.length > 0 ? (smTotalPOs / filtered.length * 100).toFixed(1) : 0;

        document.getElementById('kpiRfqCount').textContent = filtered.length.toLocaleString();
        document.getElementById('kpiQuoteValue').textContent = formatCurrencyShort(totalQuoteValueWithTax);
        document.getElementById('kpiPoCount').textContent = smTotalPOs.toLocaleString();
        document.getElementById('kpiPoValue').textContent = formatCurrencyShort(smTotalPOSpend);
        document.getElementById('kpiWinRate').textContent = winRate + '%';

        // Tax subtext under Quote Value
        const quoteTaxEl = document.getElementById('kpiQuoteTaxSubtext');
        if (quoteTaxEl) {
            quoteTaxEl.textContent = totalQuoteTax > 0 ? 'Tax: ' + formatCurrencyShort(totalQuoteTax) : '';
        }

        // CO Count/Value: Cross-filter GSA PO data by active SM filters (Q7)
        let filteredGSAPOs = gsaState?.allPOs || [];
        if (hasActiveFilter && filteredGSAPOs.length > 0) {
            filteredGSAPOs = filteredGSAPOs.filter(po => {
                if (currentFilters.entity && (po.entity || '').trim() !== currentFilters.entity.trim()) return false;
                if (currentFilters.project && po.project !== currentFilters.project) return false;
                if (currentFilters.supplier && po.supplier !== currentFilters.supplier) return false;
                if (currentFilters.material && po.material !== currentFilters.material) return false;
                if (currentFilters.materialCode && po.materialCode !== currentFilters.materialCode) return false;
                if (currentFilters.dateFrom || currentFilters.dateTo) {
                    const poDate = new Date(po.poDate);
                    if (isNaN(poDate)) return false;
                    if (currentFilters.dateFrom && poDate < new Date(currentFilters.dateFrom)) return false;
                    if (currentFilters.dateTo) {
                        const toDate = new Date(currentFilters.dateTo);
                        toDate.setHours(23, 59, 59, 999);
                        if (poDate > toDate) return false;
                    }
                }
                if (currentFilters.search) {
                    const searchFields = [po.poNumber, po.project, po.supplier, po.material, po.entity].filter(Boolean).join(' ').toLowerCase();
                    if (!searchFields.includes(currentFilters.search)) return false;
                }
                return true;
            });
            // Update PO KPIs from filtered GSA data
            const filteredPOCount = filteredGSAPOs.length;
            const filteredPOSpend = filteredGSAPOs.reduce((sum, po) => sum + (po.valueUSD || 0), 0);
            document.getElementById('kpiPoCount').textContent = filteredPOCount.toLocaleString();
            document.getElementById('kpiPoValue').textContent = formatCurrencyShort(filteredPOSpend);
            // Recalculate win rate with filtered PO count
            const filteredWinRate = filtered.length > 0 ? (filteredPOCount / filtered.length * 100).toFixed(1) : 0;
            document.getElementById('kpiWinRate').textContent = filteredWinRate + '%';
        }
        const gsaCOs = filteredGSAPOs.filter(po => po.poType === 'Change Order');
        document.getElementById('kpiCoCount').textContent = gsaCOs.length.toLocaleString();
        document.getElementById('kpiCoValue').textContent = formatCurrencyShort(
            gsaCOs.reduce((sum, po) => sum + (po.valueUSD || 0), 0)
        );

        // Update status chart from filtered data
        const statusCounts = {};
        filtered.forEach(q => {
            const status = q.Status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusColors = {
            'Order': '#4CAF50',
            'Quotation': '#2196F3',
            'Waiting': '#FFC107',
            'Cancelled': '#F44336',
            'Closed': '#9E9E9E'
        };

        const filteredStatusChart = Object.entries(statusCounts)
            .map(([status, count]) => ({
                status,
                count,
                color: statusColors[status] || '#888'
            }))
            .sort((a, b) => b.count - a.count);

        renderStatusChart(filteredStatusChart);

        // Update Conversion Rate and Open Quotes KPIs
        const orderCount = statusCounts['Order'] || 0;
        const quotationCount = statusCounts['Quotation'] || 0;
        const waitingCount = statusCounts['Waiting'] || 0;
        const openQuotesCount = quotationCount + waitingCount;
        const conversionRate = filtered.length > 0 ? ((orderCount / filtered.length) * 100).toFixed(1) : 0;
        document.getElementById('conversionRate').textContent = conversionRate + '%';
        document.getElementById('openQuotes').textContent = openQuotesCount.toLocaleString();

        // Update Entity Comparison chart from filtered data
        const entitySpend = {};
        filtered.forEach(q => {
            const entity = q.Entity || 'Unknown';
            if (!entitySpend[entity]) {
                entitySpend[entity] = { entity, quoteValue: 0, quoteCount: 0, poSpend: 0, poCount: 0 };
            }
            const val = q.QuotationValue || 0;
            const curr = q.Currency || 'USD';
            entitySpend[entity].quoteValue += convertToUSD(val, curr);
            entitySpend[entity].quoteCount++;
            if (q.Status === 'Order') {
                entitySpend[entity].poSpend += convertToUSD(val, curr);
                entitySpend[entity].poCount++;
            }
        });

        const entityColors = ['#0066CC', '#339933', '#FF9900', '#9966CC', '#CC6699', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A4', '#D4A574'];
        const entityComparison = Object.values(entitySpend)
            .filter(e => e.entity !== 'Unknown')
            .sort((a, b) => (b.quoteValue + b.poSpend) - (a.quoteValue + a.poSpend))
            .map((e, i) => ({ ...e, color: entityColors[i % entityColors.length] }));

        if (dashboardData?.supplierMarketplace) {
            dashboardData.supplierMarketplace.entityComparison = entityComparison;
        }
        renderEntityChartCanvas(entityComparison, currentEntityView || 'quote');

        // Update Top Suppliers from filtered data (using Client field)
        const clientSpend = {};
        filtered.filter(q => q.Status === 'Order').forEach(q => {
            const client = q.Client || 'Unknown';
            if (!clientSpend[client]) {
                clientSpend[client] = { name: client, poCount: 0, spend: 0 };
            }
            const val = q.QuotationValue || 0;
            const curr = q.Currency || 'USD';
            clientSpend[client].poCount++;
            clientSpend[client].spend += convertToUSD(val, curr);
        });

        const topSuppliers = Object.values(clientSpend)
            .filter(s => s.name !== 'Unknown')
            .sort((a, b) => b.spend - a.spend)
            .slice(0, 10)
            .map((s, i) => ({ rank: i + 1, ...s }));

        renderTopSuppliers(topSuppliers);

        // Update Material Distribution chart from filtered data (SM-Q11: use Material names, not codes)
        const materialCounts = {};
        filtered.forEach(q => {
            const material = q.Material || q.materialCode || 'Unknown';
            if (material && material !== 'Unknown') {
                const val = q.QuotationValue || 0;
                const curr = q.Currency || 'USD';
                if (!materialCounts[material]) materialCounts[material] = { value: 0, count: 0 };
                materialCounts[material].value += convertToUSD(val, curr);
                materialCounts[material].count++;
            }
        });

        const materialColors = ['#0066CC', '#3399FF', '#339933', '#66CC66', '#FF9900', '#FF6600', '#9966CC', '#CC6699', '#2B4257', '#06B6D4', '#EF4444', '#8B5CF6'];
        const materialDist = Object.entries(materialCounts)
            .sort((a, b) => b[1].value - a[1].value)
            .map(([material, data], i) => ({
                material,
                value: data.value,
                count: data.count,
                color: materialColors[i % materialColors.length]
            }));

        renderMaterialChartCanvas(materialDist, 'pie');

        // Q13: Update Submit & Order Quantity trend chart from filtered data
        const trendMonthlyMap = {};
        filtered.forEach(q => {
            const qDate = q.Date ? new Date(q.Date) : null;
            if (!qDate || isNaN(qDate)) return;
            const monthKey = qDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
            if (!trendMonthlyMap[monthKey]) {
                trendMonthlyMap[monthKey] = { month: monthKey, quotes: 0, orders: 0, cos: 0, sortKey: qDate.getFullYear() * 100 + qDate.getMonth() };
            }
            trendMonthlyMap[monthKey].quotes++;
            if (q.Status === 'Order') trendMonthlyMap[monthKey].orders++;
        });
        // Add CO counts from filtered GSA data
        if (filteredGSAPOs && filteredGSAPOs.length > 0) {
            filteredGSAPOs.filter(po => po.poType === 'Change Order').forEach(po => {
                const poDate = po.poDate ? new Date(po.poDate) : null;
                if (!poDate || isNaN(poDate)) return;
                const monthKey = poDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
                if (!trendMonthlyMap[monthKey]) {
                    trendMonthlyMap[monthKey] = { month: monthKey, quotes: 0, orders: 0, cos: 0, sortKey: poDate.getFullYear() * 100 + poDate.getMonth() };
                }
                trendMonthlyMap[monthKey].cos++;
            });
        }
        const trendData = Object.values(trendMonthlyMap).sort((a, b) => a.sortKey - b.sortKey);
        renderTrendChartLine(trendData);

        // Update Supplier Location Map based on filtered data
        // Use clientCountryMap (loaded from JSON) or fall back to entity-based mapping
        const entityCountryMap = {
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
            'MVL VENTURES': 'United Arab Emirates',
            'MVL ENERGY': 'United Arab Emirates',
            'MVL SOLUTIONS': 'United Arab Emirates',
            'CENTRICO': 'United Arab Emirates',
            'MVL TRADING': 'United Arab Emirates',
            'MVL FACILITIES': 'United Arab Emirates',
            'MVL ARABIA': 'Saudi Arabia',
            'MVL PROJECTS': 'United Arab Emirates',
            'Unknown': 'United Arab Emirates'
        };

        // Normalize country names — uses global normalizeCountry()
        // Count quotations/spend by country from filtered data using client country
        const countrySpend = {};
        filtered.forEach(q => {
            const client = q.Client || '';
            const entity = q.Entity || '';
            // First try to get country from clientCountryMap (simple string), then from entity
            let country = 'United Arab Emirates';
            if (clientCountryMap && clientCountryMap[client]) {
                // New format: value is just the country string
                country = typeof clientCountryMap[client] === 'string'
                    ? clientCountryMap[client]
                    : (clientCountryMap[client].country || 'United Arab Emirates');
            } else {
                country = entityCountryMap[entity] || 'United Arab Emirates';
            }
            country = normalizeCountry(country);

            const val = q.QuotationValue || 0;
            const curr = q.Currency || 'USD';
            if (!countrySpend[country]) {
                countrySpend[country] = { quoteCount: 0, totalValue: 0, clients: new Set() };
            }
            countrySpend[country].quoteCount++;
            countrySpend[country].totalValue += convertToUSD(val, curr);
            if (client) countrySpend[country].clients.add(client);
        });

        // Build filtered map locations
        const filteredMapLocations = Object.entries(countrySpend)
            .filter(([country]) => countryCoords[country])
            .map(([country, data]) => ({
                name: country,
                lat: countryCoords[country].lat,
                lng: countryCoords[country].lng,
                country: country,
                supplierCount: data.quoteCount,
                totalSpend: data.totalValue,
                suppliers: Array.from(data.clients).slice(0, 10)
            }));

        console.log('🗺️ Map locations:', filteredMapLocations.map(l => `${l.name}: ${l.supplierCount}`).join(', '));
        renderSupplierMapFromLocations(filteredMapLocations);

        // Update supplier profile with full details when supplier filter is active
        if (currentFilters.supplier) {
            const supplierQuotes = filtered.filter(q => q.Client === currentFilters.supplier);
            // Look up full supplier details from suppliersData
            const allSuppliers = suppliersData?.suppliers || [];
            const fullSupplier = allSuppliers.find(s => s.name === currentFilters.supplier);
            if (fullSupplier || supplierQuotes.length > 0) {
                const totalSpend = supplierQuotes.reduce((sum, q) => {
                    const val = q.QuotationValue || 0;
                    const curr = q.Currency || 'USD';
                    return sum + convertToUSD(val, curr);
                }, 0);

                // Update profile card with full supplier details (same as Top 10 click)
                document.getElementById('supplierName').textContent = currentFilters.supplier;
                document.getElementById('supplierAvatar').textContent = currentFilters.supplier.charAt(0).toUpperCase();
                document.getElementById('supplierLocation').textContent =
                    normalizeCountry(fullSupplier?.address?.country_standardized || fullSupplier?.phone_validation?.phone_country) ||
                    (supplierQuotes.length > 0 ? `${supplierQuotes.length} Quotations` : '-');
                document.getElementById('supplierContact').textContent =
                    fullSupplier?.contact?.primary_contact || '-';
                document.getElementById('supplierEmail').textContent =
                    fullSupplier?.contact?.email || '-';
                document.getElementById('supplierPhone').textContent =
                    fullSupplier?.contact?.phone || '-';

                // Rating stars
                const rating = fullSupplier?.rating?.score ?? (typeof fullSupplier?.rating === 'number' ? fullSupplier.rating : 3);
                const fullStars = Math.floor(rating);
                const hasHalf = (rating - fullStars) >= 0.3;
                const stars = '★'.repeat(fullStars) + (hasHalf ? '★' : '') + '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
                document.getElementById('supplierRating').textContent = stars;

                // Highlight matching supplier in Top 10 list if present
                const topSuppliers = dashboardData?.supplierMarketplace?.topSuppliers || [];
                const topIndex = topSuppliers.findIndex(s => s.name === currentFilters.supplier);
                document.querySelectorAll('.rank-item').forEach((el, i) => {
                    el.classList.toggle('selected', i === topIndex);
                });

                // Update approved materials
                renderApprovedMaterials(currentFilters.supplier);
            }
        }

        // Update Responsible MVL Employee list from filtered data (Contact field)
        const contactPerf = {};
        filtered.filter(q => q.Status === 'Order').forEach(q => {
            const contact = q.Contact || 'Unknown';
            if (!contactPerf[contact]) {
                contactPerf[contact] = { name: contact, poCount: 0, totalSpend: 0 };
            }
            const val = q.QuotationValue || 0;
            const curr = q.Currency || 'USD';
            contactPerf[contact].poCount++;
            contactPerf[contact].totalSpend += convertToUSD(val, curr);
        });

        const employeeList = Object.values(contactPerf)
            .map(e => ({ ...e, name: e.name === 'Unknown' ? 'Unassigned' : e.name }))
            .sort((a, b) => b.totalSpend - a.totalSpend)
            .map((e, i) => ({ rank: i + 1, ...e }));

        renderEmployeeList(employeeList);

        // Q12: Update Quotation to PO Time chart — filter by entity/project/supplier/material + date range
        const quotationTimeData = [];
        if (window._conversionTimes && window._conversionTimes.records && window._conversionTimes.records.length > 0) {
            // Build set of quotation numbers from filtered workbench data
            const filteredQuotationNumbers = hasActiveFilter
                ? new Set(filtered.map(q => q.QuotationNumber).filter(Boolean))
                : null;

            const dateFrom = currentFilters.dateFrom ? currentFilters.dateFrom.substring(0, 7) : null;
            const dateTo = currentFilters.dateTo ? currentFilters.dateTo.substring(0, 7) : null;

            // Filter conversion records
            const filteredRecords = window._conversionTimes.records.filter(rec => {
                if (dateFrom && rec.month < dateFrom) return false;
                if (dateTo && rec.month > dateTo) return false;
                // Cross-reference with filtered workbench quotations
                if (filteredQuotationNumbers && !filteredQuotationNumbers.has(rec.quotationNumber)) return false;
                return true;
            });

            // Recompute monthly averages from filtered records
            const monthlyMap = {};
            filteredRecords.forEach(rec => {
                if (!monthlyMap[rec.month]) monthlyMap[rec.month] = { total: 0, count: 0 };
                monthlyMap[rec.month].total += rec.daysToConvert || 0;
                monthlyMap[rec.month].count++;
            });
            Object.keys(monthlyMap).sort().forEach(month => {
                const { total, count } = monthlyMap[month];
                quotationTimeData.push({ month, avgDays: count > 0 ? Math.round(total / count) : 0 });
            });
        } else if (window._conversionTimes && window._conversionTimes.monthlyAverage) {
            // Fallback: use pre-calculated monthly averages (date range only)
            const dateFrom = currentFilters.dateFrom ? currentFilters.dateFrom.substring(0, 7) : null;
            const dateTo = currentFilters.dateTo ? currentFilters.dateTo.substring(0, 7) : null;
            window._conversionTimes.monthlyAverage.forEach(item => {
                if (dateFrom && item.month < dateFrom) return;
                if (dateTo && item.month > dateTo) return;
                quotationTimeData.push({ month: item.month, avgDays: item.avgDays });
            });
        }

        if (quotationTimeData.length > 0) {
            renderQuotationTimeChart(quotationTimeData);
        } else {
            // Show "no data" message in the chart container
            const qtCanvas = document.getElementById('quotationTimeChart');
            if (qtCanvas) {
                if (quotationTimeChartInstance) {
                    quotationTimeChartInstance.destroy();
                    quotationTimeChartInstance = null;
                }
                const ctx = qtCanvas.getContext('2d');
                quotationTimeChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: { labels: ['No Data'], datasets: [{ label: 'Avg Days', data: [0], backgroundColor: '#ccc' }] },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: { bottom: 10 } },
                        plugins: { legend: { display: false }, title: { display: true, text: 'No Q→PO link data for selected range', font: { size: 11 } } },
                        scales: {
                            y: { beginAtZero: true, ticks: { font: { size: 9 } } },
                            x: { ticks: { font: { size: 9 } } }
                        }
                    }
                });
            }
        }

        // Refresh the bottom paginated table
        bottomTableState.currentPage = 1;
        renderBottomTable(bottomTableState.currentTab);

        console.log(`✅ Filters applied: ${filtered.length} quotations from smData.workbench`);
        return;
    }

    // Fallback to original quotationsData logic
    const { quotes, pos, suppliers } = getFilteredData();

    // Update KPIs with filtered data - convert to USD
    const totalPOValue = pos.reduce((sum, po) => {
        const val = po.financial?.total_amount || 0;
        const curr = po.financial?.currency || 'USD';
        return sum + convertToUSD(val, curr);
    }, 0);
    const totalQuoteValue = quotes.reduce((sum, q) => {
        const val = q.financial?.quoted_value || 0;
        const curr = q.financial?.currency || 'USD';
        return sum + convertToUSD(val, curr);
    }, 0);
    const wonQuotes = quotes.filter(q => q.outcome?.status_normalized === 'won').length;
    const winRate = quotes.length > 0 ? (wonQuotes / quotes.length * 100).toFixed(1) : 0;

    document.getElementById('kpiRfqCount').textContent = quotes.length.toLocaleString();
    document.getElementById('kpiQuoteValue').textContent = formatCurrencyShort(totalQuoteValue);
    document.getElementById('kpiPoCount').textContent = pos.length.toLocaleString();
    document.getElementById('kpiPoValue').textContent = formatCurrencyShort(totalPOValue);
    document.getElementById('kpiWinRate').textContent = winRate + '%';
    // Tax subtext under Quote Value
    const quoteTaxEl2 = document.getElementById('kpiQuoteTaxSubtext');
    if (quoteTaxEl2) {
        const totalTax = quotes.reduce((sum, q) => {
            const t = q.financial?.tax || 0;
            const c = q.financial?.currency || 'USD';
            return sum + convertToUSD(t, c);
        }, 0);
        quoteTaxEl2.textContent = totalTax > 0 ? 'Tax: ' + formatCurrencyShort(totalTax) : '';
    }
    // CO Count/Value: Show actual change orders from GSA data
    const gsaCOsFiltered = gsaData?.summary?.changeOrders || 0;
    const gsaCOValueFiltered = gsaData?.summary?.changeOrderValue || 0;
    document.getElementById('kpiCoCount').textContent = gsaCOsFiltered.toLocaleString();
    document.getElementById('kpiCoValue').textContent = formatCurrencyShort(gsaCOValueFiltered);

    // Rebuild status chart from filtered quotes
    const statusCounts = {};
    quotes.forEach(q => {
        const status = q.outcome?.status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusColors = {
        'Order': '#4CAF50',
        'Quotation': '#2196F3',
        'Waiting': '#FFC107',
        'Cancelled': '#F44336',
        'Closed': '#9E9E9E'
    };

    const filteredStatusChart = Object.entries(statusCounts)
        .map(([status, count]) => ({
            status,
            count,
            color: statusColors[status] || '#888'
        }))
        .sort((a, b) => b.count - a.count);

    renderStatusChart(filteredStatusChart);

    // Rebuild entity comparison from filtered quotes and POs
    const entityData = {};
    quotes.forEach(q => {
        const company = q.company || 'Unknown';
        if (!entityData[company]) {
            entityData[company] = { entity: company, quoteValue: 0, quoteCount: 0, poSpend: 0, poCount: 0 };
        }
        entityData[company].quoteValue += q.financial?.quoted_value || 0;
        entityData[company].quoteCount++;
    });

    pos.forEach(po => {
        const company = po.company || po.entity || 'Unknown';
        if (!entityData[company]) {
            entityData[company] = { entity: company, quoteValue: 0, quoteCount: 0, poSpend: 0, poCount: 0 };
        }
        entityData[company].poSpend += po.financial?.total_amount || 0;
        entityData[company].poCount++;
    });

    const entityColors = ['#0066CC', '#339933', '#FF9900', '#9966CC', '#CC6699', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A4', '#D4A574'];
    // Sort by total value to get most active entities — show ALL
    const entityComparison = Object.values(entityData)
        .sort((a, b) => (b.quoteValue + b.poSpend) - (a.quoteValue + a.poSpend))
        .map((e, i) => ({ ...e, color: entityColors[i % entityColors.length] }));

    console.log('📊 Filtered entity comparison:', entityComparison.map(e => ({ entity: e.entity, quoteValue: e.quoteValue, poSpend: e.poSpend })));

    // Update dashboardData so toggle works with filtered data
    dashboardData.supplierMarketplace.entityComparison = entityComparison;

    renderEntityChartCanvas(entityComparison, currentEntityView || 'quote');

    // Rebuild top suppliers from filtered POs
    const supplierSpend = {};
    pos.forEach(po => {
        const name = po.supplier?.name || 'Unknown';
        if (!supplierSpend[name]) {
            supplierSpend[name] = { name, poCount: 0, spend: 0 };
        }
        supplierSpend[name].poCount++;
        supplierSpend[name].spend += po.financial?.total_amount || 0;
    });

    const topSuppliers = Object.values(supplierSpend)
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 10)
        .map((s, i) => ({ rank: i + 1, ...s }));

    renderTopSuppliers(topSuppliers);

    // Rebuild material distribution from filtered suppliers
    const materialCounts = {};
    suppliers.forEach(s => {
        const cat = s.material_category;
        if (cat && cat !== 'null') {
            if (!materialCounts[cat]) materialCounts[cat] = 0;
            materialCounts[cat]++;
        }
    });

    const materialColors = ['#0066CC', '#3399FF', '#339933', '#66CC66', '#FF9900', '#FF6600', '#9966CC', '#CC6699', '#2B4257', '#06B6D4', '#EF4444', '#8B5CF6'];
    const materialDist = Object.entries(materialCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([material, count], i) => ({
            material,
            value: count * 10000000,
            color: materialColors[i % materialColors.length]
        }));

    renderMaterialChartCanvas(materialDist, currentMaterialChartType || 'bar');

    // Update supplier map with filtered data
    renderSupplierMapFiltered(suppliers, pos);

    // Update bottom table with filtered data
    updateWorkbenchTable(quotes);

    // Also refresh the bottom paginated table (uses smData.workbench)
    bottomTableState.currentPage = 1;
    renderBottomTable(bottomTableState.currentTab);

    console.log(`✅ Filters applied: ${quotes.length} quotes, ${pos.length} POs, ${suppliers.length} suppliers`);
}

function updateWorkbenchTable(filteredQuotes) {
    const tbody = document.getElementById('workbenchTable');
    if (!tbody) return;

    const rows = filteredQuotes.slice(0, 20).map(q => {
        const status = q.outcome?.status || 'Unknown';
        const value = q.financial?.quoted_value ? formatCurrencyShort(q.financial.quoted_value) : '-';
        const tax = q.financial?.tax ? formatCurrencyShort(q.financial.tax) : '-';
        return `
            <tr>
                <td>${truncateText(q.quotation_number, 20)}</td>
                <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
                <td>${truncateText(q.details?.material_category || '-', 20)}</td>
                <td>${truncateText(q.project?.name || '-', 25)}</td>
                <td>${value}</td>
                <td>${tax}</td>
                <td>${truncateText(q.contact?.mvl_contact || '-', 15)}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows || '<tr><td colspan="7" style="text-align:center; color:#888;">No matching records</td></tr>';

    // Update pagination text
    const pagination = document.getElementById('tablePagination');
    if (pagination) {
        pagination.textContent = `Showing ${Math.min(20, filteredQuotes.length)} of ${filteredQuotes.length} records`;
    }
}

// ============================================
// RENDER: SUPPLIER MARKETPLACE
// ============================================
// Update Supplier Profile card (SM tab) when a supplier is selected
function updateSupplierProfile(supplier) {
    if (!supplier) return;

    const nameEl = document.getElementById('supplierName');
    const locationEl = document.getElementById('supplierLocation');
    const avatarEl = document.getElementById('supplierAvatar');
    const contactEl = document.getElementById('supplierContact');
    const emailEl = document.getElementById('supplierEmail');
    const phoneEl = document.getElementById('supplierPhone');
    const ratingEl = document.getElementById('supplierRating');

    if (nameEl) nameEl.textContent = supplier.name || '-';
    if (locationEl) locationEl.textContent = supplier.location || supplier.country || '-';
    if (avatarEl) avatarEl.textContent = (supplier.name || 'S').charAt(0).toUpperCase();
    if (contactEl) contactEl.textContent = supplier.contactPerson || supplier.contact || '-';
    if (emailEl) emailEl.textContent = supplier.email || '-';
    if (phoneEl) phoneEl.textContent = supplier.phone || '-';

    const rating = supplier.rating || 4.0;
    const fullStars = Math.floor(rating);
    const hasHalf = (rating - fullStars) >= 0.3;
    let stars = '★'.repeat(fullStars) + (hasHalf ? '★' : '') + '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
    if (ratingEl) ratingEl.textContent = stars;
}

function renderSupplierMarketplace() {
    const data = dashboardData.supplierMarketplace;

    renderStatusChart(data.statusChart);
    renderEntityChartCanvas(data.entityComparison, currentEntityView || 'quote');
    renderTopSuppliers(data.topSuppliers);
    renderMaterialChartCanvas(data.materialDistribution, 'pie');
    renderEmployeeList(data.responsibleEmployees);
    renderQuotationTimeChart(data.quotationToPOTime);
    renderTrendChartLine(data.monthlyTrend);
    renderSupplierMap(data.supplierLocations);
    renderApprovedMaterials(null); // Initialize with no supplier selected
    renderBottomTable('workbench');

    // Update KPIs
    updateKPIs(dashboardData.summary);
}

function updateKPIs(summary) {
    document.getElementById('kpiRfqCount').textContent = formatNumber(summary.rfqCount);
    document.getElementById('kpiQuoteValue').textContent = formatCurrencyShort(summary.quoteValue);
    document.getElementById('kpiPoCount').textContent = formatNumber(summary.poCount);
    document.getElementById('kpiPoValue').textContent = formatCurrencyShort(summary.poValue);
    document.getElementById('kpiWinRate').textContent = summary.winRate + '%';
    document.getElementById('kpiCoCount').textContent = formatNumber(summary.coCount);
    document.getElementById('kpiCoValue').textContent = formatCurrencyShort(summary.coValue);
    document.getElementById('conversionRate').textContent = summary.conversionRate + '%';
    document.getElementById('openQuotes').textContent = formatNumber(summary.openQuotes);
    // Tax subtext
    const quoteTaxEl = document.getElementById('kpiQuoteTaxSubtext');
    if (quoteTaxEl && summary.totalQuotationTaxUSD > 0) {
        quoteTaxEl.textContent = 'Tax: ' + formatCurrencyShort(summary.totalQuotationTaxUSD);
    }
}

// ============================================
// RENDER: STATUS CHART
// ============================================
function renderStatusChart(data) {
    const container = document.getElementById('statusChart');
    if (!container || !data) return;

    const maxCount = Math.max(...data.map(d => d.count));
    const total = data.reduce((sum, d) => sum + d.count, 0);

    container.innerHTML = data.map(item => `
        <div class="status-bar-item" style="cursor:pointer" title="${item.status}: ${formatNumber(item.count)} quotes (${((item.count / total) * 100).toFixed(1)}%)" onclick="filterByStatus('${item.status}')">
            <div class="status-bar-label">${item.status}</div>
            <div class="status-bar-track">
                <div class="status-bar-fill ${item.status.toLowerCase()}" 
                     style="width: ${(item.count / maxCount * 100)}%"></div>
            </div>
            <div class="status-bar-value">${formatNumber(item.count)}</div>
        </div>
    `).join('');
}

// SM-Q7: Click status bar to filter dashboard
function filterByStatus(status) {
    const filterStatus = document.getElementById('filterStatus');
    if (!filterStatus) return;
    // Toggle: if already selected, clear it
    if (filterStatus.value === status) {
        filterStatus.selectedIndex = 0;
    } else {
        filterStatus.value = status;
    }
    if (typeof handleFilterChange === 'function') handleFilterChange();
    else if (typeof applyFilters === 'function') applyFilters();
}
window.filterByStatus = filterByStatus;

// ============================================
// RENDER: TOP SUPPLIERS
// ============================================
function renderTopSuppliers(data) {
    const container = document.getElementById('topSuppliers');
    if (!container || !data) return;

    if (data.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888; padding:20px; font-size:13px;">No suppliers found for selected filters</div>';
        return;
    }

    const maxSpend = Math.max(...data.map(d => d.spend));

    // Rank circle colors
    const getRankClass = (rank) => {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return '';
    };

    container.innerHTML = data.map(item => `
        <div class="rank-item" onclick="selectSupplier(${item.rank - 1})" style="cursor:pointer" title="Click to view ${item.name} - Total: ${formatCurrencyShort(item.spend)} from ${item.poCount} POs">
            <div class="rank-circle ${getRankClass(item.rank)}">${item.rank}</div>
            <div class="rank-info">
                <div class="rank-name">${item.name}</div>
                <div class="rank-meta">${item.poCount} POs</div>
            </div>
            <div class="rank-bar-container">
                <div class="rank-bar" style="width: ${(item.spend / maxSpend * 100)}%"></div>
            </div>
            <div class="rank-value">${formatCurrencyShort(item.spend)}</div>
        </div>
    `).join('');
}

function selectSupplier(index) {
    const suppliers = dashboardData.supplierMarketplace.topSuppliers;
    if (!suppliers || !suppliers[index]) return;

    const supplier = suppliers[index];
    selectedSupplier = supplier;

    // Find full supplier details from suppliersData
    const allSuppliers = suppliersData?.suppliers || [];
    const fullSupplier = allSuppliers.find(s => s.name === supplier.name);

    // Update profile card with real data
    document.getElementById('supplierName').textContent = supplier.name;
    document.getElementById('supplierLocation').textContent =
        normalizeCountry(fullSupplier?.address?.country_standardized || fullSupplier?.phone_validation?.phone_country) ||
        `${supplier.poCount} Purchase Orders`;
    document.getElementById('supplierAvatar').textContent = supplier.name.charAt(0).toUpperCase();
    document.getElementById('supplierContact').textContent =
        fullSupplier?.contact?.primary_contact || '-';
    document.getElementById('supplierEmail').textContent =
        fullSupplier?.contact?.email || '-';
    document.getElementById('supplierPhone').textContent =
        fullSupplier?.contact?.phone || '-';

    // Update rating stars
    const rating = fullSupplier?.rating?.score || 3;
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    document.getElementById('supplierRating').textContent = stars;

    // Highlight selected supplier in list
    document.querySelectorAll('.rank-item').forEach((el, i) => {
        el.classList.toggle('selected', i === index);
    });

    // Cross-filter: set supplier dropdown and apply filters
    const supplierFilter = document.getElementById('filterSupplier');
    if (supplierFilter) {
        // Check if supplier exists in dropdown options
        let found = false;
        for (let option of supplierFilter.options) {
            if (option.value === supplier.name) {
                supplierFilter.value = supplier.name;
                found = true;
                break;
            }
        }
        if (!found) {
            const newOption = document.createElement('option');
            newOption.value = supplier.name;
            newOption.textContent = supplier.name;
            supplierFilter.insertBefore(newOption, supplierFilter.options[1]);
            supplierFilter.value = supplier.name;
        }
        // Trigger filter application
        applyFilters();
    }

    // Update approved materials table
    renderApprovedMaterials(supplier.name);

    console.log('👤 Selected supplier:', supplier.name, fullSupplier);
}

// ============================================
// RENDER: APPROVED MATERIALS
// ============================================
function renderApprovedMaterials(supplierName) {
    const tbody = document.getElementById('approvedMaterialTable');
    if (!tbody) return;

    const approvedMaterials = dashboardData.supplierMarketplace.approvedMaterials || [];

    if (!supplierName) {
        // No supplier selected - show all materials from top 3 suppliers for demo
        const allMaterials = [];
        approvedMaterials.slice(0, 3).forEach(s => {
            s.materials.forEach(m => allMaterials.push(m));
        });

        if (allMaterials.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#888;">No materials available</td></tr>`;
            return;
        }

        tbody.innerHTML = allMaterials.map(m => `
            <tr>
                <td>${m.material}</td>
                <td>${m.spec}</td>
                <td>${m.leadTime}</td>
            </tr>
        `).join('');
        return;
    }

    // Find materials for selected supplier
    const supplierMaterials = approvedMaterials.find(s => s.supplier === supplierName);

    if (!supplierMaterials || supplierMaterials.materials.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#888;">No approved materials for this supplier</td></tr>`;
        return;
    }

    tbody.innerHTML = supplierMaterials.materials.map(m => `
        <tr>
            <td>${m.material}</td>
            <td>${m.spec}</td>
            <td>${m.leadTime}</td>
        </tr>
    `).join('');
}

// ============================================
// RENDER: MATERIAL DISTRIBUTION
// ============================================
function renderMaterialChart(data) {
    const container = document.getElementById('materialChart');
    if (!container || !data) return;

    const maxValue = Math.max(...data.map(d => d.value));

    container.innerHTML = data.map(item => `
        <div class="bar-chart-item">
            <div class="bar-chart-label">${item.material}</div>
            <div class="bar-chart-track">
                <div class="bar-chart-fill" 
                     style="width: ${(item.value / maxValue * 100)}%; background: ${item.color}">
                </div>
            </div>
            <div class="bar-chart-value">${formatCurrencyShort(item.value)}</div>
        </div>
    `).join('');
}

// ============================================
// RENDER: EMPLOYEE LIST
// ============================================
// SM-Q12: Toggle employee sort between PO count and spend
let employeeSortBySpend = false;
function toggleEmployeeSort(event) {
    if (event) event.preventDefault();
    employeeSortBySpend = !employeeSortBySpend;
    const link = event?.target;
    if (link) link.textContent = employeeSortBySpend ? 'BY COUNT' : 'BY SPEND';
    const employees = dashboardData?.supplierMarketplace?.responsibleEmployees;
    if (!employees) return;
    const sorted = [...employees].sort((a, b) =>
        employeeSortBySpend ? b.totalSpend - a.totalSpend : b.poCount - a.poCount
    ).map((e, i) => ({ ...e, rank: i + 1 }));
    renderEmployeeList(sorted);
}
window.toggleEmployeeSort = toggleEmployeeSort;

function renderEmployeeList(data) {
    const container = document.getElementById('employeeList');
    if (!container || !data) return;

    if (data.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888; padding:20px; font-size:13px;">No employee data for selected filters</div>';
        return;
    }

    const maxSpend = Math.max(...data.map(d => d.totalSpend));

    // Rank circle colors
    const getRankClass = (rank) => {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return 'gray';
    };

    container.innerHTML = data.map(item => `
        <div class="rank-item">
            <div class="rank-circle ${getRankClass(item.rank)}">${item.rank}</div>
            <div class="rank-info">
                <div class="rank-name">${item.name}</div>
                <div class="rank-meta">${item.poCount} POs</div>
            </div>
            <div class="rank-bar-container">
                <div class="rank-bar" style="width: ${(item.totalSpend / maxSpend * 100)}%"></div>
            </div>
            <div class="rank-value">${formatCurrencyShort(item.totalSpend)}</div>
        </div>
    `).join('');
}

// ============================================
// RENDER: TREND CHART (LINE - Chart.js)
// ============================================
function renderTrendChartLine(data) {
    const canvas = document.getElementById('trendChart');
    if (!canvas || !data) return;

    // Destroy previous instance
    if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
    }

    const ctx = canvas.getContext('2d');

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.month),
            datasets: [
                {
                    label: 'Quotes',
                    data: data.map(d => d.quotes),
                    borderColor: '#0066CC',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#0066CC'
                },
                {
                    label: 'Orders',
                    data: data.map(d => d.orders),
                    borderColor: '#339933',
                    backgroundColor: 'rgba(51, 153, 51, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#339933'
                },
                {
                    label: 'COs',
                    data: data.map(d => d.cos),
                    borderColor: '#FF9900',
                    backgroundColor: 'rgba(255, 153, 0, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#FF9900'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 10 },
                        callback: function (value) {
                            return formatNumber(value);
                        }
                    }
                },
                x: {
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

// ============================================
// RENDER: QUOTATION TO PO TIME (Bar Chart)
// ============================================
function renderQuotationTimeChart(data) {
    const canvas = document.getElementById('quotationTimeChart');
    const scrollContainer = document.getElementById('quotationTimeScroll');
    if (!canvas) return;

    // Use provided data; no fallback with fake numbers
    const chartData = data;

    if (!chartData || chartData.length === 0) {
        // Show empty chart message
        if (quotationTimeChartInstance) {
            quotationTimeChartInstance.destroy();
            quotationTimeChartInstance = null;
        }
        return;
    }

    // Destroy previous instance
    if (quotationTimeChartInstance) {
        quotationTimeChartInstance.destroy();
        quotationTimeChartInstance = null;
    }

    const ctx = canvas.getContext('2d');

    quotationTimeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.month),
            datasets: [{
                label: 'Avg Days RFQ to PO',
                data: chartData.map(d => d.avgDays),
                backgroundColor: 'rgba(0, 120, 212, 0.7)',
                borderColor: '#0078D4',
                borderWidth: 1,
                borderRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 10
                }
            },
            animation: {
                duration: 0
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.raw} days (${chartData[ctx.dataIndex]?.count || 0} POs)`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Days',
                        font: { size: 10 }
                    },
                    ticks: { font: { size: 9 }, stepSize: 50 },
                    grid: { color: '#eee' }
                },
                x: {
                    ticks: {
                        font: { size: 9 },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 24
                    },
                    grid: { display: false }
                }
            }
        },
        plugins: [{
            id: 'daysLabel',
            afterDatasetsDraw(chart) {
                const { ctx: c, data, chartArea } = chart;
                const meta = chart.getDatasetMeta(0);
                c.save();
                c.font = 'bold 8px Segoe UI, sans-serif';
                c.fillStyle = '#333';
                c.textAlign = 'center';
                meta.data.forEach((bar, i) => {
                    const val = data.datasets[0].data[i];
                    if (val != null && bar.y < chartArea.bottom - 10) {
                        c.fillText(Math.round(val) + 'd', bar.x, bar.y - 4);
                    }
                });
                c.restore();
            }
        }]
    });
}

// Country coordinates lookup for map
const countryCoords = {
    'Kuwait': { lat: 29.3759, lng: 47.9774 },
    'United Arab Emirates': { lat: 24.4539, lng: 54.3773 },
    'UAE': { lat: 24.4539, lng: 54.3773 },
    'Dubai': { lat: 25.2048, lng: 55.2708 },
    'Dubai, UAE': { lat: 25.2048, lng: 55.2708 },
    'Saudi Arabia': { lat: 23.8859, lng: 45.0792 },
    'Nepal': { lat: 27.7172, lng: 85.3240 },
    'Qatar': { lat: 25.2854, lng: 51.5310 },
    'Oman': { lat: 23.5880, lng: 58.3829 },
    'Bahrain': { lat: 26.0667, lng: 50.5577 },
    'India': { lat: 20.5937, lng: 78.9629 },
    'United States': { lat: 37.0902, lng: -95.7129 },
    'USA': { lat: 37.0902, lng: -95.7129 },
    'China': { lat: 35.8617, lng: 104.1954 },
    'Japan': { lat: 36.2048, lng: 138.2529 },
    'Germany': { lat: 51.1657, lng: 10.4515 },
    'Greece': { lat: 39.0742, lng: 21.8243 },
    'Italy': { lat: 41.8719, lng: 12.5674 },
    'Lebanon': { lat: 33.8547, lng: 35.8623 },
    'United Kingdom': { lat: 55.3781, lng: -3.4360 },
    'UK': { lat: 55.3781, lng: -3.4360 },
    'France': { lat: 46.2276, lng: 2.2137 },
    'Italy': { lat: 41.8719, lng: 12.5674 },
    'Philippines': { lat: 12.8797, lng: 121.7740 },
    'Afghanistan': { lat: 33.9391, lng: 67.7100 },
    'Türkiye': { lat: 38.9637, lng: 35.2433 },
    'Turkey': { lat: 38.9637, lng: 35.2433 },
    'Lebanon': { lat: 33.8547, lng: 35.8623 },
    'Palestine, State of': { lat: 31.9522, lng: 35.2332 },
    'Pakistan': { lat: 30.3753, lng: 69.3451 },
    'Egypt': { lat: 26.8206, lng: 30.8025 },
    'Jordan': { lat: 30.5852, lng: 36.2384 },
    'Iraq': { lat: 33.2232, lng: 43.6793 },
    'Iran': { lat: 32.4279, lng: 53.6880 },
    'Singapore': { lat: 1.3521, lng: 103.8198 },
    'Malaysia': { lat: 4.2105, lng: 101.9758 },
    'Australia': { lat: -25.2744, lng: 133.7751 },
    'South Korea': { lat: 35.9078, lng: 127.7669 },
    'Spain': { lat: 40.4637, lng: -3.7492 },
    'Netherlands': { lat: 52.1326, lng: 5.2913 },
    'Belgium': { lat: 50.5039, lng: 4.4699 },
    'Canada': { lat: 56.1304, lng: -106.3468 },
    'Mexico': { lat: 23.6345, lng: -102.5528 },
    'Brazil': { lat: -14.2350, lng: -51.9253 },
    'Russia': { lat: 61.5240, lng: 105.3188 },
    'South Africa': { lat: -30.5595, lng: 22.9375 },
    'Hungary': { lat: 47.1625, lng: 19.5033 },
    'Switzerland': { lat: 46.8182, lng: 8.2275 },
    'Finland': { lat: 61.9241, lng: 25.7482 },
    'Ireland': { lat: 53.1424, lng: -7.6921 },
    'Sweden': { lat: 60.1282, lng: 18.6435 },
    'Norway': { lat: 60.4720, lng: 8.4689 },
    'Denmark': { lat: 56.2639, lng: 9.5018 },
    'Portugal': { lat: 39.3999, lng: -8.2245 },
    'Poland': { lat: 51.9194, lng: 19.1451 },
    'Czech Republic': { lat: 49.8175, lng: 15.4730 },
    'Austria': { lat: 47.5162, lng: 14.5501 },
    'Taiwan': { lat: 23.6978, lng: 120.9605 },
    'Vietnam': { lat: 14.0583, lng: 108.2772 },
    'Thailand': { lat: 15.8700, lng: 100.9925 },
    'Malaysia': { lat: 4.2105, lng: 101.9758 },
    'Indonesia': { lat: -0.7893, lng: 113.9213 },
    'Ukraine': { lat: 48.3794, lng: 31.1656 },
    'Cyprus': { lat: 35.1264, lng: 33.4299 },
    'Armenia': { lat: 40.0691, lng: 45.0382 },
    'Belize': { lat: 17.1899, lng: -88.4976 },
    'Ethiopia': { lat: 9.1450, lng: 40.4897 },
    'Niger': { lat: 17.6078, lng: 8.0817 },
    'Nigeria': { lat: 9.0820, lng: 8.6753 },
    'Uganda': { lat: 1.3733, lng: 32.2903 },
    'Zimbabwe': { lat: -19.0154, lng: 29.1549 },
    'Marshall Islands': { lat: 7.1315, lng: 171.1845 },
    'Central African Republic': { lat: 6.6111, lng: 20.9394 },
    'Iran': { lat: 32.4279, lng: 53.6880 },
    'Hong Kong': { lat: 22.3193, lng: 114.1694 },
    'Russia': { lat: 61.5240, lng: 105.3188 },
    'Palestine': { lat: 31.9522, lng: 35.2332 }
};

// ============================================
// RENDER: SUPPLIER MAP (Leaflet)
// ============================================
function renderSupplierMap(locations) {
    // Use all suppliers data
    const suppliers = suppliersData?.suppliers || [];
    const pos = purchaseOrdersData?.purchase_orders || [];
    renderSupplierMapFiltered(suppliers, pos);
}

// Render map from pre-built location objects (used by applyFilters)
function renderSupplierMapFromLocations(supplierLocations) {
    const mapContainer = document.getElementById('supplierMap');
    if (!mapContainer) return;

    console.log('🗺️ Map locations from filtered data:', supplierLocations.length, 'countries');

    // Destroy previous map instance if exists
    if (supplierMap) {
        supplierMap.remove();
        supplierMap = null;
    }

    // Initialize map
    supplierMap = L.map(mapContainer, {
        preferCanvas: true,
        attributionControl: false,
        zoomControl: true
    }).setView([25, 55], 2);

    // Add tile layer (CartoDB - lighter style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
    }).addTo(supplierMap);

    // Calculate max for intensity scaling
    const maxCount = Math.max(...supplierLocations.map(s => s.supplierCount), 1);

    // Color function based on count (intensity)
    function getColor(count) {
        const intensity = count / maxCount;
        if (intensity > 0.8) return '#d73027';
        if (intensity > 0.6) return '#fc8d59';
        if (intensity > 0.4) return '#fee08b';
        if (intensity > 0.2) return '#91cf60';
        return '#1a9850';
    }

    // Radius based on count
    function getRadius(count) {
        return Math.max(8, Math.min(25, 6 + (count / maxCount) * 20));
    }

    // Add markers for each location
    supplierLocations.forEach(loc => {
        const marker = L.circleMarker([loc.lat, loc.lng], {
            radius: getRadius(loc.supplierCount),
            fillColor: getColor(loc.supplierCount),
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
        }).addTo(supplierMap);

        marker.bindPopup(`
            <div style="min-width: 180px;">
                <strong style="font-size: 13px;">${loc.name}</strong><br>
                <hr style="margin: 6px 0; border-color: #ddd;">
                <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                    <span>Quotations:</span>
                    <strong style="color: ${getColor(loc.supplierCount)};">${loc.supplierCount.toLocaleString()}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                    <span>Total Value:</span>
                    <strong>${formatCurrencyShort(loc.totalSpend)}</strong>
                </div>
                ${loc.suppliers && loc.suppliers.length > 0 ? `
                <hr style="margin: 6px 0; border-color: #ddd;">
                <small style="color: #666;">Suppliers: ${loc.suppliers.slice(0, 5).join(', ')}${loc.suppliers.length > 5 ? '...' : ''}</small>
                ` : ''}
            </div>
        `);
    });

    // Fit bounds if we have locations
    if (supplierLocations.length > 0) {
        const bounds = L.latLngBounds(supplierLocations.map(loc => [loc.lat, loc.lng]));
        supplierMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 });
    }
}

function renderSupplierMapFiltered(suppliers, pos) {
    const mapContainer = document.getElementById('supplierMap');
    if (!mapContainer) return;

    // Group suppliers by country
    const countryGroups = {};
    suppliers.forEach(s => {
        // Try to get country from address, then from phone validation
        let country = s.address?.country_standardized || s.address?.country || s.phone_validation?.phone_country;
        if (!country || country === 'null') return;

        // Normalize country names
        country = normalizeCountry(country);

        if (!countryGroups[country]) {
            countryGroups[country] = {
                suppliers: [],
                totalSpend: 0
            };
        }
        countryGroups[country].suppliers.push(s.name);
    });

    // Add PO spend data by country
    pos.forEach(po => {
        const country = po.supplier?.country;
        if (country && countryGroups[country]) {
            countryGroups[country].totalSpend += po.financial?.total_amount || 0;
        }
    });

    // Build supplier locations array
    const supplierLocations = Object.entries(countryGroups)
        .filter(([country, data]) => countryCoords[country])
        .map(([country, data]) => ({
            name: country,
            lat: countryCoords[country].lat,
            lng: countryCoords[country].lng,
            country: country,
            supplierCount: data.suppliers.length,
            totalSpend: data.totalSpend,
            suppliers: data.suppliers.slice(0, 10)
        }))
        .filter(loc => loc.supplierCount > 0);

    console.log('🗺️ Map locations from real data:', supplierLocations.length, 'countries');

    // Destroy previous map instance if exists
    if (supplierMap) {
        supplierMap.remove();
        supplierMap = null;
    }

    // Initialize map
    supplierMap = L.map(mapContainer, {
        preferCanvas: true,
        attributionControl: false,
        zoomControl: true
    }).setView([25, 55], 2);

    // Add tile layer (CartoDB - lighter style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
    }).addTo(supplierMap);

    // Calculate max supplier count for intensity scaling
    const maxSuppliers = Math.max(...supplierLocations.map(s => s.supplierCount), 1);

    // Color function based on supplier count (intensity)
    function getColor(count) {
        const intensity = count / maxSuppliers;
        if (intensity > 0.8) return '#d73027';      // Very high - dark red
        if (intensity > 0.6) return '#fc8d59';      // High - orange-red
        if (intensity > 0.4) return '#fee08b';      // Medium - yellow
        if (intensity > 0.2) return '#91cf60';      // Low-medium - light green
        return '#1a9850';                           // Low - green
    }

    // Radius based on supplier count
    function getRadius(count) {
        return Math.max(8, Math.min(25, 6 + (count / maxSuppliers) * 20));
    }

    // Add markers for each supplier location
    supplierLocations.forEach(loc => {
        const marker = L.circleMarker([loc.lat, loc.lng], {
            radius: getRadius(loc.supplierCount),
            fillColor: getColor(loc.supplierCount),
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
        }).addTo(supplierMap);

        marker.bindPopup(`
            <div style="min-width: 180px;">
                <strong style="font-size: 13px;">${loc.name}</strong><br>
                <hr style="margin: 6px 0; border-color: #ddd;">
                <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                    <span>Suppliers:</span>
                    <strong style="color: ${getColor(loc.supplierCount)};">${loc.supplierCount}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                    <span>Total Spend:</span>
                    <strong>${formatCurrencyShort(loc.totalSpend)}</strong>
                </div>
                <hr style="margin: 6px 0; border-color: #ddd;">
                <small style="color: #666;">Top suppliers: ${loc.suppliers.slice(0, 3).join(', ')}${loc.suppliers.length > 3 ? '...' : ''}</small>
            </div>
        `);
    });

    // Add legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
            <div style="background: white; padding: 8px 10px; border-radius: 4px; font-size: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
                <div style="font-weight: 600; margin-bottom: 4px;">Supplier Count</div>
                <div style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #1a9850; border-radius: 50%; display: inline-block;"></span> 1-10</div>
                <div style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #91cf60; border-radius: 50%; display: inline-block;"></span> 11-20</div>
                <div style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #fee08b; border-radius: 50%; display: inline-block;"></span> 21-30</div>
                <div style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #fc8d59; border-radius: 50%; display: inline-block;"></span> 31-40</div>
                <div style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: #d73027; border-radius: 50%; display: inline-block;"></span> 40+</div>
            </div>
        `;
        return div;
    };
    legend.addTo(supplierMap);

    // Fit bounds to show all markers
    if (supplierLocations.length > 0) {
        const bounds = L.latLngBounds(supplierLocations.map(s => [s.lat, s.lng]));
        supplierMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 4 });
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatNumber(num) {
    if (num === undefined || num === null) return '-';
    return new Intl.NumberFormat('en-US').format(num);
}

function formatCurrency(value) {
    if (value === undefined || value === null) return '-';
    if (value >= 1000000000) {
        return '$' + (value / 1000000000).toFixed(2) + 'B';
    } else if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 1000) {
        return '$' + (value / 1000).toFixed(1) + 'K';
    }
    return '$' + value.toFixed(2);
}

// SM-Q8: Global normalizeCountry() for map lookup and cross-filtering
function normalizeCountry(country) {
    if (!country) return country;
    const trimmed = country.trim();
    if (!trimmed || trimmed === '---' || trimmed === '--' || trimmed === '...') return 'United Arab Emirates';
    const lower = trimmed.toLowerCase();
    const normalize = {
        // UAE variants
        'dubai': 'United Arab Emirates',
        'dubai, uae': 'United Arab Emirates',
        'abu dhabi': 'United Arab Emirates',
        'sharjah': 'United Arab Emirates',
        'sharjah-u.a.e': 'United Arab Emirates',
        'ajman': 'United Arab Emirates',
        'ajman, uae': 'United Arab Emirates',
        'rak': 'United Arab Emirates',
        'ras al khaimah': 'United Arab Emirates',
        'ras alkhaimah': 'United Arab Emirates',
        'fujairah': 'United Arab Emirates',
        'uae': 'United Arab Emirates',
        'uuae': 'United Arab Emirates',
        'u.a.e': 'United Arab Emirates',
        'u.a.e.': 'United Arab Emirates',
        'uae, dubai': 'United Arab Emirates',
        'dubai, u.a.e': 'United Arab Emirates',
        'unted arab emirates': 'United Arab Emirates',
        'united arab emirates': 'United Arab Emirates',
        // Saudi Arabia
        'ksa': 'Saudi Arabia',
        'kingdom of saudi arabia': 'Saudi Arabia',
        'kingdom of sadui arabia': 'Saudi Arabia',
        'riyadh': 'Saudi Arabia',
        'riyadh/kharj': 'Saudi Arabia',
        'dammam': 'Saudi Arabia',
        'dammam/khobar/dahran': 'Saudi Arabia',
        'jeddah': 'Saudi Arabia',
        'makkah': 'Saudi Arabia',
        // Turkey
        'turkey': 'Turkey',
        'türkiye': 'Turkey',
        'turkiye': 'Turkey',
        'istanbul': 'Turkey',
        'istanbul (anatolia)': 'Turkey',
        'istanbul (europe)': 'Turkey',
        'ankara': 'Turkey',
        'manisa': 'Turkey',
        'kocaeli': 'Turkey',
        // Greece
        'athens': 'Greece',
        'athens/piraeus/salamina': 'Greece',
        'thessaloniki': 'Greece',
        'chania': 'Greece',
        // US
        'usa': 'United States',
        'us': 'United States',
        'u.s.a': 'United States',
        'u.s.a.': 'United States',
        'united states of america': 'United States',
        'guam': 'United States',
        'honolulu, hi': 'United States',
        'newport news, va': 'United States',
        'compton, ca': 'United States',
        'lafayette, la': 'United States',
        'oregon': 'United States',
        'california': 'United States',
        'texas': 'United States',
        'new york': 'United States',
        'florida': 'United States',
        'illinois': 'United States',
        // UK
        'uk': 'United Kingdom',
        'u.k.': 'United Kingdom',
        'great britain': 'United Kingdom',
        'england': 'United Kingdom',
        'scotland': 'United Kingdom',
        'london': 'United Kingdom',
        'bolton': 'United Kingdom',
        'aberdeen': 'United Kingdom',
        // China
        'guangzhou, guangdong': 'China',
        'zhengzhou, henan': 'China',
        'zhengzhou/henan': 'China',
        'ningbo, zhejiang': 'China',
        'ningbo/zhejiang': 'China',
        'zhuzhou/changsha/xiangtan, hunan': 'China',
        'shanghai': 'China',
        'shanghai china': 'China',
        'beijing': 'China',
        'shenzhen': 'China',
        'qingdao': 'China',
        'province,china': 'China',
        'shandong province, china': 'China',
        'hebei province': 'China',
        'shina': 'China',
        // Afghanistan
        'kabul': 'Afghanistan',
        'kabul afghanistan': 'Afghanistan',
        'kabul, afghanistan.': 'Afghanistan',
        'helmand of afghanistan': 'Afghanistan',
        'afghanistani': 'Afghanistan',
        // Pakistan
        'pakisatn': 'Pakistan',
        // India
        'mumbai': 'India',
        'new delhi': 'India',
        'delhi': 'India',
        'maharashtra': 'India',
        'karnataka': 'India',
        // Nepal
        'kathmandu': 'Nepal',
        // Japan
        'naha, okinawa': 'Japan',
        'okinawa': 'Japan',
        'tokyo': 'Japan',
        // Germany
        'wittlich': 'Germany',
        // Korea
        'korea, democratic people\'s republic of': 'South Korea',
        // Taiwan
        'taiwan, province of china': 'Taiwan',
        // Turkey (encoded)
        'akden\u0130z/mers\u0130n': 'Turkey',
        // Kuwait
        'kuwait, 64030': 'Kuwait',
        // Oman
        'oman, al-qurum': 'Oman',
        // Russia
        'russian federation': 'Russia',
        // Iran
        'iran, islamic republic of': 'Iran',
        // Vietnam
        'viet nam': 'Vietnam',
        // Marshall Islands
        'majuro, marshall islands': 'Marshall Islands',
        // Czech
        'czechia': 'Czech Republic',
        // South Asia (generic)
        'south asia': 'India',
        // Standard passthrough
        'oman': 'Oman',
        'bahrain': 'Bahrain',
        'kuwait': 'Kuwait',
        'qatar': 'Qatar',
        'india': 'India',
        'china': 'China',
        'germany': 'Germany',
        'france': 'France',
        'italy': 'Italy',
        'japan': 'Japan',
        'nepal': 'Nepal',
        'pakistan': 'Pakistan',
        'afghanistan': 'Afghanistan',
        'jordan': 'Jordan',
        'lebanon': 'Lebanon',
        'egypt': 'Egypt',
        'iraq': 'Iraq',
        'singapore': 'Singapore',
        'canada': 'Canada',
        'australia': 'Australia',
        'spain': 'Spain',
        'netherlands': 'Netherlands',
        'belgium': 'Belgium',
        'switzerland': 'Switzerland',
        'ireland': 'Ireland',
        'ukraine': 'Ukraine',
        'south africa': 'South Africa',
        'hungary': 'Hungary',
        'finland': 'Finland',
        'cyprus': 'Cyprus',
        'belize': 'Belize',
        'armenia': 'Armenia',
        'ethiopia': 'Ethiopia',
        'niger': 'Niger',
        'nigeria': 'Nigeria',
        'uganda': 'Uganda',
        'zimbabwe': 'Zimbabwe',
        'thailand': 'Thailand',
        'malaysia': 'Malaysia',
        'south korea': 'South Korea',
        'greece': 'Greece',
        'turkey': 'Turkey',
        'saudi arabia': 'Saudi Arabia',
        'united states': 'United States',
        'united kingdom': 'United Kingdom',
    };
    // Check for address-like strings containing /Germany etc.
    if (lower.includes('/germany')) return 'Germany';
    if (lower.includes('4350 east-west highway')) return 'United States';
    return normalize[lower] || country;
}
window.normalizeCountry = normalizeCountry;

function formatCurrencyShort(value) {
    if (value === undefined || value === null) return '-';
    if (value >= 1000000000) {
        return '$' + (value / 1000000000).toFixed(2) + 'B';
    } else if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 1000) {
        return '$' + (value / 1000).toFixed(1) + 'K';
    }
    return '$' + value.toFixed(2);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// CHART TOGGLES
// ============================================
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('chart-toggle-btn')) {
        const toggle = e.target.closest('.chart-toggle');
        if (toggle) {
            toggle.querySelectorAll('.chart-toggle-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');

            // Handle entity chart toggle
            if (e.target.dataset.entityView) {
                currentEntityView = e.target.dataset.entityView;
                console.log('📊 Switching entity view to:', currentEntityView);
                renderEntityChartCanvas(dashboardData.supplierMarketplace.entityComparison, currentEntityView);
            }

            // Handle material chart toggle — Q8: always force pie
            if (e.target.dataset.chartType) {
                currentMaterialChartType = 'pie';
                console.log('📊 Material chart fixed to pie (Q8)');
                renderMaterialChartCanvas(dashboardData.supplierMarketplace.materialDistribution, 'pie');
            }
        }
    }
});

// ============================================
// RENDER: ENTITY CHART (Chart.js)
// ============================================
function renderEntityChartCanvas(data, viewType = 'quote') {
    const canvas = document.getElementById('entityChartCanvas');
    const container = document.getElementById('entityChartContainer');
    const scrollContainer = document.getElementById('entityChartScroll');
    const axisCanvas = document.getElementById('entityAxisCanvas');
    if (!canvas || !container || !data || data.length === 0) {
        if (canvas && container) {
            // Clear previous chart and show empty state
            if (entityChartInstance) {
                entityChartInstance.destroy();
                entityChartInstance = null;
            }
            const scrollEl = document.getElementById('entityChartScroll');
            if (scrollEl) scrollEl.innerHTML = '<canvas id="entityChartCanvas"></canvas>';
        }
        console.warn('⚠️ Cannot render entity chart - missing canvas or data');
        return;
    }

    // Destroy previous instance
    if (entityChartInstance) {
        entityChartInstance.destroy();
        entityChartInstance = null;
    }

    // Dynamic canvas height: 28px per entity for nice bar thickness
    const barHeight = 28;
    const dynamicHeight = Math.max(180, data.length * barHeight);
    const containerWidth = (scrollContainer || container).clientWidth || 400;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = dynamicHeight + 'px';
    canvas.width = containerWidth;
    canvas.height = dynamicHeight;

    const ctx = canvas.getContext('2d');
    const valueKey = viewType === 'quote' ? 'quoteValue' : 'poSpend';
    const labelSuffix = viewType === 'quote' ? 'Quote Value' : 'PO Spend';

    console.log(`📊 Rendering entity chart - View: ${viewType}, Key: ${valueKey}`);

    // Function to render frozen x-axis after main chart completes
    const renderFrozenAxis = () => {
        if (!entityChartInstance || !axisCanvas) return;
        const chartLeft = entityChartInstance.chartArea.left;
        const chartRight = entityChartInstance.chartArea.right;
        const xScale = entityChartInstance.scales.x;
        const xMax = xScale.max;

        axisCanvas.width = containerWidth;
        axisCanvas.height = 35;
        axisCanvas.style.width = containerWidth + 'px';
        axisCanvas.style.height = '35px';

        // Draw axis directly on canvas — no Chart.js needed
        const axCtx = axisCanvas.getContext('2d');
        axCtx.clearRect(0, 0, containerWidth, 35);

        // Draw top line
        axCtx.strokeStyle = '#ddd';
        axCtx.lineWidth = 1;
        axCtx.beginPath();
        axCtx.moveTo(chartLeft, 0.5);
        axCtx.lineTo(chartRight, 0.5);
        axCtx.stroke();

        // Draw tick labels
        axCtx.font = 'bold 12px Segoe UI, sans-serif';
        axCtx.fillStyle = '#555';
        axCtx.textAlign = 'center';
        axCtx.textBaseline = 'top';
        const ticks = xScale.ticks;
        ticks.forEach(tick => {
            const x = xScale.getPixelForValue(tick.value);
            if (x >= chartLeft && x <= chartRight) {
                // Tick mark
                axCtx.strokeStyle = '#ddd';
                axCtx.beginPath();
                axCtx.moveTo(x, 0);
                axCtx.lineTo(x, 5);
                axCtx.stroke();
                // Label
                axCtx.fillText(formatCurrencyShort(tick.value), x, 8);
            }
        });
    };

    entityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.entity),
            datasets: [{
                label: labelSuffix,
                data: data.map(d => d[valueKey] || 0),
                backgroundColor: data.map(d => d.color),
                borderColor: data.map(d => d.color),
                borderWidth: 1,
                borderRadius: 4,
                barThickness: Math.max(12, Math.min(20, barHeight * 0.6))
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            indexAxis: 'y',
            animation: {
                onComplete: renderFrozenAxis
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatCurrencyShort(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    beginAtZero: true
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 11 }
                    }
                }
            },
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const entityName = data[idx].entity;
                    const entityFilter = document.getElementById('filterEntity');
                    if (entityFilter) {
                        entityFilter.value = entityName;
                        applyFilters();
                    }
                }
            }
        },
        plugins: [{
            // Value labels on bars
            id: 'entityBarLabels',
            afterDatasetsDraw(chart) {
                const { ctx: c, data: chartData, chartArea } = chart;
                const meta = chart.getDatasetMeta(0);
                c.save();
                c.font = 'bold 9px Segoe UI, sans-serif';
                c.textBaseline = 'middle';
                meta.data.forEach((bar, i) => {
                    const val = chartData.datasets[0].data[i];
                    if (val != null && val > 0) {
                        const label = formatCurrencyShort(val);
                        const barWidth = bar.width || (bar.x - chartArea.left);
                        // Place label inside bar if wide enough, otherwise outside
                        if (barWidth > 60) {
                            c.fillStyle = '#fff';
                            c.textAlign = 'right';
                            c.fillText(label, bar.x - 6, bar.y);
                        } else {
                            c.fillStyle = '#333';
                            c.textAlign = 'left';
                            c.fillText(label, bar.x + 4, bar.y);
                        }
                    }
                });
                c.restore();
            }
        }]
    });
}

// ============================================
// RENDER: MATERIAL CHART (Chart.js - Multiple Types)
// Raw material count per Material Code (from MATERIAL_CODE_MAP in pipeline)
const MATERIAL_RAW_COUNTS = {
    'Architectural': 8, 'Chemicals': 2, 'Electrical': 1, 'Fire': 7,
    'Logistics': 4, 'Mechanical': 2, 'Office Assets': 1, 'Protection': 1,
    'Rental': 1, 'Services': 5, 'Tools': 1, 'Various': 5
};

// ============================================
function renderMaterialChartCanvas(data, chartType = 'pie') {
    const canvas = document.getElementById('materialChartCanvas');
    if (!canvas || !data || data.length === 0) return;

    // Destroy previous instance
    if (materialChartInstance) {
        materialChartInstance.destroy();
        materialChartInstance = null;
    }

    // Dynamic height for bar mode to fit all items with scroll
    const container = document.getElementById('materialChartContainer');
    if (container) {
        if (chartType === 'bar') {
            const barHeight = Math.max(300, data.length * 32);
            canvas.style.height = barHeight + 'px';
            canvas.height = barHeight;
        } else {
            canvas.style.height = '100%';
        }
    }

    const ctx = canvas.getContext('2d');
    const labels = data.map(d => d.material);
    const values = data.map(d => d.value);
    const counts = data.map(d => d.count || 0);
    const colors = data.map(d => d.color);

    let chartConfig = {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Material Value',
                data: values,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: chartType === 'pie' || chartType === 'radar', position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const count = counts[context.dataIndex];
                            const countLabel = count ? ` (${count} quotations)` : '';
                            if (chartType === 'pie') {
                                return `${context.label}: ${formatCurrencyShort(context.raw)}${countLabel}`;
                            }
                            return `${formatCurrencyShort(context.raw)}${countLabel}`;
                        }
                    }
                }
            }
        }
    };

    // Customize based on chart type
    if (chartType === 'bar') {
        chartConfig.options.indexAxis = 'y';
        chartConfig.options.layout = { padding: { right: 70 } };
        chartConfig.options.scales = {
            x: {
                beginAtZero: true,
                grid: { display: false },
                ticks: { callback: (v) => formatCurrencyShort(v) }
            },
            y: { grid: { display: false } }
        };
        chartConfig.data.datasets[0].borderRadius = 4;
        // Custom plugin to draw "N materials" label at end of each bar
        chartConfig.plugins = [{
            id: 'materialCountLabels',
            afterDatasetsDraw(chart) {
                const { ctx: c, scales } = chart;
                const dataset = chart.data.datasets[0];
                const meta = chart.getDatasetMeta(0);
                c.save();
                c.font = '11px Segoe UI, sans-serif';
                c.fillStyle = '#555';
                c.textBaseline = 'middle';
                meta.data.forEach((bar, i) => {
                    const label = chart.data.labels[i];
                    const rawCount = MATERIAL_RAW_COUNTS[label] || 0;
                    if (rawCount > 0) {
                        const x = bar.x + 6;
                        const y = bar.y;
                        c.fillText(rawCount + ' material' + (rawCount !== 1 ? 's' : ''), x, y);
                    }
                });
                c.restore();
            }
        }];
    } else if (chartType === 'line') {
        chartConfig.data.datasets[0].fill = true;
        chartConfig.data.datasets[0].tension = 0.4;
        chartConfig.data.datasets[0].borderWidth = 2;
        chartConfig.data.datasets[0].pointRadius = 4;
        chartConfig.data.datasets[0].backgroundColor = 'rgba(0, 102, 204, 0.1)';
        chartConfig.data.datasets[0].borderColor = '#0066CC';
        chartConfig.options.scales = {
            x: { grid: { display: false } },
            y: {
                beginAtZero: true,
                grid: { color: '#e5e5e5' },
                ticks: { callback: (v) => formatCurrencyShort(v) }
            }
        };
    } else if (chartType === 'pie' || chartType === 'doughnut') {
        chartConfig.type = 'pie';
        delete chartConfig.options.scales;
    } else if (chartType === 'radar') {
        chartConfig.data.datasets[0].fill = true;
        chartConfig.data.datasets[0].backgroundColor = 'rgba(0, 102, 204, 0.2)';
        chartConfig.data.datasets[0].borderColor = '#0066CC';
        chartConfig.data.datasets[0].pointBackgroundColor = '#0066CC';
        chartConfig.options.scales = {
            r: {
                beginAtZero: true,
                ticks: { display: false }
            }
        };
    }

    // Add click-to-filter handler
    chartConfig.options.onClick = (evt, elements) => {
        if (elements.length > 0) {
            const idx = elements[0].index;
            const materialName = labels[idx];
            const materialFilter = document.getElementById('filterMaterial');
            if (materialFilter) {
                // Find matching option (may need partial match)
                let found = false;
                for (let option of materialFilter.options) {
                    if (option.value === materialName || option.textContent === materialName) {
                        materialFilter.value = option.value;
                        found = true;
                        break;
                    }
                }
                if (found) applyFilters();
            }
        }
    };

    materialChartInstance = new Chart(ctx, chartConfig);
}

// ============================================
// TAB 2: GLOBAL SPEND ANALYSIS FUNCTIONS
// ============================================

// GSA State
let gsaState = {
    currentPage: 1,
    pageSize: 25,
    sortField: 'po_date',
    sortDirection: 'desc',
    filteredData: [],
    allPOs: []
};

// GSA Chart Instances
let gsaSpendTrendChart = null;
let gsaEntityChart = null;
let gsaProjectChart = null;
let gsaTopSuppliersChart = null;
let gsaBottomSuppliersChart = null;

// Initialize GSA Tab
let gsaListenersAttached = false;
function initGlobalSpendAnalysis() {
    if (!gsaData) {
        console.warn('⚠️ GSA: GSA data not loaded');
        return;
    }

    const pos = gsaData.workbench || [];
    gsaState.allPOs = pos;
    gsaState.filteredData = [...pos];

    console.log('📊 GSA: Initializing with', pos.length, 'purchase orders');

    // Populate filters from pre-built filter arrays
    populateGSAFilters();

    // Update KPIs from summary
    updateGSAKPIs();

    // Create charts from pre-calculated breakdowns
    createGSASpendTrendChart();
    createGSAEntityChart();
    createGSAProjectChart();
    createGSASupplierCharts();

    // Populate table
    updateGSATable();

    // Add instant filtering - only attach once to avoid duplicate listeners
    if (!gsaListenersAttached) {
        gsaListenersAttached = true;
        ['gsaFilterEntity', 'gsaFilterSupplier', 'gsaFilterProject', 'gsaFilterMaterial',
            'gsaFilterMaterialCode', 'gsaFilterDiscipline', 'gsaFilterYear'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('change', applyGSAFilters);
            });
        // Date + search instant
        ['gsaFilterFrom', 'gsaFilterTo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', applyGSAFilters);
        });

        const gsaSearchInput = document.getElementById('gsaSearchInput');
        if (gsaSearchInput) {
            gsaSearchInput.addEventListener('input', debounce(applyGSAFilters, 300));
        }
    }

    // Set date filter constraints - block future dates and set sensible defaults
    const today = new Date().toISOString().split('T')[0];
    const fromEl = document.getElementById('gsaFilterFrom');
    const toEl = document.getElementById('gsaFilterTo');
    if (fromEl) {
        fromEl.setAttribute('max', today);
        // Set default from date to earliest year in data
        const years = gsaData?.filters?.years || [];
        if (years.length > 0) {
            const minYear = Math.min(...years);
            fromEl.setAttribute('min', minYear + '-01-01');
            // GSA-Q6: Set default FROM value so range is always bounded
            if (!fromEl.value) {
                fromEl.value = minYear + '-01-01';
            }
        }
    }
    if (toEl) {
        toEl.setAttribute('max', today);
    }
}

// Populate GSA Filter Dropdowns
function populateGSAFilters() {
    const filters = gsaData?.filters || {};
    const pos = gsaData?.workbench || [];

    // Entity filter from filters.entities
    // Entity filter from filters.entities (GSA-Q1: with trim normalization)
    const entities = filters.entities || [];
    const entitySelect = document.getElementById('gsaFilterEntity');
    if (entitySelect) {
        entitySelect.innerHTML = '<option>All Entities</option>' +
            entities.filter(e => e && e.trim() !== 'Unknown').map(e => {
                const trimmed = e.trim();
                return `<option value="${trimmed}">${trimmed}</option>`;
            }).join('');
    }

    // Supplier filter from filters.suppliers (no cap)
    const supplierNames = filters.suppliers || [];
    const supplierSelect = document.getElementById('gsaFilterSupplier');
    if (supplierSelect) {
        supplierSelect.innerHTML = '<option>All Suppliers</option>' +
            supplierNames.filter(Boolean).map(s => `<option value="${s}">${s.length > 50 ? s.substring(0, 50) + '...' : s}</option>`).join('');
    }

    // Project filter - extract unique projects from POs (no cap)
    const projects = [...new Set(pos.map(po => po.project || '').filter(Boolean))].sort();
    const projectSelect = document.getElementById('gsaFilterProject');
    if (projectSelect) {
        projectSelect.innerHTML = '<option>All Projects</option>' +
            projects.map(p => `<option value="${p}">${p.length > 60 ? p.substring(0, 60) + '...' : p}</option>`).join('');
    }

    // Material filter from filters.materials
    const materials = filters.materials || [];
    const materialSelect = document.getElementById('gsaFilterMaterial');
    if (materialSelect) {
        materialSelect.innerHTML = '<option>All Materials</option>' +
            materials.map(m => `<option value="${m}">${m}</option>`).join('');
    }

    // Material Code filter from filters.materialCodes (GSA-Q15)
    const materialCodes = filters.materialCodes || [];
    const materialCodeSelect = document.getElementById('gsaFilterMaterialCode');
    if (materialCodeSelect) {
        materialCodeSelect.innerHTML = '<option>All Material Codes</option>' +
            materialCodes.map(m => `<option value="${m}">${m}</option>`).join('');
    }

    // PO Type filter from filters.poTypes
    const poTypes = filters.poTypes || ['Base PO', 'Change Order'];
    const disciplineSelect = document.getElementById('gsaFilterDiscipline');
    if (disciplineSelect) {
        disciplineSelect.innerHTML = '<option>All Types</option>' +
            poTypes.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    // Year filter from filters.years
    const years = filters.years || [];
    const yearSelect = document.getElementById('gsaFilterYear');
    if (yearSelect) {
        yearSelect.innerHTML = '<option>All Years</option>' +
            years.sort((a, b) => b - a).map(y => `<option value="${y}">${y}</option>`).join('');
    }

    // Table type filter - use materials
    const typeSelect = document.getElementById('gsaTableTypeFilter');
    if (typeSelect) {
        typeSelect.innerHTML = '<option value="">All Materials</option>' +
            materials.map(m => `<option value="${m}">${m}</option>`).join('');
    }
}

// Update GSA KPIs
function updateGSAKPIs() {
    const pos = gsaState.filteredData;
    const summary = gsaData?.summary || {};

    // If no filter applied, use pre-calculated summary
    const isFiltered = pos.length !== gsaState.allPOs.length;

    if (!isFiltered && summary.totalPOs) {
        // Use pre-calculated values
        document.getElementById('gsaKpiPoCount').textContent = summary.totalPOs.toLocaleString();
        document.getElementById('gsaKpiTotalSpend').textContent = formatCurrencyShort(summary.totalSpendUSD || 0);
        document.getElementById('gsaKpiCoCount').textContent = summary.changeOrders?.toLocaleString() || '0';
        document.getElementById('gsaKpiCoAmount').textContent = formatCurrencyShort(summary.changeOrderValue || 0);
        document.getElementById('gsaKpiActiveSuppliers').textContent = summary.supplierCount?.toLocaleString() || '0';
        document.getElementById('gsaKpiActiveEntities').textContent = summary.entityCount?.toLocaleString() || '0';
        // CO subtext: groups and % of total spend
        const coGroupsEl = document.getElementById('gsaKpiCoGroups');
        if (coGroupsEl) coGroupsEl.textContent = (summary.changeOrderGroups || 0) + ' groups';
        const coPctEl = document.getElementById('gsaKpiCoPct');
        if (coPctEl && summary.totalSpendUSD > 0) {
            const pct = ((summary.changeOrderValue || 0) / summary.totalSpendUSD * 100).toFixed(1);
            coPctEl.textContent = pct + '% of total spend';
        }
        // Tax subtext
        const taxSubEl = document.getElementById('gsaKpiTaxSubtext');
        if (taxSubEl) {
            const totalTax = summary.totalTaxUSD || 0;
            taxSubEl.textContent = totalTax > 0 ? 'Tax: ' + formatCurrencyShort(totalTax) : '';
        }
    } else {
        // Calculate from filtered data - convert each PO value to USD
        document.getElementById('gsaKpiPoCount').textContent = pos.length.toLocaleString();

        const totalSpend = pos.reduce((sum, po) => {
            const val = po.valueUSD || po.value || 0;
            const curr = po.currency || 'USD';
            return sum + convertToUSD(val, curr);
        }, 0);
        document.getElementById('gsaKpiTotalSpend').textContent = formatCurrencyShort(totalSpend);

        const changeOrders = pos.filter(po => po.poType === 'Change Order');
        document.getElementById('gsaKpiCoCount').textContent = changeOrders.length.toLocaleString();
        document.getElementById('gsaKpiCoAmount').textContent = formatCurrencyShort(
            changeOrders.reduce((sum, po) => {
                const val = po.valueUSD || po.value || 0;
                const curr = po.currency || 'USD';
                return sum + convertToUSD(val, curr);
            }, 0)
        );

        const activeSuppliers = new Set(pos.map(po => po.supplier).filter(Boolean)).size;
        document.getElementById('gsaKpiActiveSuppliers').textContent = activeSuppliers.toLocaleString();

        const activeEntities = new Set(pos.map(po => po.entity).filter(Boolean)).size;
        document.getElementById('gsaKpiActiveEntities').textContent = activeEntities.toLocaleString();

        // CO subtext: groups count (only multi-PO OrderID groups, not orphan COs)
        const coGroupsEl = document.getElementById('gsaKpiCoGroups');
        if (coGroupsEl) {
            const orderIdGroups = {};
            changeOrders.forEach(po => {
                const oid = po.orderId || '';
                if (oid && po.changeOrderTotal > 1) orderIdGroups[oid] = true;
            });
            coGroupsEl.textContent = Object.keys(orderIdGroups).length + ' groups';
        }
        const coPctEl = document.getElementById('gsaKpiCoPct');
        if (coPctEl && totalSpend > 0) {
            const coVal = changeOrders.reduce((sum, po) => {
                const val = po.valueUSD || po.value || 0;
                const curr = po.currency || 'USD';
                return sum + convertToUSD(val, curr);
            }, 0);
            const pct = (coVal / totalSpend * 100).toFixed(1);
            coPctEl.textContent = pct + '% of total spend';
        }
        // Tax subtext (filtered)
        const taxSubEl = document.getElementById('gsaKpiTaxSubtext');
        if (taxSubEl) {
            const totalTax = pos.reduce((sum, po) => sum + (po.taxUSD || 0), 0);
            taxSubEl.textContent = totalTax > 0 ? 'Tax: ' + formatCurrencyShort(totalTax) : '';
        }
    }
}

// Create Annual Spend Trend Chart
function createGSASpendTrendChart() {
    const ctx = document.getElementById('gsaSpendTrendChart');
    if (!ctx) return;

    if (gsaSpendTrendChart) {
        gsaSpendTrendChart.destroy();
    }

    const pos = gsaState.filteredData;
    const isFiltered = pos.length !== gsaState.allPOs.length;

    // Empty state handling
    if (pos.length === 0) {
        gsaSpendTrendChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: ['No Data'], datasets: [{ data: [0], backgroundColor: '#ccc' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
        return;
    }

    // Q14: Always calculate Base/CO breakdown from raw PO data (monthlyTrend has no CO split)
    let sortedMonths, labels, baseData, changeData;

    {
        // Calculate from PO data with Base/CO split
        const monthlyData = {};
        pos.forEach(po => {
            const monthKey = po.yearMonth || '';
            if (!monthKey) return;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { base: 0, change: 0 };
            }
            const amount = po.valueUSD || 0;
            if (po.poType === 'Change Order') {
                monthlyData[monthKey].change += amount;
            } else {
                monthlyData[monthKey].base += amount;
            }
        });

        sortedMonths = Object.keys(monthlyData).sort().slice(-12);
        labels = sortedMonths.map(m => {
            const [y, mo] = m.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[parseInt(mo) - 1] + ' ' + y.slice(2);
        });
        baseData = sortedMonths.map(m => monthlyData[m].base);
        changeData = sortedMonths.map(m => monthlyData[m].change);
    }

    // Calculate running total
    let runningTotal = 0;
    const runningData = baseData.map((base, i) => {
        runningTotal += base + (changeData[i] || 0);
        return runningTotal;
    });

    gsaSpendTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Base Spend',
                    data: baseData,
                    backgroundColor: '#FF8C00',
                    borderRadius: 4,
                    order: 2
                },
                {
                    label: 'Change Orders',
                    data: changeData,
                    backgroundColor: '#FFD700',
                    borderRadius: 4,
                    order: 2
                },
                {
                    label: 'Running Total',
                    data: runningData,
                    type: 'line',
                    borderColor: '#0066CC',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#0066CC',
                    tension: 0.3,
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatCurrencyShort(ctx.raw)}`
                    }
                }
            },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: {
                    stacked: true,
                    grid: { color: '#eee' },
                    ticks: { callback: (v) => formatCurrencyShort(v) }
                },
                y1: {
                    position: 'right',
                    grid: { display: false },
                    ticks: { callback: (v) => formatCurrencyShort(v) }
                }
            },
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const monthLabel = labels[idx];
                    console.log('📊 GSA Trend clicked:', monthLabel);
                }
            }
        }
    });
}

// Q17: Helper — deduplicate CO groups: for each orderId group with multiple revisions,
// only keep the latest version (highest poVersion). This prevents counting CO full face
// values as separate spend entries in entity/project/supplier charts.
function deduplicateCOGroups(pos) {
    const groups = {};
    const standalone = [];
    pos.forEach(po => {
        const oid = po.orderId || po.mainOrderId || '';
        if (oid && po.changeOrderTotal > 1) {
            if (!groups[oid] || (po.poVersion || 0) > (groups[oid].poVersion || 0)) {
                groups[oid] = po;
            }
        } else {
            standalone.push(po);
        }
    });
    return [...standalone, ...Object.values(groups)];
}

// Create Entity Chart
function createGSAEntityChart() {
    const ctx = document.getElementById('gsaEntityChart');
    if (!ctx) return;

    if (gsaEntityChart) {
        gsaEntityChart.destroy();
    }

    const pos = gsaState.filteredData;
    const isFiltered = pos.length !== gsaState.allPOs.length;

    // Empty state handling
    if (pos.length === 0) {
        gsaEntityChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: ['No Data'], datasets: [{ data: [0], backgroundColor: '#ccc' }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
        return;
    }

    let sorted;

    if (!isFiltered && gsaData?.entityBreakdown) {
        // Use pre-calculated entity breakdown
        sorted = gsaData.entityBreakdown
            .filter(e => e.name && e.name !== 'Unknown')
            .slice(0, 8)
            .map(e => [e.name, e.valueUSD]);
    } else {
        // Calculate from filtered data — Q17: deduplicate CO groups
        const dedupedPOs = deduplicateCOGroups(pos);
        const entitySpend = {};
        dedupedPOs.forEach(po => {
            const entity = po.entity || 'Unknown';
            if (!entitySpend[entity]) entitySpend[entity] = 0;
            entitySpend[entity] += po.valueUSD || 0;
        });

        sorted = Object.entries(entitySpend)
            .filter(e => e[0] !== 'Unknown')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    }

    const colors = ['#0066CC', '#339933', '#FFD700', '#FF8C00', '#CC3333', '#9933CC', '#008080', '#FF6B6B'];

    gsaEntityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(e => e[0]),
            datasets: [{
                data: sorted.map(e => e[1]),
                backgroundColor: colors,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => formatCurrencyShort(ctx.raw)
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { callback: (v) => formatCurrencyShort(v) }
                },
                y: { grid: { display: false } }
            },
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const entityName = sorted[idx][0];
                    console.log('Clicked entity:', entityName);

                    // Directly filter data by entity
                    gsaState.filteredData = gsaState.allPOs.filter(po => po.entity === entityName);
                    console.log('Filtered to', gsaState.filteredData.length, 'POs');

                    // Update UI
                    updateGSAKPIs();
                    updateGSATable();
                    createGSASpendTrendChart();
                    createGSAProjectChart();
                    createGSASupplierCharts();

                    // Set the entity filter dropdown
                    const entitySelect = document.getElementById('gsaFilterEntity');
                    if (entitySelect) {
                        entitySelect.value = entityName;
                    }
                }
            }
        }
    });
}

// Create Project Chart
function createGSAProjectChart() {
    const ctx = document.getElementById('gsaProjectChart');
    if (!ctx) return;

    if (gsaProjectChart) {
        gsaProjectChart.destroy();
    }

    const pos = gsaState.filteredData;

    // Empty state handling
    if (pos.length === 0) {
        gsaProjectChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: ['No Data'], datasets: [{ data: [0], backgroundColor: '#ccc' }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
        return;
    }

    // Calculate from filtered data using correct field names — Q17: deduplicate CO groups
    const dedupedPOs = deduplicateCOGroups(pos);
    const projectSpend = {};
    dedupedPOs.forEach(po => {
        const name = po.project || 'Unknown';
        if (!projectSpend[name]) projectSpend[name] = 0;
        projectSpend[name] += po.valueUSD || 0;
    });

    const sorted = Object.entries(projectSpend)
        .filter(p => p[0] !== 'Unknown')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const colors = ['#339933', '#0066CC', '#CC3333', '#FF8C00', '#004578', '#9933CC', '#008080', '#FF6B6B'];

    gsaProjectChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(p => truncateText(p[0], 40)),
            datasets: [{
                data: sorted.map(p => p[1]),
                backgroundColor: colors,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            // Show full project name in tooltip
                            const idx = items[0].dataIndex;
                            return sorted[idx][0];
                        },
                        label: (ctx) => formatCurrencyShort(ctx.raw)
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { callback: (v) => formatCurrencyShort(v) }
                },
                y: { grid: { display: false } }
            },
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const projectName = sorted[idx][0];
                    console.log('Clicked project:', projectName);

                    // Directly filter data by project (don't rely on dropdown)
                    gsaState.filteredData = gsaState.allPOs.filter(po => po.project === projectName);
                    console.log('Filtered to', gsaState.filteredData.length, 'POs');

                    // Update UI
                    updateGSAKPIs();
                    updateGSATable();
                    createGSASpendTrendChart();
                    createGSAEntityChart();
                    createGSASupplierCharts();

                    // Update dropdown if project exists there
                    const projectSelect = document.getElementById('gsaFilterProject');
                    if (projectSelect) {
                        let found = false;
                        for (let option of projectSelect.options) {
                            if (option.value === projectName) {
                                projectSelect.value = projectName;
                                found = true;
                                break;
                            }
                        }
                        // If not found, add it temporarily
                        if (!found) {
                            const newOption = document.createElement('option');
                            newOption.value = projectName;
                            newOption.textContent = projectName.length > 60 ? projectName.substring(0, 60) + '...' : projectName;
                            projectSelect.insertBefore(newOption, projectSelect.options[1]);
                            projectSelect.value = projectName;
                        }
                    }
                }
            }
        }
    });
}

// Create Top/Bottom Suppliers Charts
function createGSASupplierCharts() {
    const pos = gsaState.filteredData;
    const isFiltered = pos.length !== gsaState.allPOs.length;

    // Q15: Hide Most Inactive Suppliers chart when any filter is active
    const bottomCard = document.getElementById('gsaBottomSuppliersCard');
    if (bottomCard) {
        bottomCard.style.display = isFiltered ? 'none' : '';
    }

    // Empty state handling
    if (pos.length === 0) {
        const topCtx = document.getElementById('gsaTopSuppliersChart');
        const bottomCtx = document.getElementById('gsaBottomSuppliersChart');
        if (topCtx) {
            if (gsaTopSuppliersChart) gsaTopSuppliersChart.destroy();
            gsaTopSuppliersChart = new Chart(topCtx, { type: 'bar', data: { labels: ['No Data'], datasets: [{ data: [0], backgroundColor: '#ccc' }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } } });
        }
        if (bottomCtx) {
            if (gsaBottomSuppliersChart) gsaBottomSuppliersChart.destroy();
            gsaBottomSuppliersChart = new Chart(bottomCtx, { type: 'bar', data: { labels: ['No Data'], datasets: [{ data: [0], backgroundColor: '#ccc' }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } } });
        }
        return;
    }

    let topSuppliers, bottomSuppliers;

    if (!isFiltered && gsaData?.supplierRanking) {
        // Use pre-calculated supplier ranking
        const ranking = gsaData.supplierRanking;
        topSuppliers = ranking.slice(0, 10).map(s => ({ name: s.name, spend: s.valueUSD }));
        bottomSuppliers = ranking.slice(-10).reverse().map(s => ({ name: s.name, spend: s.valueUSD }));
    } else {
        // Calculate from filtered data — Q17: deduplicate CO groups
        const dedupedPOs = deduplicateCOGroups(pos);
        const supplierSpend = {};
        dedupedPOs.forEach(po => {
            const name = po.supplier || 'Unknown';
            if (!supplierSpend[name]) {
                supplierSpend[name] = { name, spend: 0, count: 0 };
            }
            supplierSpend[name].spend += po.valueUSD || 0;
            supplierSpend[name].count++;
        });

        const allSuppliers = Object.values(supplierSpend).filter(s => s.spend > 0);
        topSuppliers = [...allSuppliers].sort((a, b) => b.spend - a.spend).slice(0, 10);
        bottomSuppliers = [...allSuppliers].sort((a, b) => a.spend - b.spend).slice(0, 10);
    }

    // GSA-Q13: Generate unique HSL colors for top/bottom charts
    function generateUniqueColors(count, saturation = 65, lightness = 50) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = Math.round((i * 360) / count + 15) % 360;
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        return colors;
    }
    const topColors = generateUniqueColors(topSuppliers.length, 65, 45);
    const bottomColors = generateUniqueColors(bottomSuppliers.length, 55, 55);

    // Top Suppliers Chart
    const topCtx = document.getElementById('gsaTopSuppliersChart');
    if (topCtx) {
        if (gsaTopSuppliersChart) gsaTopSuppliersChart.destroy();
        gsaTopSuppliersChart = new Chart(topCtx, {
            type: 'bar',
            data: {
                labels: topSuppliers.map(s => truncateText(s.name, 30)),
                datasets: [{
                    data: topSuppliers.map(s => s.spend),
                    backgroundColor: topColors,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const idx = items[0].dataIndex;
                                return topSuppliers[idx].name;
                            },
                            label: (ctx) => formatCurrencyShort(ctx.raw)
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { callback: (v) => formatCurrencyShort(v) }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    }
                },
                onClick: (evt, elements) => {
                    if (elements.length > 0) {
                        const idx = elements[0].index;
                        const supplierName = topSuppliers[idx].name;
                        console.log('Clicked supplier:', supplierName);

                        // Update supplier details card
                        updateGSASupplierCard(supplierName);

                        // Directly filter data by supplier
                        gsaState.filteredData = gsaState.allPOs.filter(po => po.supplier === supplierName);
                        console.log('Filtered to', gsaState.filteredData.length, 'POs');

                        // Update UI
                        updateGSAKPIs();
                        updateGSATable();
                        createGSASpendTrendChart();
                        createGSAEntityChart();
                        createGSAProjectChart();

                        // Update dropdown
                        const supplierSelect = document.getElementById('gsaFilterSupplier');
                        if (supplierSelect) {
                            let found = false;
                            for (let option of supplierSelect.options) {
                                if (option.value === supplierName) {
                                    supplierSelect.value = supplierName;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                const newOption = document.createElement('option');
                                newOption.value = supplierName;
                                newOption.textContent = supplierName.length > 40 ? supplierName.substring(0, 40) + '...' : supplierName;
                                supplierSelect.insertBefore(newOption, supplierSelect.options[1]);
                                supplierSelect.value = supplierName;
                            }
                        }
                    }
                }
            }
        });
    }

    // Bottom Suppliers Chart
    const bottomCtx = document.getElementById('gsaBottomSuppliersChart');
    if (bottomCtx) {
        if (gsaBottomSuppliersChart) gsaBottomSuppliersChart.destroy();
        gsaBottomSuppliersChart = new Chart(bottomCtx, {
            type: 'bar',
            data: {
                labels: bottomSuppliers.map(s => truncateText(s.name, 30)),
                datasets: [{
                    data: bottomSuppliers.map(s => s.spend),
                    backgroundColor: bottomColors,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const idx = items[0].dataIndex;
                                return bottomSuppliers[idx].name;
                            },
                            label: (ctx) => formatCurrencyShort(ctx.raw)
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { callback: (v) => formatCurrencyShort(v) }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    }
                },
                onClick: (evt, elements) => {
                    if (elements.length > 0) {
                        const idx = elements[0].index;
                        const supplierName = bottomSuppliers[idx].name;
                        console.log('Clicked supplier:', supplierName);

                        // Update supplier details card
                        updateGSASupplierCard(supplierName);

                        // Directly filter data by supplier
                        gsaState.filteredData = gsaState.allPOs.filter(po => po.supplier === supplierName);
                        console.log('Filtered to', gsaState.filteredData.length, 'POs');

                        // Update UI
                        updateGSAKPIs();
                        updateGSATable();
                        createGSASpendTrendChart();
                        createGSAEntityChart();
                        createGSAProjectChart();

                        // Update dropdown
                        const supplierSelect = document.getElementById('gsaFilterSupplier');
                        if (supplierSelect) {
                            let found = false;
                            for (let option of supplierSelect.options) {
                                if (option.value === supplierName) {
                                    supplierSelect.value = supplierName;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                const newOption = document.createElement('option');
                                newOption.value = supplierName;
                                newOption.textContent = supplierName.length > 40 ? supplierName.substring(0, 40) + '...' : supplierName;
                                supplierSelect.insertBefore(newOption, supplierSelect.options[1]);
                                supplierSelect.value = supplierName;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Helper: Truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Update GSA Supplier Details Card
function updateGSASupplierCard(supplierName) {
    const nameEl = document.getElementById('gsaSupplierName');
    const locEl = document.getElementById('gsaSupplierLocation');
    const emailEl = document.getElementById('gsaSupplierEmail');
    const contactEl = document.getElementById('gsaSupplierContact');
    const starsEl = document.getElementById('gsaSupplierStars');
    const ratingEl = document.getElementById('gsaSupplierRating');

    if (!nameEl) return;

    // Find supplier details from suppliersData
    let supplier = null;
    if (suppliersData?.suppliers) {
        supplier = suppliersData.suppliers.find(s =>
            (s.name || s.supplier_name || '').toLowerCase() === supplierName.toLowerCase()
        );
    }

    nameEl.textContent = supplierName;

    if (supplier) {
        const loc = normalizeCountry(supplier.address?.country_standardized || supplier.phone_validation?.phone_country) || '-';
        locEl.textContent = (typeof loc === 'object') ? (loc.country_standardized || '-') : loc;
        emailEl.textContent = supplier.contact?.email || supplier.email || '-';
        contactEl.textContent = supplier.contact?.primary_contact || supplier.contact_name || '-';
        const rating = supplier.rating?.score || supplier.rating || 4.37;
        const ratingNum = typeof rating === 'number' ? rating : parseFloat(rating) || 4.37;
        const fullStars = Math.floor(ratingNum);
        const hasHalf = (ratingNum - fullStars) >= 0.5;
        let starsHtml = '⭐'.repeat(fullStars);
        if (hasHalf) starsHtml += '⭐';
        starsHtml += '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
        if (starsEl) starsEl.textContent = starsHtml;
        if (ratingEl) ratingEl.textContent = ratingNum.toFixed(2) + '/5';
    } else {
        // Use aggregated data from POs
        const pos = gsaState.filteredData.filter(po => po.supplier === supplierName);
        const totalSpend = pos.reduce((sum, po) => sum + (po.valueUSD || 0), 0);
        locEl.textContent = pos[0]?.entity || '-';
        emailEl.textContent = '-';
        contactEl.textContent = `${pos.length} POs (${formatCurrencyShort(totalSpend)})`;
        if (starsEl) starsEl.textContent = '★★★★☆';
        if (ratingEl) ratingEl.textContent = '-';
    }
}

// Update GSA Table
function updateGSATable() {
    const tbody = document.getElementById('gsaPoTableBody');
    if (!tbody) return;

    const { currentPage, pageSize, filteredData, sortField, sortDirection } = gsaState;

    // Sort data - using GSA data field names
    const sortedData = [...filteredData].sort((a, b) => {
        let aVal, bVal;
        switch (sortField) {
            case 'po_no':
                aVal = a.poNumber || '';
                bVal = b.poNumber || '';
                break;
            case 'type':
                aVal = a.poType || '';
                bVal = b.poType || '';
                break;
            case 'project':
                aVal = a.project || '';
                bVal = b.project || '';
                break;
            case 'po_date':
                aVal = new Date(a.poDate || 0).getTime();
                bVal = new Date(b.poDate || 0).getTime();
                break;
            case 'supplier':
                aVal = a.supplier || '';
                bVal = b.supplier || '';
                break;
            case 'material':
                aVal = a.material || '';
                bVal = b.material || '';
                break;
            case 'order_id':
                aVal = parseInt(a.orderId) || 0;
                bVal = parseInt(b.orderId) || 0;
                break;
            case 'po_value':
                aVal = a.valueUSD || 0;
                bVal = b.valueUSD || 0;
                break;
            case 'tax':
                aVal = a.taxUSD || 0;
                bVal = b.taxUSD || 0;
                break;
            default:
                aVal = a.poNumber || '';
                bVal = b.poNumber || '';
        }
        if (typeof aVal === 'string') {
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Paginate
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageData = sortedData.slice(startIdx, endIdx);

    // Render rows using GSA data field names - convert to USD
    tbody.innerHTML = pageData.map((po, idx) => {
        const poDate = po.poDate || '-';
        const formattedDate = poDate !== '-' ? poDate : '-';
        const poValue = po.valueUSD || po.value || 0;
        const currency = po.currency || 'USD';
        // Convert to USD using FX rates
        const valueInUSD = convertToUSD(poValue, currency);
        const taxUSD = po.taxUSD || 0;
        // Q18: PO VALUE includes tax
        const valueWithTax = valueInUSD + taxUSD;
        // Change order group indicator
        const coGroup = po.changeOrderTotal > 1
            ? `<span class="co-badge" title="${po.changeOrderTotal} POs in this order group">${po.poVersion} of ${po.changeOrderTotal}</span>`
            : '';
        const typeLabel = po.poType === 'Change Order'
            ? `<span class="co-type-badge">CO</span>`
            : `<span class="base-type-badge">Base</span>`;
        return `
            <tr class="${idx % 2 === 1 ? 'alt-row' : ''}" onclick="selectGSARow(this)">
                <td><a href="#">${po.poNumber || '-'}</a></td>
                <td>${typeLabel} ${coGroup}</td>
                <td>${po.orderId || '-'}</td>
                <td title="${po.project || ''}">${truncateText(po.project || '-', 40)}</td>
                <td>${formattedDate}</td>
                <td>${po.supplier || '-'}</td>
                <td>${po.material || '-'}</td>
                <td>${formatCurrency(valueWithTax)}</td>
                <td>${taxUSD > 0 ? formatCurrency(taxUSD) : '-'}</td>
            </tr>
        `;
    }).join('');

    // Update info
    const totalRecords = filteredData.length;
    const showingStart = totalRecords > 0 ? startIdx + 1 : 0;
    const showingEnd = Math.min(endIdx, totalRecords);
    document.getElementById('gsaTableInfo').textContent =
        `Showing ${showingStart}-${showingEnd} of ${totalRecords.toLocaleString()} records`;

    // Update pagination
    updateGSAPagination();
}

// Update GSA Pagination
function updateGSAPagination() {
    const totalPages = Math.ceil(gsaState.filteredData.length / gsaState.pageSize);
    const currentPage = gsaState.currentPage;
    const container = document.getElementById('gsaPageNumbers');
    if (!container) return;

    let pages = [];
    if (totalPages <= 5) {
        pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
        if (currentPage <= 3) {
            pages = [1, 2, 3, 4, 5];
        } else if (currentPage >= totalPages - 2) {
            pages = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
        }
    }

    container.innerHTML = pages.map(p =>
        `<span class="page-num ${p === currentPage ? 'active' : ''}" onclick="goToGSAPage(${p})">${p}</span>`
    ).join('');
}

// GSA Table Navigation
function goToGSAPage(page) {
    const totalPages = Math.ceil(gsaState.filteredData.length / gsaState.pageSize);
    if (page === 'first') gsaState.currentPage = 1;
    else if (page === 'last') gsaState.currentPage = totalPages;
    else if (page === 'prev') gsaState.currentPage = Math.max(1, gsaState.currentPage - 1);
    else if (page === 'next') gsaState.currentPage = Math.min(totalPages, gsaState.currentPage + 1);
    else if (typeof page === 'number') gsaState.currentPage = page;
    updateGSATable();
}

function changeGSAPageSize() {
    const select = document.getElementById('gsaTablePageSize');
    gsaState.pageSize = parseInt(select.value);
    gsaState.currentPage = 1;
    updateGSATable();
}

function sortGSATable(field) {
    if (gsaState.sortField === field) {
        gsaState.sortDirection = gsaState.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        gsaState.sortField = field;
        gsaState.sortDirection = 'asc';
    }
    updateGSATable();
}

function filterGSATable() {
    const searchTerm = document.getElementById('gsaTableSearch')?.value?.toLowerCase() || '';
    const typeFilter = document.getElementById('gsaTableTypeFilter')?.value || '';

    gsaState.filteredData = gsaState.allPOs.filter(po => {
        // Apply search - using GSA data field names
        if (searchTerm) {
            const searchFields = [
                po.poNumber,
                po.poName,
                po.project,
                po.supplier,
                po.material,
                po.entity,
                po.orderId,
                po.mainOrderId
            ].filter(Boolean).join(' ').toLowerCase();
            if (!searchFields.includes(searchTerm)) return false;
        }
        // Apply material/type filter
        if (typeFilter && po.material !== typeFilter) return false;
        return true;
    });

    gsaState.currentPage = 1;
    updateGSATable();
}

function selectGSARow(row) {
    document.querySelectorAll('#gsaPoTableBody tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
}

// GSA-Q16: toggleGSATableView removed — was orphaned, no toggle buttons in GSA tab

// Apply GSA Filters
function applyGSAFilters() {
    const entity = document.getElementById('gsaFilterEntity')?.value;
    const supplier = document.getElementById('gsaFilterSupplier')?.value;
    const project = document.getElementById('gsaFilterProject')?.value;
    const material = document.getElementById('gsaFilterMaterial')?.value;
    const materialCode = document.getElementById('gsaFilterMaterialCode')?.value;
    const poType = document.getElementById('gsaFilterDiscipline')?.value;
    const year = document.getElementById('gsaFilterYear')?.value;
    const fromDate = document.getElementById('gsaFilterFrom')?.value;
    const toDate = document.getElementById('gsaFilterTo')?.value;
    const search = document.getElementById('gsaSearchInput')?.value?.toLowerCase();

    gsaState.filteredData = gsaState.allPOs.filter(po => {
        // Entity filter (with trim normalization GSA-Q1)
        if (entity && entity !== 'All Entities' && (po.entity || '').trim() !== entity.trim()) return false;
        // Supplier filter
        if (supplier && supplier !== 'All Suppliers' && po.supplier !== supplier) return false;
        // Project filter
        if (project && project !== 'All Projects' && po.project !== project) return false;
        // Material filter
        if (material && material !== 'All Materials' && po.material !== material) return false;
        // Material Code filter (GSA-Q15)
        if (materialCode && materialCode !== 'All Material Codes' && po.materialCode !== materialCode) return false;
        // PO Type filter
        if (poType && poType !== 'All Types' && po.poType !== poType) return false;
        // Year filter
        if (year && year !== 'All Years' && po.year !== parseInt(year)) return false;
        // Date range using yearMonth
        if (fromDate || toDate) {
            const poDate = new Date(po.poDate);
            if (fromDate && poDate < new Date(fromDate)) return false;
            if (toDate && poDate > new Date(toDate)) return false;
        }
        // Search
        if (search) {
            const searchFields = [
                po.poNumber,
                po.poName,
                po.project,
                po.supplier,
                po.material,
                po.materialCode,
                po.entity,
                po.orderId,
                po.mainOrderId
            ].filter(Boolean).join(' ').toLowerCase();
            if (!searchFields.includes(search)) return false;
        }
        return true;
    });

    gsaState.currentPage = 1;

    // Update all components
    updateGSAKPIs();
    createGSASpendTrendChart();
    createGSAEntityChart();
    createGSAProjectChart();
    createGSASupplierCharts();
    updateGSATable();

    // GSA-Q7: Show search feedback indicator
    const gsaFeedback = document.getElementById('gsaSearchFeedback');
    if (gsaFeedback) {
        if (search) {
            gsaFeedback.textContent = `Showing ${gsaState.filteredData.length.toLocaleString()} of ${gsaState.allPOs.length.toLocaleString()} for "${search}"`;
            gsaFeedback.style.display = 'block';
        } else {
            gsaFeedback.style.display = 'none';
        }
    }

    // Update supplier card if a specific supplier is selected
    if (supplier && supplier !== 'All Suppliers') {
        updateGSASupplierCard(supplier);
    }

    console.log('📊 GSA: Filters applied,', gsaState.filteredData.length, 'records');
}

// Clear GSA Filters
function clearGSAFilters() {
    document.getElementById('gsaFilterEntity').value = 'All Entities';
    document.getElementById('gsaFilterSupplier').value = 'All Suppliers';
    document.getElementById('gsaFilterProject').value = 'All Projects';
    document.getElementById('gsaFilterMaterial').value = 'All Materials';
    const gsaMcEl = document.getElementById('gsaFilterMaterialCode');
    if (gsaMcEl) gsaMcEl.value = 'All Material Codes';
    document.getElementById('gsaFilterDiscipline').value = 'All Types';
    document.getElementById('gsaFilterYear').value = 'All Years';
    document.getElementById('gsaFilterFrom').value = '';
    document.getElementById('gsaFilterTo').value = '';
    document.getElementById('gsaSearchInput').value = '';
    document.getElementById('gsaTableSearch').value = '';
    document.getElementById('gsaTableTypeFilter').value = '';
    // GSA-Q7: Hide search feedback
    const gsaFeedback = document.getElementById('gsaSearchFeedback');
    if (gsaFeedback) gsaFeedback.style.display = 'none';

    gsaState.filteredData = [...gsaState.allPOs];
    gsaState.currentPage = 1;

    updateGSAKPIs();
    createGSASpendTrendChart();
    createGSAEntityChart();
    createGSAProjectChart();
    createGSASupplierCharts();
    updateGSATable();

    console.log('📊 GSA: Filters cleared');
}

// Clear SM Filters
function clearSMFilters() {
    ['filterEntity', 'filterProject', 'filterSupplier', 'filterStatus', 'filterMaterial', 'filterMaterialCode'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.selectedIndex = 0;
    });
    ['filterDateFrom', 'filterDateTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const searchEl = document.getElementById('searchInput');
    if (searchEl) searchEl.value = '';

    currentFilters = { entity: null, project: null, supplier: null, status: null, material: null, materialCode: null, search: '', dateFrom: null, dateTo: null };
    applyFilters();
    console.log('📊 SM: Filters cleared');
}

// Clear M&D Filters
function clearMdFilters() {
    ['filterMdDiscipline', 'filterMdMaterial', 'filterMdEntity', 'filterMdProject',
        'filterMdSupplier', 'filterMdYear'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.selectedIndex = 0;
        });
    ['filterMdFrom', 'filterMdTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const mdSearchEl = document.getElementById('mdSearchInput');
    if (mdSearchEl) mdSearchEl.value = '';

    // Q20: Reset material dropdown to show all materials
    updateMdMaterialDropdown();

    mdState.filteredPOs = [...mdState.allPOs];
    mdState.filteredQuotations = [...mdState.allQuotations];
    mdState.currentPage = 1;

    updateMdKPIs();
    createDisciplineSpendChart();
    createMaterialDistributionChart();
    updateMdSupplierTable();
    updateMdPoTable();
    console.log('📊 M&D: Filters cleared');
}

// ============================================
// MATERIALS & DISCIPLINES TAB
// ============================================
let mdState = {
    disciplineChartInstance: null,
    materialDistChartInstance: null,
    currentPage: 1,
    pageSize: 20,
    filteredPOs: [],
    allPOs: [],
    allQuotations: [],
    filteredQuotations: []
};

function initMaterialsDisciplines() {
    if (!mdData) {
        console.warn('⚠️ MD data not loaded');
        return;
    }

    console.log('📊 Initializing Materials & Disciplines tab');

    // Initialize filters
    initMdFilters();

    // Render KPIs
    updateMdKPIs();

    // Render charts
    createDisciplineSpendChart();
    createMaterialDistributionChart();

    // Render tables
    updateMdSupplierTable();
    updateMdApprovedMaterials();
    updateMdPoTable();

    // Populate supplier profile card with first supplier
    updateMdSupplierProfile();

    console.log('✅ Materials & Disciplines tab initialized');
}

// Update supplier profile card on right side
function updateMdSupplierProfile(supplier = null) {
    // If no specific supplier, use first from suppliersData
    if (!supplier && suppliersData && suppliersData.suppliers && suppliersData.suppliers.length > 0) {
        supplier = suppliersData.suppliers[0];
    }

    if (!supplier) return;

    // Update supplier card fields
    const nameEl = document.getElementById('mdSupplierName');
    const locationEl = document.getElementById('mdSupplierLocation');
    const starsEl = document.getElementById('mdSupplierStars');
    const ratingEl = document.getElementById('mdSupplierRatingVal');
    const emailEl = document.getElementById('mdSupplierEmail');
    const contactEl = document.getElementById('mdSupplierContact');

    if (nameEl) nameEl.textContent = supplier.name || '-';
    if (locationEl) {
        // Handle location object or string
        const raw = supplier.country || supplier.address?.country_standardized || supplier.phone_validation?.phone_country || '-';
        const loc = (typeof raw === 'object') ? (raw.country_standardized || raw.name || '-') : raw;
        locationEl.textContent = normalizeCountry(loc) || '-';
    }
    if (emailEl) {
        const em = supplier.email || supplier.contact?.email || '-';
        emailEl.textContent = (typeof em === 'object') ? '-' : em;
    }
    if (contactEl) {
        const ct = supplier.contact?.primary_contact || supplier.contact_name || '-';
        contactEl.textContent = (typeof ct === 'object') ? '-' : ct;
    }

    // Calculate rating stars (out of 5)
    const rating = (typeof supplier.rating === 'object' ? supplier.rating?.score : supplier.rating) || 4.37;
    const fullStars = Math.floor(rating);
    const hasHalf = (rating - fullStars) >= 0.5;
    let starsHtml = '⭐'.repeat(fullStars);
    if (hasHalf) starsHtml += '⭐';
    starsHtml += '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));

    if (starsEl) starsEl.textContent = starsHtml;
    if (ratingEl) ratingEl.textContent = rating.toFixed(2) + '/5';
}

function initMdFilters() {
    if (!mdData || !mdData.filters) return;

    const filters = mdData.filters;

    // Store all data for filtering
    mdState.allPOs = mdData.pos || [];
    mdState.allQuotations = mdData.quotations || [];
    mdState.filteredPOs = [...mdState.allPOs];
    mdState.filteredQuotations = [...mdState.allQuotations];

    // Q20: Build discipline→materials mapping from actual data for cascading filter
    const disciplineToMaterials = {};
    const allItems = [...(mdState.allPOs || []), ...(mdState.allQuotations || [])];
    allItems.forEach(item => {
        const disc = item.materialCode || item.discipline;
        const mat = item.material;
        if (disc && mat) {
            if (!disciplineToMaterials[disc]) disciplineToMaterials[disc] = new Set();
            disciplineToMaterials[disc].add(mat);
        }
    });
    // Convert Sets to sorted arrays
    Object.keys(disciplineToMaterials).forEach(k => {
        disciplineToMaterials[k] = [...disciplineToMaterials[k]].sort();
    });
    // Store for use in cascading filter
    mdState.disciplineToMaterials = disciplineToMaterials;
    mdState.allMaterials = (filters.materials || filters.disciplines || []).slice().sort();

    // Populate discipline filter (Q19: renamed from Material Code)
    const disciplineSelect = document.getElementById('filterMdDiscipline');
    if (disciplineSelect && (filters.materialCodes || filters.disciplines)) {
        const codes = filters.materialCodes || filters.disciplines || [];
        disciplineSelect.innerHTML = '<option>All Disciplines</option>' +
            codes.map(d => `<option>${d}</option>`).join('');
        // Q20: On discipline change, cascade to material dropdown then apply filters
        disciplineSelect.addEventListener('change', function() {
            updateMdMaterialDropdown();
            applyMdFilters();
        });
    }

    // Populate entity filter (MD-Q3: with trim normalization)
    const entitySelect = document.getElementById('filterMdEntity');
    if (entitySelect && filters.entities) {
        entitySelect.innerHTML = '<option>All Entities</option>' +
            filters.entities.map(e => e.trim()).filter(e => e && e !== 'Unknown').map(e => `<option>${e}</option>`).join('');
        entitySelect.addEventListener('change', applyMdFilters);
    }

    // Build unique materials from actual raw material names
    const materialSelect = document.getElementById('filterMdMaterial');
    if (materialSelect && (filters.materials || filters.disciplines)) {
        const mats = filters.materials || filters.disciplines || [];
        materialSelect.innerHTML = '<option>All Materials</option>' +
            mats.map(d => `<option>${d}</option>`).join('');
        materialSelect.addEventListener('change', applyMdFilters);
    }

    // Populate project filter
    const projectSelect = document.getElementById('filterMdProject');
    if (projectSelect && filters.projects) {
        projectSelect.innerHTML = '<option>All Projects</option>' +
            filters.projects.map(p => {
                const label = p.length > 50 ? p.substring(0, 50) + '...' : p;
                return `<option value="${p}" title="${p}">${label}</option>`;
            }).join('');
        projectSelect.addEventListener('change', applyMdFilters);
    }

    // Populate supplier filter
    const supplierSelect = document.getElementById('filterMdSupplier');
    if (supplierSelect && filters.suppliers) {
        supplierSelect.innerHTML = '<option>All Suppliers</option>' +
            filters.suppliers.map(s => {
                const label = s.length > 40 ? s.substring(0, 40) + '...' : s;
                return `<option value="${s}" title="${s}">${label}</option>`;
            }).join('');
        supplierSelect.addEventListener('change', applyMdFilters);
    }

    // Populate year filter
    const yearSelect = document.getElementById('filterMdYear');
    if (yearSelect) {
        const years = [...new Set(mdState.allPOs.map(po => po.year).filter(Boolean))].sort((a, b) => b - a);
        yearSelect.innerHTML = '<option>All Years</option>' +
            years.map(y => `<option>${y}</option>`).join('');
        yearSelect.addEventListener('change', applyMdFilters);
    }

    // Date filters
    const fromDate = document.getElementById('filterMdFrom');
    const toDate = document.getElementById('filterMdTo');
    if (fromDate) fromDate.addEventListener('change', applyMdFilters);
    if (toDate) toDate.addEventListener('change', applyMdFilters);

    // Search input handler
    const mdSearchInput = document.getElementById('mdSearchInput');
    if (mdSearchInput) {
        mdSearchInput.addEventListener('input', debounce(function () { applyMdFilters(); }, 300));
    }

    console.log('📋 MD filters initialized with materialCodes, materials, project, supplier, search');
}

// Q20: Cascading Material dropdown — repopulate based on selected Discipline
function updateMdMaterialDropdown() {
    const disciplineSelect = document.getElementById('filterMdDiscipline');
    const materialSelect = document.getElementById('filterMdMaterial');
    if (!materialSelect) return;

    const selectedDiscipline = disciplineSelect?.value;
    let materialsToShow;

    if (!selectedDiscipline || selectedDiscipline === 'All Disciplines') {
        // Show all materials
        materialsToShow = mdState.allMaterials || [];
    } else {
        // Show only materials belonging to the selected discipline
        materialsToShow = (mdState.disciplineToMaterials || {})[selectedDiscipline] || [];
    }

    // Preserve current material selection if still valid
    const currentMaterial = materialSelect.value;
    materialSelect.innerHTML = '<option>All Materials</option>' +
        materialsToShow.map(m => `<option>${m}</option>`).join('');

    // Restore selection if still in the list, otherwise reset
    if (currentMaterial && currentMaterial !== 'All Materials' && materialsToShow.includes(currentMaterial)) {
        materialSelect.value = currentMaterial;
    } else {
        materialSelect.value = 'All Materials';
    }

    // Update SearchableSelect wrapper if present
    if (materialSelect._searchableSelect) {
        materialSelect._searchableSelect.refresh();
    }
}

// Apply MD filters across all components
function applyMdFilters() {
    const discipline = document.getElementById('filterMdDiscipline')?.value;
    const entity = document.getElementById('filterMdEntity')?.value;
    const material = document.getElementById('filterMdMaterial')?.value;
    const project = document.getElementById('filterMdProject')?.value;
    const supplier = document.getElementById('filterMdSupplier')?.value;
    const year = document.getElementById('filterMdYear')?.value;
    const fromDate = document.getElementById('filterMdFrom')?.value;
    const toDate = document.getElementById('filterMdTo')?.value;
    const search = document.getElementById('mdSearchInput')?.value?.toLowerCase();

    // Filter POs
    mdState.filteredPOs = mdState.allPOs.filter(po => {
        if (discipline && discipline !== 'All Disciplines' && (po.materialCode || po.discipline) !== discipline) return false;
        if (entity && entity !== 'All Entities' && po.entity !== entity) return false;
        if (material && material !== 'All Materials' && po.material !== material) return false;
        if (project && project !== 'All Projects' && po.project !== project) return false;
        if (supplier && supplier !== 'All Suppliers' && po.supplier !== supplier) return false;
        if (year && year !== 'All Years' && po.year !== parseInt(year)) return false;

        // Date range filters
        if (fromDate || toDate) {
            const poDate = new Date(po.poDate);
            if (fromDate && poDate < new Date(fromDate)) return false;
            if (toDate && poDate > new Date(toDate)) return false;
        }
        // Search
        if (search) {
            const searchFields = [
                po.poNumber, po.poName, po.project, po.supplier,
                po.material, po.materialCode, po.entity
            ].filter(Boolean).join(' ').toLowerCase();
            if (!searchFields.includes(search)) return false;
        }
        return true;
    });

    // Filter quotations
    mdState.filteredQuotations = mdState.allQuotations.filter(q => {
        if (discipline && discipline !== 'All Disciplines' && (q.materialCode || q.discipline) !== discipline) return false;
        if (entity && entity !== 'All Entities' && q.entity !== entity) return false;
        if (material && material !== 'All Materials' && q.material !== material) return false;
        if (project && project !== 'All Projects' && q.project !== project) return false;
        if (supplier && supplier !== 'All Suppliers' && q.supplier !== supplier) return false;

        // Date range filters for quotations
        if (fromDate || toDate) {
            const qDate = new Date(q.date);
            if (fromDate && qDate < new Date(fromDate)) return false;
            if (toDate && qDate > new Date(toDate)) return false;
        }
        // Search
        if (search) {
            const searchFields = [
                q.number, q.material, q.materialCode, q.supplier,
                q.entity, q.project
            ].filter(Boolean).join(' ').toLowerCase();
            if (!searchFields.includes(search)) return false;
        }
        return true;
    });

    // Reset pagination
    mdState.currentPage = 1;

    // Update all components with filtered data
    updateMdKPIsFiltered();
    createDisciplineSpendChartFiltered();
    createMaterialDistributionChartFiltered();
    updateMdSupplierTableFiltered();
    updateMdApprovedMaterialsFiltered();
    updateMdPoTable(mdState.filteredPOs);

    // MD-Q4: Update supplier profile when supplier is selected in filter
    const supplierFilter = document.getElementById('filterMdSupplier');
    if (supplierFilter && supplierFilter.value && supplierFilter.value !== 'All Suppliers') {
        const sup = (suppliersData?.suppliers || []).find(s => s.name === supplierFilter.value);
        if (sup) updateMdSupplierProfile(sup);
    }

    console.log('📊 MD filters applied:', mdState.filteredPOs.length, 'POs,', mdState.filteredQuotations.length, 'quotations');
}

// Update KPIs from filtered data
function updateMdKPIsFiltered() {
    const pos = mdState.filteredPOs;
    const quotations = mdState.filteredQuotations;

    // Calculate from filtered data
    const totalOrdered = pos.reduce((sum, po) => sum + (po.value || po.amountValue || 0), 0);
    const totalQuoted = quotations.reduce((sum, q) => sum + (q.quotedValue || q.value || q.amount || 0), 0);

    // Unique material codes and raw materials
    const materialCodes = new Set([...pos.map(po => po.materialCode || po.discipline), ...quotations.map(q => q.materialCode || q.discipline)].filter(Boolean));
    const rawMaterials = new Set([...pos.map(po => po.material), ...quotations.map(q => q.material)].filter(Boolean));

    document.getElementById('kpiMdMaterials').textContent = rawMaterials.size || 0;
    document.getElementById('kpiMdDisciplines').textContent = materialCodes.size || 0;
    document.getElementById('kpiMdMaterialSpend').textContent = formatCurrencyShort(totalOrdered);
    document.getElementById('kpiMdDisciplineSpend').textContent = formatCurrencyShort(totalOrdered);

    const utilization = totalQuoted > 0 ? ((totalOrdered / totalQuoted) * 100).toFixed(1) : 0;
    const matUtilEl = document.getElementById('kpiMdMatUtil');
    const discUtilEl = document.getElementById('kpiMdDiscUtil');
    if (matUtilEl) matUtilEl.textContent = `${utilization}% conversion`;
    if (discUtilEl) discUtilEl.textContent = `${utilization}% conversion`;

    // Unique suppliers and projects (fix: count projects, not entities)
    const suppliers = new Set(pos.map(po => po.supplier).filter(Boolean));
    const projects = new Set(pos.map(po => po.project).filter(Boolean));

    document.getElementById('kpiMdActiveProjects').textContent = projects.size || 0;
    document.getElementById('kpiMdSupplierCount').textContent = `${suppliers.size} suppliers`;
}

// Create discipline chart from filtered data
function createDisciplineSpendChartFiltered() {
    const canvas = document.getElementById('disciplineSpendChart');
    if (!canvas) return;

    if (mdState.disciplineChartInstance) {
        mdState.disciplineChartInstance.destroy();
    }

    // Aggregate by materialCode from filtered data
    const disciplineMap = {};
    mdState.filteredQuotations.forEach(q => {
        const d = q.materialCode || q.discipline || 'Various';
        if (!disciplineMap[d]) disciplineMap[d] = { name: d, quotedValue: 0, orderedValue: 0 };
        disciplineMap[d].quotedValue += q.quotedValue || q.value || q.amount || 0;
    });
    mdState.filteredPOs.forEach(po => {
        const d = po.materialCode || po.discipline || 'Various';
        if (!disciplineMap[d]) disciplineMap[d] = { name: d, quotedValue: 0, orderedValue: 0 };
        disciplineMap[d].orderedValue += po.value || po.amountValue || 0;
    });

    const disciplines = Object.values(disciplineMap)
        .filter(d => d.orderedValue > 0 || d.quotedValue > 0)
        .sort((a, b) => b.orderedValue - a.orderedValue)
        .slice(0, 12);

    if (disciplines.length === 0) {
        // No data, show empty chart
        const ctx = canvas.getContext('2d');
        mdState.disciplineChartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: ['No Data'], datasets: [{ label: 'No Data', data: [0], backgroundColor: '#ccc' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
        return;
    }

    const ctx = canvas.getContext('2d');
    mdState.disciplineChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: disciplines.map(d => d.name),
            datasets: [
                {
                    label: 'Quoted',
                    data: disciplines.map(d => d.quotedValue || 0),
                    backgroundColor: '#9CB3C9',
                    borderColor: '#9CB3C9',
                    borderWidth: 1,
                    borderRadius: 2
                },
                {
                    label: 'Ordered',
                    data: disciplines.map(d => d.orderedValue || 0),
                    backgroundColor: '#2B4257',
                    borderColor: '#2B4257',
                    borderWidth: 1,
                    borderRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 12, font: { size: 10 }, padding: 8 } },
                tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => ctx.dataset.label + ': ' + formatCurrencyShort(ctx.raw) } }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => formatCurrencyShort(v) } },
                x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } } }
            }
        }
    });
}

// Create material distribution from filtered data
function createMaterialDistributionChartFiltered() {
    const canvas = document.getElementById('materialDistributionChart');
    if (!canvas) return;

    if (mdState.materialDistChartInstance) {
        mdState.materialDistChartInstance.destroy();
    }

    // MD-Q9: Aggregate by material name for pie chart (prefer material over materialCode)
    const materialMap = {};
    mdState.filteredPOs.forEach(po => {
        const m = po.material || po.materialCode || po.discipline || 'Various';
        materialMap[m] = (materialMap[m] || 0) + (po.value || po.amountValue || 0);
    });

    const materials = Object.entries(materialMap)
        .map(([name, value]) => ({ name, value }))
        .filter(m => m.value > 0)
        .sort((a, b) => b.value - a.value);

    if (materials.length === 0) {
        const ctx = canvas.getContext('2d');
        mdState.materialDistChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#ccc'] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
        return;
    }

    const colors = ['#2B4257', '#3B82F6', '#60A5FA', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#1E3A5F', '#8B5CF6', '#22C55E', '#F97316', '#EC4899'];
    const ctx = canvas.getContext('2d');
    mdState.materialDistChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: materials.map(m => m.name),
            datasets: [{ data: materials.map(m => m.value), backgroundColor: colors.slice(0, materials.length), borderWidth: 1 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'right', labels: { boxWidth: 10, font: { size: 10 }, padding: 6 } },
                tooltip: { callbacks: { label: ctx => ctx.label + ': ' + formatCurrencyShort(ctx.raw) } }
            },
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const matName = materials[idx]?.name;
                    const matFilter = document.getElementById('filterMdMaterial');
                    if (matFilter && matName) {
                        for (let opt of matFilter.options) {
                            if (opt.value === matName || opt.textContent === matName) {
                                matFilter.value = opt.value;
                                applyMdFilters();
                                break;
                            }
                        }
                    }
                }
            }
        }
    });
}

// Update supplier table from filtered data
// MD Supplier Table State
let mdSupplierTableState = {
    page: 1,
    pageSize: 10,
    sortField: 'name',
    sortDir: 'asc',
    search: '',
    allRows: [],    // full dataset (pre-filter tab filters applied)
    filtered: []    // after local search
};

function buildMdSupplierRows(sourceSuppliers) {
    // Build uniform row objects from either suppliersData or PO-aggregated data
    return sourceSuppliers.map(s => {
        const name = s.name || s.supplier_name || '-';
        const fullInfo = suppliersData?.suppliers?.find(ss => (ss.name || ss.supplier_name) === name) || s;
        const country = normalizeCountry(fullInfo.address?.country_standardized || fullInfo.phone_validation?.phone_country || fullInfo.country) || '-';
        const ratingVal = fullInfo.rating?.score || fullInfo.rating || 4.0;
        const rating = typeof ratingVal === 'number' ? ratingVal : parseFloat(ratingVal) || 4.0;
        const email = fullInfo.contact?.email || fullInfo.email || '-';
        const contact = fullInfo.contact?.primary_contact || fullInfo.contact_name || '-';
        return { name, country, rating, email, contact };
    });
}

function applyMdSupplierSearch() {
    const q = mdSupplierTableState.search.toLowerCase();
    if (!q) {
        mdSupplierTableState.filtered = [...mdSupplierTableState.allRows];
    } else {
        mdSupplierTableState.filtered = mdSupplierTableState.allRows.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.country.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.contact.toLowerCase().includes(q)
        );
    }
    // Apply sort
    const { sortField, sortDir } = mdSupplierTableState;
    mdSupplierTableState.filtered.sort((a, b) => {
        let aVal = a[sortField], bVal = b[sortField];
        if (sortField === 'rating') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
}

function renderMdSupplierTablePage() {
    const tbody = document.getElementById('mdSupplierTableBody');
    if (!tbody) return;

    const { page, pageSize, filtered } = mdSupplierTableState;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    // Clamp page
    if (mdSupplierTableState.page > totalPages) mdSupplierTableState.page = totalPages;
    const currentPage = mdSupplierTableState.page;
    const start = (currentPage - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No suppliers match your search</td></tr>';
    } else {
        tbody.innerHTML = pageData.map(s => `
            <tr>
                <td><a href="#" class="supplier-link" onclick="updateMdSupplierProfile({name:'${s.name.replace(/'/g, "\\'")}', country:'${(typeof s.country === 'string' ? s.country : '-').replace(/'/g, "\\'")}', email:'${s.email.replace(/'/g, "\\'")}', contact:'${s.contact.replace(/'/g, "\\'")}', rating:${s.rating}}); return false;">${s.name}</a></td>
                <td>${s.country}</td>
                <td>⭐ ${typeof s.rating === 'number' ? s.rating.toFixed(1) : s.rating}</td>
                <td>${s.email}</td>
                <td>${s.contact}</td>
            </tr>
        `).join('');
    }

    // Update pagination info
    const pageInfo = document.getElementById('mdSupplierPageInfo');
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    const showingText = document.getElementById('mdSupplierShowingText');
    if (showingText) showingText.textContent = `of ${filtered.length}`;
}

// Public handlers called from HTML
function filterMdSupplierTable() {
    mdSupplierTableState.search = document.getElementById('mdSupplierSearch')?.value || '';
    mdSupplierTableState.page = 1;
    applyMdSupplierSearch();
    renderMdSupplierTablePage();
}
window.filterMdSupplierTable = filterMdSupplierTable;

function changeMdSupplierPageSize() {
    mdSupplierTableState.pageSize = parseInt(document.getElementById('mdSupplierPageSize')?.value || '10');
    mdSupplierTableState.page = 1;
    renderMdSupplierTablePage();
}
window.changeMdSupplierPageSize = changeMdSupplierPageSize;

function sortMdSupplierTable(field) {
    if (mdSupplierTableState.sortField === field) {
        mdSupplierTableState.sortDir = mdSupplierTableState.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        mdSupplierTableState.sortField = field;
        mdSupplierTableState.sortDir = 'asc';
    }
    applyMdSupplierSearch();
    renderMdSupplierTablePage();
}
window.sortMdSupplierTable = sortMdSupplierTable;

function mdSupplierPageNav(action) {
    const totalPages = Math.max(1, Math.ceil(mdSupplierTableState.filtered.length / mdSupplierTableState.pageSize));
    switch (action) {
        case 'first': mdSupplierTableState.page = 1; break;
        case 'prev': mdSupplierTableState.page = Math.max(1, mdSupplierTableState.page - 1); break;
        case 'next': mdSupplierTableState.page = Math.min(totalPages, mdSupplierTableState.page + 1); break;
        case 'last': mdSupplierTableState.page = totalPages; break;
    }
    renderMdSupplierTablePage();
}
window.mdSupplierPageNav = mdSupplierPageNav;

function updateMdSupplierTableFiltered() {
    // Get unique suppliers from filtered POs
    const supplierMap = {};
    mdState.filteredPOs.forEach(po => {
        const name = po.supplier;
        if (!name) return;
        if (!supplierMap[name]) supplierMap[name] = { name, count: 0, value: 0 };
        supplierMap[name].count++;
        supplierMap[name].value += po.value || po.amountValue || 0;
    });

    const suppliers = Object.values(supplierMap).sort((a, b) => b.value - a.value);

    // Feed into paginated table system
    mdSupplierTableState.allRows = buildMdSupplierRows(suppliers);
    mdSupplierTableState.page = 1;
    // Preserve existing search
    mdSupplierTableState.search = document.getElementById('mdSupplierSearch')?.value || '';
    applyMdSupplierSearch();
    renderMdSupplierTablePage();
}

// Update approved materials from filtered data
function updateMdApprovedMaterialsFiltered() {
    const tbody = document.getElementById('mdApprovedMaterialsBody');
    if (!tbody) return;

    const materials = [];
    const seen = new Set();

    mdState.filteredQuotations.forEach(q => {
        const key = `${q.material}-${q.discipline}`;
        if (!seen.has(key) && materials.length < 15) {
            seen.add(key);
            materials.push({
                material: q.material || '-',
                specNo: q.number?.split('-')[1] || '-',
                supplier: q.supplier || '-',
                discipline: q.discipline || q.material || '-'
            });
        }
    });

    if (materials.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No materials for current filters</td></tr>';
        return;
    }

    tbody.innerHTML = materials.map(m => `
        <tr>
            <td>${m.material}</td>
            <td>${m.specNo}</td>
            <td><a href="#" class="supplier-link">${m.supplier}</a></td>
            <td>${m.discipline}</td>
        </tr>
    `).join('');
}

function updateMdKPIs() {
    if (!mdData || !mdData.summary) return;

    const summary = mdData.summary;

    // Materials count (raw materials)
    document.getElementById('kpiMdMaterials').textContent = summary.materialCount || summary.disciplineCount || 0;

    // Material Codes count (consolidated codes)
    document.getElementById('kpiMdDisciplines').textContent = summary.materialCodeCount || summary.disciplineCount || 0;

    // Total Material Spend
    const materialSpend = summary.totalOrdered || 0;
    document.getElementById('kpiMdMaterialSpend').textContent = formatCurrencyShort(materialSpend);

    // Total Discipline Spend (same as material spend in this context)
    document.getElementById('kpiMdDisciplineSpend').textContent = formatCurrencyShort(materialSpend);

    // Calculate utilization
    const utilization = summary.totalQuoted > 0 ?
        ((summary.totalOrdered / summary.totalQuoted) * 100).toFixed(1) : 0;

    // Update utilization subtexts
    const matUtilEl = document.getElementById('kpiMdMatUtil');
    const discUtilEl = document.getElementById('kpiMdDiscUtil');
    if (matUtilEl) matUtilEl.textContent = `${utilization}% conversion`;
    if (discUtilEl) discUtilEl.textContent = `${utilization}% conversion`;

    // Active Projects - count unique projects from PO data
    const activeProjects = summary.projectCount || mdData.filters?.projects?.length || 0;
    document.getElementById('kpiMdActiveProjects').textContent = activeProjects;

    // Supplier count
    document.getElementById('kpiMdSupplierCount').textContent = `${summary.supplierCount || 0} suppliers`;

    console.log('📊 MD KPIs updated - utilization:', utilization + '%');
}

function updateMdSupplierTable() {
    // Get suppliers from suppliersData or gsaData
    let suppliers = [];

    if (suppliersData?.suppliers) {
        suppliers = suppliersData.suppliers;
    } else if (gsaData?.supplierRankings?.top) {
        suppliers = gsaData.supplierRankings.top;
    }

    // Feed into paginated table system
    mdSupplierTableState.allRows = buildMdSupplierRows(suppliers);
    mdSupplierTableState.page = 1;
    mdSupplierTableState.search = '';
    const searchEl = document.getElementById('mdSupplierSearch');
    if (searchEl) searchEl.value = '';
    applyMdSupplierSearch();
    renderMdSupplierTablePage();

    console.log('📊 MD Supplier table updated:', suppliers.length, 'suppliers');
}

function updateMdApprovedMaterials() {
    const tbody = document.getElementById('mdApprovedMaterialsBody');
    if (!tbody) return;

    // Get approved materials from mdData quotations or build sample data
    let materials = [];

    if (mdData?.quotations) {
        // Extract unique materials from quotations
        const seen = new Set();
        mdData.quotations.forEach(q => {
            const key = `${q.material}-${q.discipline}`;
            if (!seen.has(key) && materials.length < 15) {
                seen.add(key);
                materials.push({
                    material: q.material || '-',
                    specNo: q.number?.split('-')[1] || '-',
                    supplier: q.supplier || '-',
                    discipline: q.discipline || q.material || '-'
                });
            }
        });
    }

    if (materials.length === 0) {
        // Fallback: no data available
        materials = [];
    }

    if (materials.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No approved materials data available</td></tr>';
        return;
    }

    tbody.innerHTML = materials.map(m => `
        <tr>
            <td>${m.material}</td>
            <td>${m.specNo}</td>
            <td><a href="#" class="supplier-link">${m.supplier}</a></td>
            <td>${m.discipline}</td>
        </tr>
    `).join('');

    console.log('📊 MD Approved Materials table updated:', materials.length, 'materials');
}

function createDisciplineSpendChart() {
    const canvas = document.getElementById('disciplineSpendChart');
    if (!canvas || !mdData || !mdData.disciplines) return;

    // Destroy previous instance
    if (mdState.disciplineChartInstance) {
        mdState.disciplineChartInstance.destroy();
    }

    const disciplines = mdData.disciplines
        .filter(d => d.orderedValue > 0 || d.quotedValue > 0)
        .sort((a, b) => b.orderedValue - a.orderedValue)
        .slice(0, 12);

    const ctx = canvas.getContext('2d');
    mdState.disciplineChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: disciplines.map(d => d.name),
            datasets: [
                {
                    label: 'Quoted',
                    data: disciplines.map(d => d.quotedValue || 0),
                    backgroundColor: '#9CB3C9',
                    borderColor: '#9CB3C9',
                    borderWidth: 1,
                    borderRadius: 2
                },
                {
                    label: 'Ordered',
                    data: disciplines.map(d => d.orderedValue || 0),
                    backgroundColor: '#2B4257',
                    borderColor: '#2B4257',
                    borderWidth: 1,
                    borderRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 12,
                        font: { size: 10 },
                        padding: 8
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + formatCurrencyShort(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        callback: function (value) {
                            return formatCurrencyShort(value);
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 10 }
                    }
                }
            }
        }
    });

    console.log('📊 Discipline Spend chart created with dual bars');
}

function createMaterialDistributionChart() {
    const canvas = document.getElementById('materialDistributionChart');
    if (!canvas || !mdData || !mdData.disciplines) return;

    // Destroy previous instance
    if (mdState.materialDistChartInstance) {
        mdState.materialDistChartInstance.destroy();
    }

    // Get all disciplines by spend for pie chart
    const disciplines = mdData.disciplines
        .filter(d => d.orderedValue > 0)
        .sort((a, b) => b.orderedValue - a.orderedValue);

    // Colors for all 12 material codes
    const colors = [
        '#2B4257', // Dark blue
        '#3B82F6', // Blue
        '#60A5FA', // Light blue
        '#06B6D4', // Cyan/Teal
        '#10B981', // Green
        '#F59E0B', // Orange
        '#EF4444', // Red
        '#1E3A5F', // Navy
        '#8B5CF6', // Purple
        '#22C55E', // Bright green
        '#F97316', // Deep orange
        '#EC4899', // Pink
    ];

    const ctx = canvas.getContext('2d');
    mdState.materialDistChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: disciplines.map(d => d.name),
            datasets: [{
                data: disciplines.map(d => d.orderedValue),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        font: { size: 9 },
                        padding: 6,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrencyShort(context.raw)} (${pct}%)`;
                        }
                    }
                }
            },
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const matName = disciplines[idx]?.name;
                    const matFilter = document.getElementById('filterMdMaterial');
                    if (matFilter && matName) {
                        for (let opt of matFilter.options) {
                            if (opt.value === matName || opt.textContent === matName) {
                                matFilter.value = opt.value;
                                applyMdFilters();
                                break;
                            }
                        }
                    }
                }
            }
        }
    });

    console.log('📊 Material Distribution chart created');
}

function buildMaterialLegend(disciplines, colors) {
    const legendContainer = document.getElementById('materialDistLegend');
    if (!legendContainer) return;

    legendContainer.innerHTML = disciplines.map((d, i) => `
        <span class="material-legend-item">
            <span class="material-legend-color" style="background:${colors[i]}"></span>
            ${d.name}
        </span>
    `).join('');
}

function updateMdPoTable(filteredData) {
    const tbody = document.getElementById('mdPoDetailsBody');
    if (!tbody) return;

    // Use filtered data if provided, otherwise use mdData.pos or gsaData.workbench
    let pos = [];

    if (filteredData && filteredData.length > 0) {
        pos = filteredData;
    } else if (mdData?.pos && mdData.pos.length > 0) {
        pos = mdData.pos;
    } else if (gsaData?.workbench) {
        pos = gsaData.workbench;
    }

    mdState.filteredPOs = pos;

    const startIdx = (mdState.currentPage - 1) * mdState.pageSize;
    const pageData = pos.slice(startIdx, startIdx + mdState.pageSize);

    tbody.innerHTML = pageData.map(po => {
        const currency = po.currency || 'USD';
        const rawValue = po.poSpendUSD || po.valueUSD || po.value || po.amounts?.total_po_value_usd || po.quotedValue || 0;
        // Convert to USD using FX rates
        const valueInUSD = convertToUSD(rawValue, currency);
        return `
            <tr>
                <td>${po.poNumber || po.po_number || po.number || '-'}</td>
                <td>${po.poDate || po.dates?.po_date || po.date || '-'}</td>
                <td>${po.material || '-'}</td>
                <td>${po.materialCode || po.discipline || po.material || '-'}</td>
                <td>${formatCurrencyShort(valueInUSD)}</td>
                <td>${currency}</td>
                <td title="${po.project?.project_name || po.project || '-'}">${truncateText(po.project?.project_name || po.project || '-', 40)}</td>
            </tr>
        `;
    }).join('');

    // Update pagination
    const totalPages = Math.ceil(pos.length / mdState.pageSize);
    document.getElementById('mdPoPageInfo').textContent = `Page ${mdState.currentPage} of ${totalPages}`;
    document.getElementById('mdPoPrevBtn').disabled = mdState.currentPage <= 1;
    document.getElementById('mdPoNextBtn').disabled = mdState.currentPage >= totalPages;

    console.log('📊 MD PO table updated:', pageData.length, 'rows');
}

function mdPoPageChange(delta) {
    const totalPages = Math.ceil(mdState.filteredPOs.length / mdState.pageSize);
    mdState.currentPage = Math.max(1, Math.min(totalPages, mdState.currentPage + delta));
    updateMdPoTable(mdState.filteredPOs);
}
window.clearMdFilters = clearMdFilters;
window.updateMdSupplierProfile = updateMdSupplierProfile;
window.mdPoPageChange = mdPoPageChange;

// ============================================
// KPI INFO POPUP SYSTEM (Temporary Dev Notes)
// ============================================
const KPI_INFO = {
    // ── SM Tab KPIs ──
    'sm-rfq': {
        title: 'Request for Quotation (RFQ)',
        description: 'Total number of RFQ quotation records in the SM workbench. IQ records are auto-filtered by the pipeline.',
        formula: 'COUNT(sm_data.workbench)',
        source: 'sm_data.json → workbench[] array (built dynamically by build_v8_data.py)',
        field: 'Each record = 1 RFQ quotation row from Quotation Excel export',
        example: 'All RFQ records counted dynamically from loaded quotation fragments',
        note: 'Includes all statuses: Order, Quotation, Waiting, Cancelled. IQ records are removed by the pipeline. When filtered, counts only records matching active entity/type/status/date/search filters.'
    },
    'sm-quoteValue': {
        title: 'Quote Value',
        description: 'Total value of all quotations, converted to USD using embedded FX rates.',
        formula: 'SUM( convertToUSD(q.QuotationValue, q.Currency) )  for all quotations',
        source: 'sm_data.json → workbench[].QuotationValue + Currency',
        field: 'QuotationValue (original currency) → converted via FX rates to USD',
        example: 'If QuotationValue=100,000 JPY and USD/JPY=150 → $666.67',
        note: 'FX conversion uses embedded rates (JPY÷150, AED÷3.67, QAR÷3.64, NPR÷133.5, etc.). Unknown currencies are logged by the pipeline and treated as USD. Browser also fetches live rates from open.er-api.com.'
    },
    'sm-po': {
        title: 'Purchase Orders',
        description: 'Count of quotation records with Status = "Order" — quotations that converted to POs.',
        formula: 'COUNT(workbench WHERE Status = "Order")',
        source: 'sm_data.json → workbench[] filtered by Status field',
        field: 'Status field = "Order"',
        example: 'Dynamically counted from all records where Status = "Order"',
        note: 'This counts SM workbench rows with Order status — these are quotations that converted to POs. Different from the GSA PO count which counts actual PO documents from the PO Excel export.'
    },
    'sm-poValue': {
        title: 'PO Values',
        description: 'Total value of quotations with Status = "Order", converted to USD.',
        formula: 'SUM( convertToUSD(q.QuotationValue, q.Currency) )  WHERE Status = "Order"',
        source: 'sm_data.json → workbench[] WHERE Status="Order"',
        field: 'QuotationValue for Order-status records only, FX-converted to USD',
        example: 'Sum of all QuotationValues where Status=Order → USD converted',
        note: 'Uses SM quotation values (not PO values from gsa_data). These represent the quoted amounts for won bids. When filtered, recalculated from filtered Order-status records.'
    },
    'sm-winRate': {
        title: 'Win Rate',
        description: 'Percentage of quotations that converted to orders.',
        formula: 'COUNT(Status="Order") ÷ COUNT(all quotations) × 100',
        source: 'sm_data.json → summary.winRate (pre-calculated by build_v8_data.py)',
        field: 'COUNT(Status="Order") / COUNT(all) × 100',
        example: 'Dynamically computed: Orders ÷ Total Quotations × 100',
        note: 'Pre-calculated in build_v8_data.py as sm_data.summary.winRate. When filters are active, recalculated from filtered subset using convertToUSD() for each record.'
    },
    'sm-co': {
        title: 'Change Orders',
        description: 'Total number of Change Order POs from the GSA dataset. Identified by PO suffix: -1 = Base Order, -2 or higher = Change Order.',
        formula: 'COUNT(gsa_data.pos WHERE poType = "Change Order")',
        source: 'gsa_data.json → summary.changeOrders (computed by build_v8_data.py)',
        field: 'poType = "Change Order" — detected via Order ID suffix analysis',
        example: 'Dynamically counted: POs with suffix -2 or higher on the Order ID',
        note: 'Sourced from GSA data (actual PO documents), NOT from SM workbench. SM does not track change orders — they are post-award modifications tracked in the PO system. This value does not change with SM filters.'
    },
    'sm-coValue': {
        title: 'CO Value',
        description: 'Total USD value of all Change Order POs from the GSA dataset.',
        formula: 'SUM(gsa_data.pos.valueUSD WHERE poType = "Change Order")',
        source: 'gsa_data.json → summary.changeOrderValue (computed by build_v8_data.py)',
        field: 'valueUSD for Change Order type POs, pre-converted in pipeline',
        example: 'Sum of all Change Order PO values, dynamically computed',
        note: 'Pre-calculated in build_v8_data.py from PO Excel data. This value does not change with SM filters since COs come from the GSA dataset.'
    },

    // ── GSA Tab KPIs ──
    'gsa-po': {
        title: 'Total No. of Purchase Orders',
        description: 'Total count of all PO records in the GSA dataset (Base Orders + Change Orders). Auto-detected from PO Excel file.',
        formula: 'COUNT(gsa_data.pos)',
        source: 'gsa_data.json → pos[] array (built from auto-detected PO_List_*.xls)',
        field: 'All PO records regardless of poType (Base PO + Change Order)',
        example: 'Dynamically counted: Base Orders + Change Orders = Total POs',
        note: 'Pipeline auto-detects PO file via glob and uses header-based column lookup. When filtered, counts only POs matching active entity/supplier/date/material filters. Each PO has poType = "Base PO" or "Change Order".'
    },
    'gsa-spend': {
        title: 'Total Spend',
        description: 'Sum of USD values for all POs. Converted from original currencies in the pipeline.',
        formula: 'SUM(gsa_data.pos[].valueUSD)',
        source: 'gsa_data.json → pos[].valueUSD (pre-converted by build_v8_data.py)',
        field: 'valueUSD — pre-converted to USD in build pipeline using embedded FX rates',
        example: 'Total USD spend across all POs, dynamically computed from data',
        note: 'Values are pre-converted to USD in build_v8_data.py. Unknown currencies are logged and treated as USD. When filters active, SUM is recalculated with convertToUSD() applied to each PO\'s original value + currency.'
    },
    'gsa-co': {
        title: 'Total No. of Change Orders',
        description: 'Count of POs where poType = "Change Order". Detected via Order ID suffix: same Order ID with PO suffix > -1.',
        formula: 'COUNT(gsa_data.pos WHERE poType = "Change Order")',
        source: 'gsa_data.json → pos[] filtered by poType',
        field: 'poType === "Change Order" — POs with Order ID suffix -2 or higher',
        example: 'Dynamically counted: N Change Orders in M groups (groups with changeOrderTotal > 1)',
        note: 'Subtext shows number of unique Order ID groups with multiple POs (excludes orphan COs where changeOrderTotal = 1). When filtered, counts Change Orders within the filtered PO subset only.'
    },
    'gsa-coAmount': {
        title: 'Total Amount of Change Orders',
        description: 'Sum of USD values for Change Order POs. Subtext shows CO % of total spend.',
        formula: 'SUM(valueUSD WHERE poType = "Change Order")',
        source: 'gsa_data.json → pos[] filtered by poType + summed',
        field: 'valueUSD for Change Order records, pre-converted in pipeline',
        example: 'CO spend and percentage of total spend, dynamically computed',
        note: 'When filtered, recalculated from filtered Change Orders only. Percentage is relative to filtered total spend. All values computed dynamically from data.'
    },
    'gsa-suppliers': {
        title: 'Active Suppliers',
        description: 'Count of unique supplier names across all POs in the dataset.',
        formula: 'COUNT(DISTINCT gsa_data.pos[].supplier)',
        source: 'gsa_data.json → pos[].supplier (unique vendor names)',
        field: 'Unique supplier names (vendor companies) from PO Excel data',
        example: 'Dynamically counted: unique supplier names across all POs',
        note: 'When filtered, counts unique suppliers in the filtered PO subset. Uses Set-based counting for accuracy.'
    },
    'gsa-entities': {
        title: 'Active Entities',
        description: 'Count of unique MVL business entities across all POs.',
        formula: 'COUNT(DISTINCT gsa_data.pos[].entity)',
        source: 'gsa_data.json → pos[].entity (mapped from entityCode via entity_code_map.json)',
        field: 'Unique entity names — mapped from entity codes in PO Excel data',
        example: 'Dynamically counted: unique MVL business entities e.g. "Yamauchi Gumi", "MACRO"',
        note: 'Entity codes are mapped to full names via entity_code_map.json. When filtered, counts unique entities in the filtered PO subset.'
    },

    // ── M&D Tab KPIs ──
    'md-materials': {
        title: 'Materials',
        description: 'Count of unique raw material names across POs and Quotations.',
        formula: 'COUNT(DISTINCT material) across POs + Quotations',
        source: 'md_data.json → summary.materialCount (from build_v8_data.py)',
        field: 'material field — raw material names from Excel (e.g. "Steel Rebar", "Electrical Cables")',
        example: 'Dynamically counted: unique material names from combined PO + Quotation data',
        note: 'Raw material names come from the Material column in Excel. Pipeline uses header-based lookup to find the column. When filtered, counts unique materials in filtered data.'
    },
    'md-disciplines': {
        title: 'Material Codes',
        description: 'Count of unique material code categories (consolidated groupings).',
        formula: 'COUNT(DISTINCT materialCode) across POs + Quotations',
        source: 'md_data.json → summary.materialCodeCount (from build_v8_data.py)',
        field: 'materialCode field — consolidated categories (e.g. Mechanical, Electrical, Civil)',
        example: 'Dynamically counted: unique material code categories',
        note: 'Material codes are consolidated groupings from the Material Code column in Excel. When filtered, counts unique material codes in filtered data.'
    },
    'md-materialSpend': {
        title: 'Total Material Spend',
        description: 'Sum of PO ordered values across all materials. Subtext shows conversion % (ordered/quoted).',
        formula: 'SUM(md_data.pos[].value)',
        source: 'md_data.json → pos[].value (amountValue from PO Excel)',
        field: 'PO ordered amount (in original currency)',
        example: 'Total ordered value across all M&D POs, dynamically computed',
        note: 'Shows actual PO spend. Subtext "% conversion" = (totalOrdered / totalQuoted × 100). When filtered, recalculated from filtered POs.'
    },
    'md-disciplineSpend': {
        title: 'Total Material Code Spend',
        description: 'Same as Material Spend — total PO ordered values grouped by material code.',
        formula: 'SUM(md_data.pos[].value)',
        source: 'md_data.json → pos[].value',
        field: 'Same as Material Spend — both show total ordered value',
        example: 'Identical to Total Material Spend value, dynamically computed',
        note: 'Both Material Spend and Material Code Spend show the same total ordered value. Subtext shows conversion percentage.'
    },
    'md-projects': {
        title: 'Active Projects / Suppliers',
        description: 'Unique projects (entities) and suppliers from PO data.',
        formula: 'Projects: COUNT(DISTINCT project)  |  Suppliers: COUNT(DISTINCT supplier)',
        source: 'md_data.json → summary.projectCount + summary.supplierCount',
        field: 'project = project name, supplier = vendor name (both from PO Excel)',
        example: 'Dynamically counted: unique projects and suppliers from PO data',
        note: 'Projects counts unique project names from POs. Suppliers counts unique vendor names. When filtered, recalculated from filtered PO subset.'
    }
};

function showKpiInfo(kpiKey) {
    const info = KPI_INFO[kpiKey];
    if (!info) return;

    // Remove existing popup if any
    const existing = document.querySelector('.kpi-info-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'kpi-info-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div class="kpi-info-popup">
            <div class="kpi-info-popup-header">
                <div>
                    <h3>${info.title}</h3>
                    <span class="kpi-info-popup-badge">Dev Note</span>
                </div>
                <button class="kpi-info-popup-close" onclick="this.closest('.kpi-info-overlay').remove()">&times;</button>
            </div>
            <div class="kpi-info-popup-body">
                <div class="kpi-info-row">
                    <span class="kpi-info-label">Description</span>
                    <span class="kpi-info-val">${info.description}</span>
                </div>
                <div class="kpi-info-row">
                    <span class="kpi-info-label">Data Source</span>
                    <span class="kpi-info-val">${info.source}</span>
                </div>
                <div class="kpi-info-row">
                    <span class="kpi-info-label">Field Used</span>
                    <span class="kpi-info-val">${info.field}</span>
                </div>
                <div class="kpi-info-row" style="flex-direction:column;">
                    <span class="kpi-info-label" style="margin-bottom:4px;">Formula</span>
                    <div class="kpi-info-formula">${info.formula}</div>
                </div>
                <div class="kpi-info-row">
                    <span class="kpi-info-label">Example</span>
                    <span class="kpi-info-val">${info.example}</span>
                </div>
                <div class="kpi-info-note">
                    <strong>Note:</strong> ${info.note}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Close on Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Attach click handlers to all info icons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.kpi-info-icon[data-kpi]').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            showKpiInfo(icon.dataset.kpi);
        });
    });
});

// ============================================
// SEARCHABLE SELECT COMPONENT
// ============================================
class SearchableSelect {
    constructor(selectElement) {
        if (!selectElement || selectElement.dataset.searchableInit) return;
        this.select = selectElement;
        this.select.dataset.searchableInit = 'true';
        this.select._searchableSelect = this; // Q20: store reference for cascading refresh
        this.options = [];
        this.wrapper = null;
        this.input = null;
        this.dropdown = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        // Cache original options
        this.cacheOptions();

        // Create wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'searchable-select-wrapper';
        this.wrapper.style.position = 'relative';
        this.wrapper.style.display = 'inline-block';
        this.wrapper.style.width = this.select.offsetWidth ? this.select.offsetWidth + 'px' : '100%';

        // Create search input
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'searchable-select-input';
        this.input.placeholder = this.select.options[0]?.text || 'Search...';
        this.input.value = '';

        // Create dropdown
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'searchable-select-dropdown';

        // Insert wrapper
        this.select.parentNode.insertBefore(this.wrapper, this.select);
        this.wrapper.appendChild(this.input);
        this.wrapper.appendChild(this.dropdown);
        this.select.style.display = 'none';

        // Events
        this.input.addEventListener('focus', () => this.open());
        this.input.addEventListener('input', () => this.filter());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) this.close();
        });
    }

    cacheOptions() {
        this.options = Array.from(this.select.options).map(opt => ({
            value: opt.value,
            text: opt.text,
            isDefault: opt.index === 0
        }));
    }

    open() {
        this.isOpen = true;
        this.renderOptions(this.options);
        this.dropdown.style.display = 'block';
    }

    close() {
        this.isOpen = false;
        this.dropdown.style.display = 'none';
    }

    filter() {
        const query = this.input.value.toLowerCase();
        const filtered = this.options.filter(opt =>
            opt.text.toLowerCase().includes(query) || opt.isDefault
        );
        this.renderOptions(filtered);
    }

    renderOptions(opts) {
        this.dropdown.innerHTML = opts.map(opt => `
            <div class="searchable-select-option${opt.isDefault ? ' default-option' : ''}"
                 data-value="${opt.value}">${opt.text}</div>
        `).join('');

        this.dropdown.querySelectorAll('.searchable-select-option').forEach(el => {
            el.addEventListener('click', () => {
                this.select.value = el.dataset.value;
                this.input.value = el.dataset.value === this.options[0]?.value ? '' : el.textContent;
                this.input.placeholder = el.textContent;
                this.close();
                // Trigger change event on the original select
                this.select.dispatchEvent(new Event('change'));
            });
        });
    }

    // Refresh options (call after select options change)
    refresh() {
        this.cacheOptions();
        this.input.placeholder = this.select.options[0]?.text || 'Search...';
        this.input.value = '';
    }
}

// Apply SearchableSelect to all filter dropdowns with many options
function initSearchableSelects() {
    const selectors = [
        'filterSupplier', 'filterProject', 'filterEntity', 'filterMaterial', 'filterMaterialCode',
        'gsaFilterSupplier', 'gsaFilterProject', 'gsaFilterEntity', 'gsaFilterMaterial', 'gsaFilterMaterialCode', 'gsaFilterDiscipline',
        'filterMdDiscipline', 'filterMdMaterial', 'filterMdSupplier', 'filterMdEntity', 'filterMdProject'
    ];
    selectors.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.options.length > 10) {
            new SearchableSelect(el);
        }
    });
}

// Initialize searchable selects after data loads
document.addEventListener('DOMContentLoaded', () => {
    // Delay to ensure filters are populated
    setTimeout(initSearchableSelects, 2000);
});

// ============================================
// EXPORT FOR DEBUGGING
// ============================================
window.dashboardData = () => dashboardData;
window.selectedSupplier = () => selectedSupplier;
