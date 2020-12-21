module.exports = async function(data) {
  if (!data.count || Number.isNaN(parseInt(data.count))) {
    throw new Error('Invalid data');
  }
  let ret = '| resolve_period_avg | respond_period_avg | resolve_period_median | respond_period_median | count |\n';
  ret += '|:--:|:--:|:--:|:--:|:--:|\n';
  ret += `| ${data.resolve_period_avg} | ${data.respond_period_avg} | ${data.resolve_period_median} | ${data.respond_period_median} | ${data.count} |\n`;
  return ret;
}
