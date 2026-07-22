export const DATA_GATEWAY_SCHEMA_VERSION = '1.0' as const;

export type DataSource = 'github' | 'huggingface';
export type EntityType = 'repository' | 'model' | 'dataset' | 'account' | 'organization';

export interface MetricSeriesPoint {
  time: string;
  value: number | null;
}

export interface MetricValue {
  value: number | string | boolean | null;
  unit?: string | null;
  observed_at: string;
  series?: MetricSeriesPoint[];
}

export interface EntityData {
  source: DataSource;
  entity_type: EntityType;
  entity_id: string;
  name: string;
  source_url: string;
  attributes: Record<string, unknown>;
  metrics: Record<string, MetricValue>;
}

export interface ResponseMeta {
  as_of: string;
  provider: 'opendigger' | 'opengauge';
  data_quality: string[];
  warnings: string[];
}

export interface EntityResponse {
  schema_version: typeof DATA_GATEWAY_SCHEMA_VERSION;
  data: EntityData;
  meta: ResponseMeta;
}

export interface SearchResult {
  source: DataSource;
  entity_type: EntityType;
  entity_id: string;
  name: string;
  source_url: string;
}

export interface SearchResponse {
  schema_version: typeof DATA_GATEWAY_SCHEMA_VERSION;
  data: SearchResult[];
  meta: {
    as_of: string;
    partial: boolean;
    warnings: string[];
  };
}

export interface MetricsResponse {
  schema_version: typeof DATA_GATEWAY_SCHEMA_VERSION;
  data: Record<string, MetricValue>;
  meta: ResponseMeta;
}

export interface AdapterResult<T> {
  data: T;
  as_of: string;
  provider: ResponseMeta['provider'];
  data_quality: string[];
  warnings: string[];
}

export interface EntityLocator {
  entity_type: EntityType;
  namespace: string;
  name: string;
}

export interface SearchOptions {
  entity_types?: EntityType[];
  limit: number;
}

export interface SourceDescription {
  source: DataSource;
  provider: ResponseMeta['provider'];
  entity_types: EntityType[];
}
