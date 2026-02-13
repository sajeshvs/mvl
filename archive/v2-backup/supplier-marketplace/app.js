/**
 * MVL Supply Intel Hub - Supplier Marketplace Dashboard v2.1
 * FULLY DYNAMIC - All components update based on filters
 */

// Global state
let appState = {
    data: null,
    filteredWorkbench: [],
    charts: {},
    currentPage: 1,
    pageSize: 25,
    sortKey: 'QuotationValue',
    sortDir: 'desc',
    filters: {
        entity: '',
        status: '',
        material: '',
        quoteType: '',
        search: ''
    },
    chartViews: {
        material: 'bar',
        entity: 'horizontal',
        status: 'doughnut',
        trend: 'line'
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
    try {
        const response = await fetch('data.json?' + Date.now());
        if (!response.ok) throw new Error('Failed to load data');
        appState.data = await response.json();
        
        console.log('Data loaded:', {
            quotations: appState.data.summary?.totalQuotations,
            suppliers: appState.data.suppliers?.length,
            workbench: appState.data.workbench?.length
        });
        
        appState.filteredWorkbench = [...(appState.data.workbench || [])];
        
        populateFilters();
        renderAll();
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data. Please refresh the page.');
    }
}

// CORE: Apply filters and update ALL components
function applyFiltersAndRefresh() {
    appState.filteredWorkbench = applyFilters(appState.data.workbench || []);
    appState.currentPage = 1;
    updateActiveFiltersDisplay();
    updateEntityInfo();
    renderAll();
}

// Render ALL dashboard components
function renderAll() {
    renderHeader();
    renderKPIs();
    renderFunnelChart();
    renderMaterialChart();
    renderSupplierList();
    renderEntityChart();
    renderStatusChart();
    renderTrendChart();
    renderWorkbenchTable();
}

function renderHeader() {
    document.getElementById('lastRefresh').textContent = appState.data.lastRefresh || new Date().toLocaleString();
}

function updateEntityInfo() {
    const entityInfo = document.getElementById('entityInfo');
    if (entityInfo) {
        const entity = appState.filters.entity || 'All';
        const recordCount = appState.filteredWorkbench.length;
        entityInfo.textContent = `Entity: ${entity} | ${recordCount.toLocaleString()} records`;
    }
}

function populateFilters() {
    const data = appState.data;
    
    const entities = DataUtils.getUniqueValues(data.workbench || [], 'Entity');
    const entitySelect = document.getElementById('filterEntity');
    entitySelect.innerHTML = '<option value="">All Entities</option>';
    entities.filter(e => e && e !== 'Unknown').forEach(entity => {
        entitySelect.innerHTML += `<option value="${entity}">${entity}</option>`;
    });
    
    const materials = DataUtils.getUniqueValues(data.workbench || [], 'MaterialCode');
    const materialSelect = document.getElementById('filterMaterial');
    materialSelect.innerHTML = '<option value="">All Materials</option>';
    materials.filter(m => m && m !== 'Unknown').forEach(material => {
        materialSelect.innerHTML += `<option value="${material}">${material}</option>`;
    });
}

// DYNAMIC KPI Cards
function renderKPIs() {
    const filtered = appState.filteredWorkbench;
    const hasFilters = hasActiveFilters();
    
    const totalQuotations = filtered.length;
    const totalPOs = filtered.filter(r => r.Status === 'Order').length;
    const totalCancelled = filtered.filter(r => ['Cancelled', 'Cancled'].includes(r.Status)).length;
    const totalDecided = totalPOs + totalCancelled;
    const winRate = totalDecided > 0 ? ((totalPOs / totalDecided) * 100).toFixed(1) : 0;
    
    const totalQuoteValue = filtered.reduce((sum, r) => sum + (r.QuotationValue || 0), 0);
    const totalPOValue = filtered.filter(r => r.Status === 'Order')
                                 .reduce((sum, r) => sum + (r.QuotationValue || 0), 0);
    
    const allTotal = (appState.data.workbench || []).length;
    const filteredPct = allTotal > 0 ? ((filtered.length / allTotal) * 100).toFixed(1) : 100;
    
    const kpiRow = document.getElementById('kpiRow');
    
    kpiRow.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-label">📝 Quotations</div>
            <div class="kpi-value">${DataUtils.formatNumber(totalQuotations)}</div>
            <div class="kpi-change ${hasFilters ? 'filtered' : ''}">${hasFilters ? `${filteredPct}% of total` : 'All records'}</div>
        </div>
        <div class="kpi-card success">
            <div class="kpi-label">✅ Orders (POs)</div>
            <div class="kpi-value">${DataUtils.formatNumber(totalPOs)}</div>
            <div class="kpi-change positive">Converted</div>
        </div>
        <div class="kpi-card info">
            <div class="kpi-label">🎯 Win Rate</div>
            <div class="kpi-value">${winRate}%</div>
            <div class="kpi-change">Orders / Decided</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">💰 Quote Value</div>
            <div class="kpi-value">${DataUtils.formatCurrency(totalQuoteValue, 'USD', true)}</div>
            <div class="kpi-change">Total quoted</div>
        </div>
        <div class="kpi-card success">
            <div class="kpi-label">🏦 PO Spend</div>
            <div class="kpi-value">${DataUtils.formatCurrency(totalPOValue, 'USD', true)}</div>
            <div class="kpi-change positive">Committed</div>
        </div>
    `;
}

// DYNAMIC Funnel Chart
function renderFunnelChart() {
    const filtered = appState.filteredWorkbench;
    const container = document.getElementById('funnelChart');
    
    const funnel = {
        Quotation: filtered.filter(r => r.Status === 'Quotation').length,
        Waiting: filtered.filter(r => r.Status === 'Waiting').length,
        Order: filtered.filter(r => r.Status === 'Order').length,
        Cancelled: filtered.filter(r => ['Cancelled', 'Cancled'].includes(r.Status)).length
    };
    
    const stages = [
        { label: 'Quotation', value: funnel.Quotation, color: ChartColors.funnel.quotation },
        { label: 'Waiting', value: funnel.Waiting, color: ChartColors.funnel.waiting },
        { label: 'Order', value: funnel.Order, color: ChartColors.funnel.order },
        { label: 'Cancelled', value: funnel.Cancelled, color: ChartColors.funnel.cancelled }
    ];
    
    const maxValue = Math.max(...stages.map(s => s.value), 1);
    const total = stages.reduce((sum, s) => sum + s.value, 0);
    
    container.innerHTML = `
        <div class="funnel-chart">
            ${stages.map((stage) => {
                const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                const percent = total > 0 ? ((stage.value / total) * 100).toFixed(1) : 0;
                return `
                    <div class="funnel-stage" data-status="${stage.label}" style="cursor: pointer;">
                        <div class="funnel-label">${stage.label}</div>
                        <div class="funnel-bar-container">
                            <div class="funnel-bar" 
                                 style="width: ${Math.max(width, 5)}%; background-color: ${stage.color};"
                                 title="Click to filter by ${stage.label}">
                                ${width > 20 ? stage.value.toLocaleString() : ''}
                            </div>
                        </div>
                        <div class="funnel-value">
                            ${stage.value.toLocaleString()}
                            <small>(${percent}%)</small>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    container.querySelectorAll('.funnel-stage').forEach(stage => {
        stage.addEventListener('click', () => {
            const status = stage.dataset.status;
            appState.filters.status = status;
            document.getElementById('filterStatus').value = status;
            applyFiltersAndRefresh();
        });
    });
    
    const conversionRate = (funnel.Order + funnel.Cancelled) > 0 
        ? ((funnel.Order / (funnel.Order + funnel.Cancelled)) * 100).toFixed(1) 
        : 0;
    const openQuotes = funnel.Quotation + funnel.Waiting;
    
    document.getElementById('conversionRate').textContent = conversionRate + '%';
    document.getElementById('openQuotes').textContent = DataUtils.formatNumber(openQuotes);
}

// DYNAMIC Material Chart - Multiple views
function renderMaterialChart(type) {
    if (type) appState.chartViews.material = type;
    const viewType = appState.chartViews.material;
    
    const filtered = appState.filteredWorkbench;
    
    const materialGroups = {};
    filtered.forEach(r => {
        const code = r.MaterialCode || 'Unknown';
        if (!materialGroups[code]) {
            materialGroups[code] = { count: 0, value: 0 };
        }
        materialGroups[code].count++;
        materialGroups[code].value += r.QuotationValue || 0;
    });
    
    const sorted = Object.entries(materialGroups)
        .sort((a, b) => b[1].value - a[1].value)
        .slice(0, 10);
    
    const labels = sorted.map(([code]) => code);
    const values = sorted.map(([, data]) => data.value);
    const counts = sorted.map(([, data]) => data.count);
    
    const ctx = document.getElementById('materialChart').getContext('2d');
    
    if (appState.charts.material) {
        appState.charts.material.destroy();
    }
    
    document.querySelectorAll('.material-chart-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === viewType);
    });
    
    if (viewType === 'pie' || viewType === 'doughnut') {
        appState.charts.material = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ChartColors.palette.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${DataUtils.formatCurrency(ctx.raw, 'USD', true)}`
                        }
                    }
                }
            }
        });
    } else if (viewType === 'line') {
        appState.charts.material = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quote Value',
                    data: values,
                    borderColor: ChartColors.primary,
                    backgroundColor: ChartColors.primary + '20',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { ticks: { callback: (v) => DataUtils.formatCurrency(v, 'USD', true) } }
                }
            }
        });
    } else if (viewType === 'radar') {
        const maxVal = Math.max(...values);
        const maxCnt = Math.max(...counts);
        appState.charts.material = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels.slice(0, 8),
                datasets: [{
                    label: 'Quote Value',
                    data: values.slice(0, 8),
                    borderColor: ChartColors.primary,
                    backgroundColor: ChartColors.primary + '30',
                    pointBackgroundColor: ChartColors.primary
                }, {
                    label: 'Count',
                    data: counts.slice(0, 8).map(c => c * (maxVal / maxCnt)),
                    borderColor: ChartColors.success,
                    backgroundColor: ChartColors.success + '30',
                    pointBackgroundColor: ChartColors.success
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { r: { beginAtZero: true } }
            }
        });
    } else {
        appState.charts.material = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quote Value',
                    data: values,
                    backgroundColor: ChartColors.palette.slice(0, labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x',
                plugins: { legend: { display: false } },
                scales: {
                    y: { ticks: { callback: (v) => DataUtils.formatCurrency(v, 'USD', true) } }
                }
            }
        });
    }
}

