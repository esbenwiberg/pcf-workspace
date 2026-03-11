import type {
  PcfDataset,
  PcfDatasetRecord,
  PcfDatasetColumn,
  PcfDatasetPaging,
  PcfDatasetSorting,
  PcfDatasetFiltering,
} from './pcf-types';

export interface DatasetColumnDef {
  name: string;
  displayName: string;
  dataType?: string;
  isPrimary?: boolean;
  isHidden?: boolean;
}

export interface DatasetContextOptions {
  records: Record<string, unknown>[];
  columns: DatasetColumnDef[];
  entityName: string;
  pageSize?: number;
  totalCount?: number;
  sorting?: PcfDatasetSorting[];
}

function createDatasetRecord(
  data: Record<string, unknown>,
  entityName: string,
  idField: string,
): PcfDatasetRecord {
  const id = String(data[idField] ?? data['id'] ?? crypto.randomUUID());
  return {
    getRecordId: () => id,
    getFormattedValue: (col: string) => {
      const val = data[col];
      return val != null ? String(val) : '';
    },
    getValue: (col: string) => data[col] ?? null,
    getNamedReference: () => ({
      id: { guid: id },
      name: String(data['name'] ?? ''),
      entityType: entityName,
    }),
  };
}

function createPaging(totalCount: number, pageSize: number): PcfDatasetPaging {
  let currentPage = 0;
  return {
    totalResultCount: totalCount,
    pageSize,
    get hasNextPage() {
      return (currentPage + 1) * pageSize < totalCount;
    },
    get hasPreviousPage() {
      return currentPage > 0;
    },
    loadNextPage: () => {
      currentPage++;
    },
    loadPreviousPage: () => {
      if (currentPage > 0) currentPage--;
    },
    setPageSize: (size: number) => {
      pageSize = size;
    },
    reset: () => {
      currentPage = 0;
    },
  };
}

function createFiltering(): PcfDatasetFiltering {
  let filter: unknown = null;
  return {
    getFilter: () => filter,
    setFilter: (expr: unknown) => {
      filter = expr;
    },
    clearFilter: () => {
      filter = null;
    },
  };
}

/**
 * Creates a mock PCF dataset for view/subgrid controls in Storybook and tests.
 */
export function createDatasetContext(options: DatasetContextOptions): PcfDataset {
  const { records, columns, entityName, pageSize = 25, totalCount, sorting = [] } = options;
  const idField = `${entityName}id`;

  const datasetRecords: Record<string, PcfDatasetRecord> = {};
  const sortedRecordIds: string[] = [];

  for (const rawRecord of records) {
    const record = createDatasetRecord(rawRecord as Record<string, unknown>, entityName, idField);
    const id = record.getRecordId();
    datasetRecords[id] = record;
    sortedRecordIds.push(id);
  }

  const datasetColumns: PcfDatasetColumn[] = columns.map((col, index) => ({
    name: col.name,
    displayName: col.displayName,
    dataType: col.dataType ?? 'SingleLine.Text',
    order: index,
    visualSizeFactor: 1,
    isHidden: col.isHidden ?? false,
    isPrimary: col.isPrimary ?? false,
  }));

  return {
    sortedRecordIds,
    records: datasetRecords,
    columns: datasetColumns,
    paging: createPaging(totalCount ?? records.length, pageSize),
    sorting,
    filtering: createFiltering(),
    loading: false,
    error: false,
    errorMessage: '',
    refresh: () => {
      console.log('[PCF Mock] dataset.refresh()');
    },
  };
}
