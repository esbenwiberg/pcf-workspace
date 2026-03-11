/**
 * Minimal PCF type definitions for development and testing.
 * These mirror the real ComponentFramework types but are self-contained
 * so apps don't need pcf-scripts installed.
 */

export interface PcfContext<TInputs = Record<string, PcfProperty>> {
  parameters: TInputs;
  mode: PcfMode;
  webAPI: PcfWebApi;
  formatting: PcfFormatting;
  navigation: PcfNavigation;
  utils: PcfUtility;
  updatedProperties: string[];
}

export interface PcfProperty<T = unknown> {
  raw: T | null;
  formatted?: string;
  type: string;
  attributes?: {
    LogicalName: string;
    DisplayName: string;
    Type: string;
  };
}

export interface PcfMode {
  isControlDisabled: boolean;
  isVisible: boolean;
  label: string;
  allocatedHeight: number;
  allocatedWidth: number;
  trackContainerResize: (value: boolean) => void;
}

export interface PcfDataset {
  sortedRecordIds: string[];
  records: Record<string, PcfDatasetRecord>;
  columns: PcfDatasetColumn[];
  paging: PcfDatasetPaging;
  sorting: PcfDatasetSorting[];
  filtering: PcfDatasetFiltering;
  loading: boolean;
  error: boolean;
  errorMessage: string;
  refresh: () => void;
}

export interface PcfDatasetRecord {
  getRecordId: () => string;
  getFormattedValue: (columnName: string) => string;
  getValue: (columnName: string) => unknown;
  getNamedReference: () => { id: { guid: string }; name: string; entityType: string };
}

export interface PcfDatasetColumn {
  name: string;
  displayName: string;
  dataType: string;
  order: number;
  visualSizeFactor: number;
  isHidden: boolean;
  isPrimary: boolean;
}

export interface PcfDatasetPaging {
  totalResultCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loadNextPage: () => void;
  loadPreviousPage: () => void;
  setPageSize: (pageSize: number) => void;
  reset: () => void;
}

export interface PcfDatasetSorting {
  name: string;
  sortDirection: 0 | 1;
}

export interface PcfDatasetFiltering {
  getFilter: () => unknown;
  setFilter: (expression: unknown) => void;
  clearFilter: () => void;
}

export interface PcfWebApi {
  createRecord: (
    entityType: string,
    data: Record<string, unknown>,
  ) => Promise<{ id: { guid: string } }>;
  retrieveRecord: (
    entityType: string,
    id: string,
    options?: string,
  ) => Promise<Record<string, unknown>>;
  retrieveMultipleRecords: (
    entityType: string,
    options?: string,
  ) => Promise<{ entities: Record<string, unknown>[]; nextLink?: string }>;
  updateRecord: (
    entityType: string,
    id: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  deleteRecord: (entityType: string, id: string) => Promise<void>;
}

export interface PcfFormatting {
  formatCurrency: (value: number, precision?: number, currencySymbol?: string) => string;
  formatDecimal: (value: number, precision?: number) => string;
  formatInteger: (value: number) => string;
  formatDateShort: (value: Date) => string;
  formatDateLong: (value: Date) => string;
}

export interface PcfNavigation {
  openForm: (options: { entityName: string; entityId?: string }) => Promise<void>;
  openUrl: (url: string, options?: { height?: number; width?: number }) => void;
  openAlertDialog: (
    alertStrings: { text: string; confirmButtonLabel?: string },
    options?: unknown,
  ) => Promise<void>;
  openConfirmDialog: (
    confirmStrings: { title?: string; text: string },
    options?: unknown,
  ) => Promise<{ confirmed: boolean }>;
}

export interface PcfUtility {
  getEntityMetadata: (entityType: string) => Promise<unknown>;
  lookupObjects: (options: unknown) => Promise<unknown[]>;
}
