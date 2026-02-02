// ==========================================================================
// MVL Supply Intel Hub - Data Models
// TypeScript interfaces for SharePoint list data
// ==========================================================================

/**
 * Quotation record from MT_Quotations list
 */
export interface IQuotation {
  Id: number;
  QuotationNumber: string;
  SupplierName: string;
  Entity: string;
  MaterialGroup: string;
  MaterialCode?: string;
  QuotationValue: number;
  Currency: string;
  Status: string;
  StatusCategory?: string;
  QuoteType?: string;
  CreatedDate: string;
  ValidityDays?: number;
  Description?: string;
  DeliveryTerms?: string;
  PaymentTerms?: string;
  PONumber?: string;
  LinkedPO?: string;
}

/**
 * Purchase Order record from MT_PurchaseOrders list
 */
export interface IPurchaseOrder {
  Id: number;
  PONumber: string;
  SupplierName: string;
  Entity: string;
  MaterialGroup?: string;
  POValue: number;
  Currency: string;
  PODate: string;
  Status: string;
  DeliveryDate?: string;
  Description?: string;
  QuotationNumber?: string;
}

/**
 * Supplier record from MT_Suppliers list
 */
export interface ISupplier {
  Id: number;
  SupplierName: string;
  SupplierCode?: string;
  Category?: string;
  Country?: string;
  City?: string;
  ContactEmail?: string;
  ContactPhone?: string;
  Status: string;
  Rating?: number;
  TotalQuotations?: number;
  TotalPOs?: number;
  TotalSpend?: number;
}

/**
 * Entity record from MT_Entities list
 */
export interface IEntity {
  Id: number;
  EntityName: string;
  EntityCode: string;
  Country?: string;
  Region?: string;
  Status: string;
}

/**
 * Discipline record from MT_Disciplines list
 */
export interface IDiscipline {
  Id: number;
  DisciplineName: string;
  DisciplineCode?: string;
  Entity: string;
  Budget: number;
  Actual: number;
  Variance?: number;
  VariancePercent?: number;
  Currency: string;
  Year?: number;
}

/**
 * Material Group record from MT_MaterialGroups list
 */
export interface IMaterialGroup {
  Id: number;
  MaterialGroupName: string;
  MaterialGroupCode: string;
  Category?: string;
  Description?: string;
}

/**
 * Summary record from MT_Summary list
 */
export interface ISummary {
  Id: number;
  MetricName: string;
  MetricValue: number;
  MetricType: string;
  Period?: string;
  Entity?: string;
  LastUpdated: string;
}

/**
 * Spend by Month record from MT_SpendByMonth list
 */
export interface ISpendByMonth {
  Id: number;
  Month: string;
  Year: number;
  Entity?: string;
  Spend: number;
  QuotationValue?: number;
  POCount?: number;
  Currency: string;
}

// ==========================================================================
// Aggregated/Computed Types
// ==========================================================================

export interface IPortalSummary {
  totalQuotations: number;
  totalPurchaseOrders: number;
  totalSuppliers: number;
  totalSpend: number;
  lastRefresh: string;
}

export interface ISupplierMarketplaceData {
  quotations: IQuotation[];
  suppliers: ISupplier[];
  materialGroups: IMaterialGroup[];
  entities: IEntity[];
  summary: {
    totalQuotations: number;
    totalPOs: number;
    totalCancelled: number;
    winRate: number;
    totalQuoteValue: number;
    totalPOValue: number;
  };
}

export interface IGlobalSpendData {
  purchaseOrders: IPurchaseOrder[];
  suppliers: ISupplier[];
  entities: IEntity[];
  spendByMonth: ISpendByMonth[];
  summary: {
    totalPOs: number;
    totalSpend: number;
    avgPOValue: number;
    activeEntities: number;
    activeSuppliers: number;
  };
}

export interface IDisciplinesData {
  disciplines: IDiscipline[];
  entities: IEntity[];
  summary: {
    totalDisciplines: number;
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    variancePercent: number;
  };
}

// ==========================================================================
// Filter State Types
// ==========================================================================

export interface IFilterState {
  entity: string;
  supplier?: string;
  status?: string;
  materialGroup?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ==========================================================================
// Chart Data Types
// ==========================================================================

export interface IChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface IFunnelData {
  quotation: number;
  waiting: number;
  order: number;
  cancelled: number;
}

export interface ITrendData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}
