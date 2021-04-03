module.exports = async function(data) {
  const years = data[0].map(d => d.year);
  const logCount = data[0].map(d => d.log_count / 1000);
  const actorCount = data[0].map(d => d.actor_count / 1000);
  const repoCount = data[0].map(d => d.repo_count);

  const maxLog = 220;
  const maxActor = 55;
  const maxRepo = 25;

  return {
    html: `
    <h3>Log event data overview</h3>
    <p>We collect GitHub log event from ${years[0]} to ${years[years.length - 1]} and the overview chart is shown below.</p>
    <div id="overviewChart" style="width: 600px;height:400px;"></div>`,
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
      data: ['日志量', '活跃用户', '活跃仓库']
    },
    xAxis: [
      {
        type: 'category',
        axisTick: {
          alignWithLabel: true
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
        },
        axisLabel: {
          formatter: '{value}K'
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
        },
        axisLabel: {
          formatter: '{value}K'
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
        },
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '日志量',
        type: 'line',
        data: [${logCount.join(',')}]
      },
      {
        name: '活跃用户',
        type: 'bar',
        yAxisIndex: 1,
        data: [${actorCount.join(',')}]
      },
      {
        name: '活跃仓库',
        type: 'bar',
        yAxisIndex: 2,
        data: [${repoCount.join(',')}]
      }
    ]
  };
  overViewChart.setOption(option);`,
  };
}
