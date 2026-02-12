import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { IFilterState, IGlobalSpendData } from '../../../../models';
import { SharePointService } from '../../../../services/SharePointService';
import { formatCurrency, formatNumber } from '../../../../utils/FormatUtils';
import { DashboardView } from '../SupplyIntelHub';
import ChartCard from '../shared/ChartCard/ChartCard';
import { ChartColors, ChartDefaults } from '../shared/Charts/ChartColors';
import FilterBar, { IActiveFilter, IFilterConfig } from '../shared/FilterBar/FilterBar';
import Header from '../shared/Header/Header';
import KPICard from '../shared/KPICard/KPICard';
import styles from './GlobalSpendAnalysis.module.scss';

// Helper functions for Object methods
function objectEntries<T>(obj: Record<string, T>): [string, T][] {
    const entries: [string, T][] = [];
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            entries.push([key, obj[key]]);
        }
    }
    return entries;
}

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export interface IGlobalSpendAnalysisProps {
    spService: SharePointService;
    onNavigate: (view: DashboardView) => void;
    title: string;
}

const GlobalSpendAnalysis: React.FC<IGlobalSpendAnalysisProps> = ({
    spService,
    onNavigate,
    title
}) => {
    // State
    const [data, setData] = useState<IGlobalSpendData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<IFilterState>({
        entity: '',
        supplier: '',
        materialGroup: '',
        search: ''
    });

    // Load data
    useEffect(() => {
        const loadData = async (): Promise<void> => {
            try {
                setIsLoading(true);
                const spendData = await spService.getGlobalSpendData();
                setData(spendData);
            } catch (error) {
                console.error('Error loading spend data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData().catch(console.error);
    }, [spService]);

    // Filter purchase orders
    const filteredPOs = useMemo(() => {
        if (!data?.purchaseOrders) return [];

        return data.purchaseOrders.filter(po => {
            if (filters.entity && po.Entity !== filters.entity) return false;
            if (filters.supplier && po.SupplierName !== filters.supplier) return false;
            if (filters.materialGroup && po.MaterialGroup !== filters.materialGroup) return false;
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch =
                    (po.PONumber && po.PONumber.toLowerCase().indexOf(searchLower) >= 0) ||
                    (po.SupplierName && po.SupplierName.toLowerCase().indexOf(searchLower) >= 0) ||
                    (po.Description && po.Description.toLowerCase().indexOf(searchLower) >= 0);
                if (!matchesSearch) return false;
            }
            return true;
        });
    }, [data?.purchaseOrders, filters]);

    // Calculate summary from filtered data
    const summary = useMemo(() => {
        const pos = filteredPOs;
        const totalPOs = pos.length;
        const totalSpend = pos.reduce((sum, po) => sum + (po.POValue || 0), 0);
        const avgPOValue = totalPOs > 0 ? totalSpend / totalPOs : 0;
        const entitySet: string[] = [];
        const supplierSet: string[] = [];
        pos.forEach(po => {
            if (po.Entity && entitySet.indexOf(po.Entity) === -1) entitySet.push(po.Entity);
            if (po.SupplierName && supplierSet.indexOf(po.SupplierName) === -1) supplierSet.push(po.SupplierName);
        });
        const activeEntities = entitySet.length;
        const activeSuppliers = supplierSet.length;

        return { totalPOs, totalSpend, avgPOValue, activeEntities, activeSuppliers };
    }, [filteredPOs]);

    // Get filter options
    const filterConfigs = useMemo((): IFilterConfig[] => {
        if (!data) return [];

        const entities: string[] = [];
        const suppliers: string[] = [];
        const materials: string[] = [];
        data.purchaseOrders.forEach(po => {
            if (po.Entity && entities.indexOf(po.Entity) === -1) entities.push(po.Entity);
            if (po.SupplierName && suppliers.indexOf(po.SupplierName) === -1) suppliers.push(po.SupplierName);
            if (po.MaterialGroup && materials.indexOf(po.MaterialGroup) === -1) materials.push(po.MaterialGroup);
        });

        return [
            {
                id: 'entity',
                label: 'Entity',
                value: filters.entity,
                options: entities.map(e => ({ key: e, text: e }))
            },
            {
                id: 'supplier',
                label: 'Supplier',
                value: filters.supplier || '',
                options: suppliers.map(s => ({ key: s, text: s }))
            },
            {
                id: 'materialGroup',
                label: 'Material Group',
                value: filters.materialGroup || '',
                options: materials.map(m => ({ key: m, text: m }))
            }
        ];
    }, [data, filters]);

    // Active filters for display
    const activeFilters = useMemo((): IActiveFilter[] => {
        const active: IActiveFilter[] = [];
        if (filters.entity) active.push({ id: 'entity', label: 'Entity', value: filters.entity });
        if (filters.supplier) active.push({ id: 'supplier', label: 'Supplier', value: filters.supplier });
        if (filters.materialGroup) active.push({ id: 'materialGroup', label: 'Material', value: filters.materialGroup });
        return active;
    }, [filters]);

    // Filter handlers
    const handleFilterChange = useCallback((filterId: string, value: string) => {
        setFilters(prev => ({ ...prev, [filterId]: value }));
    }, []);

    const handleClearFilter = useCallback((filterId: string) => {
        setFilters(prev => ({ ...prev, [filterId]: '' }));
    }, []);

    const handleResetAll = useCallback(() => {
        setFilters({ entity: '', supplier: '', materialGroup: '', search: '' });
    }, []);

    // Chart data: Entity spend breakdown
    const entityChartData = useMemo(() => {
        const grouped = filteredPOs.reduce((acc, po) => {
            const key = po.Entity || 'Unknown';
            acc[key] = (acc[key] || 0) + (po.POValue || 0);
            return acc;
        }, {} as Record<string, number>);

        const sorted = objectEntries(grouped)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            labels: sorted.map(([label]) => label),
            datasets: [{
                label: 'Spend',
                data: sorted.map(([, value]) => value),
                backgroundColor: ChartColors.getColors(sorted.length),
                borderRadius: 4
            }]
        };
    }, [filteredPOs]);

    // Chart data: Top Suppliers by spend
    const supplierChartData = useMemo(() => {
        const grouped = filteredPOs.reduce((acc, po) => {
            const key = po.SupplierName || 'Unknown';
            acc[key] = (acc[key] || 0) + (po.POValue || 0);
            return acc;
        }, {} as Record<string, number>);

        const sorted = objectEntries(grouped)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            labels: sorted.map(([label]) => label),
            datasets: [{
                label: 'Spend',
                data: sorted.map(([, value]) => value),
                backgroundColor: ChartColors.success,
                borderRadius: 4
            }]
        };
    }, [filteredPOs]);

    // Chart data: Monthly trend
    const trendChartData = useMemo(() => {
        if (!data?.spendByMonth) {
            return { labels: [], datasets: [] };
        }

        const months = data.spendByMonth
            .sort((a, b) => {
                if (a.Year !== b.Year) return a.Year - b.Year;
                return a.Month.localeCompare(b.Month);
            })
            .slice(-12);

        return {
            labels: months.map(m => `${m.Month} ${m.Year}`),
            datasets: [{
                label: 'Monthly Spend',
                data: months.map(m => m.Spend),
                borderColor: ChartColors.primaryLight,
                backgroundColor: ChartColors.withOpacity(ChartColors.primaryLight, 0.1),
                fill: true,
                tension: 0.4
            }]
        };
    }, [data?.spendByMonth]);

    const hasFilters = activeFilters.length > 0 || !!filters.search;

    return (
        <div className={styles.globalSpendAnalysis}>
            {/* Header */}
            <Header
                title="Global Spend Analysis"
                subtitle="Purchase Order Tracking & Spend Analytics"
                lastRefresh={new Date().toLocaleString()}
                entityInfo={`${formatNumber(filteredPOs.length)} POs${hasFilters ? ' (filtered)' : ''}`}
                showBackButton
                onBack={() => onNavigate('portal')}
                accentColor="#d96f3c"
            />

            {/* Filters */}
            <FilterBar
                filters={filterConfigs}
                activeFilters={activeFilters}
                searchValue={filters.search}
                searchPlaceholder="Search POs..."
                onFilterChange={handleFilterChange}
                onSearchChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                onClearFilter={handleClearFilter}
                onResetAll={handleResetAll}
            />

            {/* Main Content */}
            <main className={styles.content}>
                {/* KPI Row */}
                <div className={styles.kpiRow}>
                    <KPICard
                        icon="📦"
                        label="Purchase Orders"
                        value={formatNumber(summary.totalPOs)}
                        change={hasFilters ? 'Filtered' : 'All records'}
                        changeType={hasFilters ? 'filtered' : 'neutral'}
                    />
                    <KPICard
                        icon="💵"
                        label="Total Spend"
                        value={formatCurrency(summary.totalSpend, true)}
                        variant="success"
                    />
                    <KPICard
                        icon="📊"
                        label="Avg PO Value"
                        value={formatCurrency(summary.avgPOValue, true)}
                        variant="info"
                    />
                    <KPICard
                        icon="🏢"
                        label="Active Entities"
                        value={formatNumber(summary.activeEntities)}
                    />
                    <KPICard
                        icon="🤝"
                        label="Active Suppliers"
                        value={formatNumber(summary.activeSuppliers)}
                    />
                </div>

                {/* Charts Row 1 */}
                <div className={styles.chartsGrid}>
                    <ChartCard
                        title="Spend by Entity"
                        subtitle="Top entities by PO value"
                        height={320}
                        isLoading={isLoading}
                        isEmpty={entityChartData.labels.length === 0}
                    >
                        <Bar
                            data={entityChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                indexAxis: 'y',
                                plugins: {
                                    legend: { display: false },
                                    tooltip: ChartDefaults.tooltip
                                },
                                scales: {
                                    x: {
                                        ...ChartDefaults.scales.x,
                                        ticks: {
                                            callback: (value) => formatCurrency(value as number, true)
                                        }
                                    },
                                    y: {
                                        ...ChartDefaults.scales.y,
                                        grid: { display: false }
                                    }
                                }
                            }}
                        />
                    </ChartCard>

                    <ChartCard
                        title="Top Suppliers"
                        subtitle="By spend"
                        height={320}
                        isLoading={isLoading}
                        isEmpty={supplierChartData.labels.length === 0}
                    >
                        <Bar
                            data={supplierChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                indexAxis: 'y',
                                plugins: {
                                    legend: { display: false },
                                    tooltip: ChartDefaults.tooltip
                                },
                                scales: {
                                    x: {
                                        ...ChartDefaults.scales.x,
                                        ticks: {
                                            callback: (value) => formatCurrency(value as number, true)
                                        }
                                    },
                                    y: {
                                        ...ChartDefaults.scales.y,
                                        grid: { display: false }
                                    }
                                }
                            }}
                        />
                    </ChartCard>
                </div>

                {/* Charts Row 2 - Trend */}
                <div className={styles.fullWidth}>
                    <ChartCard
                        title="Monthly Spend Trend"
                        subtitle="Last 12 months"
                        height={280}
                        isLoading={isLoading}
                        isEmpty={trendChartData.labels.length === 0}
                    >
                        <Line
                            data={trendChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: ChartDefaults.tooltip
                                },
                                scales: {
                                    x: ChartDefaults.scales.x,
                                    y: {
                                        ...ChartDefaults.scales.y,
                                        ticks: {
                                            callback: (value) => formatCurrency(value as number, true)
                                        }
                                    }
                                }
                            }}
                        />
                    </ChartCard>
                </div>
            </main>
        </div>
    );
};

export default GlobalSpendAnalysis;
