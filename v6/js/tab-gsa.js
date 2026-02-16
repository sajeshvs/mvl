// ─── V6 Supply Chain Intel Hub — Global Spend Analysis Tab Controller ───
// ES module: import { initGlobalSpendAnalysis } from './tab-gsa.js'

import { state, setFilter, clearFilters, getFilteredPOs, paginate } from './state.js';
import {
  renderSpendTrendChart,
  renderEntitySpendChart,
  renderProjectSpendChart,
  renderSupplierCharts,
  renderGSAKPIs
} from './charts-gsa.js';
import {
  formatCurrency,
  formatNumber,
  debounce,
  getStatusBadge,
  generatePaginationHTML,
  truncateText,
  formatDate
} from './utils.js';

// ─── Init ───────────────────────────────────────────────────────

export function initGlobalSpendAnalysis() {
  if (state.initialized.gsa) return;
  state.initialized.gsa = true;

  populateGSAFilters();
  renderGSATab();
  attachGSAFilterHandlers();
  listenForChartFilterEvents();
}

// ─── Filter Population ─────────────────────────────────────────

export function populateGSAFilters() {
  const filters = state.dashboard?.filters;
  if (!filters) return;

  populateDropdown('gsaFilterEntity',     filters.entities);
  populateDropdown('gsaFilterSupplier',   (filters.suppliers || []).slice(0, 200));
  populateDropdown('gsaFilterProject',    (filters.projects || []).slice(0, 200));
  populateDropdown('gsaFilterMaterial',   filters.materials);
  populateDropdown('gsaFilterDiscipline', filters.disciplines);
  populateDropdown('gsaFilterPoType',     filters.poTypes);
  populateDropdown('gsaFilterYear',       (filters.years || []).map(String));

  // Clear date inputs
  const dateFrom = document.getElementById('gsaFilterFrom');
  const dateTo   = document.getElementById('gsaFilterTo');
  if (dateFrom) dateFrom.value = '';
  if (dateTo)   dateTo.value = '';

  // Clear search input
  const searchInput = document.getElementById('gsaSearchInput');
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

export function renderGSATab() {
  const pos = getFilteredPOs();

  // ── 1. KPI Cards ──────────────────────────────────────────────
  renderGSAKPIs(state.dashboard?.summary || {}, pos);

  // ── 2. Spend Trend (annual) ───────────────────────────────────
  const annualMap = {};
  pos.forEach(po => {
    const year = po.year || (po.poDate ? new Date(po.poDate).getFullYear() : null);
    if (!year) return;
    if (!annualMap[year]) annualMap[year] = { year, baseValue: 0, changeValue: 0, totalValue: 0, poCount: 0 };
    const val = Number(po.poValueUSD) || Number(po.valueUSD) || 0;
    const coVal = Number(po.changeOrderValueUSD) || 0;
    annualMap[year].totalValue += val;
    annualMap[year].poCount++;
    if (po.isChangeOrder) {
      annualMap[year].changeValue += val;
    } else {
      annualMap[year].baseValue += val;
    }
  });
  const annualData = Object.values(annualMap).sort((a, b) => a.year - b.year);
  renderSpendTrendChart(annualData);

  // ── 3. Entity Spend ───────────────────────────────────────────
  const entityMap = {};
  pos.forEach(po => {
    const e = po.entity || 'Unknown';
    if (!entityMap[e]) entityMap[e] = { entity: e, poSpendUSD: 0, poCount: 0 };
    entityMap[e].poSpendUSD += Number(po.poValueUSD) || Number(po.valueUSD) || 0;
    entityMap[e].poCount++;
  });
  const entityData = Object.values(entityMap).sort((a, b) => b.poSpendUSD - a.poSpendUSD);
  renderEntitySpendChart(entityData);

  // ── 4. Project Spend ──────────────────────────────────────────
  const projectMap = {};
  pos.forEach(po => {
    const p = po.project || 'Unknown';
    if (!projectMap[p]) projectMap[p] = { project: p, totalSpendUSD: 0, poCount: 0 };
    projectMap[p].totalSpendUSD += Number(po.poValueUSD) || Number(po.valueUSD) || 0;
    projectMap[p].poCount++;
  });
  const projectData = Object.values(projectMap)
    .sort((a, b) => b.totalSpendUSD - a.totalSpendUSD)
    .slice(0, 20);
  renderProjectSpendChart(projectData);

  // ── 5. Supplier Rankings ──────────────────────────────────────
  const supplierMap = {};
  pos.forEach(po => {
    const s = po.supplier || 'Unknown';
    if (!supplierMap[s]) supplierMap[s] = { name: s, totalSpendUSD: 0, poCount: 0 };
    supplierMap[s].totalSpendUSD += Number(po.poValueUSD) || Number(po.valueUSD) || 0;
    supplierMap[s].poCount++;
  });
  const supplierList = Object.values(supplierMap).sort((a, b) => b.totalSpendUSD - a.totalSpendUSD);
  const rankings = {
    top:    supplierList.slice(0, 10),
    bottom: supplierList.slice(-10).reverse()
  };
  renderSupplierCharts(rankings);

  // ── 6. PO Table ───────────────────────────────────────────────
  renderGSATable();
}

// ─── Filter Application ────────────────────────────────────────

export function applyGSAFilters() {
  const entity     = getVal('gsaFilterEntity');
  const supplier   = getVal('gsaFilterSupplier');
  const project    = getVal('gsaFilterProject');
  const material   = getVal('gsaFilterMaterial');
  const discipline = getVal('gsaFilterDiscipline');
  const poType     = getVal('gsaFilterPoType');
  const year       = getVal('gsaFilterYear');
  const dateFrom   = getVal('gsaFilterFrom');
  const dateTo     = getVal('gsaFilterTo');
  const search     = getVal('gsaSearchInput');

  setFilter('gsa', 'entity',     entity);
  setFilter('gsa', 'supplier',   supplier);
  setFilter('gsa', 'project',    project);
  setFilter('gsa', 'material',   material);
  setFilter('gsa', 'discipline', discipline);
  setFilter('gsa', 'poType',     poType);
  setFilter('gsa', 'year',       year);
  setFilter('gsa', 'dateFrom',   dateFrom);
  setFilter('gsa', 'dateTo',     dateTo);
  setFilter('gsa', 'search',     search);

  state.pagination.gsa.page = 1;
  renderGSATab();
}

export function clearGSAFilters() {
  clearFilters('gsa');

  // Reset dropdowns
  ['gsaFilterEntity', 'gsaFilterSupplier', 'gsaFilterProject', 'gsaFilterMaterial',
   'gsaFilterDiscipline', 'gsaFilterPoType', 'gsaFilterYear'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset date inputs
  const dateFrom = document.getElementById('gsaFilterFrom');
  const dateTo   = document.getElementById('gsaFilterTo');
  if (dateFrom) dateFrom.value = '';
  if (dateTo)   dateTo.value = '';

  // Reset search
  const searchInput = document.getElementById('gsaSearchInput');
  if (searchInput) searchInput.value = '';

  state.pagination.gsa.page = 1;
  renderGSATab();
}

// ─── PO Details Table ───────────────────────────────────────────

export function renderGSATable() {
  const container = document.getElementById('gsaPoTableBody');
  const paginationContainer = document.getElementById('gsaPagination');
  if (!container) return;

  let pos = getFilteredPOs();

  // ── Sorting ───────────────────────────────────────────────────
  const { sortField, sortDir } = state.pagination.gsa;
  if (sortField) {
    pos = [...pos].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Numeric fields
      if (['poValueUSD', 'valueUSD', 'value'].includes(sortField)) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ── Pagination ────────────────────────────────────────────────
  const paged = paginate(pos, 'gsa');

  const rows = paged.items.map(po => {
    const poValue = Number(po.poValueUSD) || Number(po.valueUSD) || 0;
    const typeBadge = po.isChangeOrder
      ? '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:0.8em;font-weight:600;color:#fff;background:#e67e22;">CO</span>'
      : '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:0.8em;font-weight:600;color:#fff;background:#27ae60;">Base</span>';

    return `<tr>
      <td style="font-weight:600;">${po.poNumber || '—'}</td>
      <td>${typeBadge}</td>
      <td title="${po.project || ''}">${truncateText(po.project || '—', 35)}</td>
      <td>${formatDate(po.poDate)}</td>
      <td title="${po.supplier || ''}">${truncateText(po.supplier || '—', 30)}</td>
      <td>${po.material || '—'}</td>
      <td style="text-align:right;font-weight:600;">${formatCurrency(poValue)}</td>
    </tr>`;
  }).join('');

  container.innerHTML = rows || '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888;">No purchase order records found</td></tr>';

  if (paginationContainer) {
    paginationContainer.innerHTML = generatePaginationHTML({
      page: paged.page,
      totalPages: paged.totalPages,
      total: paged.total
    });
    attachPaginationHandlers(paginationContainer);
  }
}

// ─── Filter Event Handlers ──────────────────────────────────────

function attachGSAFilterHandlers() {
  // Dropdown change handlers
  const dropdownIds = [
    'gsaFilterEntity', 'gsaFilterSupplier', 'gsaFilterProject',
    'gsaFilterMaterial', 'gsaFilterDiscipline', 'gsaFilterPoType', 'gsaFilterYear'
  ];
  dropdownIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => applyGSAFilters());
  });

  // Date inputs
  ['gsaFilterFrom', 'gsaFilterTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => applyGSAFilters());
  });

  // Search input debounced
  const searchInput = document.getElementById('gsaSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => applyGSAFilters(), 300));
  }

  // Clear filters button
  const clearBtn = document.getElementById('gsaClearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => clearGSAFilters());
  }

  // Table header sorting
  document.addEventListener('click', e => {
    const th = e.target.closest('[data-sort]');
    if (!th) return;
    // Only handle GSA table headers
    if (!th.closest('.data-table')) return;

    const field = th.dataset.sort;
    if (!field) return;

    const p = state.pagination.gsa;
    if (p.sortField === field) {
      p.sortDir = p.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      p.sortField = field;
      p.sortDir = 'asc';
    }
    p.page = 1;

    // Update sort indicators
    th.closest('thead')?.querySelectorAll('[data-sort]').forEach(h => {
      h.classList.remove('sort-asc', 'sort-desc');
    });
    th.classList.add(p.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');

    renderGSATable();
  });
}

// ─── Chart Filter Events ────────────────────────────────────────

function listenForChartFilterEvents() {
  window.addEventListener('chartFilterApplied', e => {
    const { type, value } = e.detail || {};
    if (!type || !value) return;

    // Map chart filter types to GSA filter fields
    const fieldMap = {
      entity:     'gsaFilterEntity',
      supplier:   'gsaFilterSupplier',
      project:    'gsaFilterProject',
      material:   'gsaFilterMaterial',
      discipline: 'gsaFilterDiscipline',
      poType:     'gsaFilterPoType',
      year:       'gsaFilterYear'
    };

    const dropdownId = fieldMap[type];
    if (!dropdownId) return;

    const el = document.getElementById(dropdownId);
    if (el) {
      el.value = value;
      applyGSAFilters();
    }
  });
}

// ─── Pagination Handlers ────────────────────────────────────────

function attachPaginationHandlers(container) {
  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (!isNaN(page) && page >= 1) {
        state.pagination.gsa.page = page;
        renderGSATable();
      }
    });
  });
}

// ─── Helpers ────────────────────────────────────────────────────

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
