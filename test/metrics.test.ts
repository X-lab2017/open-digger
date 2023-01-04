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
  const commonAssert = (result: any[], key: string) => {
    assert.strictEqual(result.length, limit);
    assert.strictEqual(result.every(r => r[key].length === months), true);
  };
  describe('Indices tests', () => {
    it('activity', async () => {
      const result = await openDigger.getRepoActivity(option);
      commonAssert(result, 'activity');
    });
  });
  describe('Metrics tests', () => {
    it('repo stars', async () => {
      const result = await openDigger.repoStars(option);
      commonAssert(result, 'count');
    });
    it('repo issue comment', async () => {
      const result = await openDigger.repoIssueComments(option);
      commonAssert(result, 'count');
    });
    it('repo participants', async () => {
      const result = await openDigger.repoParticipants(option);
      commonAssert(result, 'count');
    });
  });
  describe('CHAOSS metrics tests', () => {
    it('code change commits', async () => {
      const result = await openDigger.chaossCodeChangeCommits(option);
      commonAssert(result, 'count');
    });
    it('issues new', async () => {
      const result = await openDigger.chaossIssuesNew(option);
      commonAssert(result, 'count');
    });
    it('issues closed', async () => {
      const result = await openDigger.chaossIssuesClosed(option);
      commonAssert(result, 'count');
    });
    it('bus factor', async () => {
      const result = await openDigger.chaossBusFactor(option);
      commonAssert(result, 'bus_factor');
    });
    it('change request accepted', async () => {
      const result = await openDigger.chaossChangeRequestsAccepted(option);
      commonAssert(result, 'count');
    });
    it('change request declined', async () => {
      const result = await openDigger.chaossChangeRequestsDeclined(option);
      commonAssert(result, 'count');
    });
    it('issue resolution duration', async () => {
      const result = await openDigger.chaossIssueResolutionDuration(option);
      commonAssert(result, 'resolution_duration');
    });
    it('issue response time', async () => {
      const result = await openDigger.chaossIssueResponseTime(option);
      commonAssert(result, 'issue_response_time');
    });
    it('code change lines', async () => {
      const result = await openDigger.chaossCodeChangeLines(option);
      commonAssert(result, 'lines');
    });
    it('technical fork', async () => {
      const result = await openDigger.chaossTechnicalFork(option);
      commonAssert(result, 'count');
    });
    it('change requests', async () => {
      const result = await openDigger.chaossChangeRequests(option);
      commonAssert(result, 'count');
    });
    it('request reviews', async () => {
      const result = await openDigger.chaossChangeRequestReviews(option);
      commonAssert(result, 'count');
    });
    it('new contributors', async () => {
      const result = await openDigger.chaossNewContributors(option);
      commonAssert(result, 'new_contributors');
    });
    it('request requests duration', async () => {
      const result = await openDigger.chaossChangeRequestsDuration(option);
      commonAssert(result, 'resolution_duration');
    });
    it('request requests acceptance ratio', async () => {
      const result = await openDigger.chaossChangeRequestsAcceptanceRatio(option);
      commonAssert(result, 'ratio');
    });
  });
});