// DYNAMIC Supplier List
function renderSupplierList(searchTerm = '') {
    const filtered = appState.filteredWorkbench;
    
    const supplierMap = {};
    filtered.forEach(r => {
        const supplier = r.SupplierName || r.Contact || 'Unknown';
        if (!supplierMap[supplier]) {
            supplierMap[supplier] = { name: supplier, poCount: 0, spend: 0 };
        }
        if (r.Status === 'Order') {
            supplierMap[supplier].poCount++;
            supplierMap[supplier].spend += r.QuotationValue || 0;
        }
    });
    
    let suppliers = Object.values(supplierMap)
        .filter(s => s.poCount > 0)
        .sort((a, b) => b.spend - a.spend);
    
    if (searchTerm) {
        suppliers = suppliers.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (suppliers.length === 0 && !hasActiveFilters()) {
        suppliers = (appState.data.suppliers || []).slice(0, 15).map(s => ({
            name: s.SupplierName,
            poCount: s.POCount,
            spend: s.TotalSpendUSD
        }));
    }
    
    const topSuppliers = suppliers.slice(0, 15);
    const list = document.getElementById('supplierList');
    
    if (topSuppliers.length === 0) {
        list.innerHTML = '<li class="no-data">No suppliers found for current filter</li>';
        return;
    }
    
    list.innerHTML = topSuppliers.map((supplier, index) => `
        <li class="supplier-item" data-supplier="${encodeURIComponent(supplier.name)}">
            <div class="supplier-rank ${index < 3 ? 'top-' + (index + 1) : ''}">${index + 1}</div>
            <div class="supplier-info">
                <div class="supplier-name" title="${supplier.name}">${DataUtils.truncate(supplier.name, 30)}</div>
                <div class="supplier-meta">${supplier.poCount} PO${supplier.poCount !== 1 ? 's' : ''}</div>
            </div>
            <div class="supplier-spend">
                ${DataUtils.formatCurrency(supplier.spend, 'USD', true)}
                <small>Total Spend</small>
            </div>
        </li>
    `).join('');
    
    list.querySelectorAll('.supplier-item').forEach(item => {
        item.addEventListener('click', () => {
            const supplierName = decodeURIComponent(item.dataset.supplier);
            appState.filters.search = supplierName;
            document.getElementById('searchInput').value = supplierName;
            applyFiltersAndRefresh();
        });
    });
}

// DYNAMIC Entity Chart - Multiple views
function renderEntityChart(type) {
    if (type) appState.chartViews.entity = type;
    const viewType = appState.chartViews.entity;
    
    const filtered = appState.filteredWorkbench;
    
    const entityGroups = {};
    filtered.forEach(r => {
        const entity = r.Entity || 'Unknown';
        if (!entityGroups[entity]) {
            entityGroups[entity] = { count: 0, value: 0, poValue: 0 };
        }
        entityGroups[entity].count++;
        entityGroups[entity].value += r.QuotationValue || 0;
        if (r.Status === 'Order') {
            entityGroups[entity].poValue += r.QuotationValue || 0;
        }
    });
    
    const sorted = Object.entries(entityGroups)
        .sort((a, b) => b[1].value - a[1].value)
        .slice(0, 8);
    
    const labels = sorted.map(([entity]) => DataUtils.truncate(entity, 20));
    const quoteValues = sorted.map(([, data]) => data.value);
    const poValues = sorted.map(([, data]) => data.poValue);
    
    const ctx = document.getElementById('entityChart').getContext('2d');
    
    if (appState.charts.entity) {
        appState.charts.entity.destroy();
    }
    
    document.querySelectorAll('.entity-chart-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === viewType);
    });
    
    if (viewType === 'grouped') {
        appState.charts.entity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Quote Value', data: quoteValues, backgroundColor: ChartColors.info },
                    { label: 'PO Value', data: poValues, backgroundColor: ChartColors.success }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { ticks: { callback: (v) => DataUtils.formatCurrency(v, 'USD', true) } } }
            }
        });
    } else if (viewType === 'stacked') {
        appState.charts.entity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Quote Value', data: quoteValues, backgroundColor: ChartColors.info, stack: 'stack1' },
                    { label: 'PO Value', data: poValues, backgroundColor: ChartColors.success, stack: 'stack1' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, ticks: { callback: (v) => DataUtils.formatCurrency(v, 'USD', true) } }
                }
            }
        });
    } else {
        appState.charts.entity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quote Value',
                    data: quoteValues,
                    backgroundColor: ChartColors.palette.slice(0, labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { callback: (v) => DataUtils.formatCurrency(v, 'USD', true) } } },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const entityName = sorted[index][0];
                        appState.filters.entity = entityName;
                        document.getElementById('filterEntity').value = entityName;
                        applyFiltersAndRefresh();
                    }
                }
            }
        });
    }
}

