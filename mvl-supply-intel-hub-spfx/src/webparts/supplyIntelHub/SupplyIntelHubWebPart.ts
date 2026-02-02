import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneDropdown
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';

import SupplyIntelHub from './components/SupplyIntelHub';
import { ISupplyIntelHubProps } from './components/ISupplyIntelHubProps';

// The SharePoint site URL where the MT_* lists are located
const DATA_SITE_URL = 'https://mvlgroupusa.sharepoint.com/sites/mvlmicrotrackpowerbi';

export interface ISupplyIntelHubWebPartProps {
  title: string;
  defaultDashboard: string;
}

export default class SupplyIntelHubWebPart extends BaseClientSideWebPart<ISupplyIntelHubWebPartProps> {
  private _sp: ReturnType<typeof spfi>;

  public async onInit(): Promise<void> {
    await super.onInit();
    
    // Initialize PnP JS - connect to the specific data site
    this._sp = spfi(DATA_SITE_URL).using(SPFx(this.context));
  }

  public render(): void {
    const element: React.ReactElement<ISupplyIntelHubProps> = React.createElement(
      SupplyIntelHub,
      {
        title: this.properties.title,
        defaultDashboard: this.properties.defaultDashboard,
        context: this.context,
        sp: this._sp,
        isDarkTheme: false,
        hasTeamsContext: !!this.context.sdks.microsoftTeams
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: 'Configure the MVL Supply Intel Hub dashboard settings'
          },
          groups: [
            {
              groupName: 'General Settings',
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Dashboard Title'
                }),
                PropertyPaneDropdown('defaultDashboard', {
                  label: 'Default Dashboard View',
                  options: [
                    { key: 'portal', text: 'Portal (Home)' },
                    { key: 'supplier-marketplace', text: 'Supplier Marketplace' },
                    { key: 'global-spend', text: 'Global Spend Analysis' },
                    { key: 'disciplines', text: 'Disciplines Consolidated' }
                  ],
                  selectedKey: 'portal'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
