// ─── V6 Supply Chain Intel Hub — Supplier Marketplace Tab Controller ────
// ES module: import { initSupplierMarketplace } from './tab-sm.js'

import { state, setFilter, clearFilters, getFilteredQuotations, paginate } from './state.js';
import {
  renderEntityChart,
  renderMaterialChart,
  renderTrendChart,
  renderQuotationTimeChart,
  renderStatusBars,
  renderTopSuppliersList,
  renderEmployeeList
} from './charts-sm.js';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  convertToUSD,
  debounce,
  getStatusBadge,
  generatePaginationHTML,
  truncateText
} from './utils.js';
import { renderSupplierMap } from './map.js';

// ─── State ──────────────────────────────────────────────────────

let currentBottomTab = 'workbench'; // 'workbench' | 'supplier-list'

// ─── Init ───────────────────────────────────────────────────────

export function initSupplierMarketplace() {
  if (state.initialized.sm) return;
  state.initialized.sm = true;

  populateSMFilters();
  renderSMTab();
  setupBottomTabs();
  attachFilterHandlers();
  listenForChartToggle();
}

// ─── Chart Toggle Listener ──────────────────────────────────────

function listenForChartToggle() {
  window.addEventListener('chartTypeChanged', e => {
    const { target, type } = e.detail || {};
    if (target === 'entity') {
      // Re-render entity chart with view type (quote or spend)
      const quotations = getFilteredQuotations();
      const entityMap = {};
      quotations.forEach(q => {
        const ent = q.entity || 'Unknown';
        if (!entityMap[ent]) entityMap[ent] = { entity: ent, quotationCount: 0, quotationValueUSD: 0 };
        entityMap[ent].quotationCount++;
        entityMap[ent].quotationValueUSD += Number(q.valueUSD) || 0;
      });
      const entityData = Object.values(entityMap)
        .sort((a, b) => b.quotationValueUSD - a.quotationValueUSD)
        .slice(0, 15);
      renderEntityChart(entityData, type);
    } else if (target === 'material') {
      // Re-render material chart with chart type (bar, pie, doughnut, radar)
      const quotations = getFilteredQuotations();
      const disciplineMap = {};
      quotations.forEach(q => {
        const d = q.discipline || q.material || 'Unknown';
        if (!disciplineMap[d]) disciplineMap[d] = { discipline: d, quotationCount: 0, quotedValueUSD: 0 };
        disciplineMap[d].quotationCount++;
        disciplineMap[d].quotedValueUSD += Number(q.valueUSD) || 0;
      });
      const disciplineData = Object.values(disciplineMap)
        .sort((a, b) => b.quotedValueUSD - a.quotedValueUSD)
        .slice(0, 15);
      renderMaterialChart(disciplineData, type);
    }
  });
}

// ─── Filter Population ─────────────────────────────────────────

export function populateSMFilters() {
  const filters = state.dashboard?.filters;
  if (!filters) return;

  populateDropdown('filterEntity',     filters.entities);
  populateDropdown('filterProject',    (filters.projects || []).slice(0, 200));
  populateDropdown('filterStatus',     filters.statuses);
  populateDropdown('filterMaterial',   filters.materials);
  populateDropdown('filterDiscipline', filters.disciplines);

  // Clear search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
}

function populateDropdown(id, items) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = '<option value="">All</option>';
  if (!items || !items.length) return;

  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    el.appendChild(opt);
  });
}

// ─── Master Render ──────────────────────────────────────────────