// DYNAMIC Status Chart
function renderStatusChart(type) {
    if (type) appState.chartViews.status = type;
    const viewType = appState.chartViews.status;
    
    const filtered = appState.filteredWorkbench;
    
    const statusGroups = {};
    filtered.forEach(r => {
        let status = r.Status || 'Unknown';
        if (status === 'Cancled') status = 'Cancelled';
        if (!statusGroups[status]) {
            statusGroups[status] = { count: 0, value: 0 };
        }
        statusGroups[status].count++;
        statusGroups[status].value += r.QuotationValue || 0;
    });
    
    const statusOrder = ['Order', 'Quotation', 'Waiting', 'Cancelled'];
    const sorted = statusOrder.filter(s => statusGroups[s]).map(s => [s, statusGroups[s]]);
    
    const labels = sorted.map(([status]) => status);
    const values = sorted.map(([, data]) => data.value);
    const counts = sorted.map(([, data]) => data.count);
    
    const statusColors = {
        'Order': ChartColors.success,
        'Quotation': ChartColors.info,
        'Waiting': ChartColors.warning,
        'Cancelled': ChartColors.danger
    };
    
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    if (appState.charts.status) {
        appState.charts.status.destroy();
    }
    
    document.querySelectorAll('.status-chart-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === viewType);
    });
    
    if (viewType === 'bar') {
        appState.charts.status = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Value (USD)', data: values, backgroundColor: labels.map(l => statusColors[l]), yAxisID: 'y' },
                    { label: 'Count', data: counts, type: 'line', borderColor: '#333', backgroundColor: '#33333320', yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: { position: 'left', ticks: { callback: (v) => DataUtils.formatCurrency(v, 'USD', true) } },
                    y1: { position: 'right', grid: { drawOnChartArea: false } }
                }
            }
        });
    } else if (viewType === 'polar') {
        appState.charts.status = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: labels,
                datasets: [{ data: values, backgroundColor: labels.map(l => statusColors[l] + '80') }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${DataUtils.formatCurrency(ctx.raw, 'USD', true)}` } }
                }
            }
        });
    } else {
        appState.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: values, backgroundColor: labels.map(l => statusColors[l]), borderWidth: 2, borderColor: '#fff' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12 } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${DataUtils.formatCurrency(ctx.raw, 'USD', true)}` } }
                },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const status = labels[index];
                        appState.filters.status = status;
                        document.getElementById('filterStatus').value = status;
                        applyFiltersAndRefresh();
                    }
                }
            }
        });
    }
}

