module.exports = async function(data) {
  let ret = '| # | actor_login | activity | participant repo count | open issue | issue comment | open pull | pull review comment | pull merged |\n';
  ret += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  data.forEach((item, index) => {
    ret += `| ${index + 1} | ${item.actor_login} | ${item.developer_activity} | ${item.repo_count} | ${item.open_issue} | ${item.issue_comment} | ${item.open_pull} | ${item.pull_review_comment} | ${item.merge_pull} |\n`;
  });
  return ret;
}
