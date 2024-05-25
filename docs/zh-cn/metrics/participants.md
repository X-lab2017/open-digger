# Participants

![Type](https://img.shields.io/badge/类型-指标-blue) ![From](https://img.shields.io/badge/来自-X--lab-blue) ![For](https://img.shields.io/badge/用于-项目/开发者-blue)

## 描述

如何观察一个代码仓库的参与用户数？怎么做才算是参与了一个代码仓库？这里，我们认为只有参与了一个代码仓库下Issue的讨论或参与了其代码修改审核工作的用户才为参与者。每个参与者都至少做出了以下操作的一个，这些操作为创建了一个新的Issue、在一个Issue下进行Comment、提交了一个PR和对一个PR进行Rivise Comment。

这里，Participants指的是在 **一定时间范围** 里参与一个或多个代码仓库的用户数量（包含仓库的维护者）。

## 使用

在SQL里，我们可以筛选出`type IN ('IssuesEvent', 'IssueCommentEvent', 'PullRequestEvent', 'PullRequestReviewCommentEvent')`的event，找到这些event的`COUNT(DISTINCT actor_id)`即可，具体的实现方式可以参考[js example](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts)的`repoParticipants`函数。

event数据的schema见[data description](https://github.com/X-lab2017/open-digger/blob/master/docs/assets/data_description.csv)。我们可以限制`time1 <= created_at <= time2`来找到在time1到time2的时间段里的Participants指标。

在SQL里通常会结合Filter操作来缩小查询得到的数据范围，常见的Filter属性如下。

### 常见Filter属性

 - **created_at**

 - repo_id

 - repo_name

 - org_id

 - platform

其他操作（如GroupBy、OrderBy）使用的属性需要根据需求来改变。

### 常见Filter属性

 - **created_at**

 - repo_id

 - repo_name

 - org_id

 - platform

其他操作（如GroupBy、OrderBy）使用的属性需要根据需求来改变。

### 数据示例

可以参考[json example](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/participants.json)

### Demo

可以参考[demo](https://codepen.io/frank-zsy/pen/RwBmpYZ)