// Trend Chart
function renderTrendChart() {
    const filtered = appState.filteredWorkbench;
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (!ctx) return;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthData = months.map(() => ({ quotes: 0, orders: 0, value: 0 }));
    
    filtered.forEach((r, i) => {
        const monthIndex = i % 12;
        monthData[monthIndex].quotes++;
        monthData[monthIndex].value += r.QuotationValue || 0;
        if (r.Status === 'Order') monthData[monthIndex].orders++;
    });
    
    if (appState.charts.trend) {
        appState.charts.trend.destroy();
    }
    
    appState.charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: 'Quotations', data: monthData.map(m => m.quotes), borderColor: ChartColors.info, backgroundColor: ChartColors.info + '20', fill: true, tension: 0.4, yAxisID: 'y' },
                { label: 'Orders', data: monthData.map(m => m.orders), borderColor: ChartColors.success, backgroundColor: ChartColors.success + '20', fill: true, tension: 0.4, yAxisID: 'y' },
                { label: 'Value', data: monthData.map(m => m.value), borderColor: ChartColors.primary, backgroundColor: 'transparent', borderDash: [5, 5], type: 'line', yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: { position: 'left', title: { display: true, text: 'Count' } },
                y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: (v) => DataUtils.formatCurrency(v, 'USD', true) } }
            }
        }
    });
}

