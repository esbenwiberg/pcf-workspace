import type { IDataverseClient } from './client.interface';
import type { ODataQuery, PagedResult, EntityMetadata, OptionSetValue } from './types';

export interface MockDataverseClientOptions {
  entities?: Record<string, Record<string, unknown>[]>;
  metadata?: Record<string, EntityMetadata>;
  optionSets?: Record<string, OptionSetValue[]>;
  latency?: number;
}

export class MockDataverseClient implements IDataverseClient {
  private entities: Record<string, Record<string, unknown>[]>;
  private metadata: Record<string, EntityMetadata>;
  private optionSets: Record<string, OptionSetValue[]>;
  private latency: number;

  constructor(options: MockDataverseClientOptions = {}) {
    this.entities = options.entities ?? {};
    this.metadata = options.metadata ?? {};
    this.optionSets = options.optionSets ?? {};
    this.latency = options.latency ?? 0;
  }

  private async delay(): Promise<void> {
    if (this.latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latency));
    }
  }

  async retrieveMultiple<T = Record<string, unknown>>(
    query: ODataQuery,
  ): Promise<PagedResult<T>> {
    await this.delay();
    const records = (this.entities[query.entityType] ?? []) as T[];
    const top = query.top ?? records.length;
    return {
      entities: records.slice(0, top),
      totalCount: records.length,
    };
  }

  async retrieve<T = Record<string, unknown>>(
    entityType: string,
    id: string,
  ): Promise<T> {
    await this.delay();
    const records = this.entities[entityType] ?? [];
    const record = records.find(
      (r) => r[`${entityType}id`] === id || r['id'] === id,
    );
    if (!record) {
      throw new Error(`Record not found: ${entityType}(${id})`);
    }
    return record as T;
  }

  async create(entityType: string, data: Record<string, unknown>): Promise<string> {
    await this.delay();
    const id = crypto.randomUUID();
    if (!this.entities[entityType]) {
      this.entities[entityType] = [];
    }
    this.entities[entityType].push({ ...data, [`${entityType}id`]: id });
    return id;
  }

  async update(entityType: string, id: string, data: Record<string, unknown>): Promise<void> {
    await this.delay();
    const records = this.entities[entityType] ?? [];
    const index = records.findIndex(
      (r) => r[`${entityType}id`] === id || r['id'] === id,
    );
    if (index === -1) {
      throw new Error(`Record not found: ${entityType}(${id})`);
    }
    records[index] = { ...records[index], ...data };
  }

  async delete(entityType: string, id: string): Promise<void> {
    await this.delay();
    const records = this.entities[entityType] ?? [];
    const index = records.findIndex(
      (r) => r[`${entityType}id`] === id || r['id'] === id,
    );
    if (index === -1) {
      throw new Error(`Record not found: ${entityType}(${id})`);
    }
    records.splice(index, 1);
  }

  async getEntityMetadata(entityType: string): Promise<EntityMetadata> {
    await this.delay();
    return (
      this.metadata[entityType] ?? {
        logicalName: entityType,
        displayName: entityType,
        primaryIdAttribute: `${entityType}id`,
        primaryNameAttribute: 'name',
        attributes: [],
      }
    );
  }

  async getOptionSet(entityType: string, attribute: string): Promise<OptionSetValue[]> {
    await this.delay();
    return this.optionSets[`${entityType}.${attribute}`] ?? [];
  }

  /** Add or replace mock data for an entity type */
  seed(entityType: string, records: Record<string, unknown>[]): void {
    this.entities[entityType] = records;
  }

  /** Clear all mock data */
  reset(): void {
    this.entities = {};
  }
}
