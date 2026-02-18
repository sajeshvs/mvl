// ─── V6 Supply Chain Intel Hub — Main Application Entry Point ───
// ES module loaded by index.html: <script type="module" src="js/app.js"></script>

import { loadAllData, refreshFxRates } from './dataLoader.js';
import { state } from './state.js';
import { applyGSAFilters, clearGSAFilters, initGlobalSpendAnalysis, renderGSATab } from './tab-gsa.js';
import { applyMdFilters, clearMdFilters, initMaterialsDisciplines, renderMdTab } from './tab-md.js';
import { applySMFilters, clearSMFilters, initSupplierMarketplace, renderSMTab } from './tab-sm.js';
import { formatDate } from './utils.js';

// ─── Expose filter functions to window for onclick handlers ─────
window.applySMFilters = () => applySMFilters();
window.applyGSAFilters = () => applyGSAFilters();
window.applyMdFilters = () => applyMdFilters();

// ─── Tab Switching ──────────────────────────────────────────────

const TAB_IDS = ['supplier-marketplace', 'global-spend-analysis', 'materials-disciplines'];

function switchTab(tabId) {
  if (!TAB_IDS.includes(tabId)) return;

  state.activeTab = tabId;

  // Update nav tab buttons
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update tab content panels
  document.querySelectorAll('.tab-content').forEach(panel => {
    panel.classList.toggle('active', panel.id === 'tab-' + tabId);
  });

  // Lazy-initialize tabs on first visit
  if (tabId === 'global-spend-analysis') {
    initGlobalSpendAnalysis();
  } else if (tabId === 'materials-disciplines') {
    initMaterialsDisciplines();
  } else if (tabId === 'supplier-marketplace') {
    initSupplierMarketplace();
  }
}

function refreshActiveTab() {
  switch (state.activeTab) {
    case 'supplier-marketplace': renderSMTab(); break;
    case 'global-spend-analysis': renderGSATab(); break;
    case 'materials-disciplines': renderMdTab(); break;
  }
}

// ─── Loading Overlay ────────────────────────────────────────────

function showLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.add('hidden');
}

// ─── DOMContentLoaded — Bootstrap ───────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Show loading overlay
    showLoadingOverlay();

    // 2. Load all data
    await loadAllData();

    // 3. Initialize tab navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        if (tabId) switchTab(tabId);
      });
    });

    // 4. Initialize default tab (Supplier Marketplace)
    initSupplierMarketplace();

    // 5. Refresh FX rates (non-blocking)
    refreshFxRates();

    // 6. Listen for FX rate updates — re-render active tab
    document.addEventListener('fxRatesUpdated', () => {
      refreshActiveTab();
    });

    // 7. Hide loading overlay
    hideLoadingOverlay();

    // 8. Set up global event handlers
    setupGlobalEventHandlers();

    // 9. Update header last refresh time
    updateLastRefreshTime();

  } catch (err) {
    console.error('[App] Initialization failed:', err);
    hideLoadingOverlay();
  }
});

// ─── Global Event Handlers (Delegated) ──────────────────────────

function setupGlobalEventHandlers() {
  // Single document-level click listener for delegation
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-action]') || e.target;

    // ── Chart type toggles ────────────────────────────────────
    const chartToggle = e.target.closest('.chart-toggle-btn');
    if (chartToggle) {
      handleChartToggle(chartToggle);
      return;
    }

    // ── Pagination buttons ────────────────────────────────────
    const pageBtn = e.target.closest('.pagination-btn, .page-btn');
    if (pageBtn) {
      handlePaginationClick(pageBtn);
      return;
    }

    // ── Bottom tab buttons ────────────────────────────────────
    const bottomTab = e.target.closest('.bottom-tab-btn');
    if (bottomTab) {
      handleBottomTabSwitch(bottomTab);
      return;
    }

    // ── Clear filters buttons ─────────────────────────────────
    const clearBtn = e.target.closest('.clear-filters-btn');
    if (clearBtn) {
      handleClearFilters();
      return;
    }

    // ── Export buttons ────────────────────────────────────────
    const exportBtn = e.target.closest('.export-btn');
    if (exportBtn) {
      handleExport(exportBtn);
      return;
    }
  });

  // ── Sort handlers for tables ────────────────────────────────
  document.addEventListener('click', e => {
    const th = e.target.closest('[data-sort]');
    if (!th) return;
    handleSortClick(th);
  });
}