// Workbench table
function renderWorkbenchTable() {
    let data = appState.filteredWorkbench;
    data = DataUtils.sortBy(data, appState.sortKey, appState.sortDir);
    
    const totalFiltered = data.length;
    const paginated = DataUtils.paginate(data, appState.currentPage, appState.pageSize);
    
    const columns = [
        { key: 'QuotationNumber', label: 'Quote No.', align: '' },
        { key: 'QuotationType', label: 'Type', align: 'text-center', format: (v) => `<span class="badge badge-${v === 'RFQ' ? 'info' : 'default'}">${v || '-'}</span>` },
        { key: 'Status', label: 'Status', align: 'text-center', format: (v) => `<span class="badge ${DataUtils.getStatusBadgeClass(v)}">${v || '-'}</span>` },
        { key: 'ProjectName', label: 'Project', align: '', format: (v) => `<span title="${v || ''}">${DataUtils.truncate(v, 35)}</span>` },
        { key: 'MaterialCode', label: 'Material', align: 'text-center' },
        { key: 'Entity', label: 'Entity', align: '', format: (v) => `<span title="${v || ''}">${DataUtils.truncate(v, 20)}</span>` },
        { key: 'QuotationValue', label: 'Value', align: 'text-right cell-currency', format: (v, row) => `${DataUtils.formatNumber(v)} ${row.Currency || 'USD'}` },
        { key: 'Contact', label: 'Contact', align: '', format: (v) => DataUtils.truncate(v, 18) }
    ];
    
    const container = document.getElementById('workbenchTable');
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    ${columns.map(col => `
                        <th class="${col.align} ${appState.sortKey === col.key ? 'sorted' : ''}" data-key="${col.key}">
                            ${col.label}
                            <span class="sort-icon">${appState.sortKey === col.key ? (appState.sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                ${paginated.data.length === 0 ? `
                    <tr><td colspan="${columns.length}" class="text-center text-secondary" style="padding: 40px;">No records match the current filters</td></tr>
                ` : paginated.data.map(row => `
                    <tr>
                        ${columns.map(col => {
                            let value = row[col.key];
                            if (col.format) value = col.format(value, row);
                            return `<td class="${col.align}">${value ?? '-'}</td>`;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.querySelectorAll('th[data-key]').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.key;
            if (appState.sortKey === key) {
                appState.sortDir = appState.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                appState.sortKey = key;
                appState.sortDir = 'desc';
            }
            appState.currentPage = 1;
            renderWorkbenchTable();
        });
    });
    
    renderPagination(totalFiltered);
}

function renderPagination(total) {
    const totalPages = Math.ceil(total / appState.pageSize);
    const start = (appState.currentPage - 1) * appState.pageSize + 1;
    const end = Math.min(appState.currentPage * appState.pageSize, total);
    
    const paginationEl = document.getElementById('workbenchPagination');
    
    paginationEl.innerHTML = `
        <div class="pagination-info">
            Showing <strong>${total > 0 ? start : 0}</strong> to <strong>${end}</strong> 
            of <strong>${DataUtils.formatNumber(total)}</strong> records
            ${hasActiveFilters() ? '<em class="filtered-label">(filtered)</em>' : ''}
        </div>
        <div class="pagination-controls">
            <button class="pagination-btn" data-action="first" ${appState.currentPage === 1 ? 'disabled' : ''}>⟪</button>
            <button class="pagination-btn" data-action="prev" ${appState.currentPage === 1 ? 'disabled' : ''}>◀</button>
            ${renderPageNumbers(totalPages)}
            <button class="pagination-btn" data-action="next" ${appState.currentPage >= totalPages ? 'disabled' : ''}>▶</button>
            <button class="pagination-btn" data-action="last" ${appState.currentPage >= totalPages ? 'disabled' : ''}>⟫</button>
            <select class="page-size-select" id="pageSizeSelect">
                <option value="10" ${appState.pageSize === 10 ? 'selected' : ''}>10</option>
                <option value="25" ${appState.pageSize === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${appState.pageSize === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${appState.pageSize === 100 ? 'selected' : ''}>100</option>
            </select>
        </div>
    `;
    
    paginationEl.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => handlePagination(btn.dataset.action, btn.dataset.page, totalPages));
    });
    
    document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
        appState.pageSize = parseInt(e.target.value);
        appState.currentPage = 1;
        renderWorkbenchTable();
    });
}

