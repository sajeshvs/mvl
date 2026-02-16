// ─── V6 Supply Chain Intel Hub — Supplier Marketplace Charts ────
// ES module: import { renderEntityChart, ... } from './charts-sm.js'

import { state, destroyChart, setChart } from './state.js';
import { formatCurrency, formatNumber } from './utils.js';

// ─── Theme & Palette ────────────────────────────────────────────

const SM_PRIMARY   = '#004578';
const SM_SECONDARY = '#0064a3';

const DISCIPLINE_PALETTE = [
  '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#2980b9', '#27ae60', '#c0392b',
  '#8e44ad', '#16a085', '#d35400', '#2c3e50', '#7f8c8d',
  '#34495e', '#f1c40f', '#e84393', '#00cec9', '#6c5ce7'
];

const CHART_FONT = "'Segoe UI', system-ui, sans-serif";

const STATUS_COLORS = {
  order:      '#2ecc71',
  ordered:    '#2ecc71',
  quotation:  '#3498db',
  quoted:     '#3498db',
  waiting:    '#f39c12',
  pending:    '#f39c12',
  cancelled:  '#e74c3c',
  canceled:   '#e74c3c'
};

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

function blueGradient(ctx, barCount) {
  const colors = [];
  for (let i = 0; i < barCount; i++) {
    const t = barCount > 1 ? i / (barCount - 1) : 0;
    // Gradient from SM_PRIMARY to SM_SECONDARY
    const r = Math.round(0 + t * (0 - 0));
    const g = Math.round(69 + t * (100 - 69));
    const b = Math.round(120 + t * (163 - 120));
    colors.push(`rgb(${r}, ${g}, ${b})`);
  }
  return colors;
}

function getCanvas(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[charts-sm] Canvas #${id} not found`);
    return null;
  }
  return el.getContext('2d');
}

// ─── 1. Entity Chart (Horizontal Bar) ──────────────────────────

export function renderEntityChart(data, viewType = 'quote') {
  const CHART_ID = 'entityChart';
  const CANVAS   = 'entityChartCanvas';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !data || !data.length) return;

  // Pick value field
  const valueField = viewType === 'spend' ? 'poSpendUSD' : 'quotationValueUSD';
  const labelSuffix = viewType === 'spend' ? 'PO Spend (USD)' : 'Quotation Value (USD)';

  // Sort descending, take top 15
  const sorted = [...data]
    .sort((a, b) => (Number(b[valueField]) || 0) - (Number(a[valueField]) || 0))
    .slice(0, 15);

  const labels = sorted.map(d => d.entity || 'Unknown');
  const values = sorted.map(d => Number(d[valueField]) || 0);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: labelSuffix,
        data: values,
        backgroundColor: blueGradient(ctx, labels.length),
        borderColor: SM_PRIMARY,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      ...chartDefaults(),
      indexAxis: 'y',
      plugins: {
        ...chartDefaults().plugins,
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (tip) => `${labelSuffix}: ${formatCurrency(tip.raw)}`
          },
          titleFont: { family: CHART_FONT },
          bodyFont:  { family: CHART_FONT }
        }
      },
      scales: {
        x: {
          title: { display: true, text: labelSuffix, font: { family: CHART_FONT } },
          ticks: {
            callback: (v) => formatCurrency(v),
            font: { family: CHART_FONT }
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },
        y: {
          ticks: { font: { family: CHART_FONT, size: 11 } },
          grid: { display: false }
        }
      }
    }
  });

  setChart(CHART_ID, chart);
}

// ─── 2. Material / Discipline Chart (Multi-type) ───────────────