// ─── Chart Toggle Handler ───────────────────────────────────────

function handleChartToggle(btn) {
  const group = btn.closest('.chart-toggles');
  if (!group) return;

  // Update active state within group
  group.querySelectorAll('.chart-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const chartType = btn.dataset.chartType;
  const chartTarget = btn.dataset.chartTarget;

  if (chartTarget && chartType) {
    // Dispatch custom event for chart modules to listen to
    window.dispatchEvent(new CustomEvent('chartTypeChanged', {
      detail: { target: chartTarget, type: chartType }
    }));
  }
}

// ─── Pagination Click Handler ───────────────────────────────────

function handlePaginationClick(btn) {
  const page = parseInt(btn.dataset.page, 10);
  if (isNaN(page) || page < 1) return;

  const tab = state.activeTab;
  const tabKey = tab === 'supplier-marketplace' ? 'sm'
    : tab === 'global-spend-analysis' ? 'gsa'
      : tab === 'materials-disciplines' ? 'md'
        : null;

  if (tabKey && state.pagination[tabKey]) {
    state.pagination[tabKey].page = page;
    refreshActiveTab();
  }
}

// ─── Bottom Tab Switch Handler ──────────────────────────────────

function handleBottomTabSwitch(btn) {
  const group = btn.closest('.bottom-tabs');
  if (group) {
    group.querySelectorAll('.bottom-tab-btn').forEach(b => b.classList.remove('active'));
  }
  btn.classList.add('active');

  const type = btn.dataset.bottomTab;
  if (type) {
    window.dispatchEvent(new CustomEvent('bottomTabChanged', {
      detail: { type }
    }));
  }
}

// ─── Clear Filters Handler ─────────────────────────────────────

function handleClearFilters() {
  switch (state.activeTab) {
    case 'supplier-marketplace': clearSMFilters(); break;
    case 'global-spend-analysis': clearGSAFilters(); break;
    case 'materials-disciplines': clearMdFilters(); break;
  }
}

// ─── Sort Click Handler ─────────────────────────────────────────

function handleSortClick(th) {
  const field = th.dataset.sort;
  if (!field) return;

  const tab = state.activeTab;
  const tabKey = tab === 'supplier-marketplace' ? 'sm'
    : tab === 'global-spend-analysis' ? 'gsa'
      : tab === 'materials-disciplines' ? 'md'
        : null;

  if (!tabKey) return;

  const p = state.pagination[tabKey];
  if (p.sortField === field) {
    p.sortDir = p.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    p.sortField = field;
    p.sortDir = 'asc';
  }
  p.page = 1;

  // Update sort indicators
  const thead = th.closest('thead');
  if (thead) {
    thead.querySelectorAll('[data-sort]').forEach(h => {
      h.classList.remove('sort-asc', 'sort-desc');
    });
    th.classList.add(p.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
  }

  refreshActiveTab();
}

// ─── Export Handler ─────────────────────────────────────────────

function handleExport(btn) {
  const format = btn.dataset.format || 'csv';
  const target = btn.dataset.exportTarget || state.activeTab;

  window.dispatchEvent(new CustomEvent('exportRequested', {
    detail: { format, target }
  }));
}

// ─── Header Last Refresh Time ───────────────────────────────────

function updateLastRefreshTime() {
  const el = document.getElementById('lastRefresh');
  if (!el) return;

  const buildDate = state.dashboard?.metadata?.last_build_date
    || state.dashboard?.buildDate
    || null;

  if (buildDate) {
    el.textContent = formatDate(buildDate);
  } else {
    el.textContent = formatDate(new Date().toISOString());
  }
}

// ─── Keyboard Shortcuts ─────────────────────────────────────────

document.addEventListener('keydown', e => {
  // Ctrl+1/2/3 to switch tabs
  if (e.ctrlKey && !e.shiftKey && !e.altKey) {
    switch (e.key) {
      case '1':
        e.preventDefault();
        switchTab('supplier-marketplace');
        break;
      case '2':
        e.preventDefault();
        switchTab('global-spend-analysis');
        break;
      case '3':
        e.preventDefault();
        switchTab('materials-disciplines');
        break;
    }
  }
});
