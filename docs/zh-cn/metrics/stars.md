# Stars

![Type](https://img.shields.io/badge/类型-指标-blue) ![From](https://img.shields.io/badge/来自-X--lab-blue) ![For](https://img.shields.io/badge/用于-项目/开发者-blue)

## 描述

在讲解Stars这个指标之前，我们需要讲解下Star功能。以Github为例，你可以在一个代码仓库首页的右上部分找到Star按钮，后面跟着的数字就是目前对这个代码仓库进行Star的用户数量。用户在Star一个代码仓库后，可以在其Your Stars一栏里找到这个仓库。

Star可以理解为其他应用上的收藏操作。我们认为Star这个代码仓库的用户通常会对这个仓库提供的功能或源码感兴趣。但是我们不能排除有一些用户，对其Star的代码仓库的兴趣不大。

Stars为在 **一定时间范围** 里对一个代码仓库进行Star操作的次数，通常需要用Stars结合其他指标来衡量一个代码仓库的热度。

## 使用

在SQL里，Stars指标为`type = 'WatchEvent'`的event的数量，event数据的schema见[data description](https://github.com/X-lab2017/open-digger/blob/master/docs/assets/data_description.csv)。一般来讲，我们可以限制`time1 <= created_at <= time2`来找到在time1到time2的时间段里的Stars指标。

在SQL里通常会结合Filter操作来缩小查询得到的数据范围，常见的Filter属性如下。

### 常见Filter属性

 - **created_at**

 - repo_id

 - repo_name

 - org_id

 - platform

其他操作（如GroupBy、OrderBy）使用的属性需要根据需求来改变。

SQL查询的案例可以参考[js example](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L15)
