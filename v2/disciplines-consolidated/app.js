/**
 * MVL Supply Intel Hub - Disciplines Consolidated Dashboard
 * Quoted vs Ordered Analysis by Discipline
 */

let DATA = null;
let filteredDisciplines = [];
let currentView = 'cards';
let sortField = 'quotedValue';
let sortDirection = 'desc';

// Chart instances
let comparisonChart = null;
let utilizationChart = null;

// Discipline color palette
const DISCIPLINE_COLORS = [
    '#0f3d5e', '#00B7C3', '#107C10', '#FFB900', '#D13438',
    '#881798', '#0078D4', '#E74856', '#00CC6A', '#8764B8',
    '#038387', '#C239B3', '#567C73', '#7A7574', '#4A5459',
    '#69797E', '#CA5010', '#498205', '#847545', '#525E54',
    '#515C6B', '#4C4A48', '#7E735F', '#2D7D9A', '#B4A0FF',
    '#D83B01', '#C50F1F', '#009E49'
];

// Currency formatter
const formatCurrency = (val) => {
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
    return '$' + val.toFixed(0);
};

const formatNumber = (n) => new Intl.NumberFormat().format(n);
const formatPercent = (n) => n.toFixed(1) + '%';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data.json');
        DATA = await response.json();
        
        initFilters();
        applyFiltersAndRefresh();
        
    } catch (error) {
        console.error('Failed to load data:', error);
        document.querySelector('.content').innerHTML = `
            <div style="text-align:center;padding:60px;">
                <h2>⚠️ Data Load Error</h2>
                <p>Could not load data.json. Make sure the file exists.</p>
            </div>`;
    }
});

function initFilters() {
    // Entity filter
    const entitySelect = document.getElementById('filterEntity');
    const entities = DATA.entityBreakdown.sort((a, b) => b.orderedValue - a.orderedValue);
    entities.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.name;
        opt.textContent = `${e.name} (${formatCurrency(e.orderedValue)})`;
        entitySelect.appendChild(opt);
    });
    
    // Discipline filter
    const disciplineSelect = document.getElementById('filterDiscipline');
    const disciplines = DATA.disciplines.sort((a, b) => b.quotedValue - a.quotedValue);
    disciplines.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.name;
        opt.textContent = d.name;
        disciplineSelect.appendChild(opt);
    });
    
    // Event listeners
    entitySelect.addEventListener('change', applyFiltersAndRefresh);
    disciplineSelect.addEventListener('change', applyFiltersAndRefresh);
}

function applyFiltersAndRefresh() {
    const entityFilter = document.getElementById('filterEntity').value;
    const disciplineFilter = document.getElementById('filterDiscipline').value;
    
    // Start with all disciplines
    filteredDisciplines = DATA.disciplines.map(d => ({...d}));
    
    // If entity filter is set, we need to recalculate from entity data
    if (entityFilter) {
        const entityData = DATA.entityBreakdown.find(e => e.name === entityFilter);
        if (entityData && entityData.disciplines) {
            filteredDisciplines = entityData.disciplines.map(d => ({...d}));
        }
    }
    
    // If discipline filter is set
    if (disciplineFilter) {
        filteredDisciplines = filteredDisciplines.filter(d => d.name === disciplineFilter);
    }
    
    // Sort
    sortDisciplines();
    
    // Render everything
    renderKPIs();
    renderComparisonChart();
    renderUtilizationChart();
    renderDisciplineCards();
    renderTable();
    renderEntityGrid();
}

function sortDisciplines() {
    filteredDisciplines.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'name') {
            return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
}

function renderKPIs() {
    const totalQuoted = filteredDisciplines.reduce((s, d) => s + d.quotedValue, 0);
    const totalOrdered = filteredDisciplines.reduce((s, d) => s + d.orderedValue, 0);
    const utilization = totalQuoted > 0 ? (totalOrdered / totalQuoted) * 100 : 0;
    
    document.getElementById('kpiQuoted').textContent = formatCurrency(totalQuoted);
    document.getElementById('kpiQuotedSub').textContent = 
        `${formatNumber(filteredDisciplines.reduce((s, d) => s + (d.quoteCount || 0), 0))} quotations`;
    
    document.getElementById('kpiOrdered').textContent = formatCurrency(totalOrdered);
    document.getElementById('kpiOrderedSub').textContent = 
        `${formatNumber(filteredDisciplines.reduce((s, d) => s + (d.poCount || 0), 0))} POs`;
    
    document.getElementById('kpiUtilization').textContent = formatPercent(utilization);
    document.getElementById('kpiDisciplines').textContent = filteredDisciplines.length;
    
    const entityFilter = document.getElementById('filterEntity').value;
    document.getElementById('kpiEntities').textContent = entityFilter ? '1' : DATA.summary.entityCount;
    
    document.getElementById('disciplineCount').textContent = 
        `${filteredDisciplines.length} disciplines`;
}

function renderComparisonChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    // Get top 10 disciplines by quoted value
    const top = filteredDisciplines.slice(0, 10);
    
    if (comparisonChart) comparisonChart.destroy();
    
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top.map(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name),
            datasets: [
                {
                    label: 'Quoted (Budget)',
                    data: top.map(d => d.quotedValue),
                    backgroundColor: 'rgba(15, 61, 94, 0.8)',
                    borderRadius: 4
                },
                {
                    label: 'Ordered (Actual)',
                    data: top.map(d => d.orderedValue),
                    backgroundColor: 'rgba(0, 183, 195, 0.8)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { font: { size: 10 }, maxRotation: 45 }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: val => formatCurrency(val),
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

function renderUtilizationChart() {
    const ctx = document.getElementById('utilizationChart').getContext('2d');
    
    // Get top 10 by ordered value (they have the most action)
    const top = [...filteredDisciplines]
        .sort((a, b) => b.orderedValue - a.orderedValue)
        .slice(0, 10);
    
    if (utilizationChart) utilizationChart.destroy();
    
    utilizationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top.map(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name),
            datasets: [{
                label: 'Utilization %',
                data: top.map(d => d.utilization),
                backgroundColor: top.map(d => {
                    if (d.utilization > 80) return 'rgba(213, 52, 56, 0.8)';  // Over budget
                    if (d.utilization > 50) return 'rgba(255, 185, 0, 0.8)';  // Watch
                    return 'rgba(16, 124, 16, 0.8)';  // Under budget
                }),
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
                        label: ctx => {
                            const d = top[ctx.dataIndex];
                            return [
                                `Utilization: ${ctx.raw.toFixed(1)}%`,
                                `Quoted: ${formatCurrency(d.quotedValue)}`,
                                `Ordered: ${formatCurrency(d.orderedValue)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: Math.max(100, ...top.map(d => d.utilization)) * 1.1,
                    ticks: {
                        callback: val => val + '%',
                        font: { size: 10 }
                    }
                },
                y: {
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

function renderDisciplineCards() {
    const container = document.getElementById('cardsView');
    container.innerHTML = '';
    
    filteredDisciplines.forEach((d, idx) => {
        const colorIdx = idx % DISCIPLINE_COLORS.length;
        const baseColor = DISCIPLINE_COLORS[colorIdx];
        const variance = d.quotedValue - d.orderedValue;
        const variancePercent = d.quotedValue > 0 ? (variance / d.quotedValue) * 100 : 0;
        
        const card = document.createElement('div');
        card.className = 'discipline-card';
        card.innerHTML = `
            <div class="discipline-header" style="background: ${baseColor};">
                <span class="discipline-name">${d.name}</span>
                <span class="discipline-badge">${d.quoteCount || 0} quotes</span>
            </div>
            <div class="discipline-body">
                <div class="discipline-row">
                    <span class="discipline-label">Quoted (Budget)</span>
                    <span class="discipline-value">${formatCurrency(d.quotedValue)}</span>
                </div>
                <div class="discipline-row">
                    <span class="discipline-label">Ordered (Actual)</span>
                    <span class="discipline-value">${formatCurrency(d.orderedValue)}</span>
                </div>
                <div class="discipline-row">
                    <span class="discipline-label">Variance</span>
                    <span class="discipline-value ${variance >= 0 ? 'variance-positive' : 'variance-negative'}">
                        ${variance >= 0 ? '+' : ''}${formatCurrency(variance)} (${variancePercent >= 0 ? '+' : ''}${variancePercent.toFixed(1)}%)
                    </span>
                </div>
                <div class="utilization-bar">
                    <div class="utilization-fill" style="width: ${Math.min(d.utilization, 100)}%; background: ${getUtilizationColor(d.utilization)};"></div>
                </div>
                <div class="utilization-text">
                    <span>Utilization</span>
                    <span style="font-weight:600;">${d.utilization.toFixed(1)}%</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function getUtilizationColor(util) {
    if (util > 80) return '#D13438';  // Over budget territory
    if (util > 50) return '#FFB900';  // Watch
    return '#107C10';  // Under budget
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    filteredDisciplines.forEach(d => {
        const variance = d.quotedValue - d.orderedValue;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${d.name}</strong></td>
            <td>${formatCurrency(d.quotedValue)}</td>
            <td>${formatCurrency(d.orderedValue)}</td>
            <td>
                <span class="progress-mini">
                    <span class="progress-mini-fill" style="width: ${Math.min(d.utilization, 100)}%; background: ${getUtilizationColor(d.utilization)};"></span>
                </span>
                ${d.utilization.toFixed(1)}%
            </td>
            <td class="${variance >= 0 ? 'variance-positive' : 'variance-negative'}">
                ${variance >= 0 ? '+' : ''}${formatCurrency(variance)}
            </td>
            <td>${formatNumber(d.quoteCount || 0)}</td>
            <td>${formatNumber(d.poCount || 0)}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderEntityGrid() {
    const container = document.getElementById('entityGrid');
    container.innerHTML = '';
    
    const currentEntity = document.getElementById('filterEntity').value;
    
    DATA.entityBreakdown.sort((a, b) => b.orderedValue - a.orderedValue).forEach(e => {
        const div = document.createElement('div');
        div.className = `entity-item ${e.name === currentEntity ? 'active' : ''}`;
        div.innerHTML = `
            <div class="entity-name">${e.name}</div>
            <div class="entity-stats">
                Ordered: ${formatCurrency(e.orderedValue)} | Util: ${e.utilization.toFixed(1)}%
            </div>
        `;
        div.onclick = () => {
            document.getElementById('filterEntity').value = e.name === currentEntity ? '' : e.name;
            applyFiltersAndRefresh();
        };
        container.appendChild(div);
    });
}

function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-toggle button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(view === 'cards' ? 'Cards' : 'Table'));
    });
    document.getElementById('cardsView').style.display = view === 'cards' ? 'grid' : 'none';
    document.getElementById('tableView').style.display = view === 'table' ? 'block' : 'none';
}

function sortTable(field) {
    if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDirection = 'desc';
    }
    sortDisciplines();
    renderTable();
}

function resetFilters() {
    document.getElementById('filterEntity').value = '';
    document.getElementById('filterDiscipline').value = '';
    applyFiltersAndRefresh();
}
