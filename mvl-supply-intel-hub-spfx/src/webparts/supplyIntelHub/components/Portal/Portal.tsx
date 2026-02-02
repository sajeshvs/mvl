import * as React from 'react';
import { useState, useEffect } from 'react';
import styles from './Portal.module.scss';
import { SharePointService } from '../../../../services/SharePointService';
import { DashboardView } from '../SupplyIntelHub';

export interface IPortalProps {
  spService: SharePointService;
  onNavigate: (view: DashboardView) => void;
  title: string;
}

interface IPortalStats {
  totalQuotations: number;
  totalPurchaseOrders: number;
  totalSuppliers: number;
  totalSpend: number;
  lastRefresh: string;
}

const Portal: React.FC<IPortalProps> = ({ spService, onNavigate, title }) => {
  const [stats, setStats] = useState<IPortalStats>({
    totalQuotations: 0,
    totalPurchaseOrders: 0,
    totalSuppliers: 0,
    totalSpend: 0,
    lastRefresh: new Date().toLocaleString()
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const summaryData = await spService.getSummary();
        setStats({
          totalQuotations: summaryData.totalQuotations || 0,
          totalPurchaseOrders: summaryData.totalPurchaseOrders || 0,
          totalSuppliers: summaryData.totalSuppliers || 0,
          totalSpend: summaryData.totalSpend || 0,
          lastRefresh: new Date().toLocaleString()
        });
      } catch (error) {
        console.error('Error loading portal stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats().catch(console.error);
  }, [spService]);

  const formatCurrency = (value: number): string => {
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const dashboards = [
    {
      id: 'supplier-marketplace' as DashboardView,
      title: 'Supplier Marketplace',
      description: 'Analyze quotation funnel, supplier performance, win rates, and material group trends.',
      icon: '📊',
      iconClass: styles.supplierIcon,
      features: [
        'Quotation pipeline funnel',
        'Win rate analysis',
        'Top suppliers ranking',
        'Material group breakdown'
      ]
    },
    {
      id: 'global-spend' as DashboardView,
      title: 'Global Spend Analysis',
      description: 'Track purchase orders, spend by entity, supplier rankings, and monthly trends.',
      icon: '💰',
      iconClass: styles.spendIcon,
      features: [
        'Total spend tracking',
        'Entity-wise breakdown',
        'Supplier spend ranking',
        'Monthly trend analysis'
      ]
    },
    {
      id: 'disciplines' as DashboardView,
      title: 'Disciplines Consolidated',
      description: 'Monitor budget vs actual spend, variance analysis, and discipline-level insights.',
      icon: '📈',
      iconClass: styles.disciplinesIcon,
      features: [
        'Budget vs Actual comparison',
        'Variance tracking',
        'Discipline breakdown',
        'Cost control insights'
      ]
    }
  ];

  return (
    <div className={styles.portal}>
      {/* Header */}
      <header className={styles.portalHeader}>
        <div className={styles.headerContent}>
          <div className={styles.logoContainer}>
            {/* Logo will be added as asset */}
            <span className={styles.logoText}>MVL</span>
          </div>
          <div className={styles.titleContainer}>
            <h1>{title || 'MVL Supply Intel Hub'}</h1>
            <p>Comprehensive Procurement Analytics Dashboard</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.portalContent}>
        {/* Stats Bar */}
        <section className={styles.statsBar}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {isLoading ? '...' : stats.totalQuotations.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Quotations</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {isLoading ? '...' : stats.totalPurchaseOrders.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Purchase Orders</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {isLoading ? '...' : stats.totalSuppliers.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Suppliers</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {isLoading ? '...' : formatCurrency(stats.totalSpend)}
            </div>
            <div className={styles.statLabel}>Total Spend</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats.lastRefresh}</div>
            <div className={styles.statLabel}>Last Updated</div>
          </div>
        </section>

        {/* Dashboard Cards */}
        <section className={styles.dashboardGrid}>
          {dashboards.map((dashboard) => (
            <article
              key={dashboard.id}
              className={styles.dashboardCard}
              onClick={() => onNavigate(dashboard.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate(dashboard.id)}
            >
              <div className={`${styles.cardIcon} ${dashboard.iconClass}`}>
                <span>{dashboard.icon}</span>
              </div>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>{dashboard.title}</h2>
                <p className={styles.cardDescription}>{dashboard.description}</p>
                <ul className={styles.cardFeatures}>
                  {dashboard.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.cardCta}>
                <span>Open Dashboard</span>
                <span className={styles.arrow}>→</span>
              </div>
            </article>
          ))}
        </section>

        {/* Footer */}
        <footer className={styles.portalFooter}>
          <p>MVL Supply Intelligence Hub • Data synced from MicroTrack</p>
        </footer>
      </main>
    </div>
  );
};

export default Portal;
