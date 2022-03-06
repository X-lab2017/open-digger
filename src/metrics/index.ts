import { getRepoActivityOrOpenrank, getUserActivityOrOpenrank } from "./activity_openrank";
import { getRelatedUsers } from "./related_users";

module.exports = {
  getRepoActivity: config => getRepoActivityOrOpenrank(config, 'activity'),
  getRepoOpenrank: config => getRepoActivityOrOpenrank(config, 'open_rank'),
  getRelatedUsers: getRelatedUsers,
  getUserActivity: config => getUserActivityOrOpenrank(config, 'activity'),
  getUserOpenrank: config => getUserActivityOrOpenrank(config, 'open_rank'),
}
