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
          this.sp.web.lists.getByTitle(this.LISTS.PURCHASE_ORDERS).items.select('Id', 'POValue').top(5000)(),
          this.sp.web.lists.getByTitle(this.LISTS.SUPPLIERS).items.select('Id').top(500)()
        ]);

        const totalSpend = purchaseOrders.reduce((sum: number, po: { POValue?: number }) => 
          sum + (po.POValue || 0), 0);

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
            'QuotationNumber',
            'SupplierName',
            'Entity',
            'MaterialGroup',
            'MaterialCode',
            'QuotationValue',
            'Currency',
            'Status',
            'StatusCategory',
            'QuoteType',
            'Created',
            'ValidityDays',
            'Description',
            'DeliveryTerms',
            'PaymentTerms',
            'PONumber'
          )
          .top(5000)
          .orderBy('Created', false)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          QuotationNumber: (item.QuotationNumber || item.Title || '') as string,
          SupplierName: (item.SupplierName || 'Unknown') as string,
          Entity: (item.Entity || 'Unknown') as string,
          MaterialGroup: (item.MaterialGroup || 'Unknown') as string,
          MaterialCode: item.MaterialCode as string | undefined,
          QuotationValue: (item.QuotationValue || 0) as number,
          Currency: (item.Currency || 'USD') as string,
          Status: (item.Status || 'Quotation') as string,
          StatusCategory: item.StatusCategory as string | undefined,
          QuoteType: item.QuoteType as string | undefined,
          CreatedDate: item.Created as string,
          ValidityDays: item.ValidityDays as number | undefined,
          Description: item.Description as string | undefined,
          DeliveryTerms: item.DeliveryTerms as string | undefined,
          PaymentTerms: item.PaymentTerms as string | undefined,
          PONumber: item.PONumber as string | undefined
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
            'PONumber',
            'SupplierName',
            'Entity',
            'MaterialGroup',
            'POValue',
            'Currency',
            'PODate',
            'Status',
            'DeliveryDate',
            'Description',
            'QuotationNumber'
          )
          .top(5000)
          .orderBy('PODate', false)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          PONumber: (item.PONumber || item.Title || '') as string,
          SupplierName: (item.SupplierName || 'Unknown') as string,
          Entity: (item.Entity || 'Unknown') as string,
          MaterialGroup: item.MaterialGroup as string | undefined,
          POValue: (item.POValue || 0) as number,
          Currency: (item.Currency || 'USD') as string,
          PODate: item.PODate as string,
          Status: (item.Status || 'Active') as string,
          DeliveryDate: item.DeliveryDate as string | undefined,
          Description: item.Description as string | undefined,
          QuotationNumber: item.QuotationNumber as string | undefined
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
            'Entity',
            'Budget',
            'Actual',
            'Currency',
            'Year'
          )
          .top(500)();

        return items.map((item: Record<string, unknown>) => {
          const budget = (item.Budget || 0) as number;
          const actual = (item.Actual || 0) as number;
          const variance = budget - actual;
          const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;

          return {
            Id: item.Id as number,
            DisciplineName: (item.DisciplineName || item.Title || '') as string,
            DisciplineCode: item.DisciplineCode as string | undefined,
            Entity: (item.Entity || 'Unknown') as string,
            Budget: budget,
            Actual: actual,
            Variance: variance,
            VariancePercent: variancePercent,
            Currency: (item.Currency || 'USD') as string,
            Year: item.Year as number | undefined
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
   */
  public async getDisciplinesData(): Promise<IDisciplinesData> {
    const [disciplines, entities] = await Promise.all([
      this.getDisciplines(),
      this.getEntities()
    ]);

    // Calculate summary
    const totalDisciplines = disciplines.length;
    const totalBudget = disciplines.reduce((sum, d) => sum + (d.Budget || 0), 0);
    const totalActual = disciplines.reduce((sum, d) => sum + (d.Actual || 0), 0);
    const totalVariance = totalBudget - totalActual;
    const variancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

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
          .select('Id', 'Title', 'SupplierName', 'SupplierCode', 'Category', 'Country', 'City', 'Status')
          .top(500)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          SupplierName: (item.SupplierName || item.Title || '') as string,
          SupplierCode: item.SupplierCode as string | undefined,
          Category: item.Category as string | undefined,
          Country: item.Country as string | undefined,
          City: item.City as string | undefined,
          Status: (item.Status || 'Active') as string
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
          .select('Id', 'Title', 'EntityName', 'EntityCode', 'Country', 'Region', 'Status')
          .top(100)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          EntityName: (item.EntityName || item.Title || '') as string,
          EntityCode: (item.EntityCode || '') as string,
          Country: item.Country as string | undefined,
          Region: item.Region as string | undefined,
          Status: (item.Status || 'Active') as string
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
          .select('Id', 'Title', 'MaterialGroupName', 'MaterialGroupCode', 'Category', 'Description')
          .top(100)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          MaterialGroupName: (item.MaterialGroupName || item.Title || '') as string,
          MaterialGroupCode: (item.MaterialGroupCode || '') as string,
          Category: item.Category as string | undefined,
          Description: item.Description as string | undefined
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
          .select('Id', 'Title', 'Month', 'Year', 'Entity', 'Spend', 'QuotationValue', 'POCount', 'Currency')
          .orderBy('Year', true)
          .orderBy('Month', true)
          .top(100)();

        return items.map((item: Record<string, unknown>) => ({
          Id: item.Id as number,
          Month: (item.Month || item.Title || '') as string,
          Year: (item.Year || new Date().getFullYear()) as number,
          Entity: item.Entity as string | undefined,
          Spend: (item.Spend || 0) as number,
          QuotationValue: item.QuotationValue as number | undefined,
          POCount: item.POCount as number | undefined,
          Currency: (item.Currency || 'USD') as string
        }));
      } catch (error) {
        console.error('Error fetching spend by month:', error);
        return [];
      }
    });
  }
}
