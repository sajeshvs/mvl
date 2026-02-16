// ─── V6 Supply Chain Intel Hub — Global Spend Analysis Charts ───
// ES module: import { renderSpendTrendChart, ... } from './charts-gsa.js'

import { state, destroyChart, setChart } from './state.js';
import { formatCurrency, formatNumber } from './utils.js';

// ─── Theme & Palette ────────────────────────────────────────────

const GSA_PRIMARY   = '#d96f3c';
const GSA_SECONDARY = '#e8824a';
const GSA_DARK      = '#c0562a';
const GSA_LINE      = '#8B4513';

const GREEN_GRADIENT_START = '#27ae60';
const GREEN_GRADIENT_END   = '#2ecc71';
const RED_GRADIENT_START   = '#c0392b';
const RED_GRADIENT_END     = '#e74c3c';

const CHART_FONT = "'Segoe UI', system-ui, sans-serif";

// ─── Helpers ────────────────────────────────────────────────────

function chartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { font: { family: CHART_FONT, size: 12 } } }
    }
  };
}

function getCanvas(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[charts-gsa] Canvas #${id} not found`);
    return null;
  }
  return el.getContext('2d');
}

function truncateLabel(text, maxLen = 25) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

function dispatchFilter(type, value) {
  window.dispatchEvent(new CustomEvent('chartFilterApplied', {
    detail: { type, value }
  }));
}

function gradientColors(count, startHex, endHex) {
  const start = hexToRgb(startHex);
  const end   = hexToRgb(endHex);
  const colors = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const r = Math.round(start.r + t * (end.r - start.r));
    const g = Math.round(start.g + t * (end.g - start.g));
    const b = Math.round(start.b + t * (end.b - start.b));
    colors.push(`rgb(${r}, ${g}, ${b})`);
  }
  return colors;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}

function orangeGradient(count) {
  return gradientColors(count, GSA_PRIMARY, GSA_SECONDARY);
}

// ─── 1. Spend Trend Chart (Stacked Bar + Line) ─────────────────

