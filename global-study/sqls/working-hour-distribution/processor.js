module.exports = async function(config, utils) {
  const { year, table } = config;
  const query = `SELECT COUNT(*) AS count, toDayOfWeek(created_at) AS dayOfWeek, toHour(created_at) AS hour FROM ${table} GROUP BY hour, dayOfWeek`;
  
  const data = await utils.queryGitHubEventLog(query);
  
  let min = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;
  data.forEach(i => {
    i.count = parseInt(i.count);
    if (i.count > max) max = i.count;
    if (i.count < min) min = i.count;
  });

  let d = [];
  for (let j = 1; j <= 7; j++) {
    for (let i = 0; i < 24; i++) {
      let row = data.find(item => (item.dayOfWeek == j) && (item.hour == i));
      if (row) {
        // prevent zero for min
        let c = Math.ceil((row.count - min) * 10 / (max - min));
        d.push(Math.max(1, c));
      } else {
        d.push(0);
      }
    }
  }
  
  `${config.baseUrl}svgrenderer/github/${config.owner}/${config.repo}?path=sqls/working-hour-distribution/image.svg&data=${JSON.stringify(d)}`;

  return {
    html: `
    ${utils.genComponentTitle(`GitHub global working hour distribution`)}
    <div class="row">
      <div class="col-6">
        <embed src="${config.baseUrl}svgrenderer/github/${config.owner}/${config.repo}?path=assets/working-hour-distribution.svg&data=${JSON.stringify(d)}" />
      </div>
      <div class="col-6">
        ${utils.genComponentContent(`We analyze the working hour distribution for GitHub logs all over the world during year ${year}, we found that open source developers are predominantly European because local working hour period lays in UTC±1 as the image shows.`)}
      </div>
    </div>`,
    css: '',
    js: '',
  };
}