export function renderSMTab(filteredQuotations = null) {
  const quotations = filteredQuotations || getFilteredQuotations();

  // ── KPI Computation ───────────────────────────────────────────
  const totalQuotations = quotations.length;
  const orders = quotations.filter(q => q.status === 'Order' || q.statusNormalized === 'won');
  const totalOrders = orders.length;
  const winRate = totalQuotations > 0 ? (totalOrders / totalQuotations) * 100 : 0;
  const quotationValue = quotations.reduce((s, q) => s + (Number(q.valueUSD) || 0), 0);
  const orderValue = orders.reduce((s, q) => s + (Number(q.valueUSD) || 0), 0);

  const uniqueClients = new Set(quotations.map(q => q.client).filter(Boolean)).size;
  const uniqueEntities = new Set(quotations.map(q => q.entity).filter(Boolean)).size;
  const uniqueEmployees = new Set(quotations.map(q => q.contact).filter(Boolean)).size;
  const conversionRate = totalQuotations > 0 ? (totalOrders / totalQuotations) * 100 : 0;

  // ── 1. KPI Cards ──────────────────────────────────────────────
  setText('smKpiTotalQuotations', formatNumber(totalQuotations));
  setText('smKpiTotalOrders',     formatNumber(totalOrders));
  setText('smKpiWinRate',         formatPercent(winRate));
  setText('smKpiQuotationValue',  formatCurrency(quotationValue));
  setText('smKpiOrderValue',      formatCurrency(orderValue));
  setText('smKpiClients',         formatNumber(uniqueClients));
  setText('smKpiEntities',        formatNumber(uniqueEntities));
  setText('smKpiEmployees',       formatNumber(uniqueEmployees));
  setText('smKpiConversionRate',  formatPercent(conversionRate));

  // ── 2. Status Bars ────────────────────────────────────────────
  const statusMap = {};
  quotations.forEach(q => {
    const s = q.status || 'Unknown';
    if (!statusMap[s]) statusMap[s] = { status: s, count: 0, totalValueUSD: 0 };
    statusMap[s].count++;
    statusMap[s].totalValueUSD += Number(q.valueUSD) || 0;
  });
  renderStatusBars(Object.values(statusMap));

  // ── 3. Entity Chart ───────────────────────────────────────────
  const entityMap = {};
  quotations.forEach(q => {
    const e = q.entity || 'Unknown';
    if (!entityMap[e]) entityMap[e] = { entity: e, quotationCount: 0, quotationValueUSD: 0 };
    entityMap[e].quotationCount++;
    entityMap[e].quotationValueUSD += Number(q.valueUSD) || 0;
  });
  const entityData = Object.values(entityMap)
    .sort((a, b) => b.quotationValueUSD - a.quotationValueUSD)
    .slice(0, 15);
  renderEntityChart(entityData);

  // ── 4. Top Suppliers ──────────────────────────────────────────
  const supplierRankings = state.dashboard?.aggregations?.supplierRankings?.top || [];
  renderTopSuppliersList(supplierRankings);

  // ── 5. Material / Discipline Chart ────────────────────────────
  const disciplineMap = {};
  quotations.forEach(q => {
    const d = q.discipline || q.material || 'Unknown';
    if (!disciplineMap[d]) disciplineMap[d] = { discipline: d, quotationCount: 0, quotedValueUSD: 0 };
    disciplineMap[d].quotationCount++;
    disciplineMap[d].quotedValueUSD += Number(q.valueUSD) || 0;
  });
  const disciplineData = Object.values(disciplineMap)
    .sort((a, b) => b.quotedValueUSD - a.quotedValueUSD)
    .slice(0, 15);
  renderMaterialChart(disciplineData);

  // ── 6. Employee List ──────────────────────────────────────────
  renderEmployeeList(state.employees || []);

  // ── 7. Trend Chart ────────────────────────────────────────────
  const quotationTrend = state.dashboard?.aggregations?.quotationTrend || [];
  renderTrendChart(quotationTrend);

  // ── 8. Quotation-Time / Conversion Chart ──────────────────────
  const entityConversion = {};
  quotations.forEach(q => {
    const e = q.entity || 'Unknown';
    if (!entityConversion[e]) entityConversion[e] = { entity: e, quotationCount: 0, poCount: 0 };
    entityConversion[e].quotationCount++;
    if (q.status === 'Order' || q.statusNormalized === 'won') entityConversion[e].poCount++;
  });
  const conversionData = Object.values(entityConversion).map(e => ({
    entity: e.entity,
    quotationCount: e.quotationCount,
    poCount: e.poCount,
    rate: e.quotationCount > 0 ? (e.poCount / e.quotationCount) * 100 : 0
  }));
  renderQuotationTimeChart(conversionData);

  // ── 9. Supplier Map ───────────────────────────────────────────
  renderSupplierMap(quotations);

  // ── 10. Approved Materials Table ──────────────────────────────
  renderSMApprovedMaterials(quotations);

  // ── 11. Bottom Table ──────────────────────────────────────────
  renderBottomTable(currentBottomTab);
}

// ─── Approved Materials (SM) ────────────────────────────────────

function renderSMApprovedMaterials(quotations) {
  const container = document.getElementById('approvedMaterialTable');
  if (!container) return;

  // Filter to "Order" status quotations
  const ordered = (quotations || []).filter(q =>
    q.status && q.status.toLowerCase() === 'order'
  );

  if (!ordered.length) {
    container.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:16px;color:#888;">No approved materials</td></tr>';
    return;
  }

  // Group by material
  const matMap = {};
  ordered.forEach(q => {
    const mat = q.material || 'Unknown';
    if (!matMap[mat]) matMap[mat] = { material: mat, spec: '', count: 0 };
    matMap[mat].count++;
    if (!matMap[mat].spec && q.description) {
      matMap[mat].spec = truncateText(q.description, 60);
    }
  });

  const materials = Object.values(matMap).sort((a, b) => b.count - a.count).slice(0, 50);

  container.innerHTML = materials.map(m => `<tr>
    <td style="font-weight:600;">${truncateText(m.material, 30)}</td>
    <td title="${m.spec}">${m.spec || '—'}</td>
    <td style="text-align:center;">${m.count}</td>
  </tr>`).join('');
}

// ─── Filter Application ────────────────────────────────────────

