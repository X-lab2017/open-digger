import {
  AdapterResult,
  DataSource,
  EntityData,
  EntityLocator,
  EntityType,
  MetricValue,
  SearchOptions,
  SearchResult,
} from './types';

export interface DataAdapter {
  readonly source: DataSource;
  readonly provider: 'opendigger' | 'opengauge';
  readonly entityTypes: readonly EntityType[];

  search(query: string, options: SearchOptions): Promise<AdapterResult<SearchResult[]>>;
  getEntity(locator: EntityLocator): Promise<AdapterResult<EntityData> | null>;
  getMetrics(locator: EntityLocator): Promise<AdapterResult<Record<string, MetricValue>> | null>;
}
