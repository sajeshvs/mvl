/**
 * Format Utilities
 * Ported from v3/shared/data-utils.js
 */

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number | null | undefined, decimals = 0): string {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

/**
 * Format currency value
 */
export function formatCurrency(
    num: number | null | undefined,
    compact = false,
    currency = 'USD'
): string {
    if (num === null || num === undefined || isNaN(num)) return '$0';

    if (compact && Math.abs(num) >= 1e6) {
        // Manual compact formatting for millions
        const millions = num / 1e6;
        return `$${millions.toFixed(1)}M`;
    }

    if (compact && Math.abs(num) >= 1e3) {
        // Manual compact formatting for thousands
        const thousands = num / 1e3;
        return `$${thousands.toFixed(0)}K`;
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

/**
 * Format percentage
 */
export function formatPercent(num: number | null | undefined, decimals = 1): string {
    if (num === null || num === undefined || isNaN(num)) return '0%';
    return `${num.toFixed(decimals)}%`;
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '-';
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return String(dateStr);
    }
}

/**
 * Format date and time
 */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '-';
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return String(dateStr);
    }
}

/**
 * Calculate days ago from date
 */
export function daysAgo(dateStr: string | Date | null | undefined): number | null {
    if (!dateStr) return null;
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    } catch {
        return null;
    }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string | null | undefined, maxLength = 50): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait = 300
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(...args: Parameters<T>) {
        const later = (): void => {
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
export function getStatusBadgeVariant(status: string | null | undefined): string {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'order') return 'success';
    if (statusLower === 'waiting') return 'warning';
    if (statusLower === 'quotation') return 'info';
    if (statusLower === 'cancelled' || statusLower === 'cancled') return 'danger';
    return 'default';
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((acc, item) => {
        const groupKey = String(item[key] || 'Unknown');
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}

/**
 * Sum array by property
 */
export function sumBy<T>(array: T[], key: keyof T): number {
    return array.reduce((sum, item) => {
        const value = item[key];
        return sum + (typeof value === 'number' ? value : 0);
    }, 0);
}

/**
 * Get unique values from array
 */
export function getUniqueValues<T, K extends keyof T>(array: T[], key: K): T[K][] {
    const values = array.map(item => item[key]).filter(Boolean);
    const seen: T[K][] = [];
    values.forEach(v => {
        if (seen.indexOf(v) === -1) seen.push(v);
    });
    return seen;
}

/**
 * Sort array by key
 */
export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        // Handle null/undefined
        if (valA === null || valA === undefined) valA = '' as unknown as T[keyof T];
        if (valB === null || valB === undefined) valB = '' as unknown as T[keyof T];

        // Numeric comparison
        if (typeof valA === 'number' && typeof valB === 'number') {
            return direction === 'asc' ? valA - valB : valB - valA;
        }

        // String comparison
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (direction === 'asc') {
            return strA.localeCompare(strB);
        } else {
            return strB.localeCompare(strA);
        }
    });
}
