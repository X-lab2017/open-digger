import assert from 'assert';
import { DataAdapter } from '../src/dataGateway/adapter';
import { DataGateway } from '../src/dataGateway/gateway';
import { HuggingFaceAdapter, QueryExecutor, QueryParams } from '../src/dataGateway/huggingFaceAdapter';
import {
  AdapterResult,
  EntityData,
  EntityLocator,
  MetricValue,
  SearchOptions,
  SearchResult,
} from '../src/dataGateway/types';

class FakeAdapter implements DataAdapter {
  readonly entityTypes = ['repository'] as const;
  readonly source: 'github';
  readonly provider: 'opendigger';
  private readonly shouldFail: boolean;

  constructor(
    source: 'github',
    provider: 'opendigger',
    shouldFail = false,
  ) {
    this.source = source;
    this.provider = provider;
    this.shouldFail = shouldFail;
  }

  async search(query: string, _options: SearchOptions): Promise<AdapterResult<SearchResult[]>> {
    if (this.shouldFail) throw new Error('offline');
    return {
      data: [{
        source: this.source,
        entity_type: 'repository',
        entity_id: `example/${query}`,
        name: query,
        source_url: `https://github.com/example/${query}`,
      }],
      as_of: '2026-07-22T00:00:00.000Z',
      provider: this.provider,
      data_quality: [],
      warnings: [],
    };
  }

  async getEntity(_locator: EntityLocator): Promise<AdapterResult<EntityData> | null> { return null; }
  async getMetrics(_locator: EntityLocator): Promise<AdapterResult<Record<string, MetricValue>> | null> { return null; }
}

describe('DataGateway', () => {
  it('combines adapters behind one search response', async () => {
    const github = new FakeAdapter('github', 'opendigger');
    const huggingface = new HuggingFaceAdapter(async <T>(sql: string) => {
      if (sql.includes('model_repos')) {
        return [{ id: 'Qwen/Qwen3-8B', updated_at: '2026-07-22T00:00:00.000Z' }] as T[];
      }
      return [];
    });
    const gateway = new DataGateway(
      [github, huggingface],
      () => new Date('2026-07-22T01:00:00.000Z'),
    );
    const result = await gateway.search('qwen');
    assert.strictEqual(result.schema_version, '1.0');
    assert.deepStrictEqual(result.data.map(item => item.source), ['github', 'huggingface']);
    assert.strictEqual(result.meta.partial, false);
    assert.strictEqual(result.meta.as_of, '2026-07-22T01:00:00.000Z');
  });

  it('returns partial results when one source is unavailable', async () => {
    const gateway = new DataGateway([
      new FakeAdapter('github', 'opendigger', true),
      new HuggingFaceAdapter(async <T>(sql: string) => {
        if (sql.includes('model_repos')) {
          return [{ id: 'Qwen/Qwen3-8B', updated_at: '2026-07-22T00:00:00.000Z' }] as T[];
        }
        return [];
      }),
    ]);
    const result = await gateway.search('qwen');
    assert.strictEqual(result.meta.partial, true);
    assert.deepStrictEqual(result.meta.warnings, ['github: unavailable']);
    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.data[0].source, 'huggingface');
  });

  it('rejects unsupported sources instead of falling through', async () => {
    const gateway = new DataGateway([]);
    await assert.rejects(
      gateway.search('qwen', { sources: ['github'] }),
      /Unsupported data source: github/,
    );
  });

  it('routes metric reads through the selected adapter', async () => {
    const huggingface = new HuggingFaceAdapter(async <T>(sql: string) => {
      if (sql.includes('AS downloads_all_time')) {
        return [{ internal_id: 'hf-id', downloads: 7, likes: 2, downloads_all_time: 20,
          updated_at: '2026-07-22T00:00:00.000Z' }] as T[];
      }
      return [];
    });
    const gateway = new DataGateway([huggingface]);
    const result = await gateway.getMetrics('huggingface', {
      entity_type: 'model', namespace: 'example', name: 'model',
    });
    assert(result);
    assert.strictEqual(result.schema_version, '1.0');
    assert.strictEqual(result.data['huggingface.downloads'].value, 7);
    assert.strictEqual(result.meta.provider, 'opengauge');
  });
});

