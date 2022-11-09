import { getRepoOpenrank, getRepoActivity, getUserOpenrank, getUserActivity, getAttention } from './indices';
import { chaossCodeChangeCommits, chaossBusFactor, chaossIssuesNew, chaossIssuesClosed, chaossChangeRequestsAccepted, 
chaossChangeRequestsDeclined, chaossIssueResolutionDuration, chaossCodeChangeLines, chaossTechnicalFork, 
chaossChangeRequests, chaossChangeRequestReviews } from './chaoss';
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
  chaossIssuesClosed: chaossIssuesClosed,
  chaossBusFactor: chaossBusFactor,
  chaossChangeRequestsAccepted: chaossChangeRequestsAccepted,
  chaossChangeRequestsDeclined: chaossChangeRequestsDeclined,
  chaossIssueResolutionDuration: chaossIssueResolutionDuration,
  chaossCodeChangeLines: chaossCodeChangeLines,
  chaossTechnicalFork: chaossTechnicalFork,
  chaossChangeRequests: chaossChangeRequests,
  chaossChangeRequestReviews: chaossChangeRequestReviews,
  // x-lab metrics
  repoStars: repoStars,
  repoIssueComments: repoIssueComments,
  repoParticipants: repoParticipants,
};
