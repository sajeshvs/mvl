import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPFI } from '@pnp/sp';

export interface ISupplyIntelHubProps {
    title: string;
    defaultDashboard: string;
    context: WebPartContext;
    sp: SPFI;
    isDarkTheme: boolean;
    hasTeamsContext: boolean;
}
