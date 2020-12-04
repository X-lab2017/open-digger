module.exports = async function(data) {
  let ret = '| # | name | language | activity | developer_count | open_issue | issue_comment | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |\n';
  ret += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  data.forEach((item, index) => {
    ret += `| ${index + 1} | ${item.repo_name} | ${item.repo_language} | ${item.repo_activity} | ${item.developer_count} | ${item.open_issue} | ${item.issue_comment} | ${item.open_pull} | ${item.pull_review_comment} | ${item.merge_pull} | ${item.commits} | ${item.additions} | ${item.deletions} |\n`;
  });
  return ret;
}