export function renderMaterialChart(data, chartType = 'bar') {
  const CHART_ID = 'materialChart';
  const CANVAS   = 'materialChartCanvas';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !data || !data.length) return;

  const labels = data.map(d => d.discipline || 'Unknown');
  const isCircular = chartType === 'pie' || chartType === 'doughnut';
  const values = data.map(d => Number(isCircular ? d.quotedValueUSD : d.quotedValueUSD) || 0);
  const colors = labels.map((_, i) => DISCIPLINE_PALETTE[i % DISCIPLINE_PALETTE.length]);
  const borderColors = colors.map(c => c);

  let config;

  if (chartType === 'bar') {
    config = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Quoted Value (USD)',
          data: values,
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        ...chartDefaults(),
        plugins: {
          ...chartDefaults().plugins,
          legend: { display: false },
          tooltip: {
            callbacks: { label: (tip) => `${tip.label}: ${formatCurrency(tip.raw)}` },
            titleFont: { family: CHART_FONT },
            bodyFont:  { family: CHART_FONT }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Value (USD)', font: { family: CHART_FONT } },
            ticks: { callback: (v) => formatCurrency(v), font: { family: CHART_FONT } },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          x: {
            ticks: { font: { family: CHART_FONT, size: 10 }, maxRotation: 45 },
            grid: { display: false }
          }
        }
      }
    };
  } else if (isCircular) {
    config = {
      type: chartType,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        ...chartDefaults(),
        plugins: {
          ...chartDefaults().plugins,
          legend: {
            position: 'right',
            labels: { font: { family: CHART_FONT, size: 11 }, padding: 12, usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: (tip) => {
                const total = tip.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((tip.raw / total) * 100).toFixed(1) : 0;
                return `${tip.label}: ${formatCurrency(tip.raw)} (${pct}%)`;
              }
            },
            titleFont: { family: CHART_FONT },
            bodyFont:  { family: CHART_FONT }
          }
        }
      }
    };
  } else if (chartType === 'radar') {
    config = {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Quoted Value (USD)',
          data: values,
          backgroundColor: SM_PRIMARY + '33',
          borderColor: SM_PRIMARY,
          borderWidth: 2,
          pointBackgroundColor: SM_SECONDARY,
          pointRadius: 4
        }]
      },
      options: {
        ...chartDefaults(),
        plugins: {
          ...chartDefaults().plugins,
          legend: { display: false },
          tooltip: {
            callbacks: { label: (tip) => `${tip.label}: ${formatCurrency(tip.raw)}` },
            titleFont: { family: CHART_FONT },
            bodyFont:  { family: CHART_FONT }
          }
        },
        scales: {
          r: {
            ticks: {
              callback: (v) => formatCurrency(v),
              font: { family: CHART_FONT, size: 10 },
              backdropColor: 'transparent'
            },
            pointLabels: { font: { family: CHART_FONT, size: 11 } },
            grid: { color: 'rgba(0,0,0,0.08)' }
          }
        }
      }
    };
  } else {
    // Fallback to bar
    return renderMaterialChart(data, 'bar');
  }

  const chart = new Chart(ctx, config);
  setChart(CHART_ID, chart);
}

// ─── 3. Trend Chart (Line — Quotes / Orders / Cancelled) ───────

export function renderTrendChart(data) {
  const CHART_ID = 'trendChart';
  const CANVAS   = 'trendChart';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !data || !data.length) return;

  const labels = data.map(d => d.yearMonth);

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Quotes',
          data: data.map(d => Number(d.quotes) || 0),
          borderColor: '#3498db',
          backgroundColor: '#3498db22',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3498db'
        },
        {
          label: 'Orders',
          data: data.map(d => Number(d.orders) || 0),
          borderColor: '#2ecc71',
          backgroundColor: '#2ecc7122',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#2ecc71'
        },
        {
          label: 'Cancelled',
          data: data.map(d => Number(d.cancelled) || 0),
          borderColor: '#e74c3c',
          backgroundColor: '#e74c3c22',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#e74c3c'
        }
      ]
    },
    options: {
      ...chartDefaults(),
      interaction: { mode: 'index', intersect: false },
      plugins: {
        ...chartDefaults().plugins,
        legend: {
          position: 'top',
          labels: { font: { family: CHART_FONT, size: 12 }, usePointStyle: true, padding: 16 }
        },
        tooltip: {
          callbacks: {
            afterBody: (tips) => {
              const idx = tips[0]?.dataIndex;
              if (idx == null) return '';
              const row = data[idx];
              if (!row) return '';
              return `\nQuote Value: ${formatCurrency(row.quoteValueUSD)}\nOrder Value: ${formatCurrency(row.orderValueUSD)}`;
            }
          },
          titleFont: { family: CHART_FONT },
          bodyFont:  { family: CHART_FONT }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Month', font: { family: CHART_FONT } },
          ticks: { font: { family: CHART_FONT, size: 10 }, maxRotation: 45 },
          grid: { color: 'rgba(0,0,0,0.04)' }
        },
        y: {
          title: { display: true, text: 'Count', font: { family: CHART_FONT } },
          ticks: { font: { family: CHART_FONT }, callback: (v) => formatNumber(v) },
          grid: { color: 'rgba(0,0,0,0.06)' },
          beginAtZero: true
        }
      }
    }
  });

  setChart(CHART_ID, chart);
}

