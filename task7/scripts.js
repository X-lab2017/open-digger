function initChart(id, option) {
    let chart = echarts.init(document.getElementById(id));
    chart.setOption(option);
    return chart;
}

// 实现图表交换
function swapCharts(bigChart, smallChart, bigChartContainer, smallChartContainer) {
    let bigOption = bigChart.getOption();
    let smallOption = smallChart.getOption();

    bigChart.clear();
    smallChart.clear();

    bigChart.setOption(smallOption);
    smallChart.setOption(bigOption);
}

// 为小图表添加点击事件
function addClickEvent(smallChart, bigChart, bigChartContainer, smallChartContainer) {
    smallChart.getDom().onclick = function () {
        swapCharts(bigChart, smallChart, bigChartContainer, smallChartContainer);
    };
}

fetch('/data/contributor_all.csv')
    .then(response => response.text())
    .then(csvText => {
        var data = Papa.parse(csvText, { header: true }).data;

        var seriesData = data.map(row => ({
            name: row['community'],
            value: parseInt(row['contributor_count'])
        }));

        var colors = [
            '#FF6347', // Tomato
            '#4682B4', // SteelBlue
            '#32CD32', // LimeGreen
            '#FFD700', // Gold
            '#6A5ACD', // SlateBlue
            '#FF4500', // OrangeRed
            '#8A2BE2', // BlueViolet
            '#00FA9A', // MediumSpringGreen
            '#FF1493', // DeepPink
            '#1E90FF'  // DodgerBlue
        ];

        var option1 = {
            title: {
                text: 'Contributors by Community',
                left: 'center',
                textStyle: {
                    fontSize: 16,
                }
            },
            tooltip: {
                trigger: 'item'
            },
            legend: {
                top: 'bottom',
                textStyle: {
                    fontSize: 10,
                },
                itemWidth: 10,
                itemHeight: 10 
            },
            color: colors,
            series: [{
                name: 'Contributors',
                type: 'pie',
                radius: '50%',
                data: seriesData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                label: {
                    show: true,
                    formatter: '{b}: {d}%'
                }
            }]
        };

        let bigChartContainer = document.getElementById('chart1');
        let bigChart = initChart(bigChartContainer.id, option1);
        //let chart = echarts.init(document.getElementById(`chart1`));




fetch('/data/log_all.csv')
.then(response => response.text())
.then(csvText => {
    var data = Papa.parse(csvText, { header: true }).data;
    data = data.filter(row => row['year'] && row['community'] && row['count']);


    var yearCommunityTotals = data.reduce((acc, row) => {
        let year = row['year'];
        let community = row['community'];
        let count = parseInt(row['count']);
        
        if (!acc[year]) {
            acc[year] = {};
        }
        if (acc[year][community]) {
            acc[year][community] += count;
        } else {
            acc[year][community] = count;
        }
        
        return acc;
    }, {});


    var years = Object.keys(yearCommunityTotals);
    var communities = Array.from(new Set(data.map(row => row['community'])));
    var seriesData = communities.map(community => ({
        name: community,
        type: 'bar',
        stack: 'total',
        data: years.map(year => yearCommunityTotals[year][community] || 0)
    }));


    var colors = [
        '#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD',
        '#FF4500', '#8A2BE2', '#00FA9A', '#FF1493', '#1E90FF'
    ];


    var option2 = {
        title: {
            text: 'Contributors by Community and Year',
            left: 'center',
            textStyle: {
                fontSize: 16,
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            top: 'bottom',
            textStyle: {
                fontSize: 10,
            },
            itemWidth: 10,
            itemHeight: 10,
            data: communities
        },
        xAxis: {
            type: 'category',
            data: years,
            name: 'Year'
        },
        yAxis: {
            type: 'value',
            name: 'Contributors'
        },
        color: colors, 
        series: seriesData
    };

    let smallChartContainer = document.getElementById('chart2');
    let smallChart = initChart(smallChartContainer.id, option2);
    addClickEvent(smallChart, bigChart, bigChartContainer, smallChartContainer);
})
.catch(error => console.error('Error reading CSV file:', error));


fetch('/data/merge_all.csv')
    .then(response => response.text())
    .then(csvText => {
        var data = Papa.parse(csvText, { header: true }).data;


        data = data.filter(row => row['year_month'] && row['record_num'] && row['community']);

        var communityGroups = {};
        data.forEach(row => {
            let community = row['community'];
            let yearMonth = row['year_month'];
            let recordNum = parseInt(row['record_num']);

            if (!communityGroups[community]) {
                communityGroups[community] = [];
            }
            communityGroups[community].push([yearMonth, recordNum]);
        });


        var colors = [
            '#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD',
            '#FF4500', '#8A2BE2', '#00FA9A', '#FF1493', '#1E90FF',
            '#DA70D6', '#87CEEB', '#3CB371', '#B8860B', '#8B4513'
        ];


        var seriesData = Object.keys(communityGroups).map((community, index) => ({
            name: community,
            type: 'scatter',
            data: communityGroups[community],
            symbolSize: function (data) {
                return Math.sqrt(data[1]); 
            },
            itemStyle: {
                color: colors[index % colors.length]
            }
        }));


        var option3 = {
            title: {
                text: 'Record Numbers by Community and Year-Month',
                left: 'center',
                textStyle: {
                    fontSize: 16,
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    return params.seriesName + '<br/>' + 
                           'Year-Month: ' + params.data[0] + '<br/>' + 
                           'Records: ' + params.data[1];
                }
            },
            legend: {
                top: 'bottom',
                textStyle: {
                    fontSize: 10,
                },
                itemWidth: 10,
                itemHeight: 10,
                data: Object.keys(communityGroups)
            },
            xAxis: {
                type: 'category',
                name: 'Year-Month',
                data: [...new Set(data.map(row => row['year_month']))]
            },
            yAxis: {
                type: 'value',
                name: 'Record Numbers'
            },
            series: seriesData
        };

        let smallChartContainer = document.getElementById('chart3');
        let smallChart = initChart(smallChartContainer.id, option3);
        addClickEvent(smallChart, bigChart, bigChartContainer, smallChartContainer);
    })
    .catch(error => console.error('Error reading CSV file:', error));



fetch('/data/star_all.csv')
.then(response => response.text())
.then(csvText => {
    var data = Papa.parse(csvText, { header: true }).data;


    data = data.filter(row => row['year_month'] && row['stars'] && row['community']);


    var communityGroups = {};
    data.forEach(row => {
        let community = row['community'];
        let yearMonth = row['year_month'];
        let stars = parseInt(row['stars']);

        if (!communityGroups[community]) {
            communityGroups[community] = [];
        }
        communityGroups[community].push([yearMonth, stars]);
    });


    var colors = [
        '#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD',
        '#FF4500', '#8A2BE2', '#00FA9A', '#FF1493', '#1E90FF',
        '#DA70D6', '#87CEEB', '#3CB371', '#B8860B', '#8B4513'
    ];


    var seriesData = Object.keys(communityGroups).map((community, index) => ({
        name: community,
        type: 'line',
        data: communityGroups[community],
        itemStyle: {
            color: colors[index % colors.length]
        }
    }));


    var option4 = {
        title: {
            text: 'Star by Community and Year-Month',
            left: 'center',
            textStyle: {
                fontSize: 16,
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                return params.seriesName + '<br/>' + 
                       'Year-Month: ' + params.data[0] + '<br/>' + 
                       'Stars: ' + params.data[1];
            }
        },
        legend: {
            top: 'bottom',
            textStyle: {
                fontSize: 10,
            },
            itemWidth: 10,
            itemHeight: 10,
            data: Object.keys(communityGroups)
        },
        xAxis: {
            type: 'category',
            name: 'Year-Month',
            data: [...new Set(data.map(row => row['year_month']))]
        },
        yAxis: {
            type: 'value',
            name: 'Stars'
        },
        series: seriesData
    };


    let smallChartContainer = document.getElementById('chart4');
    let smallChart = initChart(smallChartContainer.id, option4);
    addClickEvent(smallChart, bigChart, bigChartContainer, smallChartContainer);
})
.catch(error => console.error('Error reading CSV file:', error));


fetch('/data/fork_all.csv')
.then(response => response.text())
.then(csvText => {
    var data = Papa.parse(csvText, { header: true }).data;


    data = data.filter(row => row['year_month'] && row['forks'] && row['community']);



    var communityGroups = {};
    data.forEach(row => {
        let community = row['community'];
        let yearMonth = row['year_month'];
        let forks = parseInt(row['forks']);

        if (!communityGroups[community]) {
            communityGroups[community] = [];
        }
        communityGroups[community].push([yearMonth, forks]);
    });




    var colors = [
        '#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD',
        '#FF4500', '#8A2BE2', '#00FA9A', '#FF1493', '#1E90FF',
        '#DA70D6', '#87CEEB', '#3CB371', '#B8860B', '#8B4513'
    ];


    var seriesData = Object.keys(communityGroups).map((community, index) => ({
        name: community,
        type: 'line',
        data: communityGroups[community],
        itemStyle: {
            color: colors[index % colors.length]
        }
    }));



    var option5 = {
        title: {
            text: 'Forks by Community and Year-Month',
            left: 'center',
            textStyle: {
                fontSize: 16,
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                return params.seriesName + '<br/>' + 
                       'Year-Month: ' + params.data[0] + '<br/>' + 
                       'Forks: ' + params.data[1];
            }
        },
        legend: {
            top: 'bottom',
            textStyle: {
                fontSize: 10,
            },
            itemWidth: 10,
            itemHeight: 10,
            data: Object.keys(communityGroups)
        },
        xAxis: {
            type: 'category',
            name: 'Year-Month',
            data: [...new Set(data.map(row => row['year_month']))]
        },
        yAxis: {
            type: 'value',
            name: 'Forks'
        },
        series: seriesData
    };


    let smallChartContainer = document.getElementById('chart5');
    let smallChart = initChart(smallChartContainer.id, option5);
    addClickEvent(smallChart, bigChart, bigChartContainer, smallChartContainer);
})
.catch(error => console.error('Error reading CSV file:', error));

fetch('/data/activity_all.csv')
    .then(response => response.text())
    .then(csvText => {
        var data = Papa.parse(csvText, { header: true }).data;

        data = data.filter(row => row['year_month'] && row['actor_count'] && row['community']);


        var communityGroups = {};
        data.forEach(row => {
            let community = row['community'];
            let yearMonth = row['year_month'];
            let actorNum = parseInt(row['actor_count']);

            if (!communityGroups[community]) {
                communityGroups[community] = [];
            }
            communityGroups[community].push([yearMonth, actorNum]);
        });



        var colors = [
            '#FF6347', '#4682B4', '#32CD32', '#FFD700', '#6A5ACD',
            '#FF4500', '#8A2BE2', '#00FA9A', '#FF1493', '#1E90FF',
            '#DA70D6', '#87CEEB', '#3CB371', '#B8860B', '#8B4513'
        ];


        var seriesData = Object.keys(communityGroups).map((community, index) => ({
            name: community,
            type: 'scatter',
            data: communityGroups[community],
            symbolSize: function (data) {
                return Math.sqrt(data[1]); 
            },
            itemStyle: {
                color: colors[index % colors.length]
            }
        }));


        var option6 = {
            title: {
                text: 'Actor Numbers by Community and Year-Month',
                left: 'center',
                textStyle: {
                    fontSize: 16,
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    return params.seriesName + '<br/>' + 
                           'Year-Month: ' + params.data[0] + '<br/>' + 
                           'Actors: ' + params.data[1];
                }
            },
            legend: {
                top: 'bottom',
                textStyle: {
                    fontSize: 10,
                },
                itemWidth: 10,
                itemHeight: 10,
                data: Object.keys(communityGroups)
            },
            xAxis: {
                type: 'category',
                name: 'Year-Month',
                data: [...new Set(data.map(row => row['year_month']))]
            },
            yAxis: {
                type: 'value',
                name: 'Actor Numbers'
            },
            series: seriesData
        };


        let smallChartContainer = document.getElementById('chart6');
        let smallChart = initChart(smallChartContainer.id, option6);
        addClickEvent(smallChart, bigChart, bigChartContainer, smallChartContainer);
    })
    .catch(error => console.error('Error reading CSV file:', error));


fetch('/data/star_and_fork.csv')
.then(response => response.text())
.then(csvText => {
    var data = Papa.parse(csvText, { header: true }).data;

    data = data.filter(row => row['year'] && row['stars'] && row['forks'] && row['community']);


    var communityYearGroups = {};
    data.forEach(row => {
        let community = row['community'];
        let year = row['year'];
        let stars = parseInt(row['stars']);
        let forks = parseInt(row['forks']);
        let total = stars + forks;

        if (!communityYearGroups[community]) {
            communityYearGroups[community] = {};
        }
        if (!communityYearGroups[community][year]) {
            communityYearGroups[community][year] = 0;
        }
        communityYearGroups[community][year] += total;
    });



    var communities = Object.keys(communityYearGroups);
    var years = [...new Set(data.map(row => row['year']))];


    var seriesData = years.map(year => ({
        name: year.toString(),
        type: 'bar',
        data: communities.map(community => communityYearGroups[community][year] || 0)
    }));


    var option7 = {
        title: {
            text: 'Stars and Forks by Community and Year',
            left: 'center',
            textStyle: {
                fontSize: 16,
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function (params) {
                let tooltipText = params[0].axisValue + '<br/>';
                params.forEach(param => {
                    tooltipText += param.seriesName + ': ' + param.data + '<br/>';
                });
                return tooltipText;
            }
        },
        legend: {
            data: years.map(year => year.toString()),
            textStyle: {
                fontSize: 10,
            },
            itemWidth: 10,
            itemHeight: 10,
            top: 'bottom'
        },
        xAxis: {
            type: 'category',
            name: 'Community',
            data: communities,
            axisLabel: {
                rotate: 45, 
                fontSize: 12 
            }
        },
        yAxis: {
            type: 'value',
            name: 'Stars + Forks'
        },
        series: seriesData
    };

        let smallChartContainer = document.getElementById('chart7');
        let smallChart = initChart(smallChartContainer.id, option7);
        addClickEvent(smallChart, bigChart, bigChartContainer, smallChartContainer);
})
.catch(error => console.error('Error reading CSV file:', error));

})
.catch(error => console.error('Error reading CSV file:', error));
