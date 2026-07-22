import { DataAdapter } from './adapter';
import {
  AdapterResult,
  EntityData,
  EntityLocator,
  EntityType,
  MetricSeriesPoint,
  MetricValue,
  SearchOptions,
  SearchResult,
} from './types';

export type QueryParams = Record<string, string | number | boolean>;
export type QueryExecutor = <T>(query: string, queryParams?: QueryParams) => Promise<T[]>;

interface SearchRow { id: string; updated_at: string; }
interface ModelRow {
  id: string;
  author: string;
  created_at: string;
  updated_at: string;
  pipeline_tag: string;
  library_name: string;
  tags: string[];
  gated: number | boolean;
  disabled: number | boolean;
}
interface DatasetRow {
  id: string;
  author: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  gated: number | boolean;
  disabled: number | boolean;
  citation: string | null;
  description: string;
}
interface MetricSeedRow {
  internal_id: string;
  downloads: number | null;
  likes: number | null;
  downloads_all_time: number | null;
  updated_at: string;
}
interface HistoryRow {
  download_count: number;
  like_count: number;
  crawl_time: string;
}

const SUPPORTED_ENTITY_TYPES: readonly EntityType[] = ['model', 'dataset'];

export class HuggingFaceAdapter implements DataAdapter {
  readonly source = 'huggingface' as const;
  readonly provider = 'opengauge' as const;
  readonly entityTypes = SUPPORTED_ENTITY_TYPES;
  private readonly query: QueryExecutor;
  private readonly database: string;