// ─── 4. Quotation Time / Conversion Rate by Entity (Bar) ───────

export function renderQuotationTimeChart(data) {
  const CHART_ID = 'quotationTimeChart';
  const CANVAS   = 'quotationTimeChart';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !data || !data.length) return;

  // data: [{entity, quotationCount, poCount, ...}]
  // Compute conversion rate = poCount / quotationCount * 100
  const processed = data
    .map(d => ({
      entity: d.entity || 'Unknown',
      rate: (Number(d.quotationCount) || 0) > 0
        ? ((Number(d.poCount) || 0) / Number(d.quotationCount)) * 100
        : 0
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 15);

  const labels = processed.map(d => d.entity);
  const values = processed.map(d => d.rate);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Conversion Rate (%)',
        data: values,
        backgroundColor: values.map(v => {
          if (v >= 60) return '#2ecc71CC';
          if (v >= 30) return '#f39c12CC';
          return '#e74c3cCC';
        }),
        borderColor: values.map(v => {
          if (v >= 60) return '#27ae60';
          if (v >= 30) return '#e67e22';
          return '#c0392b';
        }),
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      ...chartDefaults(),
      indexAxis: 'y',
      plugins: {
        ...chartDefaults().plugins,
        legend: { display: false },
        title: {
          display: true,
          text: 'Conversion Rate by Entity (Quote → Order)',
          font: { family: CHART_FONT, size: 14, weight: '600' },
          color: SM_PRIMARY,
          padding: { bottom: 12 }
        },
        tooltip: {
          callbacks: {
            label: (tip) => `Conversion: ${tip.raw.toFixed(1)}%`
          },
          titleFont: { family: CHART_FONT },
          bodyFont:  { family: CHART_FONT }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Conversion Rate (%)', font: { family: CHART_FONT } },
          ticks: { callback: (v) => `${v}%`, font: { family: CHART_FONT } },
          grid: { color: 'rgba(0,0,0,0.06)' },
          min: 0,
          max: 100
        },
        y: {
          ticks: { font: { family: CHART_FONT, size: 11 } },
          grid: { display: false }
        }
      }
    }
  });

  setChart(CHART_ID, chart);
}

// ─── 5. Status Bars (HTML) ──────────────────────────────────────

export function renderStatusBars(statusData) {
  const container = document.getElementById('statusChart');
  if (!statusData || !statusData.length) {
    if (container) container.innerHTML = '<p class="text-muted">No status data available</p>';
    return '';
  }

  const totalCount = statusData.reduce((sum, s) => sum + (Number(s.count) || 0), 0);

  const html = statusData.map(s => {
    const count = Number(s.count) || 0;
    const pct = totalCount > 0 ? ((count / totalCount) * 100) : 0;
    const value = Number(s.totalValueUSD) || 0;
    const status = (s.status || 'unknown').toLowerCase();

    // Determine color
    let color = '#7f8c8d';
    for (const [key, c] of Object.entries(STATUS_COLORS)) {
      if (status.includes(key)) { color = c; break; }
    }

    return `
      <div class="status-bar-item" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-weight:600;font-size:13px;color:${color};text-transform:capitalize;">
            ${s.status || 'Unknown'}
          </span>
          <span style="font-size:12px;color:#666;">
            ${formatNumber(count)} (${pct.toFixed(1)}%) &mdash; ${formatCurrency(value)}
          </span>
        </div>
        <div style="background:#e9ecef;border-radius:6px;height:8px;overflow:hidden;">
          <div style="width:${Math.max(pct, 1)}%;height:100%;background:${color};border-radius:6px;transition:width 0.5s ease;"></div>
        </div>
      </div>`;
  }).join('');

  if (container) container.innerHTML = html;
  return html;
}

// ─── 6. Top Suppliers Ranked List (HTML) ────────────────────────