export function renderSpendTrendChart(annualData) {
  const CHART_ID = 'gsaSpendTrend';
  const CANVAS   = 'gsaSpendTrendChart';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !annualData || !annualData.length) return;

  // Sort by year ascending
  const sorted = [...annualData].sort((a, b) => a.year - b.year);

  const labels     = sorted.map(d => String(d.year));
  const baseValues = sorted.map(d => d.baseValue || 0);
  const changeValues = sorted.map(d => d.changeValue || 0);

  // Running total
  let runningTotal = 0;
  const runningTotals = sorted.map(d => {
    runningTotal += (d.totalValue || 0);
    return runningTotal;
  });

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Base PO Value',
          data: baseValues,
          backgroundColor: GSA_SECONDARY,
          borderColor: GSA_SECONDARY,
          borderWidth: 1,
          stack: 'spend',
          order: 2
        },
        {
          label: 'Change Orders',
          data: changeValues,
          backgroundColor: GSA_DARK,
          borderColor: GSA_DARK,
          borderWidth: 1,
          stack: 'spend',
          order: 2
        },
        {
          label: 'Running Total',
          data: runningTotals,
          type: 'line',
          borderColor: GSA_LINE,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: GSA_LINE,
          tension: 0.3,
          yAxisID: 'yRight',
          order: 1
        }
      ]
    },
    options: {
      ...chartDefaults(),
      interaction: { mode: 'index', intersect: false },
      onClick(_event, elements) {
        if (elements.length) {
          const idx = elements[0].index;
          const year = sorted[idx]?.year;
          if (year) dispatchFilter('year', year);
        }
      },
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: 'Year', font: { family: CHART_FONT } },
          ticks: { font: { family: CHART_FONT } }
        },
        y: {
          stacked: true,
          position: 'left',
          title: { display: true, text: 'Spend (USD)', font: { family: CHART_FONT } },
          ticks: {
            font: { family: CHART_FONT },
            callback: v => formatCurrency(v)
          }
        },
        yRight: {
          position: 'right',
          title: { display: true, text: 'Running Total (USD)', font: { family: CHART_FONT } },
          ticks: {
            font: { family: CHART_FONT },
            callback: v => formatCurrency(v)
          },
          grid: { drawOnChartArea: false }
        }
      },
      plugins: {
        ...chartDefaults().plugins,
        tooltip: {
          callbacks: {
            label(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${formatCurrency(value)}`;
            }
          }
        }
      }
    }
  });

  setChart(CHART_ID, chart);
}

// ─── 2. Entity Spend Chart (Horizontal Bar) ────────────────────

export function renderEntitySpendChart(entityData) {
  const CHART_ID = 'gsaEntityChart';
  const CANVAS   = 'gsaEntityChart';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !entityData || !entityData.length) return;

  // Sort descending by poSpendUSD, top 15
  const sorted = [...entityData]
    .sort((a, b) => (b.poSpendUSD || 0) - (a.poSpendUSD || 0))
    .slice(0, 15);

  const labels = sorted.map(d => truncateLabel(d.entity));
  const values = sorted.map(d => d.poSpendUSD || 0);
  const barColors = orangeGradient(sorted.length);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'PO Spend (USD)',
        data: values,
        backgroundColor: barColors,
        hoverBackgroundColor: GSA_PRIMARY,
        borderColor: barColors,
        borderWidth: 1
      }]
    },
    options: {
      ...chartDefaults(),
      indexAxis: 'y',
      onClick(_event, elements) {
        if (elements.length) {
          const idx = elements[0].index;
          const entity = sorted[idx]?.entity;
          if (entity) dispatchFilter('entity', entity);
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Spend (USD)', font: { family: CHART_FONT } },
          ticks: {
            font: { family: CHART_FONT },
            callback: v => formatCurrency(v)
          }
        },
        y: {
          ticks: { font: { family: CHART_FONT, size: 11 } }
        }
      },
      plugins: {
        ...chartDefaults().plugins,
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(items) { return sorted[items[0]?.dataIndex]?.entity || ''; },
            label(context) {
              const d = sorted[context.dataIndex];
              return [
                `Spend: ${formatCurrency(d.poSpendUSD)}`,
                `POs: ${formatNumber(d.poCount)}`,
                `Base: ${formatCurrency(d.baseValue)}`,
                `Change: ${formatCurrency(d.changeValue)}`
              ];
            }
          }
        }
      }
    }
  });

  setChart(CHART_ID, chart);
}

// ─── 3. Project Spend Chart (Horizontal Bar) ───────────────────

export function renderProjectSpendChart(projectData) {
  const CHART_ID = 'gsaProjectChart';
  const CANVAS   = 'gsaProjectChart';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !projectData || !projectData.length) return;

  // Sort descending by totalSpendUSD, top 15
  const sorted = [...projectData]
    .sort((a, b) => (b.totalSpendUSD || 0) - (a.totalSpendUSD || 0))
    .slice(0, 15);

  const labels = sorted.map(d => truncateLabel(d.project));
  const values = sorted.map(d => d.totalSpendUSD || 0);
  const barColors = orangeGradient(sorted.length);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Total Spend (USD)',
        data: values,
        backgroundColor: barColors,
        hoverBackgroundColor: GSA_PRIMARY,
        borderColor: barColors,
        borderWidth: 1
      }]
    },
    options: {
      ...chartDefaults(),
      indexAxis: 'y',
      onClick(_event, elements) {
        if (elements.length) {
          const idx = elements[0].index;
          const project = sorted[idx]?.project;
          if (project) dispatchFilter('project', project);
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Spend (USD)', font: { family: CHART_FONT } },
          ticks: {
            font: { family: CHART_FONT },
            callback: v => formatCurrency(v)
          }
        },
        y: {
          ticks: { font: { family: CHART_FONT, size: 11 } }
        }
      },
      plugins: {
        ...chartDefaults().plugins,
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(items) { return sorted[items[0]?.dataIndex]?.project || ''; },
            label(context) {
              const d = sorted[context.dataIndex];
              return [
                `Spend: ${formatCurrency(d.totalSpendUSD)}`,
                `POs: ${formatNumber(d.poCount)}`
              ];
            }
          }
        }
      }
    }
  });

  setChart(CHART_ID, chart);
}

// ─── 4. Supplier Charts (Top & Bottom) ─────────────────────────

export function renderSupplierCharts(rankings) {
  if (!rankings) return;
  renderTopSuppliersChart(rankings.top || []);
  renderBottomSuppliersChart(rankings.bottom || []);
}

function renderTopSuppliersChart(topData) {
  const CHART_ID = 'gsaTopSuppliers';
  const CANVAS   = 'gsaTopSuppliersChart';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !topData.length) return;

  const sorted = [...topData]
    .sort((a, b) => (b.totalSpendUSD || 0) - (a.totalSpendUSD || 0))
    .slice(0, 10);

  const labels = sorted.map(d => truncateLabel(d.name));
  const values = sorted.map(d => d.totalSpendUSD || 0);
  const barColors = gradientColors(sorted.length, GREEN_GRADIENT_START, GREEN_GRADIENT_END);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Top Supplier Spend (USD)',
        data: values,
        backgroundColor: barColors,
        hoverBackgroundColor: GREEN_GRADIENT_START,
        borderColor: barColors,
        borderWidth: 1
      }]
    },
    options: {
      ...chartDefaults(),
      indexAxis: 'y',
      onClick(_event, elements) {
        if (elements.length) {
          const idx = elements[0].index;
          const name = sorted[idx]?.name;
          if (name) dispatchFilter('supplier', name);
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Spend (USD)', font: { family: CHART_FONT } },
          ticks: {
            font: { family: CHART_FONT },
            callback: v => formatCurrency(v)
          }
        },
        y: {
          ticks: { font: { family: CHART_FONT, size: 11 } }
        }
      },
      plugins: {
        ...chartDefaults().plugins,
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(items) { return sorted[items[0]?.dataIndex]?.name || ''; },
            label(context) {
              const d = sorted[context.dataIndex];
              return [
                `Spend: ${formatCurrency(d.totalSpendUSD)}`,
                `POs: ${formatNumber(d.poCount)}`
              ];
            }
          }
        }
      }
    }
  });

  setChart(CHART_ID, chart);
}

function renderBottomSuppliersChart(bottomData) {
  const CHART_ID = 'gsaBottomSuppliers';
  const CANVAS   = 'gsaBottomSuppliersChart';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !bottomData.length) return;

  const sorted = [...bottomData]
    .sort((a, b) => (a.totalSpendUSD || 0) - (b.totalSpendUSD || 0))
    .slice(0, 10);

  const labels = sorted.map(d => truncateLabel(d.name));
  const values = sorted.map(d => d.totalSpendUSD || 0);
  const barColors = gradientColors(sorted.length, RED_GRADIENT_START, RED_GRADIENT_END);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Bottom Supplier Spend (USD)',
        data: values,
        backgroundColor: barColors,
        hoverBackgroundColor: RED_GRADIENT_START,
        borderColor: barColors,
        borderWidth: 1
      }]
    },
    options: {
      ...chartDefaults(),
      indexAxis: 'y',
      onClick(_event, elements) {
        if (elements.length) {
          const idx = elements[0].index;
          const name = sorted[idx]?.name;
          if (name) dispatchFilter('supplier', name);
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Spend (USD)', font: { family: CHART_FONT } },
          ticks: {
            font: { family: CHART_FONT },
            callback: v => formatCurrency(v)
          }
        },
        y: {
          ticks: { font: { family: CHART_FONT, size: 11 } }
        }
      },
      plugins: {
        ...chartDefaults().plugins,
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(items) { return sorted[items[0]?.dataIndex]?.name || ''; },
            label(context) {
              const d = sorted[context.dataIndex];
              return [
                `Spend: ${formatCurrency(d.totalSpendUSD)}`,
                `POs: ${formatNumber(d.poCount)}`
              ];
            }
          }
        }
      }
    }
  });

  setChart(CHART_ID, chart);
}

// ─── 5. GSA KPI Cards (DOM updates, not Chart.js) ──────────────

export function renderGSAKPIs(summary, filteredPOs) {
  const pos = filteredPOs || [];

  // Calculate KPIs from filtered POs
  const poCount = pos.length;

  const totalSpend = pos.reduce((sum, po) => sum + (Number(po.poValueUSD) || 0), 0);

  const changeOrders = pos.filter(po => po.isChangeOrder);
  const coCount = changeOrders.length;
  const coAmount = changeOrders.reduce((sum, po) =>
    sum + (Number(po.valueUSD) || 0), 0
  );

  const uniqueSuppliers = new Set(
    pos.map(po => (po.supplier || po.supplierName || '')).filter(Boolean)
  ).size;

  const uniqueEntities = new Set(
    pos.map(po => (po.entity || po.entityName || '')).filter(Boolean)
  ).size;

  // Update DOM elements
  setText('gsaKpiPoCount', formatNumber(poCount));
  setText('gsaKpiTotalSpend', formatCurrency(totalSpend));
  setText('gsaKpiCoCount', formatNumber(coCount));
  setText('gsaKpiCoAmount', formatCurrency(coAmount));
  setText('gsaKpiSupplierCount', formatNumber(uniqueSuppliers));
  setText('gsaKpiEntityCount', formatNumber(uniqueEntities));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
