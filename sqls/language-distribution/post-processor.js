module.exports = async function(data) {
  let ret = '| # | repo_language | count | top_repo | activity | \n';
  ret += '|:--:|:--:|:--:|:--:|:--:| \n';
  data.forEach((item, index) => {
    ret += `| ${index + 1} | ${item.repo_language} | ${item.count} | ${item.top_repo} | ${item.activity} | \n`;
  });
  return ret;
}