export function renderTopSuppliersList(rankings) {
  const container = document.getElementById('topSuppliers');
  if (!rankings || !rankings.length) {
    if (container) container.innerHTML = '<p class="text-muted">No supplier data available</p>';
    return '';
  }

  // Top 10
  const top = rankings.slice(0, 10);
  const maxSpend = Math.max(...top.map(s => Number(s.totalSpendUSD) || 0), 1);

  const medals = ['🥇', '🥈', '🥉'];

  const html = top.map((s, i) => {
    const spend = Number(s.totalSpendUSD) || 0;
    const barPct = (spend / maxSpend) * 100;
    const badge = i < 3 ? `<span style="font-size:18px;margin-right:6px;">${medals[i]}</span>` : `<span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:50%;background:#e9ecef;color:#555;font-size:11px;font-weight:600;margin-right:6px;">${i + 1}</span>`;

    return `
      <div class="supplier-rank-item"
           style="padding:10px 12px;border-bottom:1px solid #f0f0f0;cursor:pointer;transition:background 0.15s;"
           onmouseenter="this.style.background='#f5f9fc'"
           onmouseleave="this.style.background='transparent'"
           onclick="this.dispatchEvent(new CustomEvent('supplierSelected',{bubbles:true,detail:{name:'${(s.name || '').replace(/'/g, "\\'")}'}}))">
        <div style="display:flex;align-items:center;margin-bottom:6px;">
          ${badge}
          <span style="font-weight:600;font-size:13px;color:#2c3e50;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${s.name || ''}">${s.name || 'Unknown'}</span>
          <span style="font-size:12px;color:#0064a3;font-weight:600;margin-left:8px;">${formatCurrency(spend)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;background:#e9ecef;border-radius:4px;height:6px;overflow:hidden;">
            <div style="width:${barPct.toFixed(1)}%;height:100%;background:linear-gradient(90deg,${SM_PRIMARY},${SM_SECONDARY});border-radius:4px;transition:width 0.5s ease;"></div>
          </div>
          <span style="font-size:11px;color:#888;white-space:nowrap;">${formatNumber(s.poCount || 0)} POs</span>
        </div>
      </div>`;
  }).join('');

  const wrapper = `<div style="max-height:480px;overflow-y:auto;">${html}</div>`;

  if (container) container.innerHTML = wrapper;
  return wrapper;
}

// ─── 7. Employee List (HTML) ────────────────────────────────────

export function renderEmployeeList(employees) {
  const container = document.getElementById('employeeList');
  if (!employees || !employees.length) {
    if (container) container.innerHTML = '<p class="text-muted">No employee data available</p>';
    return '';
  }

  // Top 15 by orderValueUSD
  const top = [...employees]
    .sort((a, b) => (Number(b.orderValueUSD) || 0) - (Number(a.orderValueUSD) || 0))
    .slice(0, 15);

  const html = top.map((emp, i) => {
    const winRate = Number(emp.winRate) || 0;
    let badgeColor, badgeText;

    if (winRate >= 70) {
      badgeColor = '#2ecc71'; badgeText = 'High';
    } else if (winRate >= 40) {
      badgeColor = '#f39c12'; badgeText = 'Mid';
    } else {
      badgeColor = '#e74c3c'; badgeText = 'Low';
    }

    return `
      <div class="employee-rank-item" style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;background:${SM_PRIMARY};color:#fff;font-size:10px;font-weight:600;">${i + 1}</span>
            <span style="font-weight:600;font-size:13px;color:#2c3e50;">${emp.name || 'Unknown'}</span>
          </div>
          <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;color:#fff;background:${badgeColor};" title="Win Rate: ${winRate.toFixed(1)}%">
            ${badgeText} ${winRate.toFixed(0)}%
          </span>
        </div>
        <div style="display:flex;gap:16px;font-size:12px;color:#666;">
          <span title="Quotations">📝 ${formatNumber(emp.quotationCount || 0)} quotes</span>
          <span title="Orders">📦 ${formatNumber(emp.orderCount || 0)} orders</span>
          <span title="Order Value" style="color:${SM_SECONDARY};font-weight:600;">${formatCurrency(emp.orderValueUSD || 0)}</span>
        </div>
      </div>`;
  }).join('');

  const wrapper = `<div style="max-height:480px;overflow-y:auto;">${html}</div>`;

  if (container) container.innerHTML = wrapper;
  return wrapper;
}
