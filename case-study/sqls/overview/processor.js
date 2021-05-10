module.exports = async function(config, utils) {
  const query = `SELECT * FROM
(SELECT 2021 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM github_log.year2021 WHERE repo_id IN (${config.repos.join(',')})
UNION ALL
SELECT 2020 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM github_log.year2020 WHERE repo_id IN (${config.repos.join(',')})
UNION ALL
SELECT 2019 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM github_log.year2019 WHERE repo_id IN (${config.repos.join(',')})
UNION ALL
SELECT 2018 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM github_log.year2018 WHERE repo_id IN (${config.repos.join(',')})
UNION ALL
SELECT 2017 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM github_log.year2017 WHERE repo_id IN (${config.repos.join(',')})
UNION ALL
SELECT 2016 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM github_log.year2016 WHERE repo_id IN (${config.repos.join(',')})
UNION ALL
SELECT 2015 AS year, COUNT(*) AS log_count, COUNT(Distinct actor_id) as actor_count, COUNT(Distinct repo_id) AS repo_count FROM github_log.year2015 WHERE repo_id IN (${config.repos.join(',')}))
ORDER BY year ASC`;

  const data = await utils.queryGitHubEventLog(query);
  const dataError = data === null;

  const years = dataError ? [2015, 2016, 2017, 2018] : data.map(d => d.year);
  const logCount = utils.constrainMetrics(dataError ? [1100, 2200, 3300, 4400] : data.map(d => d.log_count));
  const actorCount = utils.constrainMetrics(dataError ? [1100, 2200, 3300, 4400] : data.map(d => d.actor_count));
  const repoCount = utils.constrainMetrics(dataError ? [1100, 2200, 3300, 4400] : data.map(d => d.repo_count));

  const maxLog = logCount.max;
  const maxActor = actorCount.max;
  const maxRepo = repoCount.max;

  return {
    html: `${utils.genComponentTitle("GitHub log event data overview")}
    <div class="row">
      <div class="col-4">
        ${utils.genComponentContent(`We collect GitHub log event from ${years[0]} to ${years[years.length - 1]} and the overview chart is shown as right.`)}
      </div>
      <div class="col-8">
        <div id="overviewChart" style="width:100%;height:400px;"></div>
      </div>
    </div>`,
    css: '',
    js: `
  var overViewChart = echarts.init(document.getElementById('overviewChart'));
  var option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      right: '20%'
    },
    toolbox: {
      feature: {
        dataView: {show: true, readOnly: false},
        saveAsImage: {show: true}
      }
    },
    legend: {
      data: ['日志量', '活跃用户', '活跃仓库'],
      textStyle: {
        color: textColor
      }
    },
    xAxis: [
      {
        type: 'category',
        axisTick: {
          alignWithLabel: true
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: textColor
          }
        },
        data: [${years.join(',')}]
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '日志量',
        min: 0,
        max: ${maxLog},
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: colors[0]
          }
        },
        axisLabel: {
          formatter: '{value}${logCount.unit}'
        }
      },
      {
        type: 'value',
        name: '活跃用户',
        min: 0,
        max: ${maxActor},
        position: 'right',
        offset: 50,
        axisLine: {
          show: true,
          lineStyle: {
            color: colors[1]
          }
        },
        axisLabel: {
          formatter: '{value}${actorCount.unit}'
        }
      },
      {
        type: 'value',
        name: '活跃仓库',
        min: 0,
        max: ${maxRepo},
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: colors[2]
          }
        },
        axisLabel: {
          formatter: '{value}${repoCount.unit}'
        }
      }
    ],
    series: [
      {
        name: '日志量',
        type: 'line',
        data: [${logCount.nums.join(',')}]
      },
      {
        name: '活跃用户',
        type: 'bar',
        yAxisIndex: 1,
        data: [${actorCount.nums.join(',')}]
      },
      {
        name: '活跃仓库',
        type: 'bar',
        yAxisIndex: 2,
        data: [${repoCount.nums.join(',')}]
      }
    ]
  };
  overViewChart.setOption(option);`,
  };
}
