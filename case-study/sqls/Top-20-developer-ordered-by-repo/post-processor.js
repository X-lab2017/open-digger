module.exports = async function(data) {
  console.log(data);
  let ret = '| # | actor_login | top10_repo_list | activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |\n';
  ret += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  data.forEach((item, index) => {
    console.log(item);
    let top10_repo_list;
    item.forEach((repo_list_item, list_item_index) => {
      top10_repo_list = repo_list_item.data
    });
    ret += `| ${index + 1} | ${item.actor_login} | ${top10_repo_list} |${item.developer_activity} |  ${item.issue_comment} | ${item.open_issue} | ${item.open_pull} | ${item.pull_review_comment} | ${item.merge_pull} | ${item.commits} | ${item.additions} | ${item.deletions} |\n`;
  });
  return ret;
}