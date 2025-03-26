const func = require('../lib/metrics/index');
const label = require('../lib/labelDataUtils');
const neo4j = require('../lib/db/neo4j');
const clickhouse = require('../lib/db/clickhouse');
const plotly = require('ijavascript-plotly');

const openDigger = {
  label,
  render: {
    plotly,
  },
  driver: {
    neo4j,
    clickhouse,
  },
  index: {
    activity: {
      getRepoActivity: func.getRepoActivity,
      getUserActivity: func.getUserActivity,
      getRepoActivityWithDetail: func.getRepoActivityWithDetail,
      getUserActivityWithDetail: func.getUserActivityWithDetail,
    },
    openrank: {
      getRepoOpenrank: func.getRepoOpenrank,
      getUserOpenrank: func.getUserOpenrank,
      getRepoCommunityOpenrank: func.getRepoCommunityOpenrank,
    },
    attention: {
      getAttention: func.getAttention,
    }
  },
  metric: {
    chaoss: {
      codeChangeCommits: func.chaossCodeChangeCommits,
      issuesNew: func.chaossIssuesNew,
      issuesAndChangeRequestActive: func.chaossIssuesAndChangeRequestActive,
      issuesClosed: func.chaossIssuesClosed,
      busFactor: func.chaossBusFactor,
      changeRequestsAccepted: func.chaossChangeRequestsAccepted,
      changeRequestsDeclined: func.chaossChangeRequestsDeclined,
      issueResolutionDuration: func.chaossIssueResolutionDuration,
      changeRequestResolutionDuration: func.chaossChangeRequestResolutionDuration,
      codeChangeLines: func.chaossCodeChangeLines,
      newContributors: func.chaossNewContributors,
      changeRequestsDuration: func.chaossChangeRequestsDuration,
      issueResponseTime: func.chaossIssueResponseTime,
      changeRequestResponseTime: func.chaossChangeRequestResponseTime,
      technicalFork: func.chaossTechnicalFork,
      changeRequestsAcceptanceRatio: func.chaossChangeRequestsAcceptanceRatio,
      repoActiveDatesAndTimes: func.chaossRepoActiveDatesAndTimes,
      userActiveDatesAndTimes: func.chaossUserActiveDatesAndTimes,
      issueAge: func.chaossIssueAge,
      changeRequestAge: func.chaossChangeRequestAge,
      inactiveContributors: func.chaossInactiveContributors,
      contributors: func.chaossContributors,
    },
    xlab: {
      repoStars: func.repoStars,
      repoParticipants: func.repoParticipants,
      userEquivalentTimeZone: func.userEquivalentTimeZone,
      contributorEmailSuffixes: func.contributorEmailSuffixes,
    },
  },
  getRank: (values, nameGetter, valueGetter) => {
    let resultMap = new Map();
    values.forEach(v => resultMap.set(nameGetter(v), []));
    let valueLength = valueGetter(values[0]).length;
    for (let i = 0; i < valueLength; i++) {
      values = values.sort((a, b) => valueGetter(b)[i] - valueGetter(a)[i]);
      values.forEach((v, index) => {
        resultMap.get(nameGetter(v)).push((valueGetter(v)[i] == 0) ? undefined : index + 1);
      });
    }
    return Array.from(resultMap.entries()).map(e => {
      return {
        name: e[0],
        values: e[1],
      };
    });
  },
}

module.exports = openDigger;
