import { getRepoActivityOrOpenrank, getRepoActivityWithDetail, getUserActivityOrOpenrank, getUserActivityWithDetail } from './activity_openrank';
import { chaossCodeChangeCommits, chaossBusFactor, chaossIssuesNew, chaossIssuesClosed, chaossChangeRequestsAccepted, chaossChangeRequestsDeclined, chaossIssueResolutionDuration, chaossCodeChangeLines } from './chaoss';
import { getAttention } from './attention';
import { getRelatedUsers } from './related_users';

module.exports = {
  // index
  getRepoActivity: config => getRepoActivityOrOpenrank(config, 'activity'),
  getRepoActivityWithDetail: getRepoActivityWithDetail,
  getRepoOpenrank: config => getRepoActivityOrOpenrank(config, 'open_rank'),
  getRelatedUsers: getRelatedUsers,
  getUserActivity: config => getUserActivityOrOpenrank(config, 'activity'),
  getUserActivityWithDetail: getUserActivityWithDetail,
  getUserOpenrank: config => getUserActivityOrOpenrank(config, 'open_rank'),
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
}
