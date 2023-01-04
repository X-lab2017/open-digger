import assert from 'assert';
import { query as queryClickhouse, queryStream as queryClickhouseStream } from '../src/db/clickhouse';

describe('Database driver test', () => {
  describe('ClickHouse', () => {
    it('Should return correct database name', async () => {
      const result = await queryClickhouse<any>('SHOW DATABASES');
      assert.strictEqual(result.some(a => a.includes('opensource')), true);
    });
    it('Should return correct table name', async () => {
      const result = await queryClickhouse<any>('SHOW TABLES');
      assert.strictEqual(result.some(a => a.includes('gh_events')), true);
    });
    it('Should return correct event count with original format', async () => {
      const result = await queryClickhouse<any>('SELECT COUNT() FROM gh_events');
      assert.strictEqual(parseInt(result[0][0]) > 1e8, true);
    });
    it('Should return correct event count with specified format', async () => {
      const result = await queryClickhouse<any>('SELECT COUNT() AS count FROM gh_events', { format: 'JSONEachRow' });
      assert.strictEqual(parseInt(result[0].count) > 1e8, true);
    });
    it('Should return correct event count with stream query', async () => {
      const result: any[] = [];
      await queryClickhouseStream('SELECT COUNT() AS count, toYear(created_at) AS year FROM gh_events WHERE year <= 2016 GROUP BY year', row => result.push(row), { format: 'JSONEachRow' });
      assert.strictEqual(result.every(r => parseInt(r.count) > 1e5), true);
    });
  });
});
