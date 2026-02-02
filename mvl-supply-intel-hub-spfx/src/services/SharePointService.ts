import { SPFI } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import {
  IQuotation,
  IPurchaseOrder,
  ISupplier,
  IEntity,
  IDiscipline,
  IMaterialGroup,
  ISummary,
  ISpendByMonth,
  IPortalSummary,
  ISupplierMarketplaceData,
  IGlobalSpendData,
  IDisciplinesData
} from '../models';

/**
 * SharePoint Service - Data access layer for MT_* lists
 */
export class SharePointService {
  private sp: SPFI;
  private context: WebPartContext;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // SharePoint List Names
  private readonly LISTS = {
    QUOTATIONS: 'MT_Quotations',
    PURCHASE_ORDERS: 'MT_PurchaseOrders',
    SUPPLIERS: 'MT_Suppliers',
    ENTITIES: 'MT_Entities',
    DISCIPLINES: 'MT_Disciplines',
    MATERIAL_GROUPS: 'MT_MaterialGroups',
    SUMMARY: 'MT_Summary',
    SPEND_BY_MONTH: 'MT_SpendByMonth'
  };

  constructor(sp: SPFI, context: WebPartContext) {
    this.sp = sp;
    this.context = context;
  }

  /**
   * Get cached data or fetch from SharePoint
   */
  private async getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }

    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
  }

  // ==========================================================================
  // Portal Summary Data
  // ==========================================================================

  /**
   * Get summary statistics for portal page
   */
  public async getSummary(): Promise<IPortalSummary> {
    return this.getCachedOrFetch('portal-summary', async () => {
      try {
        // Fetch counts from each list
        const [quotations, purchaseOrders, suppliers] = await Promise.all([
          this.sp.web.lists.getByTitle(this.LISTS.QUOTATIONS).items.select('Id').top(5000)(),
          this.sp.web.lists.getByTitle(this.LISTS.PURCHASE_ORDERS).items.select('Id', 'ValueUSD').top(5000)(),
          this.sp.web.lists.getByTitle(this.LISTS.SUPPLIERS).items.select('Id').top(500)()
        ]);

        const totalSpend = purchaseOrders.reduce((sum: number, po: { ValueUSD?: number }) => 
          sum + (po.ValueUSD || 0), 0);

        return {
          totalQuotations: quotations.length,
          totalPurchaseOrders: purchaseOrders.length,
          totalSuppliers: suppliers.length,
          totalSpend,
          lastRefresh: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error fetching summary:', error);
        // Return default values on error
        return {
          totalQuotations: 0,
          totalPurchaseOrders: 0,
          totalSuppliers: 0,
          totalSpend: 0,
          lastRefresh: new Date().toISOString()
        };
      }
    });
  }

  // ==========================================================================
  // Quotations (Supplier Marketplace)
  // ==========================================================================

  /**
   * Get all quotations
   */
  public async getQuotations(): Promise<IQuotation[]> {
    return this.getCachedOrFetch('quotations', async () => {
      try {
        const items = await this.sp.web.lists
          .getByTitle(this.LISTS.QUOTATIONS)
          .items
          .select(
            'Id',
            'Title',
            'QuotationID',
            'ClientName',
            'Entity',
            'Discipline',
            'ValueUSD',
            'Status',
            'Created'
          )
          .top(5000)
          .orderBy('Created', false)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          QuotationNumber: (item.QuotationID || item.Title || '') as string,
          SupplierName: (item.ClientName || 'Unknown') as string,
          Entity: (item.Entity || 'Unknown') as string,
          MaterialGroup: (item.Discipline || 'Unknown') as string,
          MaterialCode: undefined,
          QuotationValue: (item.ValueUSD || 0) as number,
          Currency: 'USD',
          Status: (item.Status || 'Quotation') as string,
          StatusCategory: undefined,
          QuoteType: undefined,
          CreatedDate: item.Created as string,
          ValidityDays: undefined,
          Description: (item.ClientName || '') as string,
          DeliveryTerms: undefined,
          PaymentTerms: undefined,
          PONumber: undefined
        }));
      } catch (error) {
        console.error('Error fetching quotations:', error);
        return [];
      }
    });
  }

  /**
   * Get Supplier Marketplace dashboard data
   */
  public async getSupplierMarketplaceData(): Promise<ISupplierMarketplaceData> {
    const [quotations, suppliers, materialGroups, entities] = await Promise.all([
      this.getQuotations(),
      this.getSuppliers(),
      this.getMaterialGroups(),
      this.getEntities()
    ]);

    // Calculate summary
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

    return {
      quotations,
      suppliers,
      materialGroups,
      entities,
      summary: {
        totalQuotations,
        totalPOs,
        totalCancelled,
        winRate,
        totalQuoteValue,
        totalPOValue
      }
    };
  }

  // ==========================================================================
  // Purchase Orders (Global Spend Analysis)
  // ==========================================================================

  /**
   * Get all purchase orders
   */
  public async getPurchaseOrders(): Promise<IPurchaseOrder[]> {
    return this.getCachedOrFetch('purchase-orders', async () => {
      try {
        const items = await this.sp.web.lists
          .getByTitle(this.LISTS.PURCHASE_ORDERS)
          .items
          .select(
            'Id',
            'Title',
            'POID',
            'SupplierName',
            'Entity',
            'MaterialGroup',
            'ValueUSD',
            'Created'
          )
          .top(5000)
          .orderBy('Created', false)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          PONumber: (item.POID || item.Title || '') as string,
          SupplierName: (item.SupplierName || 'Unknown') as string,
          Entity: (item.Entity || 'Unknown') as string,
          MaterialGroup: (item.MaterialGroup || '') as string | undefined,
          POValue: (item.ValueUSD || 0) as number,
          Currency: 'USD',
          PODate: item.Created as string,
          Status: 'Active',
          DeliveryDate: undefined,
          Description: undefined,
          QuotationNumber: undefined
        }));
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
        return [];
      }
    });
  }

  /**
   * Get Global Spend Analysis dashboard data
   */
  public async getGlobalSpendData(): Promise<IGlobalSpendData> {
    const [purchaseOrders, suppliers, entities, spendByMonth] = await Promise.all([
      this.getPurchaseOrders(),
      this.getSuppliers(),
      this.getEntities(),
      this.getSpendByMonth()
    ]);

    // Calculate summary
    const totalPOs = purchaseOrders.length;
    const totalSpend = purchaseOrders.reduce((sum, po) => sum + (po.POValue || 0), 0);
    const avgPOValue = totalPOs > 0 ? totalSpend / totalPOs : 0;
    const activeEntities = new Set(purchaseOrders.map(po => po.Entity)).size;
    const activeSuppliers = new Set(purchaseOrders.map(po => po.SupplierName)).size;

    return {
      purchaseOrders,
      suppliers,
      entities,
      spendByMonth,
      summary: {
        totalPOs,
        totalSpend,
        avgPOValue,
        activeEntities,
        activeSuppliers
      }
    };
  }

  // ==========================================================================
  // Disciplines
  // ==========================================================================

  /**
   * Get all disciplines
   */
  public async getDisciplines(): Promise<IDiscipline[]> {
    return this.getCachedOrFetch('disciplines', async () => {
      try {
        const items = await this.sp.web.lists
          .getByTitle(this.LISTS.DISCIPLINES)
          .items
          .select(
            'Id',
            'Title',
            'DisciplineName',
            'DisciplineCode',
            'Category'
          )
          .top(500)();

        return items.map((item: Record<string, unknown>) => {
          return {
            Id: item.Id as number,
            DisciplineName: (item.DisciplineName || item.Title || '') as string,
            DisciplineCode: item.DisciplineCode as string | undefined,
            Entity: 'All' as string,
            Budget: 0,
            Actual: 0,
            Variance: 0,
            VariancePercent: 0,
            Currency: 'USD',
            Year: new Date().getFullYear()
          };
        });
      } catch (error) {
        console.error('Error fetching disciplines:', error);
        return [];
      }
    });
  }

  /**
   * Get Disciplines Consolidated dashboard data
   * Aggregates quotation and PO data by discipline (Material/Discipline field)
   */
  public async getDisciplinesData(): Promise<IDisciplinesData> {
    const [quotations, purchaseOrders, entities] = await Promise.all([
      this.getQuotations(),
      this.getPurchaseOrders(),
      this.getEntities()
    ]);

    // Aggregate quotations by discipline (MaterialGroup = Discipline field)
    const disciplineMap = new Map<string, {
      quotedValue: number;
      quotedCount: number;
      orderedValue: number;
      orderedCount: number;
    }>();

    // Process quotations
    for (let i = 0; i < quotations.length; i++) {
      const q = quotations[i];
      const discipline = q.MaterialGroup || 'Unknown';
      
      if (!disciplineMap.has(discipline)) {
        disciplineMap.set(discipline, {
          quotedValue: 0,
          quotedCount: 0,
          orderedValue: 0,
          orderedCount: 0
        });
      }
      
      const entry = disciplineMap.get(discipline);
      if (entry) {
        entry.quotedValue += q.QuotationValue || 0;
        entry.quotedCount += 1;
        
        // If status is 'Order', count as ordered
        if (q.Status === 'Order') {
          entry.orderedValue += q.QuotationValue || 0;
          entry.orderedCount += 1;
        }
      }
    }

    // Convert to disciplines array
    const disciplines: IDiscipline[] = [];
    const keys = Array.from(disciplineMap.keys());
    for (let i = 0; i < keys.length; i++) {
      const name = keys[i];
      const data = disciplineMap.get(name);
      if (data) {
        const variance = data.orderedValue - data.quotedValue;
        const variancePercent = data.quotedValue > 0 ? (variance / data.quotedValue) * 100 : 0;
        const utilization = data.quotedValue > 0 ? (data.orderedValue / data.quotedValue) * 100 : 0;
        
        disciplines.push({
          Id: i + 1,
          DisciplineName: name,
          DisciplineCode: name.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, ''),
          Entity: 'All',
          Budget: data.quotedValue,
          Actual: data.orderedValue,
          Variance: variance,
          VariancePercent: variancePercent,
          Currency: 'USD',
          Year: new Date().getFullYear()
        });
      }
    }

    // Sort by quoted value descending
    disciplines.sort((a, b) => (b.Budget || 0) - (a.Budget || 0));

    // Calculate summary
    const totalDisciplines = disciplines.length;
    const totalBudget = disciplines.reduce((sum, d) => sum + (d.Budget || 0), 0);
    const totalActual = disciplines.reduce((sum, d) => sum + (d.Actual || 0), 0);
    const totalVariance = totalActual - totalBudget;
    const variancePercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return {
      disciplines,
      entities,
      summary: {
        totalDisciplines,
        totalBudget,
        totalActual,
        totalVariance,
        variancePercent
      }
    };
  }

  // ==========================================================================
  // Reference Data
  // ==========================================================================

  /**
   * Get all suppliers
   */
  public async getSuppliers(): Promise<ISupplier[]> {
    return this.getCachedOrFetch('suppliers', async () => {
      try {
        const items = await this.sp.web.lists
          .getByTitle(this.LISTS.SUPPLIERS)
          .items
          .select('Id', 'Title', 'SupplierName', 'POCount', 'TotalSpendUSD')
          .top(500)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          SupplierName: (item.SupplierName || item.Title || '') as string,
          SupplierCode: undefined,
          Category: undefined,
          Country: undefined,
          City: undefined,
          Status: 'Active'
        }));
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        return [];
      }
    });
  }

  /**
   * Get all entities
   */
  public async getEntities(): Promise<IEntity[]> {
    return this.getCachedOrFetch('entities', async () => {
      try {
        const items = await this.sp.web.lists
          .getByTitle(this.LISTS.ENTITIES)
          .items
          .select('Id', 'Title', 'EntityName', 'EntityCode', 'Country', 'Region')
          .top(100)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          EntityName: (item.EntityName || item.Title || '') as string,
          EntityCode: (item.EntityCode || '') as string,
          Country: item.Country as string | undefined,
          Region: item.Region as string | undefined,
          Status: 'Active'
        }));
      } catch (error) {
        console.error('Error fetching entities:', error);
        return [];
      }
    });
  }

  /**
   * Get all material groups
   */
  public async getMaterialGroups(): Promise<IMaterialGroup[]> {
    return this.getCachedOrFetch('material-groups', async () => {
      try {
        const items = await this.sp.web.lists
          .getByTitle(this.LISTS.MATERIAL_GROUPS)
          .items
          .select('Id', 'Title', 'MaterialName', 'MaterialCode', 'Category')
          .top(100)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          MaterialGroupName: (item.MaterialName || item.Title || '') as string,
          MaterialGroupCode: (item.MaterialCode || '') as string,
          Category: item.Category as string | undefined,
          Description: undefined
        }));
      } catch (error) {
        console.error('Error fetching material groups:', error);
        return [];
      }
    });
  }

  /**
   * Get spend by month data
   */
  public async getSpendByMonth(): Promise<ISpendByMonth[]> {
    return this.getCachedOrFetch('spend-by-month', async () => {
      try {
        const items = await this.sp.web.lists
          .getByTitle(this.LISTS.SPEND_BY_MONTH)
          .items
          .select('Id', 'Title', 'YearMonth', 'Month', 'Year', 'TotalSpendUSD', 'POCount')
          .orderBy('Year', true)
          .orderBy('Month', true)
          .top(100)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          Month: (item.YearMonth || item.Title || '') as string,
          Year: (item.Year || new Date().getFullYear()) as number,
          Entity: undefined,
          Spend: (item.TotalSpendUSD || 0) as number,
          QuotationValue: undefined,
          POCount: item.POCount as number | undefined,
          Currency: 'USD'
        }));
      } catch (error) {
        console.error('Error fetching spend by month:', error);
        return [];
      }
    });
  }
}
