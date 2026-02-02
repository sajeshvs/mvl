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
import { Bar, Doughnut } from 'react-chartjs-2';
import styles from './DisciplinesConsolidated.module.scss';
import { SharePointService } from '../../../../services/SharePointService';
import { IDiscipline, IFilterState, IDisciplinesData } from '../../../../models';
import { DashboardView } from '../SupplyIntelHub';
import Header from '../shared/Header/Header';
import FilterBar, { IFilterConfig, IActiveFilter } from '../shared/FilterBar/FilterBar';
import KPICard from '../shared/KPICard/KPICard';
import ChartCard from '../shared/ChartCard/ChartCard';
import { ChartColors, ChartDefaults } from '../shared/Charts/ChartColors';
import { formatCurrency, formatNumber, formatPercent } from '../../../../utils/FormatUtils';

// Helper functions for Object methods
function objectKeys(obj: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
}

function objectValues<T>(obj: Record<string, T>): T[] {
  const values: T[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      values.push(obj[key]);
    }
  }
  return values;
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

export interface IDisciplinesConsolidatedProps {
  spService: SharePointService;
  onNavigate: (view: DashboardView) => void;
  title: string;
}

const DisciplinesConsolidated: React.FC<IDisciplinesConsolidatedProps> = ({
  spService,
  onNavigate,
  title
}) => {
  // State
  const [data, setData] = useState<IDisciplinesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<IFilterState>({
    entity: '',
    search: ''
  });
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');

  // Load data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const disciplinesData = await spService.getDisciplinesData();
        setData(disciplinesData);
      } catch (error) {
        console.error('Error loading disciplines data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData().catch(console.error);
  }, [spService]);

  // Filter disciplines
  const filteredDisciplines = useMemo(() => {
    if (!data?.disciplines) return [];
    
    return data.disciplines.filter(d => {
      if (filters.entity && d.Entity !== filters.entity) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          (d.DisciplineName && d.DisciplineName.toLowerCase().indexOf(searchLower) >= 0) ||
          (d.DisciplineCode && d.DisciplineCode.toLowerCase().indexOf(searchLower) >= 0);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [data?.disciplines, filters]);

  // Calculate summary from filtered data
  const summary = useMemo(() => {
    const disciplines = filteredDisciplines;
    const totalDisciplines = disciplines.length;
    const totalBudget = disciplines.reduce((sum, d) => sum + (d.Budget || 0), 0);
    const totalActual = disciplines.reduce((sum, d) => sum + (d.Actual || 0), 0);
    const totalVariance = totalBudget - totalActual;
    const variancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

    return { totalDisciplines, totalBudget, totalActual, totalVariance, variancePercent };
  }, [filteredDisciplines]);

  // Get filter options
  const filterConfigs = useMemo((): IFilterConfig[] => {
    if (!data) return [];

    const entities: string[] = [];
    data.disciplines.forEach(d => {
      if (d.Entity && entities.indexOf(d.Entity) === -1) entities.push(d.Entity);
    });

    return [
      {
        id: 'entity',
        label: 'Entity',
        value: filters.entity,
        options: entities.map(e => ({ key: e, text: e }))
      }
    ];
  }, [data, filters]);

  // Active filters for display
  const activeFilters = useMemo((): IActiveFilter[] => {
    const active: IActiveFilter[] = [];
    if (filters.entity) active.push({ id: 'entity', label: 'Entity', value: filters.entity });
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
    setFilters({ entity: '', search: '' });
  }, []);

  // Chart data: Budget vs Actual
  const budgetVsActualData = useMemo(() => {
    const sorted = [...filteredDisciplines]
      .sort((a, b) => (b.Budget || 0) - (a.Budget || 0))
      .slice(0, 15);

    return {
      labels: sorted.map(d => d.DisciplineName),
      datasets: [
        {
          label: 'Budget',
          data: sorted.map(d => d.Budget || 0),
          backgroundColor: ChartColors.primaryLight,
          borderRadius: 4
        },
        {
          label: 'Actual',
          data: sorted.map(d => d.Actual || 0),
          backgroundColor: ChartColors.success,
          borderRadius: 4
        }
      ]
    };
  }, [filteredDisciplines]);

  // Chart data: Variance distribution
  const varianceData = useMemo(() => {
    const sorted = [...filteredDisciplines]
      .sort((a, b) => Math.abs(b.Variance || 0) - Math.abs(a.Variance || 0))
      .slice(0, 10);

    return {
      labels: sorted.map(d => d.DisciplineName),
      datasets: [{
        label: 'Variance',
        data: sorted.map(d => d.Variance || 0),
        backgroundColor: sorted.map(d => 
          (d.Variance || 0) >= 0 ? ChartColors.success : ChartColors.danger
        ),
        borderRadius: 4
      }]
    };
  }, [filteredDisciplines]);

  // Chart data: Distribution by entity
  const entityDistributionData = useMemo(() => {
    const grouped = filteredDisciplines.reduce((acc, d) => {
      const key = d.Entity || 'Unknown';
      acc[key] = (acc[key] || 0) + (d.Budget || 0);
      return acc;
    }, {} as Record<string, number>);

    const labels = objectKeys(grouped as Record<string, unknown>);
    return {
      labels,
      datasets: [{
        data: objectValues(grouped),
        backgroundColor: ChartColors.getColors(labels.length)
      }]
    };
  }, [filteredDisciplines]);

  const hasFilters = activeFilters.length > 0 || !!filters.search;

  return (
    <div className={styles.disciplinesConsolidated}>
      {/* Header */}
      <Header
        title="Disciplines Consolidated"
        subtitle="Budget vs Actual Analysis"
        lastRefresh={new Date().toLocaleString()}
        entityInfo={`${formatNumber(filteredDisciplines.length)} disciplines${hasFilters ? ' (filtered)' : ''}`}
        showBackButton
        onBack={() => onNavigate('portal')}
        accentColor="#0f3d5e"
      />

      {/* Filters */}
      <FilterBar
        filters={filterConfigs}
        activeFilters={activeFilters}
        searchValue={filters.search}
        searchPlaceholder="Search disciplines..."
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
            icon="📋"
            label="Disciplines"
            value={formatNumber(summary.totalDisciplines)}
            change={hasFilters ? 'Filtered' : 'All records'}
            changeType={hasFilters ? 'filtered' : 'neutral'}
          />
          <KPICard
            icon="💰"
            label="Total Budget"
            value={formatCurrency(summary.totalBudget, true)}
            variant="info"
          />
          <KPICard
            icon="📊"
            label="Total Actual"
            value={formatCurrency(summary.totalActual, true)}
          />
          <KPICard
            icon="📈"
            label="Variance"
            value={formatCurrency(summary.totalVariance, true)}
            variant={summary.totalVariance >= 0 ? 'success' : 'danger'}
            change={summary.totalVariance >= 0 ? 'Under budget' : 'Over budget'}
            changeType={summary.totalVariance >= 0 ? 'positive' : 'negative'}
          />
          <KPICard
            icon="📉"
            label="Variance %"
            value={formatPercent(summary.variancePercent)}
            variant={summary.variancePercent >= 0 ? 'success' : 'danger'}
          />
        </div>

        {/* View Toggle */}
        <div className={styles.viewToggle}>
          <button
            className={viewMode === 'chart' ? styles.active : ''}
            onClick={() => setViewMode('chart')}
          >
            📊 Charts
          </button>
          <button
            className={viewMode === 'cards' ? styles.active : ''}
            onClick={() => setViewMode('cards')}
          >
            🃏 Cards
          </button>
        </div>

        {viewMode === 'chart' ? (
          <>
            {/* Charts Row 1 */}
            <div className={styles.chartsGrid}>
              <ChartCard
                title="Budget vs Actual"
                subtitle="Top disciplines by budget"
                height={400}
                isLoading={isLoading}
                isEmpty={budgetVsActualData.labels.length === 0}
              >
                <Bar
                  data={budgetVsActualData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                      legend: ChartDefaults.legend,
                      tooltip: ChartDefaults.tooltip
                    },
                    scales: {
                      x: {
                        ...ChartDefaults.scales.x,
                        stacked: false,
                        ticks: {
                          callback: (value) => formatCurrency(value as number, true)
                        }
                      },
                      y: {
                        ...ChartDefaults.scales.y,
                        stacked: false,
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </ChartCard>

              <ChartCard
                title="Entity Distribution"
                subtitle="Budget by entity"
                height={400}
                isLoading={isLoading}
                isEmpty={entityDistributionData.labels.length === 0}
              >
                <Doughnut
                  data={entityDistributionData}
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

            {/* Charts Row 2 - Variance */}
            <div className={styles.fullWidth}>
              <ChartCard
                title="Variance Analysis"
                subtitle="Top variances (positive = under budget)"
                height={300}
                isLoading={isLoading}
                isEmpty={varianceData.labels.length === 0}
              >
                <Bar
                  data={varianceData}
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
          </>
        ) : (
          /* Discipline Cards View */
          <div className={styles.disciplineCardsGrid}>
            {filteredDisciplines.map((discipline) => (
              <div key={discipline.Id} className={styles.disciplineCard}>
                <div className={styles.cardHeader}>
                  <h4>{discipline.DisciplineName}</h4>
                  <span className={styles.entity}>{discipline.Entity}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.metric}>
                    <span className={styles.label}>Budget</span>
                    <span className={styles.value}>{formatCurrency(discipline.Budget, true)}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.label}>Actual</span>
                    <span className={styles.value}>{formatCurrency(discipline.Actual, true)}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.label}>Variance</span>
                    <span className={`${styles.value} ${(discipline.Variance || 0) >= 0 ? styles.positive : styles.negative}`}>
                      {formatCurrency(discipline.Variance, true)}
                    </span>
                  </div>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progress}
                    style={{ 
                      width: `${Math.min(100, ((discipline.Actual || 0) / (discipline.Budget || 1)) * 100)}%`,
                      backgroundColor: (discipline.Actual || 0) <= (discipline.Budget || 0) 
                        ? ChartColors.success 
                        : ChartColors.danger
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DisciplinesConsolidated;
