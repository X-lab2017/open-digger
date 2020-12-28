module.exports = async function(data) {
  console.log(data);
  let ret = '| # | repo_name | actor_login | developer_activity | issue_comment | open_issue | open_pull | pull_review_comment | merge_pull | pull_commits | pull_additions | pull_deletions |\n';
  ret += '|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n';
  data.forEach((item, index) => {
    console.log(item);
    let top10_actor_login;
    item.forEach((actor_login_item, _item_index) => {
      top10_actor_login = actor_login_item.data
    });
    let top10_develpoer_activity;
    item.forEach((develpoer_activity_item, _item_index) => {
      top10_develpoer_activity = develpoer_activity_item.data
    });
    let top10_issue_comment;
    item.forEach((issue_comment_item, _item_index) => {
      top10_issue_comment = issue_comment_item.data
    });
    let top10_open_issue;
    item.forEach((open_issue_item, _list_item_index) => {
      top10_open_issue = open_issue_item.data
    });
    let top10_open_pull;
    item.forEach((open_pull_item, _list_item_index) => {
      top10_open_pull = open_pull_item.data
    }); 
    let top10_pull_review_comment;
    item.forEach((pull_review_comment_item, _list_item_index) => {
      top10_pull_review_comment = pull_review_comment_item.data
    });
    let top10_merge_pull;
    item.forEach((merge_pull_item, _list_item_index) => {
      top10_merge_pull = merge_pull_item.data
    });
    let top10_commits;
    item.forEach((commits_item, _list_item_index) => {
      top10_commits = commits_item.data
    });
    let top10_additions;
    item.forEach((additions_item, _list_item_index) => {
      top10_additions = additions_item.data
    });
    let top10_deletions;
    item.forEach((deletions_item, _list_item_index) => {
      top10_deletions = deletions_item.data
    });
    ret += `| ${index + 1} | ${item.repo_name} | ${top10_actor_login} | ${top10_develpoer_activit} |  ${top10_issue_comment} | ${top10_open_issue} | ${top10_open_pull} | ${top10_pull_review_comment} | ${top10_merge_pull} | ${top10_commits} | ${top10_additions} | ${top10_deletions} |\n`;
  });
  return ret;
}