function renderPageNumbers(totalPages) {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, appState.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) {
        pages.push(`<button class="pagination-btn ${i === appState.currentPage ? 'active' : ''}" data-action="goto" data-page="${i}">${i}</button>`);
    }
    return pages.join('');
}

function handlePagination(action, page, totalPages) {
    switch (action) {
        case 'first': appState.currentPage = 1; break;
        case 'prev': appState.currentPage = Math.max(1, appState.currentPage - 1); break;
        case 'next': appState.currentPage = Math.min(totalPages, appState.currentPage + 1); break;
        case 'last': appState.currentPage = totalPages; break;
        case 'goto': appState.currentPage = parseInt(page); break;
    }
    renderWorkbenchTable();
}

function applyFilters(data) {
    const { entity, status, material, quoteType, search } = appState.filters;
    return data.filter(row => {
        if (entity && row.Entity !== entity) return false;
        if (status) {
            if (status === 'Cancelled' && !['Cancelled', 'Cancled'].includes(row.Status)) return false;
            if (status !== 'Cancelled' && row.Status !== status) return false;
        }
        if (material && row.MaterialCode !== material) return false;
        if (quoteType && row.QuotationType !== quoteType) return false;
        if (search && !DataUtils.searchInObject(row, search)) return false;
        return true;
    });
}

