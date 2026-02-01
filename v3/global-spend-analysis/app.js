/**
 * Global Spend Analysis Dashboard - app.js v3.0
 * Full dynamic filtering with Chart.js visualizations and Modal Details
 */

// Global state
let rawData = null;
let filteredData = [];
let currentPage = 1;
const PAGE_SIZE = 50;
let sortColumn = 'valueUSD';
let sortDirection = 'desc';
let trendChartType = 'stacked';
let breakdownType = 'entity';

// Chart instances
let trendChart = null;
let breakdownChart = null;

// Filter state
let filters = {
    entity: '',
    supplier: '',
    year: '',
    poType: '',
    material: '',
    currency: '',
    minValue: '',
    maxValue: ''
};

// Color palette
const colors = {
    primary: '#d96f3c',
    primaryLight: '#e8824a',
    base: '#107C10',
    change: '#FFB900',
    chart: [
        '#d96f3c', '#e8824a', '#f5a65b', '#107C10', '#0078D4',
        '#5C2D91', '#D13438', '#00B7C3', '#FFB900', '#8764B8',
        '#038387', '#881798', '#4A154B', '#E74856', '#00CC6A'
    ]
};

// =====================================
// ROW CLICK HANDLERS - Show Detail Modals
// =====================================

function showPODetailsFromRow(po) {
    const poData = {
        poNumber: po.poNumber || po.po_number || 'N/A',
        valueUSD: po.valueUSD || po.value_usd || 0,
        originalValue: po.originalValue || po.valueUSD || 0,
        currency: po.currency || 'USD',
        poType: po.poType || po.po_type || 'Base PO',
        entity: po.entity || 'N/A',
        supplier: po.supplier || po.vendor || 'Unknown',
        poDate: po.poDate || po.date || 'N/A',
        year: po.year || new Date(po.poDate || po.date).getFullYear(),
        materialGroup: po.materialGroup || po.material || 'N/A',
        description: po.description || po.text || ''
    };
    
    if (typeof showPODetails === 'function') {
        showPODetails(poData);
    } else {
        console.log('PO Details:', poData);
        alert('PO: ' + poData.poNumber + '\nSupplier: ' + poData.supplier + '\nValue: ' + formatCurrency(poData.valueUSD));
    }
}

function showSupplierDetailsFromRow(supplierName) {
    if (typeof showSupplierProfile === 'function') {
        showSupplierProfile(supplierName);
    } else {
        alert('Supplier: ' + supplierName);
    }
}

// Format helpers
function formatCurrency(value) {
    if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return '$' + (value / 1e3).toFixed(1) + 'K';
    return '$' + value.toFixed(2);
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Loading Global Spend Analysis data...');
    try {
        const response = await fetch('data.json?' + Date.now());
        rawData = await response.json();
        console.log('Data loaded:', rawData.summary);
        
        initializeFilters();
        applyFiltersAndRefresh();
    } catch (error) {
        console.error('Error loading data:', error);
        document.querySelector('.content').innerHTML = `
            <div class="loading">
                <div style="text-align:center;">
                    <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                    <div style="font-size:18px;color:#D13438;">Failed to load data</div>
                    <div style="font-size:13px;color:#605e5c;margin-top:8px;">${error.message}</div>
                </div>
            </div>
        `;
    }
});

// Initialize filter dropdowns
function initializeFilters() {
    const filterData = rawData.filters;
    
    // Entity filter
    const entitySelect = document.getElementById('filterEntity');
    filterData.entities.forEach(e => {
        entitySelect.add(new Option(e, e));
    });
    
    // Supplier filter (limit to top 100 for performance)
    const supplierSelect = document.getElementById('filterSupplier');
    const topSuppliers = rawData.supplierRankings.top.map(s => s.name);
    topSuppliers.forEach(s => {
        supplierSelect.add(new Option(s.length > 40 ? s.substring(0, 40) + '...' : s, s));
    });
    
    // Year filter
    const yearSelect = document.getElementById('filterYear');
    filterData.years.forEach(y => {
        yearSelect.add(new Option(y, y));
    });
    
    // Material filter
    const materialSelect = document.getElementById('filterMaterial');
    filterData.materials.forEach(m => {
        materialSelect.add(new Option(m, m));
    });
    
    // Currency filter
    const currencySelect = document.getElementById('filterCurrency');
    filterData.currencies.forEach(c => {
        currencySelect.add(new Option(c, c));
    });
    
    // Add event listeners
    document.getElementById('filterEntity').addEventListener('change', e => { filters.entity = e.target.value; applyFiltersAndRefresh(); });
    document.getElementById('filterSupplier').addEventListener('change', e => { filters.supplier = e.target.value; applyFiltersAndRefresh(); });
    document.getElementById('filterYear').addEventListener('change', e => { filters.year = e.target.value; applyFiltersAndRefresh(); });
    document.getElementById('filterPOType').addEventListener('change', e => { filters.poType = e.target.value; applyFiltersAndRefresh(); });
    document.getElementById('filterMaterial').addEventListener('change', e => { filters.material = e.target.value; applyFiltersAndRefresh(); });
    document.getElementById('filterCurrency').addEventListener('change', e => { filters.currency = e.target.value; applyFiltersAndRefresh(); });
    document.getElementById('filterMinValue').addEventListener('change', e => { filters.minValue = e.target.value; applyFiltersAndRefresh(); });
    document.getElementById('filterMaxValue').addEventListener('change', e => { filters.maxValue = e.target.value; applyFiltersAndRefresh(); });
}

