import type { ODataQuery, PagedResult, EntityMetadata, OptionSetValue } from './types';

export interface IDataverseClient {
  retrieveMultiple<T = Record<string, unknown>>(query: ODataQuery): Promise<PagedResult<T>>;
  retrieve<T = Record<string, unknown>>(
    entityType: string,
    id: string,
    select?: string[],
  ): Promise<T>;
  create(entityType: string, data: Record<string, unknown>): Promise<string>;
  update(entityType: string, id: string, data: Record<string, unknown>): Promise<void>;
  delete(entityType: string, id: string): Promise<void>;
  getEntityMetadata(entityType: string): Promise<EntityMetadata>;
  getOptionSet(entityType: string, attribute: string): Promise<OptionSetValue[]>;
}
