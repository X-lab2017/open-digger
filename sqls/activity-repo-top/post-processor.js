module.exports = async function(data) {
  let ret = '| # | repo_id | repo_name | repo_activity | developer_count | open_issue | issue_comment | open_pull | pull_review_comment | merge_pull |\n';
  ret += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  data.forEach((item, index) => {
    ret += `| ${index + 1} | ${item.repo_id} | ${item.repo_name} | ${item.repo_activity} | ${item.actor_count} | ${item.oic_count} | ${item.icc_count} | ${item.opc_count} | ${item.rcc_count} | ${item.mpc_count} |\n`;
  });
  return ret;
}
