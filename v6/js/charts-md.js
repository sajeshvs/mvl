// ─── V6 Supply Chain Intel Hub — Materials & Disciplines Charts ─
// ES module: import { renderDisciplineSpendChart, ... } from './charts-md.js'

import { state, destroyChart, setChart } from './state.js';
import { formatCurrency, formatNumber } from './utils.js';

// ─── Theme & Palette ────────────────────────────────────────────

const MD_PRIMARY   = '#0f3d5e';
const MD_SECONDARY = '#1a5a8a';
const MD_QUOTED    = '#4a9fd5';
const MD_ORDERED   = '#0f3d5e';

const DISCIPLINE_PALETTE = [
  '#0f3d5e', '#1a5a8a', '#4a9fd5', '#2ecc71', '#e74c3c',
  '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#2980b9',
  '#27ae60', '#c0392b', '#8e44ad', '#16a085', '#d35400',
  '#2c3e50', '#7f8c8d', '#34495e', '#f1c40f', '#e84393',
  '#00cec9', '#6c5ce7', '#fd79a8', '#55efc4', '#74b9ff'
];

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
    console.warn(`[charts-md] Canvas #${id} not found`);
    return null;
  }
  return el.getContext('2d');
}

function truncateLabel(text, maxLen = 25) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

function safeEl(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = safeEl(id);
  if (el) el.textContent = value;
}

function generateStars(rating) {
  const score = Math.round(Number(rating) || 0);
  const clamped = Math.min(5, Math.max(0, score));
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= clamped
      ? '<span class="star filled">★</span>'
      : '<span class="star empty">☆</span>';
  }
  return html;
}

// ─── 1. Discipline Spend Chart (Grouped Bar) ───────────────────

export function renderDisciplineSpendChart(disciplineData) {
  const CHART_ID = 'disciplineSpend';
  const CANVAS   = 'disciplineSpendChart';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !disciplineData || !disciplineData.length) return;

  // Sort by quoted value descending
  const sorted = [...disciplineData]
    .sort((a, b) => (Number(b.quotedValueUSD) || 0) - (Number(a.quotedValueUSD) || 0));

  const labels        = sorted.map(d => truncateLabel(d.discipline || 'Unknown'));
  const quotedValues  = sorted.map(d => Number(d.quotedValueUSD) || 0);
  const orderedValues = sorted.map(d => Number(d.orderedValueUSD) || 0);
  const quoteCounts   = sorted.map(d => Number(d.quotationCount) || 0);
  const poCounts      = sorted.map(d => Number(d.poCount) || 0);

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Quoted',
          data: quotedValues,
          backgroundColor: MD_QUOTED,
          borderColor: MD_QUOTED,
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Actual / Ordered',
          data: orderedValues,
          backgroundColor: MD_ORDERED,
          borderColor: MD_ORDERED,
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      ...chartDefaults(),
      plugins: {
        ...chartDefaults().plugins,
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: CHART_FONT, size: 12 }, usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            afterLabel(tip) {
              const idx = tip.dataIndex;
              if (tip.datasetIndex === 0) {
                return `Quotations: ${formatNumber(quoteCounts[idx])}`;
              }
              return `PO Count: ${formatNumber(poCounts[idx])}`;
            },
            label(tip) {
              return `${tip.dataset.label}: ${formatCurrency(tip.raw)}`;
            }
          },
          titleFont: { family: CHART_FONT },
          bodyFont:  { family: CHART_FONT }
        }
      },
      scales: {
        x: {
          ticks: {
            font: { family: CHART_FONT, size: 11 },
            maxRotation: 45,
            minRotation: 20
          },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: 'Value (USD)', font: { family: CHART_FONT } },
          ticks: {
            callback: (v) => formatCurrency(v),
            font: { family: CHART_FONT, size: 11 }
          },
          grid: { color: 'rgba(15, 61, 94, 0.08)' }
        }
      }
    }
  });

  setChart(CHART_ID, chart);
}

