import * as React from 'react';
import styles from './Header.module.scss';
import { DashboardView } from '../../SupplyIntelHub';

// Import logo from project assets folder
const logoUrl = require('../../../../../../assets/images/logo.png');

export interface IHeaderProps {
  title: string;
  subtitle?: string;
  lastRefresh?: string;
  entityInfo?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onNavigate?: (view: DashboardView) => void;
  accentColor?: string;
}

const Header: React.FC<IHeaderProps> = ({
  title,
  subtitle,
  lastRefresh,
  entityInfo,
  showBackButton = false,
  onBack,
  accentColor
}) => {
  const headerStyle = accentColor ? {
    background: `linear-gradient(135deg, ${accentColor} 0%, ${adjustColor(accentColor, -20)} 100%)`
  } : undefined;

  return (
    <header className={styles.dashboardHeader} style={headerStyle}>
      <div className={styles.headerLeft}>
        {showBackButton && onBack && (
          <button 
            className={styles.backButton} 
            onClick={onBack}
            aria-label="Go back to portal"
          >
            ← Back
          </button>
        )}
        <img src={logoUrl} alt="MVL Logo" className={styles.logo} />
        <div className={styles.titleContainer}>
          <h1>{title}</h1>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      </div>
      <div className={styles.headerRight}>
        {lastRefresh && (
          <div className={styles.refreshTime}>
            Last Refresh: {lastRefresh}
          </div>
        )}
        {entityInfo && (
          <div className={styles.entityInfo}>
            {entityInfo}
          </div>
        )}
      </div>
    </header>
  );
};

/**
 * Adjust color brightness
 */
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  const result = ((r << 16) | (g << 8) | b).toString(16);
  return '#' + ('000000' + result).slice(-6);
}

export default Header;
