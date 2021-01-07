module.exports = async function(data) {
  let ret = '| # | name | language | activity | developer_count | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions | release_num | avg_release_body_len | issue_resolve_period_avg | issue_response_period_avg | issue_resolve_period_median | issue_response_period_median |\n';
  ret += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  data.forEach((item, index) => {
    ret += `| ${index + 1} | ${item.repo_name} | ${item.repo_language} | ${item.repo_activity} | ${item.developer_count} | ${item.issue_comment} | ${item.open_issue} | ${item.open_pull} | ${item.pull_review_comment} | ${item.merge_pull} | ${item.commits} | ${item.additions} | ${item.deletions} | ${item.release_num} | ${item.avg_release_body_len} | ${item.issue_resolve_period_avg} | ${item.issue_response_period_avg} | ${item.issue_resolve_period_median} | ${item.issue_response_period_median} |\n`;
  });
  return ret;
}
