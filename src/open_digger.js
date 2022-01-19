const utils = require('../lib/label_data_utils');
const neo4j = require('../lib/db/neo4j');
const clickhouse = require('../lib/db/clickhouse');
var Plotly = require("ijavascript-plotly");

exports.getLabelUnion = utils.getLabelUnion;
exports.plotly = function (data, config) {
    Plotly(data, config);
}
exports.driver = {
  neo4j,
  clickhouse,
}
exports.showAll = (repoName, startYear = 2015, endYear = 2021) => {
    openDigger.driver.neo4j.query(`MATCH (r:Repo{name:'${repoName}'}) RETURN r;`).then(data => {
        const values = [
            {y: [], mode: 'lines+markers', name: 'activity'},
            {y: [], mode: 'lines+markers', name: 'openrank'}];
        for (let year = startYear; year <= endYear; year++) {
            for (let month = 1; month <= 12; month++) {
                const k = `${year}${month}`;
                values[0].y.push(data[0][`activity_${k}`]);
                values[1].y.push(data[0][`open_rank_${k}`]);
            }
        }
        openDigger.plotly(values, {title: `Activity/OpenRank for ${repoName} from ${startYear} to ${endYear}`});
    });
}
