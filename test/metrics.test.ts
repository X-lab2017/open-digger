import assert from 'assert';
const openDigger = require('../src/metrics/index');

describe('Index and metric test', () => {
  // use repos under google org in 2015 to 2016

  const commonAssert = async (func: (option: any) => Promise<any[]>, key: string, options?: any) => {
    const years = 2;
    const months = 24;

    // year group with latest order
    const option: any = {
      startYear: 2015, endYear: 2016, startMonth: 1, endMonth: 12,
      orgIds: [1342004], order: 'DESC', limit: 3,
      groupTimeRange: 'year',
      ...(options?.queryOptions ? options.queryOptions : {}),
    };
    let result = await func(option);
    assert.strictEqual(result.length, option.limit); // the limit works fine
    assert.strictEqual(result.every(r => r[key].length === years), true);  // the main field has correct length
    // order works fine
    if (options?.index !== undefined) {
      assert.strictEqual(parseFloat(result[0][key][years - 1][options.index]) >= parseFloat(result[option.limit - 1][key][years - 1][options.index]), true);
    } else {
      assert.strictEqual(parseFloat(result[0][key][years - 1]) >= parseFloat(result[option.limit - 1][key][years - 1]), true);
    }

    if (options?.noTotal) return;
    // month group with total order
    option.groupTimeRange = 'month';
    option.orderOption = 'total';
    option.order = 'ASC';
    result = await func(option);
    assert.strictEqual(result.length, option.limit); // the limit works fine
    assert.strictEqual(result.every(r => r[key].length === months), true);  // the main field has correct length
    // order works fine
    const sumFunc = (res: any, f?: any): number => res[key].map(r => parseFloat(f ? f(r) : r)).reduce((p, c) => p + c);
    if (options?.index !== undefined) {
      assert.strictEqual(sumFunc(result[0], r => r[options.index]) <= sumFunc(result[option.limit - 1], r => r[options.index]), true);
    } else {
      assert.strictEqual(sumFunc(result[0]) <= sumFunc(result[option.limit - 1]), true);
    }
  };
  describe('Indices tests', () => {
    it('activity', async () => {
      await commonAssert(openDigger.getRepoActivity, 'activity');
    });
  });
  describe('Metrics tests', () => {
    it('repo stars', async () => {
      await commonAssert(openDigger.repoStars, 'count');
    });
    it('repo issue comment', async () => {
      await commonAssert(openDigger.repoIssueComments, 'count');
    });
    it('repo participants', async () => {
      await commonAssert(openDigger.repoParticipants, 'count');
    });
  });
  describe('CHAOSS metrics tests', () => {
    it('code change commits', async () => {
      await commonAssert(openDigger.chaossCodeChangeCommits, 'count');
    });
    it('issues new', async () => {
      await commonAssert(openDigger.chaossIssuesNew, 'count');
    });
    it('issues active', async () => {
      await commonAssert(openDigger.chaossIssuesActive, 'count');
    });
    it('issues closed', async () => {
      await commonAssert(openDigger.chaossIssuesClosed, 'count');
    });
    it('bus factor', async () => {
      await commonAssert(openDigger.chaossBusFactor, 'bus_factor');
    });
    it('change request accepted', async () => {
      await commonAssert(openDigger.chaossChangeRequestsAccepted, 'count');
    });
    it('change request declined', async () => {
      await commonAssert(openDigger.chaossChangeRequestsDeclined, 'count');
    });
    it('issue resolution duration', async () => {
      const getParams = (key: string): [() => any, string, any] =>
        [openDigger.chaossIssueResolutionDuration, key, { noTotal: true, queryOptions: { options: { sortBy: key } } }];
      await commonAssert(...getParams('avg'));
      await commonAssert(...getParams('quantile_0'));
      await commonAssert(...getParams('quantile_1'));
      await commonAssert(...getParams('quantile_2'));
      await commonAssert(...getParams('quantile_3'));
      await commonAssert(...getParams('quantile_4'));
      const p = getParams('levels');
      await commonAssert(p[0], p[1], { index: 1, ...p[2] });
    });
    it('change request resolution duration', async () => {
      const getParams = (key: string): [() => any, string, any] =>
        [openDigger.chaossChangeRequestResolutionDuration, key, { noTotal: true, queryOptions: { options: { sortBy: key } } }];
      await commonAssert(...getParams('avg'));
      await commonAssert(...getParams('quantile_0'));
      await commonAssert(...getParams('quantile_1'));
      await commonAssert(...getParams('quantile_2'));
      await commonAssert(...getParams('quantile_3'));
      await commonAssert(...getParams('quantile_4'));
      const p = getParams('levels');
      await commonAssert(p[0], p[1], { index: 1, ...p[2] });
    });
    it('issue response time', async () => {
      const getParams = (key: string): [() => any, string, any] =>
        [openDigger.chaossIssueResponseTime, key, { noTotal: true, queryOptions: { options: { sortBy: key } } }];
      await commonAssert(...getParams('avg'));
      await commonAssert(...getParams('quantile_0'));
      await commonAssert(...getParams('quantile_1'));
      await commonAssert(...getParams('quantile_2'));
      await commonAssert(...getParams('quantile_3'));
      await commonAssert(...getParams('quantile_4'));
      const p = getParams('levels');
      await commonAssert(p[0], p[1], { index: 1, ...p[2] });
    });
    it('code change lines', async () => {
      await commonAssert(openDigger.chaossCodeChangeLines, 'lines');
    });
    it('technical fork', async () => {
      await commonAssert(openDigger.chaossTechnicalFork, 'count');
    });
    it('change requests', async () => {
      await commonAssert(openDigger.chaossChangeRequests, 'count');
    });
    it('request reviews', async () => {
      await commonAssert(openDigger.chaossChangeRequestReviews, 'count');
    });
    it('new contributors', async () => {
      await commonAssert(openDigger.chaossNewContributors, 'new_contributors');
    });
    it('request requests duration', async () => {
      const getParams = (key: string): [() => any, string, any] =>
        [openDigger.chaossChangeRequestsDuration, key, { noTotal: true, queryOptions: { options: { sortBy: key } } }];
      await commonAssert(...getParams('avg'));
      await commonAssert(...getParams('quantile_0'));
      await commonAssert(...getParams('quantile_1'));
      await commonAssert(...getParams('quantile_2'));
      await commonAssert(...getParams('quantile_3'));
      await commonAssert(...getParams('quantile_4'));
      const p = getParams('levels');
      await commonAssert(p[0], p[1], { index: 1, ...p[2] });
    });
    it('request requests acceptance ratio', async () => {
      await commonAssert(openDigger.chaossChangeRequestsAcceptanceRatio, 'ratio');
    });
  });
});