// Reset all filters
function resetFilters() {
    filters = { entity: '', supplier: '', year: '', poType: '', material: '', currency: '', minValue: '', maxValue: '' };
    
    document.getElementById('filterEntity').value = '';
    document.getElementById('filterSupplier').value = '';
    document.getElementById('filterYear').value = '';
    document.getElementById('filterPOType').value = '';
    document.getElementById('filterMaterial').value = '';
    document.getElementById('filterCurrency').value = '';
    document.getElementById('filterMinValue').value = '';
    document.getElementById('filterMaxValue').value = '';
    
    applyFiltersAndRefresh();
}

// Apply filters and refresh all components
function applyFiltersAndRefresh() {
    // Filter workbench data
    filteredData = rawData.workbench.filter(po => {
        if (filters.entity && po.entity !== filters.entity) return false;
        if (filters.supplier && po.supplier !== filters.supplier) return false;
        if (filters.year && po.year !== parseInt(filters.year)) return false;
        if (filters.poType && po.poType !== filters.poType) return false;
        if (filters.material && po.material !== filters.material) return false;
        if (filters.currency && po.currency !== filters.currency) return false;
        if (filters.minValue && po.valueUSD < parseFloat(filters.minValue)) return false;
        if (filters.maxValue && po.valueUSD > parseFloat(filters.maxValue)) return false;
        return true;
    });
    
    // Update header subtitle
    updateHeaderSubtitle();
    
    // Render all components
    currentPage = 1;
    renderKPIs();
    renderTrendChart();
    renderBreakdownChart();
    renderPOTable();
    renderSupplierRankings();
}

// Update header subtitle
function updateHeaderSubtitle() {
    const years = [...new Set(filteredData.map(p => p.year))].sort();
    const minYear = years[0] || 2012;
    const maxYear = years[years.length - 1] || 2026;
    const entityText = filters.entity || 'All entities';
    const supplierText = filters.supplier ? filters.supplier.substring(0, 30) + '...' : 'All suppliers';
    
    document.getElementById('headerSubtitle').textContent = 
        `${minYear} – ${maxYear} | ${entityText} | ${supplierText}`;
}

// Render KPIs
function renderKPIs() {
    const totalSpend = filteredData.reduce((sum, p) => sum + p.valueUSD, 0);
    const basePOs = filteredData.filter(p => p.poType === 'Base PO');
    const changeOrders = filteredData.filter(p => p.poType === 'Change Order');
    const suppliers = new Set(filteredData.map(p => p.supplier));
    const avgPO = filteredData.length > 0 ? totalSpend / filteredData.length : 0;
    const changeRatio = filteredData.length > 0 ? (changeOrders.length / filteredData.length * 100) : 0;
    
    document.getElementById('kpiTotalSpendValue').textContent = formatCurrency(totalSpend);
    document.getElementById('kpiTotalSpendSub').textContent = `${formatNumber(filteredData.length)} POs`;
    
    document.getElementById('kpiBasePOValue').textContent = formatNumber(basePOs.length);
    document.getElementById('kpiBasePOSub').textContent = formatCurrency(basePOs.reduce((s, p) => s + p.valueUSD, 0));
    
    document.getElementById('kpiChangeOrderValue').textContent = formatNumber(changeOrders.length);
    document.getElementById('kpiChangeOrderSub').textContent = formatCurrency(changeOrders.reduce((s, p) => s + p.valueUSD, 0));
    
    document.getElementById('kpiSuppliersValue').textContent = formatNumber(suppliers.size);
    document.getElementById('kpiAvgPOValue').textContent = formatCurrency(avgPO);
    document.getElementById('kpiChangeRatioValue').textContent = changeRatio.toFixed(1) + '%';
}

