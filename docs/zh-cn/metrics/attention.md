# Attention

![Type](https://img.shields.io/badge/类型-指标-blue) ![From](https://img.shields.io/badge/来自-X--lab-blue) ![For](https://img.shields.io/badge/用于-项目/开发者-blue)

## 描述

如何评价一个项目的受关注程度？我们可以使用Forks或Stars的数量来反映受关注程度。但是单纯使用Forks的数量或Stars的数量，可能会有偏差。在这里，我们结合Forks数和Stars数得到Attention来表示一个项目的受关注程度。

这里，Attention表示在 **一定时间范围** 里一个或多个代码仓库的受关注程度。其值为`stars + 2 * forks`，stars为在 **一定时间范围** 里对一个或多个代码仓库进行Star操作的次数，forks为在 **一定时间范围** 里对一个或多个代码仓库进行Fork操作的次数。但是我们需要注意的是，单纯使用这个指标可能会高估代码仓库的受关注程度，我们需要结合更多的指标（如创建Issue或提交PR的用户数等）来观察。

## 使用

在SQL里，Attention的值为`stars + 2 * forks`，其中`stars`为`countIf(type='WatchEvent')`，`forks`为`countIf(type='ForkEvent')`，实现方式可以参考[js example](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts)的`getAttention`函数。

event数据的schema见[data description](https://github.com/X-lab2017/open-digger/blob/master/docs/assets/data_description.csv)。我们可以限制`time1 <= created_at <= time2`来找到在time1到time2的时间段里的Attention指标。

在SQL里通常会结合Filter操作来缩小查询得到的数据范围，常见的Filter属性如下。

### 常见Filter属性

 - **created_at**

 - repo_id

 - repo_name

 - org_id

 - platform

其他操作（如GroupBy、OrderBy）使用的属性需要根据需求来改变。

### 数据示例

可以参考[json example](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/attention.json)

### Demo

可以参考[demo](https://codepen.io/frank-zsy/pen/MWBdpNg?type=attention)