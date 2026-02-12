import * as React from 'react';
import styles from './KPICard.module.scss';

export type KPIVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface IKPICardProps {
    icon?: string;
    label: string;
    value: string | number;
    subValue?: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral' | 'filtered';
    variant?: KPIVariant;
    onClick?: () => void;
    isActive?: boolean;
}

const KPICard: React.FC<IKPICardProps> = ({
    icon,
    label,
    value,
    subValue,
    change,
    changeType = 'neutral',
    variant = 'default',
    onClick,
    isActive = false
}) => {
    const cardClasses = [
        styles.kpiCard,
        styles[variant],
        onClick ? styles.clickable : '',
        isActive ? styles.active : ''
    ].filter(Boolean).join(' ');

    const changeClasses = [
        styles.kpiChange,
        styles[changeType]
    ].join(' ');

    return (
        <div
            className={cardClasses}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
            {icon && <div className={styles.kpiIcon}>{icon}</div>}
            <div className={styles.kpiLabel}>{label}</div>
            <div className={styles.kpiValue}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {subValue && <div className={styles.kpiSub}>{subValue}</div>}
            {change && <div className={changeClasses}>{change}</div>}
        </div>
    );
};

export default KPICard;
