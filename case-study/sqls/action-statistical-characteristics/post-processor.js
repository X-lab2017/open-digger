module.exports = async function(data) {
  let ret = '| # | repo_id | repo_name | resolve_issue_period_avg | respond_issue_period_avg | resolve_issue_period_median | respond_issue_period_median | resolve_pr_period_avg | respond_pr_period_avg | resolve_pr_period_median | respond_pr_period_median | count |\n';
  ret += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  data.forEach((item, index) => {
    ret += `| ${index + 1} | ${item.repo_id} | ${item.repo_name} | ${item.resolve_issue_period_avg} | ${item.respond_issue_period_avg} | ${item.resolve_issue_period_median} | ${item.respond_issue_period_median} | ${item.resolve_pr_period_avg} | ${item.respond_pr_period_avg} | ${item.resolve_pr_period_median} | ${item.respond_pr_period_median} | ${item.count} |\n`;
  });
  return ret;
}
