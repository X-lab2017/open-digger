import assert from 'assert';
import {
  developerCountForOverviewYear,
  latestOverviewReportYear,
  overviewYearRange,
  overviewYearSql,
} from '../src/dataProduction/openshareOverview';

describe('OpenShare overview time dimensions', () => {
  it('advances the natural-year export when January starts', () => {
    assert.strictEqual(latestOverviewReportYear('natural_year', new Date(2025, 11, 31)), 2024);
    assert.strictEqual(latestOverviewReportYear('natural_year', new Date(2026, 0, 1)), 2025);
  });

  it('advances the half-year export when July starts', () => {
    assert.strictEqual(latestOverviewReportYear('half_year', new Date(2025, 5, 30)), 2024);
    assert.strictEqual(latestOverviewReportYear('half_year', new Date(2025, 6, 1)), 2025);
  });

  it('maps the 2025 half-year dimension to July 2024 through June 2025', () => {
    assert.deepStrictEqual(overviewYearRange('half_year', 2025), {
      start: '2024-07-01',
      end: '2025-07-01',
    });
    assert.strictEqual(
      overviewYearSql('half_year', 'e.created_at'),
      'toYear(addMonths(e.created_at, 6))',
    );
  });

  it('keeps the existing natural-year boundaries', () => {
    assert.deepStrictEqual(overviewYearRange('natural_year', 2025), {
      start: '2025-01-01',
      end: '2026-01-01',
    });
  });

  it('uses Q2 for half-year totals and ignores later snapshots', () => {
    const entries = [
      { year: 2024, quarter: 4, count: 100 },
      { year: 2025, quarter: 1, count: 120 },
      { year: 2025, quarter: 2, count: 140 },
      { year: 2025, quarter: 3, count: 160 },
    ];
    assert.strictEqual(developerCountForOverviewYear(entries, 2025, 'half_year'), 140);
  });

  it('falls back from an unpublished Q2 snapshot one quarter at a time', () => {
    const q1Available = [
      { year: 2024, quarter: 4, count: 100 },
      { year: 2025, quarter: 1, count: 120 },
    ];
    assert.strictEqual(developerCountForOverviewYear(q1Available, 2025, 'half_year'), 120);
    assert.strictEqual(developerCountForOverviewYear(q1Available.slice(0, 1), 2025, 'half_year'), 100);
  });
});
