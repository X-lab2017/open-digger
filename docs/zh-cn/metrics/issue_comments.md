# IssueComments

![Type](https://img.shields.io/badge/类型-指标-blue) ![From](https://img.shields.io/badge/来自-X--lab-blue) ![For](https://img.shields.io/badge/用于-项目/开发者-blue)

## 描述

在讲解IssueComments这个指标之前，我们需要讲解下Issue。例如在Github的一个代码仓库，我们可以找到Issue页面。在Issue页面，某用户可以open一个Issue，向开发者询问一些使用上的问题或一些bug的地方，开发者或其他用户可以在已经存在的Issue下回复。

在这里，我们可以将用户对一个Issue的操作分为New、Comment和Closed。New指的是open一个新的Issue或reopen一个已经关闭的Issue；Closed指的是关闭一个Issue，关闭后所有用户无法在这个Issue下进行Comment；Comment指的是在这个未被关闭的Issue下进行回复的操作。

在一定时间段里，Issue的Comment发生的次数可以反映一个代码仓库对应的社区的热度，但是需要注意，一些bot可能也会进行Comment，一些用户也可能会发现无意义的垃圾Comment，将这些Comment的次数统计进来可能会高估社区热度。

IssueComments为在 **一定时间范围** 里所有用户（包括开发者）对一个或多个代码仓库下的Issue进行Comment的次数，一定程度上可以反映这个时间段里社区的热度。

## 使用

在SQL里，IssueComments指`type = 'IssueCommentEvent' AND action = 'created'`的event的数量，event数据的schema见[data description](https://github.com/X-lab2017/open-digger/blob/master/docs/assets/data_description.csv)。我们可以限制`time1 <= created_at <= time2`来找到在time1到time2的时间段里的IssueComments指标。

在SQL里通常会结合Filter操作来缩小查询得到的数据范围，常见的Filter属性如下。

### 常见Filter属性

 - **created_at**

 - repo_id

 - repo_name

 - org_id

 - platform

其他操作（如GroupBy、OrderBy、Limit）使用的属性需要根据需求来改变。

SQL查询的案例可以参考[js example](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts)的`repoIssueComments`函数。

### 数据示例

可以参考[json example](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_comments.json)

这里，我们可以简单地访问记录一个代码仓库issue_comments指标变化的Json文件，其url格式：

```
https://oss.x-lab.info/open_digger/{platform}/{user name or organization name}/{repository name}/{metric name}.json
```

例如：

```
https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_comments.json
https://oss.x-lab.info/open_digger/github/facebook/rocksdb/issue_comments.json
```

### Demo

可以参考[Codepen demo](https://codepen.io/frank-zsy/pen/mdjaZMw)，数据来源为上述的Json文件[json example](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_comments.json)