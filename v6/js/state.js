// ─── V6 Supply Chain Intel Hub — Centralized State Management ───
// ES module: import { state, setFilter, ... } from './state.js'

export const state = {
  dashboard: null,
  quotations: [],
  purchaseOrders: [],
  suppliers: [],
  employees: [],
  clientCountryMap: {},
  fxRates: {
    USD: 1,
    AED: 3.6725,
    SAR: 3.75,
    KWD: 0.3077,
    QAR: 3.64,
    NPR: 133.5,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83,
    JPY: 149.5,
    BHD: 0.376,
    OMR: 0.385
  },
  activeTab: 'supplier-marketplace',
  filters: {
    sm:  { entity: '', project: '', supplier: '', status: '', material: '', discipline: '', search: '' },
    gsa: { entity: '', supplier: '', project: '', material: '', discipline: '', poType: '', year: '', dateFrom: '', dateTo: '', search: '' },
    md:  { entity: '', supplier: '', project: '', material: '', discipline: '', year: '', dateFrom: '', dateTo: '', search: '' }
  },
  pagination: {
    sm:  { page: 1, pageSize: 25 },
    gsa: { page: 1, pageSize: 25, sortField: 'poDate', sortDir: 'desc' },
    md:  { page: 1, pageSize: 25 }
  },
  charts: {},
  initialized: { sm: false, gsa: false, md: false },
  selectedSupplier: null
};

// ─── Filter helpers ─────────────────────────────────────────────

export function setFilter(tab, field, value) {
  if (state.filters[tab]) {
    state.filters[tab][field] = value;
  }
}

export function clearFilters(tab) {
  if (state.filters[tab]) {
    for (const key of Object.keys(state.filters[tab])) {
      state.filters[tab][key] = '';
    }
  }
}

// ─── Filtering — Quotations (Supplier Marketplace) ─────────────

function matchesSearch(record, fields, term) {
  if (!term) return true;
  const lower = term.toLowerCase();
  return fields.some(f => {
    const val = record[f];
    return val && String(val).toLowerCase().includes(lower);
  });
}

export function getFilteredQuotations() {
  const f = state.filters.sm;
  return state.quotations.filter(q => {
    if (f.entity   && q.entity       !== f.entity)     return false;
    if (f.project  && q.projectName  !== f.project)    return false;
    if (f.supplier && q.client       !== f.supplier)   return false;
    if (f.status   && q.status       !== f.status)     return false;
    if (f.material && q.material     !== f.material)   return false;
    if (f.discipline && q.discipline !== f.discipline) return false;
    if (f.search && !matchesSearch(q,
      ['quotationNumber', 'projectName', 'description', 'material', 'client', 'contact'],
      f.search)) return false;
    return true;
  });
}

// ─── Filtering — Purchase Orders (Global Spend Analysis) ────────

export function getFilteredPOs() {
  const f = state.filters.gsa;
  return state.purchaseOrders.filter(po => {
    if (f.entity     && po.entity     !== f.entity)     return false;
    if (f.supplier   && po.supplier   !== f.supplier)   return false;
    if (f.project    && po.project    !== f.project)    return false;
    if (f.material   && po.material   !== f.material)   return false;
    if (f.discipline && po.discipline !== f.discipline) return false;
    if (f.poType     && po.poType     !== f.poType)     return false;
    if (f.year) {
      const poYear = po.poDate ? new Date(po.poDate).getFullYear() : null;
      if (poYear !== parseInt(f.year, 10)) return false;
    }
    if (f.dateFrom && po.poDate && po.poDate < f.dateFrom) return false;
    if (f.dateTo   && po.poDate && po.poDate > f.dateTo)   return false;
    if (f.search && !matchesSearch(po,
      ['poNumber', 'poName', 'supplier', 'project', 'material'],
      f.search)) return false;
    return true;
  });
}

// ─── Filtering — Material / Discipline POs ──────────────────────

export function getFilteredMdPOs() {
  const f = state.filters.md;
  return state.purchaseOrders.filter(po => {
    if (f.entity     && po.entity     !== f.entity)     return false;
    if (f.supplier   && po.supplier   !== f.supplier)   return false;
    if (f.project    && po.project    !== f.project)    return false;
    if (f.material   && po.material   !== f.material)   return false;
    if (f.discipline && po.discipline !== f.discipline) return false;
    if (f.year) {
      const poYear = po.poDate ? new Date(po.poDate).getFullYear() : null;
      if (poYear !== parseInt(f.year, 10)) return false;
    }
    if (f.dateFrom && po.poDate && po.poDate < f.dateFrom) return false;
    if (f.dateTo   && po.poDate && po.poDate > f.dateTo)   return false;
    if (f.search && !matchesSearch(po,
      ['poNumber', 'poName', 'supplier', 'project', 'material'],
      f.search)) return false;
    return true;
  });
}

// ─── Filtering — Material / Discipline Quotations ───────────────

export function getFilteredMdQuotations() {
  const f = state.filters.md;
  return state.quotations.filter(q => {
    if (f.entity     && q.entity       !== f.entity)     return false;
    if (f.supplier   && q.client       !== f.supplier)   return false;
    if (f.project    && q.projectName  !== f.project)    return false;
    if (f.material   && q.material     !== f.material)   return false;
    if (f.discipline && q.discipline   !== f.discipline) return false;
    if (f.year) {
      const qYear = q.quotationDate ? new Date(q.quotationDate).getFullYear() : null;
      if (qYear !== parseInt(f.year, 10)) return false;
    }
    if (f.dateFrom && q.quotationDate && q.quotationDate < f.dateFrom) return false;
    if (f.dateTo   && q.quotationDate && q.quotationDate > f.dateTo)   return false;
    if (f.search && !matchesSearch(q,
      ['quotationNumber', 'projectName', 'description', 'material', 'client', 'contact'],
      f.search)) return false;
    return true;
  });
}

// ─── Chart lifecycle ────────────────────────────────────────────

export function destroyChart(chartId) {
  if (state.charts[chartId]) {
    try { state.charts[chartId].destroy(); } catch (_) { /* already gone */ }
    delete state.charts[chartId];
  }
}

export function setChart(chartId, instance) {
  destroyChart(chartId);
  state.charts[chartId] = instance;
}

// ─── Pagination ─────────────────────────────────────────────────

export function paginate(items, tab) {
  const p = state.pagination[tab];
  if (!p) return { items, total: items.length, page: 1, pageSize: items.length, totalPages: 1 };

  const { page, pageSize } = p;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const sliced = items.slice(start, start + pageSize);

  return { items: sliced, total, page: safePage, pageSize, totalPages };
}
