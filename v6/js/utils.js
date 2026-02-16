// ─── V6 Supply Chain Intel Hub — Utility Functions ─────────────
// ES module: import { formatCurrency, debounce, ... } from './utils.js'

import { state } from './state.js';

// ─── Currency conversion ────────────────────────────────────────

export function convertToUSD(amount, currency) {
  if (!amount || !currency) return 0;
  const rate = state.fxRates[currency.toUpperCase()];
  if (!rate) return Number(amount) || 0;
  return (Number(amount) || 0) / rate;
}

// ─── Formatting ─────────────────────────────────────────────────

export function formatCurrency(value) {
  const num = Number(value) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrencyFull(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function formatNumber(num) {
  return (Number(num) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatPercent(num) {
  return `${(Number(num) || 0).toFixed(1)}%`;
}

export function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Text helpers ───────────────────────────────────────────────

export function truncateText(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

// ─── Timing ─────────────────────────────────────────────────────

export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ─── Date parsing ───────────────────────────────────────────────

export function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  // ISO format: 2026-01-23  or  2026-01-23T...
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

  // MM/DD/YYYY
  const mdy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) return new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2]));

  // "23 Jan 2026" style
  const txt = dateStr.match(/^(\d{1,2})\s+(\w{3,})\s+(\d{4})$/);
  if (txt) return new Date(`${txt[2]} ${txt[1]}, ${txt[3]}`);

  // Fallback
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// ─── Status styling ─────────────────────────────────────────────

const STATUS_COLORS = {
  'Order':      '#2ecc71',
  'Quotation':  '#3498db',
  'Waiting':    '#f39c12',
  'Cancelled':  '#e74c3c',
  'Closed':     '#95a5a6'
};

export function getStatusColor(status) {
  if (!status) return '#95a5a6';
  // Case-insensitive match on first word
  const key = Object.keys(STATUS_COLORS).find(
    k => status.toLowerCase().startsWith(k.toLowerCase())
  );
  return key ? STATUS_COLORS[key] : '#95a5a6';
}

export function getStatusBadge(status) {
  const color = getStatusColor(status);
  const label = status || 'Unknown';
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:0.82em;font-weight:600;color:#fff;background:${color}">${label}</span>`;
}

// ─── Pagination HTML ────────────────────────────────────────────

export function generatePaginationHTML(pagination) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return '';

  const btns = [];

  // First / Prev
  btns.push(`<button class="page-btn" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button>`);
  btns.push(`<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>&laquo; Prev</button>`);

  // Page numbers — show up to 7 around current
  const range = 3;
  let start = Math.max(1, page - range);
  let end = Math.min(totalPages, page + range);

  if (start > 1) btns.push(`<span class="page-ellipsis">…</span>`);
  for (let i = start; i <= end; i++) {
    btns.push(`<button class="page-btn${i === page ? ' active' : ''}" data-page="${i}">${i}</button>`);
  }
  if (end < totalPages) btns.push(`<span class="page-ellipsis">…</span>`);

  // Next / Last
  btns.push(`<button class="page-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next &raquo;</button>`);
  btns.push(`<button class="page-btn" data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}>Last</button>`);

  return `<div class="pagination-controls">
  <span class="pagination-info">Page ${page} of ${totalPages} (${total.toLocaleString('en-US')} records)</span>
  <div class="pagination-buttons">${btns.join('')}</div>
</div>`;
}

// ─── DOM helpers ────────────────────────────────────────────────

export function showLoading(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  // Avoid duplicates
  if (el.querySelector('.loading-spinner')) return;
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.innerHTML = '<div class="spinner"></div><p>Loading…</p>';
  el.appendChild(spinner);
}

export function hideLoading(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const spinner = el.querySelector('.loading-spinner');
  if (spinner) spinner.remove();
}

export function createElement(tag, className, innerHTML) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML != null) el.innerHTML = innerHTML;
  return el;
}