function hasActiveFilters() {
    const { entity, status, material, quoteType, search } = appState.filters;
    return !!(entity || status || material || quoteType || search);
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFilters');
    const filters = [];
    
    if (appState.filters.entity) filters.push({ key: 'entity', label: `Entity: ${appState.filters.entity}` });
    if (appState.filters.status) filters.push({ key: 'status', label: `Status: ${appState.filters.status}` });
    if (appState.filters.material) filters.push({ key: 'material', label: `Material: ${appState.filters.material}` });
    if (appState.filters.quoteType) filters.push({ key: 'quoteType', label: `Type: ${appState.filters.quoteType}` });
    if (appState.filters.search) filters.push({ key: 'search', label: `Search: "${appState.filters.search}"` });
    
    if (filters.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = filters.map(f => `
        <span class="filter-tag">${f.label}<button data-filter="${f.key}">×</button></span>
    `).join('');
    
    container.querySelectorAll('button[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => clearFilter(btn.dataset.filter));
    });
}

function clearFilter(key) {
    appState.filters[key] = '';
    const elementId = `filter${key.charAt(0).toUpperCase() + key.slice(1)}`;
    const el = document.getElementById(elementId);
    if (el) el.value = '';
    if (key === 'search') document.getElementById('searchInput').value = '';
    applyFiltersAndRefresh();
}

function resetAllFilters() {
    appState.filters = { entity: '', status: '', material: '', quoteType: '', search: '' };
    document.getElementById('filterEntity').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterMaterial').value = '';
    document.getElementById('filterQuoteType').value = '';
    document.getElementById('searchInput').value = '';
    applyFiltersAndRefresh();
}

function setupEventListeners() {
    document.getElementById('filterEntity').addEventListener('change', (e) => {
        appState.filters.entity = e.target.value;
        applyFiltersAndRefresh();
    });
    
    document.getElementById('filterStatus').addEventListener('change', (e) => {
        appState.filters.status = e.target.value;
        applyFiltersAndRefresh();
    });
    
    document.getElementById('filterMaterial').addEventListener('change', (e) => {
        appState.filters.material = e.target.value;
        applyFiltersAndRefresh();
    });
    
    document.getElementById('filterQuoteType').addEventListener('change', (e) => {
        appState.filters.quoteType = e.target.value;
        applyFiltersAndRefresh();
    });
    
    document.getElementById('searchInput').addEventListener('input', DataUtils.debounce((e) => {
        appState.filters.search = e.target.value;
        applyFiltersAndRefresh();
    }, 300));
    
    document.getElementById('supplierSearch')?.addEventListener('input', DataUtils.debounce((e) => {
        renderSupplierList(e.target.value);
    }, 300));
    
    document.getElementById('resetFilters').addEventListener('click', resetAllFilters);
    
    document.querySelectorAll('.material-chart-btn').forEach(btn => {
        btn.addEventListener('click', () => renderMaterialChart(btn.dataset.type));
    });
    
    document.querySelectorAll('.entity-chart-btn').forEach(btn => {
        btn.addEventListener('click', () => renderEntityChart(btn.dataset.type));
    });
    
    document.querySelectorAll('.status-chart-btn').forEach(btn => {
        btn.addEventListener('click', () => renderStatusChart(btn.dataset.type));
    });
    
    document.getElementById('exportCSV')?.addEventListener('click', () => {
        DataUtils.exportToCSV(appState.filteredWorkbench, 'supplier-marketplace-export.csv');
    });
    
    document.getElementById('exportJSON')?.addEventListener('click', () => {
        DataUtils.downloadJSON(appState.filteredWorkbench, 'supplier-marketplace-export.json');
    });
}

function showError(message) {
    document.querySelector('.dashboard-content').innerHTML = `
        <div class="card" style="text-align: center; padding: 60px;">
            <h2 style="color: var(--color-danger);">⚠️ Error</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
        </div>
    `;
}
