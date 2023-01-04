import assert from 'assert';
const openDigger = require('../src/metrics/index');

describe('Index and metric test', () => {
  // use repos under google org in 2015 to 2016
  const limit = 3;
  const option = {
    startYear: 2015, endYear: 2016, startMonth: 1, endMonth: 12,
    orgIds: [1342004], order: 'DESC', limit,
    groupTimeRange: 'month',
  };
  const months = 24;
  describe('Indices tests', () => {
    it('activity', async () => {
      const result = await openDigger.getRepoActivity(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.activity.length === months), true);
    });
  });
  describe('Metrics tests', () => {
    it('repo stars', async () => {
      const result = await openDigger.repoStars(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('repo issue comment', async () => {
      const result = await openDigger.repoIssueComments(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('repo participants', async () => {
      const result = await openDigger.repoParticipants(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
  });
  describe('CHAOSS metrics tests', () => {
    it('code change commits', async () => {
      const result = await openDigger.chaossCodeChangeCommits(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('issues new', async () => {
      const result = await openDigger.chaossIssuesNew(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('issues closed', async () => {
      const result = await openDigger.chaossIssuesClosed(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('bus factor', async () => {
      const result = await openDigger.chaossBusFactor(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.bus_factor.length === months), true);
    });
    it('change request accepted', async () => {
      const result = await openDigger.chaossChangeRequestsAccepted(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('change request declined', async () => {
      const result = await openDigger.chaossChangeRequestsDeclined(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('issue resolution duration', async () => {
      const result = await openDigger.chaossIssueResolutionDuration(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.resolution_duration.length === months), true);
    });
    it('issue response time', async () => {
      const result = await openDigger.chaossIssueResponseTime(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.issue_response_time.length === months), true);
    });
    it('code change lines', async () => {
      const result = await openDigger.chaossCodeChangeLines(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.lines.length === months), true);
    });
    it('technical fork', async () => {
      const result = await openDigger.chaossTechnicalFork(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('change requests', async () => {
      const result = await openDigger.chaossChangeRequests(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('request reviews', async () => {
      const result = await openDigger.chaossChangeRequestReviews(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.count.length === months), true);
    });
    it('new contributors', async () => {
      const result = await openDigger.chaossNewContributors(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.new_contributors.length === months), true);
    });
    it('request requests duration', async () => {
      const result = await openDigger.chaossChangeRequestsDuration(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.resolution_duration.length === months), true);
    });
    it('request requests acceptance ratio', async () => {
      const result = await openDigger.chaossChangeRequestsAcceptanceRatio(option);
      assert.strictEqual(result.length, limit);
      assert.strictEqual(result.every(r => r.ratio.length === months), true);
    });
  });
});