export function applySMFilters() {
  const entity     = getVal('filterEntity');
  const project    = getVal('filterProject');
  const status     = getVal('filterStatus');
  const material   = getVal('filterMaterial');
  const discipline = getVal('filterDiscipline');
  const search     = getVal('searchInput');

  setFilter('sm', 'entity',     entity);
  setFilter('sm', 'project',    project);
  setFilter('sm', 'status',     status);
  setFilter('sm', 'material',   material);
  setFilter('sm', 'discipline', discipline);
  setFilter('sm', 'search',     search);

  state.pagination.sm.page = 1;
  renderSMTab();
}

export function clearSMFilters() {
  clearFilters('sm');

  // Reset dropdowns
  ['filterEntity', 'filterProject', 'filterStatus', 'filterMaterial', 'filterDiscipline'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  state.pagination.sm.page = 1;
  renderSMTab();
}

// ─── Bottom Table (Supplier List / Workbench) ───────────────────

export function renderBottomTable(type = 'workbench') {
  currentBottomTab = type;

  if (type === 'workbench') {
    renderWorkbenchTable();
  } else {
    renderSupplierListTable();
  }
}

function renderWorkbenchTable() {
  const container = document.getElementById('smBottomTableBody') || document.getElementById('smTableBody');
  const paginationContainer = document.getElementById('smPagination');
  if (!container) return;

  const quotations = getFilteredQuotations();
  const paged = paginate(quotations, 'sm');

  const rows = paged.items.map(q => {
    const valueUSD = Number(q.valueUSD) || convertToUSD(q.value, q.currency);
    return `<tr>
      <td>${q.quotationNumber || '—'}</td>
      <td>${getStatusBadge(q.status)}</td>
      <td title="${q.material || ''}">${truncateText(q.material || '—', 30)}</td>
      <td title="${q.projectName || ''}">${truncateText(q.projectName || '—', 35)}</td>
      <td style="text-align:right;font-weight:600;">${formatCurrency(valueUSD)}</td>
      <td>${q.contact || '—'}</td>
    </tr>`;
  }).join('');

  container.innerHTML = rows || '<tr><td colspan="6" style="text-align:center;padding:24px;color:#888;">No quotation records found</td></tr>';

  if (paginationContainer) {
    paginationContainer.innerHTML = generatePaginationHTML({
      page: paged.page,
      totalPages: paged.totalPages,
      total: paged.total
    });
    attachPaginationHandlers(paginationContainer, 'sm');
  }
}

function renderSupplierListTable() {
  const container = document.getElementById('smBottomTableBody') || document.getElementById('smTableBody');
  const paginationContainer = document.getElementById('smPagination');
  if (!container) return;

  const suppliers = state.suppliers || [];
  const paged = paginate(suppliers, 'sm');

  const rows = paged.items.map(s => {
    const rating = Number(s.ratingScore) || 0;
    const stars = '★'.repeat(Math.round(rating / 20)) + '☆'.repeat(5 - Math.round(rating / 20));
    return `<tr>
      <td style="font-weight:600;">${s.name || '—'}</td>
      <td>${s.country || '—'}</td>
      <td>${s.materialCategory || '—'}</td>
      <td title="Score: ${rating}" style="color:#f39c12;">${stars}</td>
      <td style="text-align:right;">${formatNumber(s.poCount || 0)}</td>
      <td style="text-align:right;font-weight:600;">${formatCurrency(s.totalSpendUSD || 0)}</td>
    </tr>`;
  }).join('');

  container.innerHTML = rows || '<tr><td colspan="6" style="text-align:center;padding:24px;color:#888;">No supplier records found</td></tr>';

  if (paginationContainer) {
    paginationContainer.innerHTML = generatePaginationHTML({
      page: paged.page,
      totalPages: paged.totalPages,
      total: paged.total
    });
    attachPaginationHandlers(paginationContainer, 'sm');
  }
}

// ─── Bottom Tab Switching ───────────────────────────────────────

function setupBottomTabs() {
  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-bottom-tab]');
    if (!tab) return;

    const type = tab.dataset.bottomTab;
    if (!type) return;

    // Update active tab styling
    document.querySelectorAll('[data-bottom-tab]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    state.pagination.sm.page = 1;
    renderBottomTable(type);
  });
}

// ─── Filter Event Handlers ──────────────────────────────────────

function attachFilterHandlers() {
  // Dropdown change handlers
  const dropdownIds = ['filterEntity', 'filterProject', 'filterStatus', 'filterMaterial', 'filterDiscipline'];
  dropdownIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => applySMFilters());
  });

  // Search input debounced handler
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => applySMFilters(), 300));
  }

  // Clear filters button
  const clearBtn = document.getElementById('smClearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => clearSMFilters());
  }
}

// ─── Pagination Handlers ────────────────────────────────────────

function attachPaginationHandlers(container, tab) {
  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (!isNaN(page) && page >= 1) {
        state.pagination[tab].page = page;
        renderBottomTable(currentBottomTab);
      }
    });
  });
}

// ─── Helpers ────────────────────────────────────────────────────

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
