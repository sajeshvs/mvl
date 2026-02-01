/**
 * MVL Supply Intel Hub - Chart Utilities v2.0
 * Chart.js helpers and custom chart components
 */

// Color palette for charts
const ChartColors = {
    primary: '#004578',
    primaryLight: '#0078D4',
    accent: '#00A4EF',
    
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
        quotation: '#00B7C3',  // Teal/Info
        waiting: '#FFB900',    // Amber/Warning
        order: '#107C10',      // Green/Success
        cancelled: '#D83B01'   // Red/Danger
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
    
    // Gradient creators
    createGradient(ctx, color1, color2, direction = 'vertical') {
        const gradient = direction === 'vertical' 
            ? ctx.createLinearGradient(0, 0, 0, 300)
            : ctx.createLinearGradient(0, 0, 300, 0);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    }
};

// Default Chart.js configuration
const ChartDefaults = {
    // Common font settings
    font: {
        family: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif",
        size: 11
    },
    
    // Common animation settings
    animation: {
        duration: 500,
        easing: 'easeOutQuart'
    },
    
    // Common tooltip settings
    tooltip: {
        backgroundColor: 'rgba(50, 49, 48, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        titleFont: { weight: 'bold', size: 12 },
        bodyFont: { size: 11 },
        displayColors: true,
        boxPadding: 4
    },
    
    // Common legend settings
    legend: {
        position: 'bottom',
        labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 11 }
        }
    }
};

/**
 * Create a bar chart
 */
function createBarChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: data.datasets.map((ds, i) => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: ds.backgroundColor || ChartColors.palette[i % ChartColors.palette.length],
                borderColor: ds.borderColor || ChartColors.palette[i % ChartColors.palette.length],
                borderWidth: 0,
                borderRadius: 4,
                ...ds
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: ChartDefaults.tooltip,
                legend: {
                    ...ChartDefaults.legend,
                    display: data.datasets.length > 1
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: ChartDefaults.font }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        font: ChartDefaults.font,
                        callback: options.yAxisFormat || (v => v.toLocaleString())
                    }
                }
            },
            animation: ChartDefaults.animation,
            ...options
        }
    });
}

/**
 * Create a horizontal bar chart
 */
function createHorizontalBarChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: data.label || 'Value',
                data: data.values,
                backgroundColor: data.colors || ChartColors.palette[0],
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    ...ChartDefaults.tooltip,
                    callbacks: {
                        label: options.tooltipFormat || (ctx => ctx.formattedValue)
                    }
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        font: ChartDefaults.font,
                        callback: options.xAxisFormat || (v => v.toLocaleString())
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: ChartDefaults.font }
                }
            },
            animation: ChartDefaults.animation,
            ...options
        }
    });
}

/**
 * Create a line chart
 */
function createLineChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: data.datasets.map((ds, i) => ({
                label: ds.label,
                data: ds.data,
                borderColor: ds.borderColor || ChartColors.palette[i % ChartColors.palette.length],
                backgroundColor: ds.backgroundColor || 'transparent',
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: ds.borderColor || ChartColors.palette[i % ChartColors.palette.length],
                borderWidth: 2,
                fill: ds.fill || false,
                ...ds
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: ChartDefaults.tooltip,
                legend: ChartDefaults.legend
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: ChartDefaults.font }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        font: ChartDefaults.font,
                        callback: options.yAxisFormat || (v => v.toLocaleString())
                    }
                }
            },
            animation: ChartDefaults.animation,
            ...options
        }
    });
}

/**
 * Create a doughnut/pie chart
 */
function createDoughnutChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: options.pie ? 'pie' : 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.colors || ChartColors.palette.slice(0, data.values.length),
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: options.pie ? 0 : '60%',
            plugins: {
                tooltip: {
                    ...ChartDefaults.tooltip,
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((ctx.raw / total) * 100).toFixed(1);
                            const value = options.valueFormat 
                                ? options.valueFormat(ctx.raw) 
                                : ctx.raw.toLocaleString();
                            return `${ctx.label}: ${value} (${percent}%)`;
                        }
                    }
                },
                legend: ChartDefaults.legend
            },
            animation: ChartDefaults.animation,
            ...options
        }
    });
}

/**
 * Create a combo chart (bar + line)
 */
function createComboChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    type: 'bar',
                    label: data.barLabel || 'Bar',
                    data: data.barData,
                    backgroundColor: data.barColor || ChartColors.palette[0],
                    borderRadius: 4,
                    order: 2
                },
                {
                    type: 'line',
                    label: data.lineLabel || 'Line',
                    data: data.lineData,
                    borderColor: data.lineColor || ChartColors.danger,
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                    yAxisID: options.dualAxis ? 'y1' : 'y',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: ChartDefaults.tooltip,
                legend: ChartDefaults.legend
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: ChartDefaults.font }
                },
                y: {
                    beginAtZero: true,
                    position: 'left',
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        font: ChartDefaults.font,
                        callback: options.yAxisFormat || (v => v.toLocaleString())
                    }
                },
                ...(options.dualAxis ? {
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: { display: false },
                        ticks: {
                            font: ChartDefaults.font,
                            callback: options.y1AxisFormat || (v => v.toLocaleString())
                        }
                    }
                } : {})
            },
            animation: ChartDefaults.animation,
            ...options
        }
    });
}

/**
 * Create a stacked bar chart
 */
function createStackedBarChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: data.datasets.map((ds, i) => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: ds.backgroundColor || ChartColors.palette[i % ChartColors.palette.length],
                borderRadius: i === data.datasets.length - 1 ? { topLeft: 4, topRight: 4 } : 0,
                ...ds
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: ChartDefaults.tooltip,
                legend: ChartDefaults.legend
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { font: ChartDefaults.font }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        font: ChartDefaults.font,
                        callback: options.yAxisFormat || (v => v.toLocaleString())
                    }
                }
            },
            animation: ChartDefaults.animation,
            ...options
        }
    });
}

/**
 * Custom funnel chart (HTML/CSS based, not Chart.js)
 */
function renderFunnelChart(container, data) {
    // data = { stages: [{ label, value, color }] }
    const maxValue = Math.max(...data.stages.map(s => s.value));
    const total = data.stages.reduce((sum, s) => sum + s.value, 0);
    
    container.innerHTML = `
        <div class="funnel-chart">
            ${data.stages.map((stage, i) => {
                const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                const percent = total > 0 ? ((stage.value / total) * 100).toFixed(1) : 0;
                return `
                    <div class="funnel-stage">
                        <div class="funnel-label">${stage.label}</div>
                        <div class="funnel-bar-container">
                            <div class="funnel-bar" 
                                 style="width: ${Math.max(width, 5)}%; background-color: ${stage.color};"
                                 title="${stage.label}: ${stage.value.toLocaleString()} (${percent}%)">
                                ${width > 20 ? stage.value.toLocaleString() : ''}
                            </div>
                        </div>
                        <div class="funnel-value">
                            ${stage.value.toLocaleString()}
                            <small>(${percent}%)</small>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Create KPI card HTML
 */
function createKPICard(data) {
    // data = { label, value, format, change, changeType, colorClass, icon }
    let formattedValue = data.value;
    if (data.format === 'currency') {
        formattedValue = DataUtils.formatCurrency(data.value, 'USD', true);
    } else if (data.format === 'percent') {
        formattedValue = DataUtils.formatPercent(data.value);
    } else if (data.format === 'number') {
        formattedValue = DataUtils.formatNumber(data.value);
    }
    
    const changeHtml = data.change !== undefined ? `
        <div class="kpi-change ${data.changeType || ''}">
            <span class="arrow">${data.changeType === 'positive' ? '▲' : (data.changeType === 'negative' ? '▼' : '')}</span>
            ${data.change}
        </div>
    ` : '';
    
    return `
        <div class="kpi-card ${data.colorClass || ''}">
            <div class="kpi-label">${data.icon ? `<span class="icon">${data.icon}</span>` : ''}${data.label}</div>
            <div class="kpi-value ${data.format === 'currency' ? 'currency' : ''}">${formattedValue}</div>
            ${changeHtml}
        </div>
    `;
}

/**
 * Animate counting up a number
 */
function animateValue(element, start, end, duration = 1000, format = 'number') {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease out quad)
        const eased = 1 - Math.pow(1 - progress, 2);
        const current = start + (end - start) * eased;
        
        if (format === 'currency') {
            element.textContent = DataUtils.formatCurrency(current, 'USD', true);
        } else if (format === 'percent') {
            element.textContent = DataUtils.formatPercent(current);
        } else {
            element.textContent = DataUtils.formatNumber(Math.round(current));
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Destroy all Chart.js instances on a canvas
 */
function destroyChart(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChartColors,
        ChartDefaults,
        createBarChart,
        createHorizontalBarChart,
        createLineChart,
        createDoughnutChart,
        createComboChart,
        createStackedBarChart,
        renderFunnelChart,
        createKPICard,
        animateValue,
        destroyChart
    };
}
