# Project OpenRank

![Type](https://img.shields.io/badge/Type-Index-blue) ![From](https://img.shields.io/badge/From-X--lab-blue) ![For](https://img.shields.io/badge/For-Developer-blue)

## Definition

Project OpenRank is an index introduced by X-lab, the original idea of OpenRank is from Frank, read the [blog](https://blog.frankzhao.cn/openrank_in_project/) for the detail of this index.

Similar to global OpenRank, the algorithm uses project issues and pull requests collaboration data to construct the network, the network model is:

![Project OpenRank](//www.plantuml.com/plantuml/png/VSvH2i8m40JG_pt5Ng0NA5fw4qdj885D4pUxXIBUNIY2GMY_vyqmOxMWvaaeXS8pLaWkK7uHynh4mTU15qyJbDwq8qN9DLhMxKp5MXrdeBZ8JV5qL3jolp-NhXk-cps7kyKrslQVjvCjstixQS_tF47oyg2sTgnen39xaWy0)

## Code

Project OpenRank algorithm implementation is not open sourced yet, but the underlying libaray of OpenRank plugin for Neo4j database is open sourced [here](https://github.com/X-lab2017/openrank-neo4j-gds).

## Parameters

Project OpenRank is a much more complex algorithm than global OpenRank, there are many parameters used in project OpenRank algorithm.

| Parameter Name | Value | Description | Note |
| :------------- | :---- | :---------- | :--- |
| OpenRank default value for developer/repository | 1.0 | The default value of a new node in the network, like new joined developers and new create repository | |
| OpenRank default value for issue | 2.0 | The default value of a new issue in the network | |
| OpenRank default value for not merged pull request | 3.0 | The default value of a not merged new pull request in the network | |
| OpenRank default value for merged pull request | 5.0 | The default value of a merged new pull request in the network | |
| Developer/repository retention factor | 0.15 | How much OpenRank value to inherit from last month for developers and repository | In project OpenRank, developers' value should mostly depends on theirs contribution |
| Issue/Pull request retention factor | 0.8 | How much OpenRank value to inherit from last month or its own value for issues and pull requests | Issues' and pull requests' value should be much more stable and depend on their own value |
| OpenRank attenuation factor | 0.8 | How much OpenRank value will be left if a developer or issue/pull request has no activity in a specific month | OpenRank value should not be cleared for developers and issues/pull requests if they have no activity just in one month |
| OpenRank min value | 0.1 | Clear the OpenRank value if it attenuates to a smaller one than this value | |
| Belong edge ratio from issue/pull request to repository | 0.1 | How much value will be transferred from issue/pull request to repository | |
| Belong edge ratio from repository to issue/pull request | avg | How much value will be transferred its value to issue/pull request | |
| Activity edge ratio from issue/pull request to developer | 0.9 | How much value will be transferred from issue/pull request to developer | |
| Activity edge ratio from developer issue/pull request | 1.0 | How much value will be transferred from developer to issue/pull request | |
| Open activity ratio | 0.5 | How much value will be transferred to the author of an issue/pull request | Author of an issue/pull request will share 50% of its value first |
| Open/Comment/Review/Close activity weight | 2/1/1/2 | What is the weight of each activity to calculate the value transfermation weight of issues and pull requests | |
| 👍/❤️/🚀 emoji weight | 2/3/4 | What is the weight to calculate the initial weight of issues and pull requests | Issues and pull requests initial weight can be changed by developers in the community by add emoji to them |

## CodePen Demo

> We do not generate project OpenRank network for all repositories, only for all the repos in [XSOSI](https://github.com/X-lab2017/open-digger/blob/master/notebook/community_analysis/xlab.ipynb) and [Alibaba open source contribution leaderboard](https://opensource.alibaba.com/collection/contribution_leaderboard).

<iframe height="600" style="width: 100%;" scrolling="no" title="OpenDigger - [X-lab] OpenRank/Activity/Bus Factor" src="https://codepen.io/frank-zsy/embed/abjMXBV?default-tab=js%2Cresult&editable=true" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href="https://codepen.io/frank-zsy/pen/bGjyqQj">
  OpenDigger - [X-lab] OpenRank/Activity/Bus Factor</a> by Frank Zhao (<a href="https://codepen.io/frank-zsy">@frank-zsy</a>)
  on <a href="https://codepen.io">CodePen</a>.
</iframe>

