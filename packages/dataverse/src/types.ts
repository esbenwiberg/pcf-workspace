export interface ODataQuery {
  entityType: string;
  select?: string[];
  filter?: string;
  orderBy?: string;
  top?: number;
  expand?: string[];
}

export interface PagedResult<T> {
  entities: T[];
  nextLink?: string;
  totalCount?: number;
}

export interface EntityMetadata {
  logicalName: string;
  displayName: string;
  primaryIdAttribute: string;
  primaryNameAttribute: string;
  attributes: AttributeMetadata[];
}

export interface AttributeMetadata {
  logicalName: string;
  displayName: string;
  attributeType: string;
  isRequired: boolean;
}

export interface OptionSetValue {
  value: number;
  label: string;
  color?: string;
}

export interface DataverseRecord {
  [key: string]: unknown;
}
