import { getRepoActivityOrOpenrank, getRepoActivityWithDetail, getUserActivityOrOpenrank, getUserActivityWithDetail } from './activity_openrank';
import { getRelatedUsers } from './related_users';

module.exports = {
  getRepoActivity: config => getRepoActivityOrOpenrank(config, 'activity'),
  getRepoActivityWithDetail: config => getRepoActivityWithDetail(config),
  getRepoOpenrank: config => getRepoActivityOrOpenrank(config, 'open_rank'),
  getRelatedUsers: getRelatedUsers,
  getUserActivity: config => getUserActivityOrOpenrank(config, 'activity'),
  getUserActivityWithDetail: config => getUserActivityWithDetail(config),
  getUserOpenrank: config => getUserActivityOrOpenrank(config, 'open_rank'),
}
