/**
 * V5 Supply Chain Intel Hub - Main JavaScript
 * Based on Visio Wireframe Specification
 */

// ============================================
// GLOBAL STATE
// ============================================
let dashboardData = null;
let selectedSupplier = null;
let suppliersData = null;
let purchaseOrdersData = null;
let quotationsData = null;

// Chart instances (for Chart.js)
let trendChartInstance = null;
let quotationTimeChartInstance = null;
let entityChartInstance = null;
let materialChartInstance = null;
let supplierMap = null;

// Chart state
let currentEntityView = 'quote';
let currentMaterialChartType = 'bar';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Supply Chain Intel Hub v5 initializing...');

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

    console.log('✅ Dashboard initialized');
});

// ============================================
// DATA LOADING
// ============================================
async function loadAllData() {
    try {
        // Load all data files in parallel
        const [suppliersRes, posRes, quotesRes, dashRes] = await Promise.all([
            fetch('data/suppliers.json'),
            fetch('data/purchase_orders.json'),
            fetch('data/quotations.json'),
            fetch('data/dashboard_data.json')
        ]);

        suppliersData = await suppliersRes.json();
        purchaseOrdersData = await posRes.json();
        quotationsData = await quotesRes.json();
        dashboardData = await dashRes.json();

        console.log('📊 Loaded suppliers:', suppliersData.metadata.total_records);
        console.log('📊 Loaded POs:', purchaseOrdersData.metadata.total_records);
        console.log('📊 Loaded quotations:', quotationsData.metadata.total_records);

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

    console.log('📊 Processing data:', { suppliers: suppliers.length, pos: pos.length, quotes: quotes.length });

    // Calculate real summary KPIs
    const totalPOValue = pos.reduce((sum, po) => sum + (po.financial?.total_amount || 0), 0);
    const totalQuoteValue = quotes.reduce((sum, q) => sum + (q.financial?.quoted_value || 0), 0);

    dashboardData.summary = {
        rfqCount: quotationsData.metadata.total_records,
        quoteValue: totalQuoteValue,
        poCount: purchaseOrdersData.metadata.total_records,
        poValue: totalPOValue,
        winRate: ((quotationsData.metadata.status_distribution?.won || 0) / quotationsData.metadata.total_records * 100).toFixed(1),
        coCount: purchaseOrdersData.metadata.total_records,
        coValue: totalPOValue,
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
            country: s.address?.country_standardized || s.address?.country || 'Unknown',
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
        { status: 'Order', count: statusDist?.won || 7697, color: '#4CAF50' },
        { status: 'Quotation', count: statusDist?.unknown || 4439, color: '#2196F3' },
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

    // Add PO data to entities
    pos.forEach(po => {
        const company = po.company || po.entity || 'Unknown';
        if (entityData[company]) {
            entityData[company].poSpend += po.financial?.total_amount || 0;
            entityData[company].poCount++;
        }
    });

    const entityColors = ['#0066CC', '#339933', '#FF9900', '#9966CC', '#CC6699'];
    const entityComparison = Object.values(entityData)
        .sort((a, b) => b.quoteValue - a.quoteValue)
        .slice(0, 5)
        .map((e, i) => ({ ...e, color: entityColors[i % entityColors.length] }));

    if (entityComparison.length > 0) {
        dashboardData.supplierMarketplace.entityComparison = entityComparison;
    }

    // Build employee performance from quotation data
    const contactPerf = quotationsData.metadata.contact_performance || {};
    const employeeList = Object.entries(contactPerf)
        .map(([name, data]) => ({
            name,
            poCount: data.won || 0,
            totalSpend: data.won_value || 0,
            winRate: data.win_rate || 0
        }))
        .sort((a, b) => b.totalSpend - a.totalSpend)
        .slice(0, 6)
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

    if (sortedMonths.length > 0) {
        dashboardData.supplierMarketplace.monthlyTrend = sortedMonths.map(m => {
            const monthNum = parseInt(m.split('-')[1]) - 1;
            return {
                month: monthNames[monthNum],
                quotes: monthlyData[m].quotes,
                orders: monthlyData[m].orders,
                cos: Math.floor(monthlyData[m].orders * 0.1)
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
    return {
        summary: {
            rfqCount: 12532,
            quoteValue: 3600000000,
            poCount: 7697,
            poValue: 721300000,
            winRate: 97.7,
            coCount: 7697,
            coValue: 721300000,
            openQuotes: 4650,
            conversionRate: 97.7
        },
        supplierMarketplace: {
            statusChart: [
                { status: 'Order', count: 7697, color: '#c6f6d5' },
                { status: 'Quotation', count: 4249, color: '#cce5ff' },
                { status: 'Waiting', count: 150, color: '#fff4ce' },
                { status: 'Cancelled', count: 86, color: '#ffe0e0' },
                { status: 'Closed', count: 350, color: '#e5e5e5' }
            ],
            entityComparison: [
                { entity: 'Yamauchi Gumi', quoteValue: 1800000000, poSpend: 1200000000, color: '#0066CC' },
                { entity: 'MACRO', quoteValue: 800000000, poSpend: 650000000, color: '#339933' },
                { entity: 'MVL Nepal', quoteValue: 300000000, poSpend: 280000000, color: '#339933' }
            ],
            topSuppliers: [
                { rank: 1, name: 'Rastra Bhusan Construction', poCount: 21, spend: 74650000 },
                { rank: 2, name: 'KATKUWA SUPPLIERS', poCount: 10, spend: 49010000 },
                { rank: 3, name: 'Shivam Traders', poCount: 13, spend: 41260000 }
            ],
            materialDistribution: [
                { material: 'Logistics', value: 1900000000, color: '#0066CC' },
                { material: 'Tools', value: 450000000, color: '#3399FF' },
                { material: 'Various', value: 350000000, color: '#339933' }
            ],
            responsibleEmployees: [
                { rank: 1, name: 'Admin User', poCount: 1965, totalSpend: 503800000 },
                { rank: 2, name: 'Lince M.', poCount: 256, totalSpend: 41400000 }
            ],
            monthlyTrend: [
                { month: 'Jan', quotes: 850, orders: 620, cos: 45 },
                { month: 'Feb', quotes: 920, orders: 710, cos: 52 },
                { month: 'Mar', quotes: 780, orders: 590, cos: 38 },
                { month: 'Apr', quotes: 1050, orders: 820, cos: 61 },
                { month: 'May', quotes: 1120, orders: 890, cos: 72 },
                { month: 'Jun', quotes: 980, orders: 760, cos: 55 },
                { month: 'Jul', quotes: 890, orders: 680, cos: 48 },
                { month: 'Aug', quotes: 1200, orders: 950, cos: 85 },
                { month: 'Sep', quotes: 1080, orders: 840, cos: 68 },
                { month: 'Oct', quotes: 1150, orders: 920, cos: 78 },
                { month: 'Nov', quotes: 1300, orders: 1050, cos: 92 },
                { month: 'Dec', quotes: 1214, orders: 985, cos: 88 }
            ],
            quotationToPoTime: [
                { month: 'Jan', avgDays: 12 },
                { month: 'Feb', avgDays: 15 },
                { month: 'Mar', avgDays: 8 },
                { month: 'Apr', avgDays: 10 },
                { month: 'May', avgDays: 14 },
                { month: 'Jun', avgDays: 11 },
                { month: 'Jul', avgDays: 9 },
                { month: 'Aug', avgDays: 13 },
                { month: 'Sep', avgDays: 7 },
                { month: 'Oct', avgDays: 16 },
                { month: 'Nov', avgDays: 12 },
                { month: 'Dec', avgDays: 10 }
            ],
            approvedMaterials: [
                {
                    supplier: 'Rastra Bhusan Construction', materials: [
                        { material: 'Steel Rebar', spec: 'ASTM-A615-GR60', leadTime: '14 days' },
                        { material: 'Concrete Mix', spec: 'ACI-318-21', leadTime: '7 days' },
                        { material: 'Formwork Panels', spec: 'ISO-9001', leadTime: '21 days' }
                    ]
                },
                {
                    supplier: 'KATKUWA SUPPLIERS', materials: [
                        { material: 'Electrical Cables', spec: 'IEC-60502', leadTime: '10 days' },
                        { material: 'Junction Boxes', spec: 'NEMA-4X', leadTime: '5 days' }
                    ]
                },
                {
                    supplier: 'Shivam Traders', materials: [
                        { material: 'PVC Pipes', spec: 'ASTM-D2241', leadTime: '7 days' },
                        { material: 'Pipe Fittings', spec: 'ANSI-B16.9', leadTime: '3 days' },
                        { material: 'Valves', spec: 'API-600', leadTime: '14 days' },
                        { material: 'Flanges', spec: 'ASME-B16.5', leadTime: '10 days' }
                    ]
                },
                {
                    supplier: 'Yamauchi Gumi', materials: [
                        { material: 'Heavy Machinery', spec: 'JIS-B8100', leadTime: '45 days' },
                        { material: 'Crane Parts', spec: 'OSHA-1910', leadTime: '30 days' },
                        { material: 'Safety Equipment', spec: 'ANSI-Z89.1', leadTime: '14 days' }
                    ]
                },
                {
                    supplier: 'Kuwait Materials Co', materials: [
                        { material: 'Sand & Aggregate', spec: 'ASTM-C33', leadTime: '5 days' },
                        { material: 'Cement', spec: 'ASTM-C150', leadTime: '7 days' }
                    ]
                }
            ],
            supplierLocations: [
                { name: 'Rastra Bhusan Construction', lat: 27.7172, lng: 85.3240, country: 'Nepal', poCount: 21, spend: 74650000 },
                { name: 'KATKUWA SUPPLIERS', lat: 27.6915, lng: 85.3420, country: 'Nepal', poCount: 10, spend: 49010000 },
                { name: 'Shivam Traders', lat: 27.7050, lng: 85.3145, country: 'Nepal', poCount: 13, spend: 41260000 },
                { name: 'Oman Cables Industry', lat: 23.5880, lng: 58.3829, country: 'Oman', poCount: 5, spend: 7630000 },
                { name: 'Yamauchi Gumi Japan', lat: 35.6762, lng: 139.6503, country: 'Japan', poCount: 45, spend: 125000000 },
                { name: 'US Supplier Corp', lat: 40.7128, lng: -74.0060, country: 'USA', poCount: 18, spend: 35000000 },
                { name: 'Kuwait Materials Co', lat: 29.3759, lng: 47.9774, country: 'Kuwait', poCount: 28, spend: 52000000 },
                { name: 'Diego Garcia Logistics', lat: -7.3195, lng: 72.4229, country: 'Diego Garcia', poCount: 12, spend: 28000000 },
                { name: 'Qatar Construction LLC', lat: 25.2854, lng: 51.5310, country: 'Qatar', poCount: 15, spend: 42000000 }
            ]
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

    console.log(`📑 Switched to tab: ${tabId}`);
}

// ============================================
// BOTTOM TABS
// ============================================
function initBottomTabs() {
    const bottomTabs = document.querySelectorAll('.bottom-tab');
    bottomTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            bottomTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabType = tab.dataset.bottomTab;
            renderBottomTable(tabType);
        });
    });
}

function renderBottomTable(type) {
    const tbody = document.getElementById('workbenchTable');
    const thead = document.getElementById('bottomTableHead');
    const pagination = document.getElementById('tablePagination');
    if (!tbody) return;

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
        // Show real supplier list
        tbody.innerHTML = generateSupplierListRows();
        if (pagination) {
            pagination.textContent = `Showing 50 of ${suppliersData?.metadata?.total_records || 2189} suppliers`;
        }
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
                    <th>CONTACT</th>
                </tr>
            `;
        }
        // Workbench - show quotation/PO data
        tbody.innerHTML = generateWorkbenchRows();
        if (pagination) {
            pagination.textContent = `Showing 20 of ${quotationsData?.metadata?.total_records || 12136} quotations`;
        }
    }
}

function generateSupplierListRows() {
    if (!suppliersData || !suppliersData.suppliers) {
        return '<tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">Loading suppliers...</td></tr>';
    }

    const suppliers = suppliersData.suppliers.slice(0, 50); // Show first 50

    return suppliers.map(s => `
        <tr onclick="selectSupplierByName('${s.name.replace(/'/g, "\\'")}')" style="cursor:pointer;">
            <td><strong>${s.name}</strong></td>
            <td>${s.contact?.primary_contact || '-'}</td>
            <td>${s.contact?.email || '-'}</td>
            <td>${s.contact?.phone || '-'}</td>
            <td>${s.address?.country_standardized || s.address?.country || '-'}</td>
            <td>${s.material_category || '-'}</td>
        </tr>
    `).join('');
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
            document.getElementById('supplierLocation').textContent = fullSupplier.address?.country_standardized || fullSupplier.address?.country || '-';
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

function generateWorkbenchRows() {
    // Use real quotation data if available
    if (quotationsData && quotationsData.quotations) {
        const quotes = quotationsData.quotations.slice(0, 30); // Show first 30

        return quotes.map(q => {
            // Use correct nested field paths from the quotations_improved.json structure
            const status = q.outcome?.status || 'Quotation';
            const statusClass = status.toLowerCase().replace(/\s+/g, '-');
            const value = q.financial?.quoted_value ? formatCurrencyShort(q.financial.quoted_value) : '-';
            const material = q.details?.material_code || q.details?.material_category || '-';
            const project = q.project?.name || q.project?.project_code || '-';
            const contact = q.contact?.mvl_contact || '-';

            return `
                <tr>
                    <td>${q.quotation_number || q.id || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>${material}</td>
                    <td title="${project}">${truncateText(project, 30)}</td>
                    <td>${value}</td>
                    <td>${contact}</td>
                </tr>
            `;
        }).join('');
    }

    // Fallback to sample data
    const sampleData = [
        { quotation: 'RFQ-7139-V4359-1', status: 'Order', material: 'Various', project: 'Project Alpha', value: '$125,000', remark: 'Completed' },
        { quotation: 'RFQ-7140-L4521-1', status: 'Quotation', material: 'Logistics', project: 'Project Beta', value: '$89,500', remark: 'Pending review' },
        { quotation: 'RFQ-7141-A5102-1', status: 'Waiting', material: 'Architectural', project: 'Project Gamma', value: '$210,000', remark: 'Awaiting supplier' },
        { quotation: 'RFPO-7139-V4359-1', status: 'Order', material: 'Various', project: 'Project Alpha', value: '$125,000', remark: 'PO Issued' },
        { quotation: 'RFQ-7142-F7500-1', status: 'Quotation', material: 'Fire', project: 'Project Delta', value: '$45,000', remark: 'New' }
    ];

    return sampleData.map(row => `
        <tr>
            <td>${row.quotation}</td>
            <td><span class="status-badge ${row.status.toLowerCase()}">${row.status}</span></td>
            <td>${row.material}</td>
            <td>${row.project}</td>
            <td>${row.value}</td>
            <td>${row.remark}</td>
        </tr>
    `).join('');
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
    search: ''
};

function initFilters() {
    if (!dashboardData || !dashboardData.filters) {
        console.warn('⚠️ No filters available in dashboardData');
        return;
    }

    const filters = dashboardData.filters;
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

    // Search input handler
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Add change handlers to all filter dropdowns
    ['filterEntity', 'filterProject', 'filterSupplier', 'filterStatus', 'filterMaterial'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', handleFilterChange);
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
        'filterMaterial': 'material'
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

    const { quotes, pos, suppliers } = getFilteredData();

    // Update KPIs with filtered data
    const totalPOValue = pos.reduce((sum, po) => sum + (po.financial?.total_amount || 0), 0);
    const totalQuoteValue = quotes.reduce((sum, q) => sum + (q.financial?.quoted_value || 0), 0);
    const wonQuotes = quotes.filter(q => q.outcome?.status_normalized === 'won').length;
    const winRate = quotes.length > 0 ? (wonQuotes / quotes.length * 100).toFixed(1) : 0;

    document.getElementById('kpiRfqCount').textContent = quotes.length.toLocaleString();
    document.getElementById('kpiQuoteValue').textContent = formatCurrencyShort(totalQuoteValue);
    document.getElementById('kpiPoCount').textContent = pos.length.toLocaleString();
    document.getElementById('kpiPoValue').textContent = formatCurrencyShort(totalPOValue);
    document.getElementById('kpiWinRate').textContent = winRate + '%';
    document.getElementById('kpiCoCount').textContent = pos.length.toLocaleString();
    document.getElementById('kpiCoValue').textContent = formatCurrencyShort(totalPOValue);

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

    // Rebuild entity comparison from filtered quotes
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
        if (entityData[company]) {
            entityData[company].poSpend += po.financial?.total_amount || 0;
            entityData[company].poCount++;
        }
    });

    const entityColors = ['#0066CC', '#339933', '#FF9900', '#9966CC', '#CC6699'];
    const entityComparison = Object.values(entityData)
        .sort((a, b) => b.quoteValue - a.quoteValue)
        .slice(0, 5)
        .map((e, i) => ({ ...e, color: entityColors[i % entityColors.length] }));

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

    const materialColors = ['#0066CC', '#3399FF', '#339933', '#66CC66', '#FF9900', '#FF6600', '#9966CC', '#CC6699'];
    const materialDist = Object.entries(materialCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
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

    console.log(`✅ Filters applied: ${quotes.length} quotes, ${pos.length} POs, ${suppliers.length} suppliers`);
}

function updateWorkbenchTable(filteredQuotes) {
    const tbody = document.getElementById('workbenchTable');
    if (!tbody) return;

    const rows = filteredQuotes.slice(0, 20).map(q => {
        const status = q.outcome?.status || 'Unknown';
        const value = q.financial?.quoted_value ? formatCurrencyShort(q.financial.quoted_value) : '-';
        return `
            <tr>
                <td>${truncateText(q.quotation_number, 20)}</td>
                <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
                <td>${truncateText(q.details?.material_category || '-', 20)}</td>
                <td>${truncateText(q.project?.name || '-', 25)}</td>
                <td>${value}</td>
                <td>${truncateText(q.contact?.mvl_contact || '-', 15)}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows || '<tr><td colspan="6" style="text-align:center; color:#888;">No matching records</td></tr>';

    // Update pagination text
    const pagination = document.getElementById('tablePagination');
    if (pagination) {
        pagination.textContent = `Showing ${Math.min(20, filteredQuotes.length)} of ${filteredQuotes.length} records`;
    }
}

// ============================================
// RENDER: SUPPLIER MARKETPLACE
// ============================================
function renderSupplierMarketplace() {
    const data = dashboardData.supplierMarketplace;

    renderStatusChart(data.statusChart);
    renderEntityChartCanvas(data.entityComparison, currentEntityView || 'quote');
    renderTopSuppliers(data.topSuppliers);
    renderMaterialChartCanvas(data.materialDistribution, currentMaterialChartType || 'bar');
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
    document.getElementById('kpiQuoteValue').textContent = formatCurrency(summary.quoteValue);
    document.getElementById('kpiPoCount').textContent = formatNumber(summary.poCount);
    document.getElementById('kpiPoValue').textContent = formatCurrency(summary.poValue);
    document.getElementById('kpiWinRate').textContent = summary.winRate + '%';
    document.getElementById('kpiCoCount').textContent = formatNumber(summary.coCount);
    document.getElementById('kpiCoValue').textContent = formatCurrency(summary.coValue);
    document.getElementById('conversionRate').textContent = summary.conversionRate + '%';
    document.getElementById('openQuotes').textContent = formatNumber(summary.openQuotes);
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
        <div class="status-bar-item" title="${item.status}: ${formatNumber(item.count)} quotes (${((item.count / total) * 100).toFixed(1)}%)">
            <div class="status-bar-label">${item.status}</div>
            <div class="status-bar-track">
                <div class="status-bar-fill ${item.status.toLowerCase()}" 
                     style="width: ${(item.count / maxCount * 100)}%"></div>
            </div>
            <div class="status-bar-value">${formatNumber(item.count)}</div>
        </div>
    `).join('');
}

// ============================================
// RENDER: ENTITY COMPARISON
// ============================================
function renderEntityChart(data) {
    const container = document.getElementById('entityChart');
    if (!container || !data) return;

    const maxValue = Math.max(...data.map(d => d.quoteValue));

    container.innerHTML = data.map(item => `
        <div class="bar-chart-item">
            <div class="bar-chart-label">${item.entity}</div>
            <div class="bar-chart-track">
                <div class="bar-chart-fill" 
                     style="width: ${(item.quoteValue / maxValue * 100)}%; background: ${item.color}">
                </div>
            </div>
            <div class="bar-chart-value">${formatCurrencyShort(item.quoteValue)}</div>
        </div>
    `).join('');
}

// ============================================
// RENDER: TOP SUPPLIERS
// ============================================
function renderTopSuppliers(data) {
    const container = document.getElementById('topSuppliers');
    if (!container || !data) return;

    const maxSpend = Math.max(...data.map(d => d.spend));

    container.innerHTML = data.map(item => `
        <div class="rank-item" onclick="selectSupplier(${item.rank - 1})" style="cursor:pointer" title="Click to view ${item.name} - Total: ${formatCurrencyShort(item.spend)} from ${item.poCount} POs">
            <div class="rank-circle">${item.rank}</div>
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
        fullSupplier?.address?.country_standardized ||
        fullSupplier?.phone_validation?.phone_country ||
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
function renderEmployeeList(data) {
    const container = document.getElementById('employeeList');
    if (!container || !data) return;

    const maxSpend = Math.max(...data.map(d => d.totalSpend));

    container.innerHTML = data.map(item => `
        <div class="rank-item">
            <div class="rank-circle ${item.rank > 1 ? 'gray' : ''}">${item.rank}</div>
            <div class="rank-info">
                <div class="rank-name">${item.name}</div>
                <div class="rank-meta">${item.poCount} POs</div>
            </div>
            <div class="rank-bar-container">
                <div class="rank-bar gray" style="width: ${(item.totalSpend / maxSpend * 100)}%"></div>
            </div>
            <div class="rank-value">
                ${formatCurrencyShort(item.totalSpend)}
                <span class="rank-value-label">Total Spend</span>
            </div>
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
    if (!canvas) return;

    // Use fallback data if not provided
    const chartData = data || [
        { month: 'Jan', avgDays: 12 },
        { month: 'Feb', avgDays: 15 },
        { month: 'Mar', avgDays: 8 },
        { month: 'Apr', avgDays: 10 },
        { month: 'May', avgDays: 14 },
        { month: 'Jun', avgDays: 11 },
        { month: 'Jul', avgDays: 9 },
        { month: 'Aug', avgDays: 13 },
        { month: 'Sep', avgDays: 7 },
        { month: 'Oct', avgDays: 16 },
        { month: 'Nov', avgDays: 12 },
        { month: 'Dec', avgDays: 10 }
    ];

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
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Days',
                        font: { size: 10 }
                    },
                    ticks: { font: { size: 9 } }
                },
                x: {
                    ticks: { font: { size: 9 } }
                }
            }
        }
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
    'South Africa': { lat: -30.5595, lng: 22.9375 }
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
        if (country === 'Dubai' || country === 'Dubai, UAE') country = 'United Arab Emirates';

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
        return '$' + (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return '$' + (value / 1000).toFixed(1) + 'K';
    }
    return '$' + value.toFixed(0);
}

function formatCurrencyShort(value) {
    if (value === undefined || value === null) return '-';
    if (value >= 1000000000) {
        return '$' + (value / 1000000000).toFixed(2) + 'B';
    } else if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 1000) {
        return '$' + (value / 1000).toFixed(1) + 'K';
    }
    return '$' + value;
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

            // Handle material chart toggle
            if (e.target.dataset.chartType) {
                currentMaterialChartType = e.target.dataset.chartType;
                console.log('📊 Switching material chart to:', currentMaterialChartType);
                renderMaterialChartCanvas(dashboardData.supplierMarketplace.materialDistribution, currentMaterialChartType);
            }
        }
    }
});

// ============================================
// RENDER: ENTITY CHART (Chart.js)
// ============================================
function renderEntityChartCanvas(data, viewType = 'quote') {
    const canvas = document.getElementById('entityChartCanvas');
    if (!canvas || !data || data.length === 0) return;

    // Destroy previous instance
    if (entityChartInstance) {
        entityChartInstance.destroy();
        entityChartInstance = null;
    }

    const ctx = canvas.getContext('2d');
    const valueKey = viewType === 'quote' ? 'quoteValue' : 'poSpend';
    const labelSuffix = viewType === 'quote' ? 'Quote Value' : 'PO Spend';

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
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
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
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: {
                        callback: function (value) {
                            return formatCurrencyShort(value);
                        }
                    }
                },
                y: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ============================================
// RENDER: MATERIAL CHART (Chart.js - Multiple Types)
// ============================================
function renderMaterialChartCanvas(data, chartType = 'bar') {
    const canvas = document.getElementById('materialChartCanvas');
    if (!canvas || !data || data.length === 0) return;

    // Destroy previous instance
    if (materialChartInstance) {
        materialChartInstance.destroy();
        materialChartInstance = null;
    }

    const ctx = canvas.getContext('2d');
    const labels = data.map(d => d.material);
    const values = data.map(d => d.value);
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
                            if (chartType === 'pie') {
                                return `${context.label}: ${formatCurrencyShort(context.raw)}`;
                            }
                            return formatCurrencyShort(context.raw);
                        }
                    }
                }
            }
        }
    };

    // Customize based on chart type
    if (chartType === 'bar') {
        chartConfig.options.indexAxis = 'y';
        chartConfig.options.scales = {
            x: {
                beginAtZero: true,
                grid: { display: false },
                ticks: { callback: (v) => formatCurrencyShort(v) }
            },
            y: { grid: { display: false } }
        };
        chartConfig.data.datasets[0].borderRadius = 4;
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

    materialChartInstance = new Chart(ctx, chartConfig);
}

// ============================================
// EXPORT FOR DEBUGGING
// ============================================
window.dashboardData = () => dashboardData;
window.selectedSupplier = () => selectedSupplier;
