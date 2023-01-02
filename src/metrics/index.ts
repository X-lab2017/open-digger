import { getRepoOpenrank, getRepoActivity, getUserOpenrank, getUserActivity, getAttention } from './indices';
<<<<<<< HEAD
import { chaossCodeChangeCommits, chaossBusFactor, chaossIssuesNew, chaossIssuesClosed, chaossChangeRequestsAccepted, 
chaossChangeRequestsDeclined, chaossIssueResolutionDuration, chaossCodeChangeLines, chaossTechnicalFork, 
chaossChangeRequests, chaossChangeRequestReviews,chaossNewContributors,chaossChangeRequestsDuration, chaossIssueResponseTime, chaossChangeRequestsAcceptanceRatio } from './chaoss';
=======
import {
  chaossCodeChangeCommits, chaossBusFactor, chaossIssuesNew, chaossIssuesClosed, chaossChangeRequestsAccepted,
  chaossChangeRequestsDeclined, chaossIssueResolutionDuration, chaossCodeChangeLines, chaossTechnicalFork,
  chaossChangeRequests, chaossChangeRequestReviews, chaossNewContributors, chaossChangeRequestsDuration, chaossIssueResponseTime
} from './chaoss';
>>>>>>> notebook: implement open source report 2022
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
  chaossIssueResponseTime: chaossIssueResponseTime,
  chaossCodeChangeLines: chaossCodeChangeLines,
  chaossTechnicalFork: chaossTechnicalFork,
  chaossChangeRequests: chaossChangeRequests,
  chaossChangeRequestReviews: chaossChangeRequestReviews,
  chaossNewContributors: chaossNewContributors,
  chaossChangeRequestsDuration: chaossChangeRequestsDuration,
  chaossChangeRequestsAcceptanceRatio: chaossChangeRequestsAcceptanceRatio,
  // x-lab metrics
  repoStars: repoStars,
  repoIssueComments: repoIssueComments,
  repoParticipants: repoParticipants,
};
