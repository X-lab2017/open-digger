const func = require('../lib/metrics/index');
const label = require('../lib/label_data_utils');
const neo4j = require('../lib/db/neo4j');
const clickhouse = require('../lib/db/clickhouse');
const plotly = require("ijavascript-plotly");

const openDigger = {
  label,
  render: {
    plotly,
  },
  driver: {
    neo4j,
    clickhouse,
  },
  index: {
    activity: {
      getRepoActivity: func.getRepoActivity,
      getUserActivity: func.getUserActivity,
    },
    openrank: {
      getRepoOpenrank: func.getRepoOpenrank,
    }
  },
  metric: {
    
  },
  relation: {
    getRelatedUsers: func.getRelatedUsers,
  },
  quick: {
    showAll: (repoName, startYear = 2015, endYear = 2021) => {
      openDigger.driver.neo4j.query(`MATCH (r:Repo{name:'${repoName}'}) RETURN r;`).then(data => {
          const values = [
              {y: [], mode: 'scatter', name: 'activity'},
              {y: [], mode: 'scatter', name: 'openrank'}];
          for (let year = startYear; year <= endYear; year++) {
              for (let month = 1; month <= 12; month++) {
                  const k = `${year}${month}`;
                  values[0].y.push(data[0][`activity_${k}`]);
                  values[1].y.push(data[0][`open_rank_${k}`]);
              }
          }
          openDigger.render.plotly(values, {title: `Activity/OpenRank for ${repoName} from ${startYear} to ${endYear}`});
      });
    }
  }
}

module.exports = openDigger;
