/**
 * MVL Supply Intel Hub - Data Utilities v2.0
 * Pagination, Filtering, Sorting, Export utilities
 */

class DataUtils {
    /**
     * Format number with thousand separators
     */
    static formatNumber(num, decimals = 0) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    /**
     * Format currency value
     */
    static formatCurrency(num, currency = 'USD', compact = false) {
        if (num === null || num === undefined || isNaN(num)) return '$0';
        
        if (compact && Math.abs(num) >= 1e6) {
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                notation: 'compact',
                compactDisplay: 'short',
                maximumFractionDigits: 1
            }).format(num);
            return formatted;
        }
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    }

    /**
     * Format percentage
     */
    static formatPercent(num, decimals = 1) {
        if (num === null || num === undefined || isNaN(num)) return '0%';
        return `${num.toFixed(decimals)}%`;
    }

    /**
     * Format date for display
     */
    static formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }

    /**
     * Calculate days ago from date
     */
    static daysAgo(dateStr) {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            return diff;
        } catch {
            return null;
        }
    }

    /**
     * Truncate text with ellipsis
     */
    static truncate(text, maxLength = 50) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Debounce function for filter inputs
     */
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Get status badge class
     */
    static getStatusBadgeClass(status) {
        const statusLower = (status || '').toLowerCase();
        if (statusLower === 'order') return 'badge-order';
        if (statusLower === 'waiting') return 'badge-waiting';
        if (statusLower === 'quotation') return 'badge-quotation';
        if (statusLower === 'cancelled' || statusLower === 'cancled') return 'badge-cancelled';
        return 'badge-default';
    }

    /**
     * Sort array by key
     */
    static sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            let valA = a[key];
            let valB = b[key];
            
            // Handle null/undefined
            if (valA === null || valA === undefined) valA = '';
            if (valB === null || valB === undefined) valB = '';
            
            // Numeric comparison
            if (typeof valA === 'number' && typeof valB === 'number') {
                return direction === 'asc' ? valA - valB : valB - valA;
            }
            
            // String comparison
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
            
            if (direction === 'asc') {
                return valA.localeCompare(valB);
            } else {
                return valB.localeCompare(valA);
            }
        });
    }

    /**
     * Filter array by multiple criteria
     */
    static filterBy(array, filters) {
        return array.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value || value === '' || value === 'all') return true;
                
                const itemValue = item[key];
                if (itemValue === null || itemValue === undefined) return false;
                
                // Array of values (multi-select)
                if (Array.isArray(value)) {
                    return value.includes(itemValue);
                }
                
                // String contains
                return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
            });
        });
    }

    /**
     * Get unique values for filter dropdown
     */
    static getUniqueValues(array, key) {
        const values = new Set();
        array.forEach(item => {
            if (item[key]) values.add(item[key]);
        });
        return Array.from(values).sort();
    }

    /**
     * Paginate array
     */
    static paginate(array, page = 1, pageSize = 25) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            data: array.slice(start, end),
            page: page,
            pageSize: pageSize,
            total: array.length,
            totalPages: Math.ceil(array.length / pageSize),
            hasNext: end < array.length,
            hasPrev: page > 1
        };
    }

    /**
     * Export data to CSV
     */
    static exportToCSV(data, filename = 'export.csv') {
        if (!data || !data.length) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    let cell = row[header];
                    if (cell === null || cell === undefined) cell = '';
                    // Escape quotes and wrap in quotes if contains comma
                    cell = String(cell).replace(/"/g, '""');
                    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    /**
     * Download JSON data
     */
    static downloadJSON(data, filename = 'data.json') {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    /**
     * Search in object values
     */
    static searchInObject(obj, searchTerm) {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return Object.values(obj).some(value => 
            String(value).toLowerCase().includes(term)
        );
    }

    /**
     * Group array by key
     */
    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key] || 'Unknown';
            if (!groups[group]) groups[group] = [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    /**
     * Calculate aggregations
     */
    static aggregate(array, valueKey) {
        if (!array || !array.length) return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
        
        const values = array.map(item => parseFloat(item[valueKey]) || 0);
        const sum = values.reduce((a, b) => a + b, 0);
        
        return {
            sum: sum,
            avg: sum / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length
        };
    }
}

/**
 * Pagination Component
 */
class PaginationComponent {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            pageSize: options.pageSize || 25,
            pageSizes: options.pageSizes || [10, 25, 50, 100],
            onPageChange: options.onPageChange || (() => {}),
            onPageSizeChange: options.onPageSizeChange || (() => {})
        };
        this.currentPage = 1;
        this.totalItems = 0;
    }

    update(totalItems, currentPage = 1) {
        this.totalItems = totalItems;
        this.currentPage = currentPage;
        this.render();
    }

    render() {
        const totalPages = Math.ceil(this.totalItems / this.options.pageSize);
        const start = (this.currentPage - 1) * this.options.pageSize + 1;
        const end = Math.min(this.currentPage * this.options.pageSize, this.totalItems);

        this.container.innerHTML = `
            <div class="pagination-info">
                Showing <strong>${start}</strong> to <strong>${end}</strong> of <strong>${DataUtils.formatNumber(this.totalItems)}</strong> records
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" data-action="first" ${this.currentPage === 1 ? 'disabled' : ''}>
                    ⟪
                </button>
                <button class="pagination-btn" data-action="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
                    ◀
                </button>
                ${this.renderPageNumbers(totalPages)}
                <button class="pagination-btn" data-action="next" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    ▶
                </button>
                <button class="pagination-btn" data-action="last" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    ⟫
                </button>
                <select class="page-size-select">
                    ${this.options.pageSizes.map(size => 
                        `<option value="${size}" ${size === this.options.pageSize ? 'selected' : ''}>${size} per page</option>`
                    ).join('')}
                </select>
            </div>
        `;

        // Attach event listeners
        this.container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleAction(btn.dataset.action, btn.dataset.page));
        });

        this.container.querySelector('.page-size-select').addEventListener('change', (e) => {
            this.options.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.options.onPageSizeChange(this.options.pageSize);
        });
    }

    renderPageNumbers(totalPages) {
        const pages = [];
        const maxVisible = 5;
        
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(`
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        data-action="goto" data-page="${i}">
                    ${i}
                </button>
            `);
        }

        return pages.join('');
    }

    handleAction(action, page) {
        const totalPages = Math.ceil(this.totalItems / this.options.pageSize);
        
        switch (action) {
            case 'first':
                this.currentPage = 1;
                break;
            case 'prev':
                this.currentPage = Math.max(1, this.currentPage - 1);
                break;
            case 'next':
                this.currentPage = Math.min(totalPages, this.currentPage + 1);
                break;
            case 'last':
                this.currentPage = totalPages;
                break;
            case 'goto':
                this.currentPage = parseInt(page);
                break;
        }

        this.render();
        this.options.onPageChange(this.currentPage);
    }
}

