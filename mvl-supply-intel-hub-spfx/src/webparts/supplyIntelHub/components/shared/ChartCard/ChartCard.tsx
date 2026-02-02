import * as React from 'react';
import styles from './ChartCard.module.scss';

export interface IChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
  showToggle?: boolean;
  toggleOptions?: { key: string; label: string }[];
  activeToggle?: string;
  onToggle?: (key: string) => void;
  actions?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

const ChartCard: React.FC<IChartCardProps> = ({
  title,
  subtitle,
  children,
  height = 300,
  showToggle = false,
  toggleOptions = [],
  activeToggle,
  onToggle,
  actions,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available'
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <h3 className={styles.cardTitle}>{title}</h3>
          {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
        </div>
        <div className={styles.headerRight}>
          {showToggle && toggleOptions.length > 0 && (
            <div className={styles.toggleGroup}>
              {toggleOptions.map((option) => (
                <button
                  key={option.key}
                  className={`${styles.toggleButton} ${activeToggle === option.key ? styles.active : ''}`}
                  onClick={() => onToggle && onToggle(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {actions}
        </div>
      </div>
      <div className={styles.cardBody} style={{ height }}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Loading...</span>
          </div>
        ) : isEmpty ? (
          <div className={styles.empty}>
            <span>📊</span>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className={styles.chartContainer}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartCard;
