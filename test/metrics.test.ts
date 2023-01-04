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
  const commonAssert = async (func: (option: any) => Promise<any[]>, key: string) => {
    const result = await func(option);
    assert.strictEqual(result.length, limit);
    assert.strictEqual(result.every(r => r[key].length === months), true);
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
      await commonAssert(openDigger.chaossIssueResolutionDuration, 'resolution_duration');
    });
    it('issue response time', async () => {
      await commonAssert(openDigger.chaossIssueResponseTime, 'issue_response_time');
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
      await commonAssert(openDigger.chaossChangeRequestsDuration, 'resolution_duration');
    });
    it('request requests acceptance ratio', async () => {
      await commonAssert(openDigger.chaossChangeRequestsAcceptanceRatio, 'ratio');
    });
  });
});
