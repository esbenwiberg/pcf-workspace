/**
 * Minimal Xrm type definitions — just the subset we need for XrmDataverseClient.
 * Hand-rolled to avoid pulling in the massive @types/xrm package.
 */

export interface XrmWebApiRetrieveMultipleResponse {
  entities: Record<string, unknown>[];
  nextLink?: string;
}

export interface XrmWebApiEntityReference {
  id: string;
  entityType: string;
}

export interface XrmWebApi {
  retrieveMultipleRecords(
    entityType: string,
    options?: string,
    maxPageSize?: number,
  ): Promise<XrmWebApiRetrieveMultipleResponse>;
  retrieveRecord(
    entityType: string,
    id: string,
    options?: string,
  ): Promise<Record<string, unknown>>;
  createRecord(
    entityType: string,
    data: Record<string, unknown>,
  ): Promise<XrmWebApiEntityReference>;
  updateRecord(
    entityType: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<XrmWebApiEntityReference>;
  deleteRecord(
    entityType: string,
    id: string,
  ): Promise<XrmWebApiEntityReference>;
}

export interface XrmContext {
  WebApi: XrmWebApi;
}

declare global {
  interface Window {
    Xrm?: XrmContext;
  }
}
