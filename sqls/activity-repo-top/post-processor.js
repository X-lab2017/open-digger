module.exports = async function(data) {
  let ret = '| # | repo_id | repo_name | repo_activity |\n';
  ret += '|:--:|:--:|:--:|:--:|\n';
  data.forEach((item, index) => {
    ret += `| ${index + 1} | ${item.repo_id} | ${item.repo_name} | ${item.repo_activity} |\n`;
  });
  return ret;
}