// ─── 2. Material Distribution Chart (Doughnut) ─────────────────

export function renderMaterialDistributionChart(disciplineData) {
  const CHART_ID = 'materialDistribution';
  const CANVAS   = 'materialDistributionChart';

  destroyChart(CHART_ID);

  const ctx = getCanvas(CANVAS);
  if (!ctx || !disciplineData || !disciplineData.length) return;

  // Sort by ordered value descending
  const sorted = [...disciplineData]
    .sort((a, b) => (Number(b.orderedValueUSD) || 0) - (Number(a.orderedValueUSD) || 0));

  const labels = sorted.map(d => d.discipline || 'Unknown');
  const values = sorted.map(d => Number(d.orderedValueUSD) || 0);
  const total  = values.reduce((s, v) => s + v, 0);
  const colors = sorted.map((_, i) => DISCIPLINE_PALETTE[i % DISCIPLINE_PALETTE.length]);

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      ...chartDefaults(),
      cutout: '55%',
      plugins: {
        ...chartDefaults().plugins,
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { family: CHART_FONT, size: 11 },
            padding: 12,
            usePointStyle: true,
            generateLabels(chart) {
              const data = chart.data;
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return {
                  text: `${truncateLabel(label, 20)} (${pct}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: '#ffffff',
                  lineWidth: 1,
                  hidden: false,
                  index: i
                };
              });
            }
          }
        },
        tooltip: {
          callbacks: {
            label(tip) {
              const val = tip.raw;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return `${tip.label}: ${formatCurrency(val)} (${pct}%)`;
            }
          },
          titleFont: { family: CHART_FONT },
          bodyFont:  { family: CHART_FONT }
        }
      }
    },
    plugins: [{
      id: 'centerText',
      afterDraw(chart) {
        const { ctx: context, chartArea } = chart;
        if (!chartArea) return;

        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        context.save();
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Label
        context.font = `600 12px ${CHART_FONT}`;
        context.fillStyle = '#666';
        context.fillText('Total Ordered', centerX, centerY - 12);

        // Value
        context.font = `700 18px ${CHART_FONT}`;
        context.fillStyle = MD_PRIMARY;
        context.fillText(formatCurrency(total), centerX, centerY + 12);

        context.restore();
      }
    }]
  });

  setChart(CHART_ID, chart);
}

// ─── 3. M&D KPI Cards ──────────────────────────────────────────

export function renderMdKPIs(filteredPOs, filteredQuotations) {
  // Discipline count — unique disciplines across both datasets
  const disciplineSet = new Set();
  if (filteredPOs) {
    filteredPOs.forEach(po => {
      if (po.discipline) disciplineSet.add(po.discipline);
    });
  }
  if (filteredQuotations) {
    filteredQuotations.forEach(q => {
      if (q.discipline) disciplineSet.add(q.discipline);
    });
  }
  setText('mdKpiDisciplineCount', formatNumber(disciplineSet.size));

  // Total Quoted
  const totalQuoted = (filteredQuotations || [])
    .reduce((sum, q) => sum + (Number(q.valueUSD) || 0), 0);
  setText('mdKpiTotalQuoted', formatCurrency(totalQuoted));

  // Total Ordered
  const totalOrdered = (filteredPOs || [])
    .reduce((sum, po) => sum + (Number(po.valueUSD) || 0), 0);
  setText('mdKpiTotalOrdered', formatCurrency(totalOrdered));

  // Supplier count — unique suppliers in POs
  const supplierSet = new Set();
  (filteredPOs || []).forEach(po => {
    if (po.supplier) supplierSet.add(po.supplier);
  });
  setText('mdKpiSupplierCount', formatNumber(supplierSet.size));

  // Project count — unique projects across both
  const projectSet = new Set();
  (filteredPOs || []).forEach(po => {
    if (po.project) projectSet.add(po.project);
  });
  (filteredQuotations || []).forEach(q => {
    const proj = q.projectName || q.project;
    if (proj) projectSet.add(proj);
  });
  setText('mdKpiProjectCount', formatNumber(projectSet.size));

  // Conversion Rate
  const conversionRate = totalQuoted > 0 ? (totalOrdered / totalQuoted) * 100 : 0;
  setText('mdKpiConversionRate', `${conversionRate.toFixed(1)}%`);
}

// ─── 4. Supplier Table ─────────────────────────────────────────

export function renderSupplierTable(suppliers, containerId = 'mdSupplierTableBody') {
  if (!suppliers || !suppliers.length) {
    return '<tr><td colspan="6" class="text-center">No suppliers found</td></tr>';
  }

  // Top 20 by spend
  const top = [...suppliers]
    .sort((a, b) => (Number(b.totalSpendUSD) || 0) - (Number(a.totalSpendUSD) || 0))
    .slice(0, 20);

  const html = top.map((s, idx) => {
    const stars = generateStars(s.ratingScore);
    return `<tr>
      <td>${truncateLabel(s.name || '—', 35)}</td>
      <td>${s.country || '—'}</td>
      <td class="rating-cell">${stars}</td>
      <td><a href="mailto:${s.email || ''}">${s.email || '—'}</a></td>
      <td class="text-right">${formatNumber(s.poCount)}</td>
      <td class="text-right">${formatCurrency(s.totalSpendUSD)}</td>
    </tr>`;
  }).join('');

  // Inject into DOM if container exists
  const tbody = safeEl(containerId);
  if (tbody) tbody.innerHTML = html;

  return html;
}

// ─── 5. Approved Materials Table ────────────────────────────────

export function renderApprovedMaterialsTable(quotations, containerId = 'mdApprovedMaterialsBody') {
  if (!quotations || !quotations.length) {
    return '<tr><td colspan="5" class="text-center">No approved materials found</td></tr>';
  }

  // Filter to only "Order" status quotations
  const ordered = quotations.filter(q =>
    q.status && q.status.toLowerCase() === 'order'
  );

  if (!ordered.length) {
    return '<tr><td colspan="5" class="text-center">No approved materials found</td></tr>';
  }

  // Group by material
  const materialMap = new Map();
  ordered.forEach(q => {
    const mat = q.material || 'Unknown';
    if (!materialMap.has(mat)) {
      materialMap.set(mat, {
        material: mat,
        discipline: q.discipline || '—',
        suppliers: new Set(),
        quotationCount: 0,
        totalValue: 0,
        spec: ''
      });
    }
    const entry = materialMap.get(mat);
    if (q.client) entry.suppliers.add(q.client);
    entry.quotationCount++;
    entry.totalValue += Number(q.valueUSD) || 0;
    // Extract spec from description if available
    if (!entry.spec && q.description) {
      entry.spec = truncateLabel(q.description, 60);
    }
    // Prefer discipline from first occurrence but update if missing
    if (entry.discipline === '—' && q.discipline) {
      entry.discipline = q.discipline;
    }
  });

  // Sort by total value descending
  const materials = [...materialMap.values()]
    .sort((a, b) => b.totalValue - a.totalValue);

  const html = materials.map(m => {
    return `<tr>
      <td title="${m.spec || m.material}">${truncateLabel(m.material, 30)}</td>
      <td>${m.discipline}</td>
      <td class="text-center">${formatNumber(m.suppliers.size)}</td>
      <td class="text-center">${formatNumber(m.quotationCount)}</td>
      <td class="text-right">${formatCurrency(m.totalValue)}</td>
    </tr>`;
  }).join('');

  const tbody = safeEl(containerId);
  if (tbody) tbody.innerHTML = html;

  return html;
}

// ─── 6. M&D PO Detail Table with Pagination ────────────────────

export function renderMdPoTable(pos, pagination) {
  if (!pos || !pos.length) {
    return {
      html: '<tr><td colspan="8" class="text-center">No purchase orders found</td></tr>',
      paginationHtml: ''
    };
  }

  const { page = 1, pageSize = 25 } = pagination || {};
  const total = pos.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const sliced = pos.slice(start, start + pageSize);

  const html = sliced.map(po => {
    const poDate = po.poDate
      ? new Date(po.poDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    return `<tr>
      <td>${po.poNumber || '—'}</td>
      <td>${poDate}</td>
      <td>${truncateLabel(po.material || '—', 25)}</td>
      <td>${po.discipline || '—'}</td>
      <td>${po.entity || '—'}</td>
      <td class="text-right">${formatCurrency(po.valueUSD || po.poValueUSD)}</td>
      <td>${po.currency || '—'}</td>
      <td>${truncateLabel(po.project || '—', 20)}</td>
    </tr>`;
  }).join('');

  // Pagination controls
  const paginationHtml = buildPaginationControls(safePage, totalPages, total);

  return { html, paginationHtml };
}

function buildPaginationControls(page, totalPages, total) {
  if (totalPages <= 1) return '';

  const btns = [];

  btns.push(`<button class="page-btn" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button>`);
  btns.push(`<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>&laquo; Prev</button>`);

  const range = 3;
  const start = Math.max(1, page - range);
  const end   = Math.min(totalPages, page + range);

  if (start > 1) btns.push(`<span class="page-ellipsis">…</span>`);
  for (let i = start; i <= end; i++) {
    btns.push(`<button class="page-btn${i === page ? ' active' : ''}" data-page="${i}">${i}</button>`);
  }
  if (end < totalPages) btns.push(`<span class="page-ellipsis">…</span>`);

  btns.push(`<button class="page-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next &raquo;</button>`);
  btns.push(`<button class="page-btn" data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}>Last</button>`);

  return `<div class="pagination-controls">
  <span class="pagination-info">Page ${page} of ${totalPages} (${total.toLocaleString('en-US')} records)</span>
  <div class="pagination-buttons">${btns.join('')}</div>
</div>`;
}

// ─── 7. Supplier Profile Card ───────────────────────────────────

export function renderSupplierProfileCard(supplier) {
  const container = safeEl('mdSupplierProfile');

  if (!supplier) {
    const emptyHtml = `<div class="supplier-profile-empty">
      <p>Select a supplier to view profile details</p>
    </div>`;
    if (container) container.innerHTML = emptyHtml;
    return emptyHtml;
  }

  const stars = generateStars(supplier.ratingScore);

  const html = `<div class="supplier-profile-card">
  <div class="supplier-profile-header">
    <h3 class="supplier-profile-name">${supplier.name || 'Unknown Supplier'}</h3>
    <div class="supplier-profile-rating">${stars}</div>
  </div>
  <div class="supplier-profile-details">
    <div class="profile-row">
      <span class="profile-label">Country</span>
      <span class="profile-value">${supplier.country || '—'}</span>
    </div>
    <div class="profile-row">
      <span class="profile-label">Contact</span>
      <span class="profile-value">${supplier.contactName || '—'}</span>
    </div>
    <div class="profile-row">
      <span class="profile-label">Email</span>
      <span class="profile-value"><a href="mailto:${supplier.email || ''}">${supplier.email || '—'}</a></span>
    </div>
    <div class="profile-row">
      <span class="profile-label">Phone</span>
      <span class="profile-value">${supplier.phone || '—'}</span>
    </div>
    <div class="profile-row">
      <span class="profile-label">Material Category</span>
      <span class="profile-value">${supplier.materialCategory || supplier.material || '—'}</span>
    </div>
    <div class="profile-row">
      <span class="profile-label">PO Count</span>
      <span class="profile-value">${formatNumber(supplier.poCount)}</span>
    </div>
    <div class="profile-row">
      <span class="profile-label">Total Spend</span>
      <span class="profile-value spend-value">${formatCurrency(supplier.totalSpendUSD)}</span>
    </div>
  </div>
</div>`;

  if (container) container.innerHTML = html;

  return html;
}
