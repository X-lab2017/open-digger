import { getRepoOpenrank, getRepoActivity, getUserOpenrank, getUserActivity, getAttention } from './indices';
import {
  chaossCodeChangeCommits, chaossBusFactor, chaossIssuesNew, chaossIssuesClosed, chaossChangeRequestsAccepted,
  chaossChangeRequestsDeclined, chaossIssueResolutionDuration, chaossCodeChangeLines, chaossTechnicalFork,
  chaossChangeRequests, chaossChangeRequestReviews, chaossNewContributors, chaossChangeRequestsDuration, chaossIssueResponseTime, chaossChangeRequestsAcceptanceRatio, chaossIssuesActive, chaossActiveDatesAndTimes,
} from './chaoss';
import { repoStars, repoIssueComments, repoParticipants } from './metrics';
import { getRelatedUsers } from './related_users';

module.exports = {
  // index
  getRepoActivity: getRepoActivity,
  getRepoOpenrank: getRepoOpenrank,
  getRelatedUsers: getRelatedUsers,
  getUserActivity: getUserActivity,
  getUserOpenrank: getUserOpenrank,
  getAttention: getAttention,
  // chaoss metrics
  chaossCodeChangeCommits: chaossCodeChangeCommits,
  chaossIssuesNew: chaossIssuesNew,
  chaossIssuesActive: chaossIssuesActive,
  chaossIssuesClosed: chaossIssuesClosed,
  chaossBusFactor: chaossBusFactor,
  chaossChangeRequestsAccepted: chaossChangeRequestsAccepted,
  chaossChangeRequestsDeclined: chaossChangeRequestsDeclined,
  chaossIssueResolutionDuration: chaossIssueResolutionDuration,
  chaossIssueResponseTime: chaossIssueResponseTime,
  chaossCodeChangeLines: chaossCodeChangeLines,
  chaossTechnicalFork: chaossTechnicalFork,
  chaossChangeRequests: chaossChangeRequests,
  chaossChangeRequestReviews: chaossChangeRequestReviews,
  chaossNewContributors: chaossNewContributors,
  chaossChangeRequestsDuration: chaossChangeRequestsDuration,
  chaossChangeRequestsAcceptanceRatio: chaossChangeRequestsAcceptanceRatio,
  chaossRepoActiveDatesAndTimes: config => chaossActiveDatesAndTimes(config, 'repo'),
  chaossUserActiveDatesAndTimes: config => chaossActiveDatesAndTimes(config, 'user'),
  // x-lab metrics
  repoStars: repoStars,
  repoIssueComments: repoIssueComments,
  repoParticipants: repoParticipants,
};
