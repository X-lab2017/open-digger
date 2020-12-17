module.exports = async function(data) {
  let ret = '| # | language | count | top_repo | activity | \n';
  ret += '|:--:|:--:|:--:|:--:|:--:| \n';
  data.forEach((item, index) => {
    ret += `| ${index + 1} | ${item.language} | ${item.count} | ${item.top_repo} | ${item.activity} | \n`;
  });
  return ret;
}