describe('HuggingFaceAdapter', () => {
  it('uses query parameters for search and excludes private entities', async () => {
    const calls: { sql: string, params: Record<string, unknown> }[] = [];
    const query: QueryExecutor = async <T>(sql: string, params: QueryParams = {}) => {
      calls.push({ sql, params });
      if (sql.includes('model_repos')) {
        return [{ id: 'Qwen/Qwen3-8B', updated_at: '2026-07-22T00:00:00.000Z' }] as T[];
      }
      return [];
    };
    const adapter = new HuggingFaceAdapter(query);
    const result = await adapter.search("qwen' OR 1=1", { entity_types: ['model'], limit: 500 });
    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(calls[0].params.query, "qwen' OR 1=1");
    assert.strictEqual(calls[0].params.limit, 100);
    assert(!calls[0].sql.includes("qwen' OR 1=1"));
    assert(calls[0].sql.includes('HAVING argMax(private, lastModified) = 0'));
  });

  it('maps a model and its history to the unified entity response', async () => {
    const calls: { sql: string, params: Record<string, unknown> }[] = [];
    const query: QueryExecutor = async <T>(sql: string, params: QueryParams = {}) => {
      calls.push({ sql, params });
      if (sql.includes('AS author')) {
        return [{
          id: 'Qwen/Qwen3-8B', author: 'Qwen',
          created_at: '2026-07-01T00:00:00.000Z', updated_at: '2026-07-20T00:00:00.000Z',
          pipeline_tag: 'text-generation', library_name: 'transformers', tags: ['transformers'],
          gated: 0, disabled: 0,
        }] as T[];
      }
      if (sql.includes('AS downloads_all_time')) {
        return [{ internal_id: 'hf-internal-id', downloads: 150, likes: 12, downloads_all_time: 1200,
          updated_at: '2026-07-20T00:00:00.000Z' }] as T[];
      }
      if (sql.includes('dllk_history')) {
        return [
          { download_count: 100, like_count: 10, crawl_time: '2026-07-20T00:00:00.000Z' },
          { download_count: 150, like_count: 12, crawl_time: '2026-07-21T00:00:00.000Z' },
        ] as T[];
      }
      return [];
    };
    const gateway = new DataGateway([new HuggingFaceAdapter(query)]);
    const result = await gateway.getEntity('huggingface', {
      entity_type: 'model', namespace: 'Qwen', name: 'Qwen3-8B',
    });
    assert(result);
    assert.strictEqual(result.schema_version, '1.0');
    assert.strictEqual(result.data.entity_id, 'Qwen/Qwen3-8B');
    assert.strictEqual(result.data.attributes.pipeline_tag, 'text-generation');
    assert.strictEqual(result.data.metrics['huggingface.downloads'].value, 150);
    assert.strictEqual(result.data.metrics['huggingface.downloads_history'].series?.length, 2);
    assert.strictEqual(result.meta.as_of, '2026-07-21T00:00:00.000Z');
    const historyCall = calls.find(call => call.sql.includes('dllk_history'));
    assert(historyCall);
    assert.strictEqual(historyCall.params.internalId, 'hf-internal-id');
  });

  it('queries history by internal id and marks missing history', async () => {
    const query: QueryExecutor = async <T>(sql: string, params: QueryParams = {}) => {
      if (sql.includes('AS downloads_all_time')) {
        return [{ internal_id: 'dataset-internal-id', downloads: 3, likes: 1, downloads_all_time: 10,
          updated_at: '2026-07-20T00:00:00.000Z' }] as T[];
      }
      if (sql.includes('dllk_history')) {
        assert.strictEqual(params.internalId, 'dataset-internal-id');
        assert.strictEqual(params.entityId, undefined);
      }
      return [];
    };
    const adapter = new HuggingFaceAdapter(query);
    const result = await adapter.getMetrics({
      entity_type: 'dataset', namespace: 'example', name: 'data',
    });
    assert(result);
    assert.deepStrictEqual(result.data_quality, ['metric_history_missing']);
  });
});
