// ─── V6 Supply Chain Intel Hub — Materials & Disciplines Tab Controller ──
// ES module: import { initMaterialsDisciplines } from './tab-md.js'

import { state, setFilter, clearFilters, getFilteredMdPOs, getFilteredMdQuotations, paginate } from './state.js';
import {
  renderDisciplineSpendChart,
  renderMaterialDistributionChart,
  renderMdKPIs,
  renderSupplierTable,
  renderApprovedMaterialsTable,
  renderMdPoTable,
  renderSupplierProfileCard
} from './charts-md.js';
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

export function initMaterialsDisciplines() {
  if (state.initialized.md) return;
  state.initialized.md = true;

  populateMdFilters();
  renderMdTab();
  attachMdFilterHandlers();
  listenForSupplierSelection();
}

// ─── Filter Population ─────────────────────────────────────────

export function populateMdFilters() {
  const filters = state.dashboard?.filters;
  if (!filters) return;

  populateDropdown('filterMdDiscipline', filters.disciplines);
  populateDropdown('filterMdEntity',     filters.entities);
  populateDropdown('filterMdProject',    (filters.projects || []).slice(0, 200));
  populateDropdown('filterMdSupplier',   (filters.suppliers || []).slice(0, 200));
  populateDropdown('filterMdMaterial',   filters.materials);
  populateDropdown('filterMdYear',       (filters.years || []).map(String));

  // Clear date inputs
  const dateFrom = document.getElementById('filterMdFrom');
  const dateTo   = document.getElementById('filterMdTo');
  if (dateFrom) dateFrom.value = '';
  if (dateTo)   dateTo.value = '';

  // Clear search input
  const searchInput = document.getElementById('mdSearchInput');
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

export function renderMdTab() {
  const filteredPOs         = getFilteredMdPOs();
  const filteredQuotations  = getFilteredMdQuotations();

  // ── Discipline Aggregation ────────────────────────────────────
  const disciplineMap = {};

  filteredQuotations.forEach(q => {
    const d = q.discipline || 'Unknown';
    if (!disciplineMap[d]) {
      disciplineMap[d] = {
        discipline: d,
        quotedValueUSD: 0,
        orderedValueUSD: 0,
        quotationCount: 0,
        poCount: 0
      };
    }
    disciplineMap[d].quotedValueUSD += Number(q.valueUSD) || 0;
    disciplineMap[d].quotationCount++;
  });

  filteredPOs.forEach(po => {
    const d = po.discipline || 'Unknown';
    if (!disciplineMap[d]) {
      disciplineMap[d] = {
        discipline: d,
        quotedValueUSD: 0,
        orderedValueUSD: 0,
        quotationCount: 0,
        poCount: 0
      };
    }
    disciplineMap[d].orderedValueUSD += Number(po.poValueUSD) || Number(po.valueUSD) || 0;
    disciplineMap[d].poCount++;
  });

  const disciplineAggregation = Object.values(disciplineMap)
    .sort((a, b) => (b.quotedValueUSD + b.orderedValueUSD) - (a.quotedValueUSD + a.orderedValueUSD));

  // ── 1. KPI Cards ──────────────────────────────────────────────
  renderMdKPIs(filteredPOs, filteredQuotations);

  // ── 2. Discipline Spend Chart ─────────────────────────────────
  renderDisciplineSpendChart(disciplineAggregation);

  // ── 3. Material Distribution Chart ────────────────────────────
  renderMaterialDistributionChart(disciplineAggregation);

  // ── 4. Top Suppliers Table ────────────────────────────────────
  const supplierSpendMap = {};
  filteredPOs.forEach(po => {
    const s = po.supplier || 'Unknown';
    if (!supplierSpendMap[s]) supplierSpendMap[s] = { name: s, totalSpendUSD: 0, poCount: 0 };
    supplierSpendMap[s].totalSpendUSD += Number(po.poValueUSD) || Number(po.valueUSD) || 0;
    supplierSpendMap[s].poCount++;
  });

  // Join with state.suppliers for contact info
  const topSuppliers = Object.values(supplierSpendMap)
    .sort((a, b) => b.totalSpendUSD - a.totalSpendUSD)
    .slice(0, 20)
    .map(s => {
      const match = (state.suppliers || []).find(
        sup => sup.name === s.name || sup.supplier === s.name
      );
      return {
        ...s,
        country:          match?.country          || '—',
        email:            match?.email            || '',
        phone:            match?.phone            || '',
        contactName:      match?.contactName      || '',
        materialCategory: match?.materialCategory || '',
        ratingScore:      match?.ratingScore      || 0
      };
    });

  renderSupplierTable(topSuppliers);

  // ── 5. Approved Materials Table ───────────────────────────────
  renderApprovedMaterialsTable(filteredQuotations);

  // ── 6. PO Detail Table ────────────────────────────────────────
  renderMdPoDetailTable(filteredPOs);

  // ── 7. Supplier Profile Card ──────────────────────────────────
  if (state.selectedSupplier) {
    renderSupplierProfileCard(state.selectedSupplier);
  }
}

// ─── PO Detail Table with Pagination ────────────────────────────

function renderMdPoDetailTable(pos) {
  const container = document.getElementById('mdPoDetailsBody');
  const paginationContainer = document.getElementById('mdPagination');

  const result = renderMdPoTable(pos, state.pagination.md);

  if (container) container.innerHTML = result.html;
  if (paginationContainer) {
    paginationContainer.innerHTML = result.paginationHtml;
    attachPaginationHandlers(paginationContainer);
  }
}

// ─── Filter Application ────────────────────────────────────────

export function applyMdFilters() {
  const discipline = getVal('filterMdDiscipline');
  const entity     = getVal('filterMdEntity');
  const project    = getVal('filterMdProject');
  const supplier   = getVal('filterMdSupplier');
  const material   = getVal('filterMdMaterial');
  const year       = getVal('filterMdYear');
  const dateFrom   = getVal('filterMdFrom');
  const dateTo     = getVal('filterMdTo');
  const search     = getVal('mdSearchInput');

  setFilter('md', 'discipline', discipline);
  setFilter('md', 'entity',     entity);
  setFilter('md', 'project',    project);
  setFilter('md', 'supplier',   supplier);
  setFilter('md', 'material',   material);
  setFilter('md', 'year',       year);
  setFilter('md', 'dateFrom',   dateFrom);
  setFilter('md', 'dateTo',     dateTo);
  setFilter('md', 'search',     search);

  state.pagination.md.page = 1;
  renderMdTab();
}

export function clearMdFilters() {
  clearFilters('md');

  // Reset dropdowns
  ['filterMdDiscipline', 'filterMdEntity', 'filterMdProject',
   'filterMdSupplier', 'filterMdMaterial', 'filterMdYear'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset date inputs
  const dateFrom = document.getElementById('filterMdFrom');
  const dateTo   = document.getElementById('filterMdTo');
  if (dateFrom) dateFrom.value = '';
  if (dateTo)   dateTo.value = '';

  // Reset search
  const searchInput = document.getElementById('mdSearchInput');
  if (searchInput) searchInput.value = '';

  state.pagination.md.page = 1;
  renderMdTab();
}

// ─── Filter Event Handlers ──────────────────────────────────────

function attachMdFilterHandlers() {
  // Dropdown change handlers
  const dropdownIds = [
    'filterMdDiscipline', 'filterMdEntity', 'filterMdProject',
    'filterMdSupplier', 'filterMdMaterial', 'filterMdYear'
  ];
  dropdownIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => applyMdFilters());
  });

  // Date inputs
  ['filterMdFrom', 'filterMdTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => applyMdFilters());
  });

  // Search input debounced
  const searchInput = document.getElementById('mdSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => applyMdFilters(), 300));
  }

  // Clear filters button
  const clearBtn = document.getElementById('mdClearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => clearMdFilters());
  }
}

// ─── Supplier Selection Listener ────────────────────────────────

function listenForSupplierSelection() {
  window.addEventListener('supplierSelected', e => {
    const { name } = e.detail || {};
    if (!name) return;

    // Look up full supplier record from state.suppliers
    const match = (state.suppliers || []).find(
      s => s.name === name || s.supplier === name
    );

    state.selectedSupplier = match || { name: name };
    renderSupplierProfileCard(state.selectedSupplier);
  });
}

// ─── Pagination Handlers ────────────────────────────────────────

function attachPaginationHandlers(container) {
  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (!isNaN(page) && page >= 1) {
        state.pagination.md.page = page;
        renderMdPoDetailTable(getFilteredMdPOs());
      }
    });
  });
}

// ─── Helpers ────────────────────────────────────────────────────

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
