import type { IDataverseClient } from './client.interface';
import type { ODataQuery, PagedResult, EntityMetadata, OptionSetValue } from './types';
import type { XrmWebApi } from './xrm-types';

/**
 * Resolves the Xrm.WebApi instance from the current runtime context.
 * Checks window.Xrm first (standalone page), then parent.Xrm (iframe in form).
 * Cross-origin parent access is caught gracefully.
 */
function resolveXrmWebApi(): XrmWebApi {
  if (window.Xrm?.WebApi) {
    return window.Xrm.WebApi;
  }

  try {
    if (window.parent?.Xrm?.WebApi) {
      return window.parent.Xrm.WebApi;
    }
  } catch {
    // Cross-origin iframe — parent access throws SecurityError
  }

  throw new Error(
    'XrmDataverseClient: No Xrm context found. ' +
      'This client only works inside Dynamics 365 web resources.',
  );
}

/**
 * Dataverse client for D365 web resources. Wraps Xrm.WebApi.
 * Works in both standalone pages (SiteMap) and iframe-embedded web resources.
 */
export class XrmDataverseClient implements IDataverseClient {
  private webApi: XrmWebApi;

  constructor(webApi?: XrmWebApi) {
    this.webApi = webApi ?? resolveXrmWebApi();
  }

  async retrieveMultiple<T = Record<string, unknown>>(
    query: ODataQuery,
  ): Promise<PagedResult<T>> {
    const options: string[] = [];
    if (query.select?.length) options.push(`$select=${query.select.join(',')}`);
    if (query.filter) options.push(`$filter=${query.filter}`);
    if (query.orderBy) options.push(`$orderby=${query.orderBy}`);
    if (query.top) options.push(`$top=${query.top}`);
    if (query.expand?.length) options.push(`$expand=${query.expand.join(',')}`);

    const result = await this.webApi.retrieveMultipleRecords(
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
    const result = await this.webApi.retrieveRecord(entityType, id, options);
    return result as T;
  }

  async create(entityType: string, data: Record<string, unknown>): Promise<string> {
    const result = await this.webApi.createRecord(entityType, data);
    return result.id;
  }

  async update(entityType: string, id: string, data: Record<string, unknown>): Promise<void> {
    await this.webApi.updateRecord(entityType, id, data);
  }

  async delete(entityType: string, id: string): Promise<void> {
    await this.webApi.deleteRecord(entityType, id);
  }

  async getEntityMetadata(_entityType: string): Promise<EntityMetadata> {
    throw new Error(
      'getEntityMetadata not available via Xrm.WebApi — use Xrm.Utility.getEntityMetadata instead',
    );
  }

  async getOptionSet(_entityType: string, _attribute: string): Promise<OptionSetValue[]> {
    throw new Error('getOptionSet not available via Xrm.WebApi');
  }
}