// Render trend chart
function renderTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Aggregate by year
    const yearlyData = {};
    filteredData.forEach(po => {
        if (!yearlyData[po.year]) {
            yearlyData[po.year] = { base: 0, change: 0, total: 0 };
        }
        if (po.poType === 'Base PO') {
            yearlyData[po.year].base += po.valueUSD;
        } else {
            yearlyData[po.year].change += po.valueUSD;
        }
        yearlyData[po.year].total += po.valueUSD;
    });
    
    const years = Object.keys(yearlyData).sort();
    const baseValues = years.map(y => yearlyData[y].base);
    const changeValues = years.map(y => yearlyData[y].change);
    const totalValues = years.map(y => yearlyData[y].total);
    
    // Destroy existing chart
    if (trendChart) {
        trendChart.destroy();
    }
    
    let datasets = [];
    let chartType = 'bar';
    
    if (trendChartType === 'line') {
        chartType = 'line';
        datasets = [{
            label: 'Total Spend',
            data: totalValues,
            borderColor: colors.primary,
            backgroundColor: 'rgba(217, 111, 60, 0.1)',
            fill: true,
            tension: 0.3
        }];
    } else {
        datasets = [
            {
                label: 'Base PO',
                data: baseValues,
                backgroundColor: colors.base,
                stack: trendChartType === 'stacked' ? 'stack1' : undefined
            },
            {
                label: 'Change Order',
                data: changeValues,
                backgroundColor: colors.change,
                stack: trendChartType === 'stacked' ? 'stack1' : undefined
            }
        ];
    }
    
    trendChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    stacked: trendChartType === 'stacked',
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const year = years[elements[0].index];
                    filters.year = year;
                    document.getElementById('filterYear').value = year;
                    applyFiltersAndRefresh();
                }
            }
        }
    });
}

// Render breakdown chart
function renderBreakdownChart() {
    const ctx = document.getElementById('breakdownChart').getContext('2d');
    
    // Destroy existing chart
    if (breakdownChart) {
        breakdownChart.destroy();
    }
    
    let labels = [];
    let values = [];
    
    if (breakdownType === 'entity') {
        // Aggregate by entity
        const entityData = {};
        filteredData.forEach(po => {
            if (!entityData[po.entity]) entityData[po.entity] = 0;
            entityData[po.entity] += po.valueUSD;
        });
        const sorted = Object.entries(entityData).sort((a, b) => b[1] - a[1]).slice(0, 10);
        labels = sorted.map(e => e[0]);
        values = sorted.map(e => e[1]);
    } else if (breakdownType === 'material') {
        // Aggregate by material
        const materialData = {};
        filteredData.forEach(po => {
            const mat = po.material || 'General';
            if (!materialData[mat]) materialData[mat] = 0;
            materialData[mat] += po.valueUSD;
        });
        const sorted = Object.entries(materialData).sort((a, b) => b[1] - a[1]).slice(0, 10);
        labels = sorted.map(e => e[0]);
        values = sorted.map(e => e[1]);
    } else {
        // PO Type breakdown
        const basePOs = filteredData.filter(p => p.poType === 'Base PO');
        const changeOrders = filteredData.filter(p => p.poType === 'Change Order');
        labels = ['Base PO', 'Change Order'];
        values = [
            basePOs.reduce((s, p) => s + p.valueUSD, 0),
            changeOrders.reduce((s, p) => s + p.valueUSD, 0)
        ];
    }
    
    breakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.chart.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((value / total) * 100).toFixed(1);
                            return context.label + ': ' + formatCurrency(value) + ' (' + pct + '%)';
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0 && breakdownType === 'entity') {
                    const entity = labels[elements[0].index];
                    filters.entity = entity;
                    document.getElementById('filterEntity').value = entity;
                    applyFiltersAndRefresh();
                }
            }
        }
    });
}

