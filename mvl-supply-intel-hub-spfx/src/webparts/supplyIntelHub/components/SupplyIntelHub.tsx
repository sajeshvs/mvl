import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { SharePointService } from '../../../services/SharePointService';
import DisciplinesConsolidated from './DisciplinesConsolidated/DisciplinesConsolidated';
import GlobalSpendAnalysis from './GlobalSpendAnalysis/GlobalSpendAnalysis';
import { ISupplyIntelHubProps } from './ISupplyIntelHubProps';
import Portal from './Portal/Portal';
import SupplierMarketplace from './SupplierMarketplace/SupplierMarketplace';
import styles from './SupplyIntelHub.module.scss';

export type DashboardView = 'portal' | 'supplier-marketplace' | 'global-spend' | 'disciplines';

export interface IAppState {
    currentView: DashboardView;
    isLoading: boolean;
    error: string | null;
    lastRefresh: Date | null;
}

const SupplyIntelHub: React.FC<ISupplyIntelHubProps> = (props) => {
    const { title, defaultDashboard, context, sp } = props;

    const [state, setState] = useState<IAppState>({
        currentView: (defaultDashboard as DashboardView) || 'portal',
        isLoading: false,
        error: null,
        lastRefresh: null
    });

    // Initialize SharePoint service
    const [spService] = useState(() => new SharePointService(sp, context));

    // Navigation handler
    const navigateTo = useCallback((view: DashboardView) => {
        setState(prev => ({ ...prev, currentView: view }));
        // Update URL hash for bookmarking
        window.location.hash = view;
    }, []);

    // Handle browser back/forward
    useEffect(() => {
        const handleHashChange = (): void => {
            const hash = window.location.hash.replace('#', '') as DashboardView;
            const validViews = ['portal', 'supplier-marketplace', 'global-spend', 'disciplines'];
            if (validViews.indexOf(hash) >= 0) {
                setState(prev => ({ ...prev, currentView: hash }));
            }
        };

        window.addEventListener('hashchange', handleHashChange);

        // Check initial hash
        if (window.location.hash) {
            handleHashChange();
        }

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Render current dashboard view
    const renderCurrentView = (): JSX.Element => {
        const commonProps = {
            spService,
            onNavigate: navigateTo,
            title
        };

        switch (state.currentView) {
            case 'supplier-marketplace':
                return <SupplierMarketplace {...commonProps} />;
            case 'global-spend':
                return <GlobalSpendAnalysis {...commonProps} />;
            case 'disciplines':
                return <DisciplinesConsolidated {...commonProps} />;
            case 'portal':
            default:
                return <Portal {...commonProps} />;
        }
    };

    return (
        <div className={styles.supplyIntelHub}>
            {state.error && (
                <div className={styles.errorBanner}>
                    <span>⚠️ {state.error}</span>
                    <button onClick={() => setState(prev => ({ ...prev, error: null }))}>×</button>
                </div>
            )}

            {renderCurrentView()}
        </div>
    );
};

export default SupplyIntelHub;
