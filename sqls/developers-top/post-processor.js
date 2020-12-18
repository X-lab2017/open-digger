module.exports = async function(data) {
  let ret = '| # | actor_login | activity | participant repo count | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |\n';
  ret += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  data.forEach((item, index) => {
    ret += `| ${index + 1} | ${item.actor_login} | ${item.developer_activity} | ${item.repo_count} | ${item.issue_comment} | ${item.open_issue} | ${item.open_pull} | ${item.pull_review_comment} | ${item.merge_pull} | ${item.commits} | ${item.additions} | ${item.deletions} |\n`;
  });
  return ret;
}