// Set trend chart type
function setTrendType(type) {
    trendChartType = type;
    document.querySelectorAll('.chart-grid .card:first-child .chart-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    renderTrendChart();
}

// Set breakdown chart type
function setBreakdownType(type) {
    breakdownType = type;
    document.querySelectorAll('.chart-grid .card:last-child .chart-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    renderBreakdownChart();
}

// Render PO table
function renderPOTable() {
    const tbody = document.getElementById('poTableBody');
    
    // Sort data
    const sorted = [...filteredData].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    // Paginate
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageData = sorted.slice(startIdx, endIdx);
    
    // Render rows with click handlers
    tbody.innerHTML = pageData.map((po, idx) => `
        <tr class="clickable-row" data-po-index="${idx}" style="cursor:pointer;" title="Click to view PO details">
            <td><strong>${po.poNumber}</strong></td>
            <td>${po.poDate}</td>
            <td title="${po.supplier}">${po.supplier.length > 25 ? po.supplier.substring(0, 25) + '...' : po.supplier}</td>
            <td>${po.entity}</td>
            <td><span class="${po.poType === 'Base PO' ? 'po-type-base' : 'po-type-change'}">${po.poType}</span></td>
            <td class="${po.valueUSD > 100000 ? 'value-large' : ''}">${formatCurrency(po.valueUSD)}</td>
        </tr>
    `).join('');
    
    // Add click handlers for PO rows
    tbody.querySelectorAll('.clickable-row').forEach((tr, idx) => {
        tr.addEventListener('click', () => {
            const poData = pageData[idx];
            showPODetailsFromRow(poData);
        });
    });
    
    // Update pagination info
    document.getElementById('tableInfo').textContent = `${formatNumber(filteredData.length)} POs | ${formatCurrency(filteredData.reduce((s, p) => s + p.valueUSD, 0))}`;
    document.getElementById('paginationInfo').textContent = 
        `Showing ${startIdx + 1} to ${Math.min(endIdx, filteredData.length)} of ${formatNumber(filteredData.length)}`;
    
    document.getElementById('btnPrev').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = endIdx >= filteredData.length;
}

// Table sorting
function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'desc';
    }
    renderPOTable();
}

// Pagination
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPOTable();
    }
}

function nextPage() {
    const maxPage = Math.ceil(filteredData.length / PAGE_SIZE);
    if (currentPage < maxPage) {
        currentPage++;
        renderPOTable();
    }
}

// Render supplier rankings
function renderSupplierRankings() {
    // Aggregate suppliers from filtered data
    const supplierData = {};
    filteredData.forEach(po => {
        if (!supplierData[po.supplier]) {
            supplierData[po.supplier] = { value: 0, count: 0 };
        }
        supplierData[po.supplier].value += po.valueUSD;
        supplierData[po.supplier].count++;
    });
    
    const sorted = Object.entries(supplierData)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value);
    
    const maxValue = sorted[0]?.value || 1;
    
    // Top 10
    const topContainer = document.getElementById('topSuppliers');
    topContainer.innerHTML = sorted.slice(0, 10).map((s, i) => `
        <div class="ranking-item" onclick="filterBySupplier('${s.name.replace(/'/g, "\\'")}')">
            <div class="ranking-rank">${i + 1}</div>
            <div class="ranking-info">
                <div class="ranking-name" title="${s.name}">${s.name.length > 30 ? s.name.substring(0, 30) + '...' : s.name}</div>
                <div class="ranking-meta">${s.count} POs</div>
                <div class="ranking-bar">
                    <div class="ranking-bar-fill" style="width: ${(s.value / maxValue * 100)}%"></div>
                </div>
            </div>
            <div class="ranking-value">${formatCurrency(s.value)}</div>
        </div>
    `).join('');
    
    // Bottom 10 (active only)
    const active = sorted.filter(s => s.value > 0);
    const bottomContainer = document.getElementById('bottomSuppliers');
    bottomContainer.innerHTML = active.slice(-10).reverse().map((s, i) => `
        <div class="ranking-item" onclick="filterBySupplier('${s.name.replace(/'/g, "\\'")}')">
            <div class="ranking-rank" style="background:#605e5c;">${active.length - 9 + i}</div>
            <div class="ranking-info">
                <div class="ranking-name" title="${s.name}">${s.name.length > 30 ? s.name.substring(0, 30) + '...' : s.name}</div>
                <div class="ranking-meta">${s.count} POs</div>
            </div>
            <div class="ranking-value" style="color:#605e5c;">${formatCurrency(s.value)}</div>
        </div>
    `).join('');
}

// Filter by supplier (from ranking click)
function filterBySupplier(supplier) {
    filters.supplier = supplier;
    // Find and select in dropdown if exists
    const select = document.getElementById('filterSupplier');
    for (let opt of select.options) {
        if (opt.value === supplier) {
            select.value = supplier;
            break;
        }
    }
    applyFiltersAndRefresh();
}

// Make functions globally available
window.setTrendType = setTrendType;
window.setBreakdownType = setBreakdownType;
window.sortTable = sortTable;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.resetFilters = resetFilters;
window.filterBySupplier = filterBySupplier;
