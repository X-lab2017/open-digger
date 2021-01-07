module.exports = async function(data, param, config) {
  let repoData = {};
  data.forEach(item => {
    if (!repoData[item.repo_name]) {
      repoData[item.repo_name] = [];
    }
    repoData[item.repo_name].push(item);
  });

  let ret = '';
  for (let i in repoData) {
    let d = repoData[i];
    ret += `\n- ${i}\n
| # | login | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |\n|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n`;
    d.sort((a, b) => {
      return b.developer_activity - a.developer_activity;
    });
    d.slice(0, config.topN).forEach((item, index) => {
      ret += `| ${index + 1} | ${item.actor_login} | ${item.developer_activity} |  ${item.issue_comment} | ${item.open_issue} | ${item.open_pull} | ${item.pull_review_comment} | ${item.merge_pull} | ${item.pull_commits} | ${item.pull_additions} | ${item.pull_deletions} |\n`;
    });
  }
  return ret;
}