/**
 * Sortable Table Component
 */
class SortableTable {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            columns: options.columns || [],
            data: options.data || [],
            sortKey: options.sortKey || null,
            sortDir: options.sortDir || 'asc',
            onSort: options.onSort || (() => {}),
            onRowClick: options.onRowClick || null
        };
    }

    setData(data) {
        this.options.data = data;
        this.render();
    }

    sort(key) {
        if (this.options.sortKey === key) {
            this.options.sortDir = this.options.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.options.sortKey = key;
            this.options.sortDir = 'asc';
        }
        this.options.onSort(key, this.options.sortDir);
    }

    render() {
        const { columns, data, sortKey, sortDir } = this.options;

        this.container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${columns.map(col => `
                            <th data-key="${col.key}" class="${sortKey === col.key ? 'sorted' : ''} ${col.align || ''}">
                                ${col.label}
                                <span class="sort-icon">${sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.length === 0 ? `
                        <tr><td colspan="${columns.length}" class="text-center text-secondary" style="padding: 40px;">
                            No data available
                        </td></tr>
                    ` : data.map((row, idx) => `
                        <tr data-index="${idx}">
                            ${columns.map(col => {
                                let value = row[col.key];
                                if (col.format) value = col.format(value, row);
                                const cellClass = col.cellClass ? col.cellClass(value, row) : '';
                                return `<td class="${col.align || ''} ${cellClass}">${value ?? '-'}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Attach sort listeners
        this.container.querySelectorAll('th[data-key]').forEach(th => {
            th.addEventListener('click', () => this.sort(th.dataset.key));
        });

        // Attach row click listeners
        if (this.options.onRowClick) {
            this.container.querySelectorAll('tbody tr').forEach(tr => {
                tr.style.cursor = 'pointer';
                tr.addEventListener('click', () => {
                    const idx = parseInt(tr.dataset.index);
                    this.options.onRowClick(data[idx], idx);
                });
            });
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataUtils, PaginationComponent, SortableTable };
}
