import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
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
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import styles from './SupplierMarketplace.module.scss';
import { SharePointService } from '../../../../services/SharePointService';
import { IQuotation, IFilterState, ISupplierMarketplaceData } from '../../../../models';
import { DashboardView } from '../SupplyIntelHub';
import Header from '../shared/Header/Header';
import FilterBar, { IFilterConfig, IActiveFilter } from '../shared/FilterBar/FilterBar';
import KPICard from '../shared/KPICard/KPICard';
import ChartCard from '../shared/ChartCard/ChartCard';
import { ChartColors, ChartDefaults } from '../shared/Charts/ChartColors';
import { formatCurrency, formatNumber } from '../../../../utils/FormatUtils';

// Helper function for Object.entries compatibility
function objectEntries<T>(obj: Record<string, T>): [string, T][] {
  const entries: [string, T][] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      entries.push([key, obj[key]]);
    }
  }
  return entries;
}

// Helper function for Object.values compatibility
function objectValues<T>(obj: Record<string, T>): T[] {
  const values: T[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      values.push(obj[key]);
    }
  }
  return values;
}

// Helper function for Object.keys
function objectKeys(obj: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
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

export interface ISupplierMarketplaceProps {
  spService: SharePointService;
  onNavigate: (view: DashboardView) => void;
  title: string;
}

const SupplierMarketplace: React.FC<ISupplierMarketplaceProps> = ({
  spService,
  onNavigate,
  title
}) => {
  // State
  const [data, setData] = useState<ISupplierMarketplaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<IFilterState>({
    entity: '',
    status: '',
    materialGroup: '',
    search: ''
  });

  // Load data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const marketplaceData = await spService.getSupplierMarketplaceData();
        setData(marketplaceData);
      } catch (error) {
        console.error('Error loading marketplace data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData().catch(console.error);
  }, [spService]);

  // Filter quotations
  const filteredQuotations = useMemo(() => {
    if (!data?.quotations) return [];
    
    return data.quotations.filter(q => {
      if (filters.entity && q.Entity !== filters.entity) return false;
      if (filters.status && q.Status !== filters.status) return false;
      if (filters.materialGroup && q.MaterialGroup !== filters.materialGroup) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          (q.QuotationNumber && q.QuotationNumber.toLowerCase().indexOf(searchLower) >= 0) ||
          (q.SupplierName && q.SupplierName.toLowerCase().indexOf(searchLower) >= 0) ||
          (q.Description && q.Description.toLowerCase().indexOf(searchLower) >= 0);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [data?.quotations, filters]);

  // Calculate summary from filtered data
  const summary = useMemo(() => {
    const quotations = filteredQuotations;
    const totalQuotations = quotations.length;
    const totalPOs = quotations.filter(q => q.Status === 'Order').length;
    const totalCancelled = quotations.filter(q => 
      q.Status === 'Cancelled' || q.Status === 'Cancled'
    ).length;
    const totalDecided = totalPOs + totalCancelled;
    const winRate = totalDecided > 0 ? (totalPOs / totalDecided) * 100 : 0;
    const totalQuoteValue = quotations.reduce((sum, q) => sum + (q.QuotationValue || 0), 0);
    const totalPOValue = quotations
      .filter(q => q.Status === 'Order')
      .reduce((sum, q) => sum + (q.QuotationValue || 0), 0);

    return { totalQuotations, totalPOs, totalCancelled, winRate, totalQuoteValue, totalPOValue };
  }, [filteredQuotations]);

  // Get filter options
  const filterConfigs = useMemo((): IFilterConfig[] => {
    if (!data) return [];

    const entities: string[] = [];
    const statuses: string[] = [];
    const materials: string[] = [];
    data.quotations.forEach(q => {
      if (q.Entity && entities.indexOf(q.Entity) === -1) entities.push(q.Entity);
      if (q.Status && statuses.indexOf(q.Status) === -1) statuses.push(q.Status);
      if (q.MaterialGroup && materials.indexOf(q.MaterialGroup) === -1) materials.push(q.MaterialGroup);
    });

    return [
      {
        id: 'entity',
        label: 'Entity',
        value: filters.entity,
        options: entities.map(e => ({ key: e, text: e }))
      },
      {
        id: 'status',
        label: 'Status',
        value: filters.status || '',
        options: statuses.map(s => ({ key: s, text: s }))
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
    if (filters.status) active.push({ id: 'status', label: 'Status', value: filters.status });
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
    setFilters({ entity: '', status: '', materialGroup: '', search: '' });
  }, []);

  // Chart data: Material Group breakdown
  const materialChartData = useMemo(() => {
    const grouped = filteredQuotations.reduce((acc, q) => {
      const key = q.MaterialGroup || 'Unknown';
      acc[key] = (acc[key] || 0) + (q.QuotationValue || 0);
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sorted.map(([label]) => label),
      datasets: [{
        label: 'Quote Value',
        data: sorted.map(([, value]) => value),
        backgroundColor: ChartColors.getColors(sorted.length),
        borderRadius: 4
      }]
    };
  }, [filteredQuotations]);

  // Chart data: Status distribution
  const statusChartData = useMemo(() => {
    const grouped = filteredQuotations.reduce((acc, q) => {
      const key = q.Status || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusColors: Record<string, string> = {
      'Quotation': ChartColors.funnel.quotation,
      'Waiting': ChartColors.funnel.waiting,
      'Order': ChartColors.funnel.order,
      'Cancelled': ChartColors.funnel.cancelled,
      'Cancled': ChartColors.funnel.cancelled
    };

    const labels = objectKeys(grouped as Record<string, unknown>);
    return {
      labels,
      datasets: [{
        data: objectValues(grouped),
        backgroundColor: labels.map(l => statusColors[l] || ChartColors.getColor(labels.indexOf(l)))
      }]
    };
  }, [filteredQuotations]);

  // Chart data: Top Suppliers
  const supplierChartData = useMemo(() => {
    const grouped = filteredQuotations.reduce((acc, q) => {
      const key = q.SupplierName || 'Unknown';
      acc[key] = (acc[key] || 0) + (q.QuotationValue || 0);
      return acc;
    }, {} as Record<string, number>);

    const sorted = objectEntries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sorted.map(([label]) => label),
      datasets: [{
        label: 'Quote Value',
        data: sorted.map(([, value]) => value),
        backgroundColor: ChartColors.primaryLight,
        borderRadius: 4
      }]
    };
  }, [filteredQuotations]);

  const hasFilters = activeFilters.length > 0 || !!filters.search;

  return (
    <div className={styles.supplierMarketplace}>
      {/* Header */}
      <Header
        title="Supplier Marketplace"
        subtitle="Quotation Pipeline & Supplier Analysis"
        lastRefresh={new Date().toLocaleString()}
        entityInfo={`${formatNumber(filteredQuotations.length)} records${hasFilters ? ' (filtered)' : ''}`}
        showBackButton
        onBack={() => onNavigate('portal')}
      />

      {/* Filters */}
      <FilterBar
        filters={filterConfigs}
        activeFilters={activeFilters}
        searchValue={filters.search}
        searchPlaceholder="Search quotations..."
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
            icon="📝"
            label="Quotations"
            value={formatNumber(summary.totalQuotations)}
            change={hasFilters ? 'Filtered' : 'All records'}
            changeType={hasFilters ? 'filtered' : 'neutral'}
          />
          <KPICard
            icon="✅"
            label="Orders (POs)"
            value={formatNumber(summary.totalPOs)}
            change="Converted"
            changeType="positive"
            variant="success"
          />
          <KPICard
            icon="🎯"
            label="Win Rate"
            value={`${summary.winRate.toFixed(1)}%`}
            subValue="Orders / Decided"
            variant="info"
          />
          <KPICard
            icon="💰"
            label="Quote Value"
            value={formatCurrency(summary.totalQuoteValue, true)}
            subValue="Total quoted"
          />
          <KPICard
            icon="🏦"
            label="PO Spend"
            value={formatCurrency(summary.totalPOValue, true)}
            change="Committed"
            changeType="positive"
            variant="success"
          />
        </div>

        {/* Charts Row 1 */}
        <div className={styles.chartsGrid}>
          <ChartCard
            title="Material Group Breakdown"
            subtitle="Top 10 by Quote Value"
            height={320}
            isLoading={isLoading}
            isEmpty={materialChartData.labels.length === 0}
          >
            <Bar
              data={materialChartData}
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
            title="Status Distribution"
            height={320}
            isLoading={isLoading}
            isEmpty={statusChartData.labels.length === 0}
          >
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: ChartDefaults.legend,
                  tooltip: ChartDefaults.tooltip
                },
                cutout: '60%'
              }}
            />
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className={styles.chartsGrid}>
          <ChartCard
            title="Top Suppliers"
            subtitle="By Quote Value"
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
      </main>
    </div>
  );
};

export default SupplierMarketplace;
