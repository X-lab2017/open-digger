# OpenRank

![Type](https://img.shields.io/badge/Type-Index-blue) ![From](https://img.shields.io/badge/From-X--lab-blue) ![For](https://img.shields.io/badge/For-Repo/Developer-blue)

## Definition

OpenRank is an index introduced by X-lab, the original idea of OpenRank is from Frank, read the [blog](https://blog.frankzhao.cn/how_to_measure_open_source_3) for the detail of this index.

OpenRank is a downstream index of `activity`, it partially uses `activity` index to construct a collaborative network for all GitHub repos and developers. The network model is:

![OpenRankUML](https://www.plantuml.com/plantuml/png/SoWkIImgAStDuUBAJInGI4ajIyt9BqWjKgZcKb0eIymfJLMmjLF8AyrDIYtYgeKeAaejo2_EBCalgiIb2c6CZQwk7R86AuN4v9BCiioIIYukXzIy5A3D0000)

In the implementation of OpenRank, we use `activity` index as relationship weight for developers and repositories, construct the global network for every month and calculate the OpenRank of every node in the network. However, we do not use `square` to calculate the `activity` in OpenRank because `square` is used to bring community size into account, but for a global collaborative network, the community size is already implied in the network structure.

Different from PageRank, the value of each node does not entirely depend on the network structure, but also partially depends on the value of the node in last month. So for every developer and repository, it will inherit part of its OpenRank value which is also a reflect of long-term value in open source.

## Code

We do not open source OpenRank calculation code in OpenDigger since this is a network index and depends on Neo4j database. But we do export the result of each month to ClickHouse server, so you can still access OpenRank index by the [code](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L21).

## Parameters

There are several parameters used in OpenRank algorithm.

| Parameter Name | Value | Description | Note |
| :------------- | :---- | :---------- | :--- |
| OpenRank default value | 1.0 | The default value of a new node in the network, like new joined developers and new create repositories | |
| Developer retention factor | 0.5 | How much OpenRank value to inherit from last month for developers | We assume developers' value is much more long-term value than repositories', so developers will inherit more value from themselves |
| Repository retention factor | 0.3 | How much OpenRank value to inherit from last month for repositories | |
| OpenRank attenuation factor | 0.85 | How much OpenRank value will be left if a developer or repository has no activity in a specific month | OpenRank value should not be cleared for repositories and developers if they have no activity just in one month |
| OpenRank min value | 0.1 | Clear the OpenRank value if it attenuates to a smaller one than this value | |

## CodePen demo

<iframe height="600" style="width: 100%;" scrolling="no" title="OpenDigger - [X-lab] OpenRank/Activity/Bus Factor" src="https://codepen.io/frank-zsy/embed/bGjyqQj?default-tab=js%2Cresult&editable=true&type=openrank" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href="https://codepen.io/frank-zsy/pen/bGjyqQj">
  OpenDigger - [X-lab] OpenRank/Activity/Bus Factor</a> by Frank Zhao (<a href="https://codepen.io/frank-zsy">@frank-zsy</a>)
  on <a href="https://codepen.io">CodePen</a>.
</iframe>
