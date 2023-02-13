# 全域 OpenRank

![Type](https://img.shields.io/badge/类型-指标-blue) ![From](https://img.shields.io/badge/来自-X--lab-blue) ![For](https://img.shields.io/badge/用于-项目/开发者-blue)

## 定义

全域 OpenRank 是一个由 X-lab 开放实验室提出的开源指标，该指标由赵生宇博士提出，关于全域  OpenRank 的算法细节可以参考[这篇博客](https://blog.frankzhao.cn/how_to_measure_open_source_3)。

全域 OpenRank 是`活跃度`指标的一个下游指标，借鉴了`活跃度`来构建 GitHub 全域项目与开发者之间的一个协作网络，其网络模型是：

![OpenRankUML](https://www.plantuml.com/plantuml/png/SoWkIImgAStDuIhEpimhI2nAp5L8IKrBBCqfSSlFA_5Bp4rLS0nI2F1H2FLEp5HmzkFYoaqiK7Ywf-5f_yGN3QqArLmA2lu5gNb1YNdP2hPs2i-cRdZQi8Uh5gBkoUx9JtTDngC8OP2DhguTJBsLmhCjkrziR-PoICrB0JeE0000)

在全域 OpenRank 指标的实现中，使用`活跃度`指标作为开发者与仓库之间的边的权重，从而构建出全域协作网络来计算网络中每个节点在每个月的全域 OpenRank 值。但与`活跃度`不同的地方在于，我们并没有对开发者的加权活跃值进行开方运算，这是由于`活跃度`指标中的开方运算是为了将社区参与人数（社区规模）的因素引入到指标计算中，但对于协作网络而言，社区参与人数这个变量已经隐含在了网络结构中。

与传统 PageRank 不同之处在于，计算中每个节点的全域 OpenRank 值将不仅仅依赖于当月的协作网络结构，并且也部分依赖于该节点在上个月的全域 OpenRank 值。即对于全域协作网络中的每个开发者和仓库节点，会部分的继承其历史的 OpenRank 值，这里也是体现了开源中珍视长期价值的价值观。

## 代码

由于全域 OpenRank 是基于 Neo4j 数据库的图指标实现，我们并没有在 OpenDigger 中完全开源全域 OpenRank 的计算代码。但我们将每月的结算结果导入到了 ClickHouse 数据库中，因此依然可以通过 OpenDigger 的[代码]((https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L21))来访问各项目与开发者的全域 OpenRank 值。

## 参数

全域 OpenRank 的计算中包含的参数如下：

| 参数名 | 值 | 参数描述 | 注 |
| :------------- | :---- | :---------- | :--- |
| OpenRank 默认值 | 1.0 | 协作网中新节点的默认值，例如新加入网络的开发者节点与新仓库 | |
| 开发者继承比例 | 0.5 | 开发者节点对于上个月 OpenRank 的依赖比例 | 该算法认为相较于仓库，开发者的价值更应体现出开源中的长期价值，因此开发者对于历史价值的依赖度较高 |
| 仓库继承比例 | 0.3 | 仓库节点对于上个月 OpenRank 的依赖比例 | |
| OpenRank 衰减系数 | 0.85 | 对于当月不活跃的开发者和仓库节点的 OpenRank 衰减比例 | OpenRank 价值并不会因为开发者或仓库仅在某月不活跃就直接清零 |
| OpenRank 最小值 | 0.1 | 当节点 OpenRank 衰减值该值以下时清空节点 OpenRank | |

## CodePen 示例

<iframe height="600" style="width: 100%;" scrolling="no" title="OpenDigger - [X-lab] OpenRank/Activity/Bus Factor" src="https://codepen.io/frank-zsy/embed/bGjyqQj?default-tab=js%2Cresult&editable=true&type=openrank" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href="https://codepen.io/frank-zsy/pen/bGjyqQj">
  OpenDigger - [X-lab] OpenRank/Activity/Bus Factor</a> by Frank Zhao (<a href="https://codepen.io/frank-zsy">@frank-zsy</a>)
  on <a href="https://codepen.io">CodePen</a>.
</iframe>
