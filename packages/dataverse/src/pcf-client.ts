import type { IDataverseClient } from './client.interface';
import type { ODataQuery, PagedResult, EntityMetadata, OptionSetValue } from './types';

/**
 * Production Dataverse client that wraps PCF's context.webAPI.
 * Only used inside actual PCF shells at runtime.
 */
export class PcfDataverseClient implements IDataverseClient {
  constructor(private webAPI: ComponentFramework.WebApi) {}

  async retrieveMultiple<T = Record<string, unknown>>(
    query: ODataQuery,
  ): Promise<PagedResult<T>> {
    const options: string[] = [];
    if (query.select?.length) options.push(`$select=${query.select.join(',')}`);
    if (query.filter) options.push(`$filter=${query.filter}`);
    if (query.orderBy) options.push(`$orderby=${query.orderBy}`);
    if (query.top) options.push(`$top=${query.top}`);
    if (query.expand?.length) options.push(`$expand=${query.expand.join(',')}`);

    const result = await this.webAPI.retrieveMultipleRecords(
      query.entityType,
      `?${options.join('&')}`,
    );

    return {
      entities: result.entities as T[],
      nextLink: result.nextLink,
    };
  }

  async retrieve<T = Record<string, unknown>>(
    entityType: string,
    id: string,
    select?: string[],
  ): Promise<T> {
    const options = select?.length ? `?$select=${select.join(',')}` : undefined;
    const result = await this.webAPI.retrieveRecord(entityType, id, options);
    return result as T;
  }

  async create(entityType: string, data: Record<string, unknown>): Promise<string> {
    const result = await this.webAPI.createRecord(entityType, data);
    return typeof result.id === 'string' ? result.id : (result.id as { guid: string }).guid;
  }

  async update(entityType: string, id: string, data: Record<string, unknown>): Promise<void> {
    await this.webAPI.updateRecord(entityType, id, data);
  }

  async delete(entityType: string, id: string): Promise<void> {
    await this.webAPI.deleteRecord(entityType, id);
  }

  async getEntityMetadata(_entityType: string): Promise<EntityMetadata> {
    throw new Error(
      'getEntityMetadata not available via webAPI — use context.utils.getEntityMetadata instead',
    );
  }

  async getOptionSet(_entityType: string, _attribute: string): Promise<OptionSetValue[]> {
    throw new Error('getOptionSet not available via webAPI — use context utility API instead');
  }
}
