/**
 * Chart Colors and Configuration
 * Ported from v3/shared/charts.js
 */

export const ChartColors = {
    // Primary brand colors
    primary: '#004578',
    primaryLight: '#0078D4',
    accent: '#00A4EF',

    // Status colors
    success: '#107C10',
    successLight: '#DFF6DD',
    warning: '#FFB900',
    warningLight: '#FFF4CE',
    danger: '#D83B01',
    dangerLight: '#FDE7E1',
    info: '#00B7C3',
    infoLight: '#E1F7F7',

    // Funnel colors
    funnel: {
        quotation: '#00B7C3',
        waiting: '#FFB900',
        order: '#107C10',
        cancelled: '#D83B01'
    },

    // Chart palette for multiple series
    palette: [
        '#0078D4', // Blue
        '#00A4EF', // Light Blue
        '#107C10', // Green
        '#FFB900', // Amber
        '#D83B01', // Orange
        '#881798', // Purple
        '#00B7C3', // Teal
        '#E81123', // Red
        '#0063B1', // Dark Blue
        '#498205'  // Olive
    ],

    /**
     * Get color from palette by index
     */
    getColor(index: number): string {
        return this.palette[index % this.palette.length];
    },

    /**
     * Generate array of colors for n items
     */
    getColors(count: number): string[] {
        const colors: string[] = [];
        for (let i = 0; i < count; i++) {
            colors.push(this.getColor(i));
        }
        return colors;
    },

    /**
     * Get color with opacity
     */
    withOpacity(color: string, opacity: number): string {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
};

/**
 * Default Chart.js options
 */
export const ChartDefaults = {
    font: {
        family: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif",
        size: 11
    },

    animation: {
        duration: 500,
        easing: 'easeOutQuart' as const
    },

    tooltip: {
        backgroundColor: 'rgba(50, 49, 48, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        titleFont: { weight: 'bold' as const, size: 12 },
        bodyFont: { size: 11 },
        displayColors: true,
        boxPadding: 4
    },

    legend: {
        position: 'bottom' as const,
        labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle' as const,
            font: { size: 11 }
        }
    },

    scales: {
        x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
        },
        y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 11 } }
        }
    }
};