  constructor(query: QueryExecutor, database = 'huggingface_scrapy') {
    this.query = query;
    this.database = database;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(database)) {
      throw new Error(`Invalid ClickHouse database name: ${database}`);
    }
  }

  async search(query: string, options: SearchOptions): Promise<AdapterResult<SearchResult[]>> {
    const requestedTypes = (options.entity_types ?? [...SUPPORTED_ENTITY_TYPES])
      .filter((entityType): entityType is 'model' | 'dataset' => SUPPORTED_ENTITY_TYPES.includes(entityType));
    const limit = Math.min(Math.max(options.limit, 1), 100);
    const settled = await Promise.allSettled(
      requestedTypes.map(entityType => this.searchEntityType(entityType, query, limit)),
    );
    const data: SearchResult[] = [];
    const warnings: string[] = [];
    settled.forEach((result, index) => {
      const entityType = requestedTypes[index];
      if (result.status === 'rejected') warnings.push(`${entityType}: unavailable`);
      else data.push(...result.value);
    });
    return {
      data: data.slice(0, limit),
      as_of: new Date().toISOString(),
      provider: this.provider,
      data_quality: [],
      warnings,
    };
  }

  async getEntity(locator: EntityLocator): Promise<AdapterResult<EntityData> | null> {
    this.assertSupportedLocator(locator);
    const entityId = `${locator.namespace}/${locator.name}`;
    const table = locator.entity_type === 'model' ? 'model_repos' : 'dataset_repos';
    const sourceUrl = locator.entity_type === 'model'
      ? `https://huggingface.co/${entityId}`
      : `https://huggingface.co/datasets/${entityId}`;

    if (locator.entity_type === 'model') {
      const rows = await this.query<ModelRow>(`
SELECT
  id,
  argMax(author, lastModified) AS author,
  min(createdAt) AS created_at,
  max(lastModified) AS updated_at,
  argMax(pipeline_tag, lastModified) AS pipeline_tag,
  argMax(library_name, lastModified) AS library_name,
  argMax(tags, lastModified) AS tags,
  argMax(gated, lastModified) AS gated,
  argMax(disabled, lastModified) AS disabled
FROM ${this.database}.${table}
WHERE id = {entityId:String}
GROUP BY id
HAVING argMax(private, lastModified) = 0
LIMIT 1`, { entityId });
      const row = rows[0];
      if (!row) return null;
      const metrics = await this.getMetrics(locator);
      return this.entityResult({
        source: this.source,
        entity_type: 'model',
        entity_id: row.id,
        name: this.displayName(row.id),
        source_url: sourceUrl,
        attributes: {
          author: row.author,
          created_at: row.created_at,
          updated_at: row.updated_at,
          pipeline_tag: row.pipeline_tag,
          library_name: row.library_name,
          tags: row.tags,
          gated: Boolean(row.gated),
          disabled: Boolean(row.disabled),
        },
        metrics: metrics?.data ?? {},
      }, metrics, row.updated_at);
    }

    const rows = await this.query<DatasetRow>(`
SELECT
  id,
  argMax(author, lastModified) AS author,
  min(createdAt) AS created_at,
  max(lastModified) AS updated_at,
  argMax(tags, lastModified) AS tags,
  argMax(gated, lastModified) AS gated,
  argMax(disabled, lastModified) AS disabled,
  argMax(citation, lastModified) AS citation,
  argMax(description, lastModified) AS description
FROM ${this.database}.${table}
WHERE id = {entityId:String}
GROUP BY id
HAVING argMax(private, lastModified) = 0
LIMIT 1`, { entityId });
    const row = rows[0];
    if (!row) return null;
    const metrics = await this.getMetrics(locator);
    return this.entityResult({
      source: this.source,
      entity_type: 'dataset',
      entity_id: row.id,
      name: this.displayName(row.id),
      source_url: sourceUrl,
      attributes: {
        author: row.author,
        created_at: row.created_at,
        updated_at: row.updated_at,
        tags: row.tags,
        gated: Boolean(row.gated),
        disabled: Boolean(row.disabled),
        citation: row.citation,
        description: row.description,
      },
      metrics: metrics?.data ?? {},
    }, metrics, row.updated_at);
  }

  async getMetrics(locator: EntityLocator): Promise<AdapterResult<Record<string, MetricValue>> | null> {
    this.assertSupportedLocator(locator);
    const entityId = `${locator.namespace}/${locator.name}`;
    const table = locator.entity_type === 'model' ? 'model_repos' : 'dataset_repos';
    const seedRows = await this.query<MetricSeedRow>(`
SELECT
  argMax(_id, lastModified) AS internal_id,
  argMax(downloads, lastModified) AS downloads,
  argMax(likes, lastModified) AS likes,
  argMax(downloadsAllTime, lastModified) AS downloads_all_time,
  max(lastModified) AS updated_at
FROM ${this.database}.${table}
WHERE id = {entityId:String}
HAVING argMax(private, lastModified) = 0
LIMIT 1`, { entityId });
    const seed = seedRows[0];
    if (!seed || !seed.internal_id) return null;
    const history = await this.query<HistoryRow>(`
SELECT download_count, like_count, crawl_time
FROM ${this.database}.dllk_history
WHERE _id = {internalId:String}
ORDER BY crawl_time ASC`, { internalId: seed.internal_id });
    const latest = history[history.length - 1];
    const observedAt = latest?.crawl_time ?? seed.updated_at;
    const metrics: Record<string, MetricValue> = {
      'huggingface.downloads': {
        value: seed.downloads,
        unit: 'downloads',
        observed_at: seed.updated_at,
      },
      'huggingface.likes': {
        value: seed.likes,
        unit: 'likes',
        observed_at: seed.updated_at,
      },
      'huggingface.downloads_all_time': {
        value: seed.downloads_all_time,
        unit: 'downloads',
        observed_at: observedAt,
      },
      'huggingface.last_modified': {
        value: seed.updated_at,
        unit: null,
        observed_at: seed.updated_at,
      },
    };
    if (latest) {
      metrics['huggingface.downloads_history'] = {
        value: latest.download_count,
        unit: 'downloads',
        observed_at: latest.crawl_time,
        series: this.series(history, 'download_count'),
      };
      metrics['huggingface.likes_history'] = {
        value: latest.like_count,
        unit: 'likes',
        observed_at: latest.crawl_time,
        series: this.series(history, 'like_count'),
      };
    }
    return {
      data: metrics,
      as_of: observedAt,
      provider: this.provider,
      data_quality: latest ? [] : ['metric_history_missing'],
      warnings: [],
    };
  }

  private async searchEntityType(
    entityType: 'model' | 'dataset',
    query: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const table = entityType === 'model' ? 'model_repos' : 'dataset_repos';
    const rows = await this.query<SearchRow>(`
SELECT id, max(lastModified) AS updated_at
FROM ${this.database}.${table}
WHERE positionCaseInsensitiveUTF8(id, {query:String}) > 0
GROUP BY id
HAVING argMax(private, lastModified) = 0
ORDER BY updated_at DESC
LIMIT {limit:UInt32}`, { query, limit });
    return rows.map(row => ({
      source: this.source,
      entity_type: entityType,
      entity_id: row.id,
      name: this.displayName(row.id),
      source_url: entityType === 'model'
        ? `https://huggingface.co/${row.id}`
        : `https://huggingface.co/datasets/${row.id}`,
    }));
  }

  private entityResult(
    data: EntityData,
    metrics: AdapterResult<Record<string, MetricValue>> | null,
    fallbackAsOf: string,
  ): AdapterResult<EntityData> {
    return {
      data,
      as_of: metrics?.as_of ?? fallbackAsOf,
      provider: this.provider,
      data_quality: metrics?.data_quality ?? ['metric_history_missing'],
      warnings: metrics?.warnings ?? [],
    };
  }

  private assertSupportedLocator(locator: EntityLocator): asserts locator is EntityLocator & {
    entity_type: 'model' | 'dataset';
  } {
    if (!SUPPORTED_ENTITY_TYPES.includes(locator.entity_type)) {
      throw new Error(`Unsupported Hugging Face entity type: ${locator.entity_type}`);
    }
    if (!locator.namespace.trim() || !locator.name.trim()) {
      throw new Error('Hugging Face namespace and name must not be empty');
    }
  }

  private displayName(entityId: string): string {
    return entityId.split('/').pop() ?? entityId;
  }

  private series(history: HistoryRow[], key: 'download_count' | 'like_count'): MetricSeriesPoint[] {
    return history.map(row => ({ time: row.crawl_time, value: row[key] }));
  }
}
