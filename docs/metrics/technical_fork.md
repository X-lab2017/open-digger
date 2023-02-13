# Technical Fork

![Type](https://img.shields.io/badge/Type-Metric-blue) ![From](https://img.shields.io/badge/From-CHAOSS-blue) ![For](https://img.shields.io/badge/For-Repo-blue)

## Definition

Technical Fork is a metric defined by CHAOSS, see [CHAOSS Metrics - Technical Fork](https://chaoss.community/kb/metric-technical-fork/) for the detail definition of this metric.

A technical fork is a distributed version control copy of a project. The number of technical forks indicates the number of copies of a project on the same code development platform.

> Fork from the same developer will be double counted. For example, if a developer has deleted the forked repository and then fork again, the latter fork will also be counted in the total.


## Data

Link: https://oss.x-lab.info/open_digger/github/{owner}/{repo}/technical_fork.json

To get the data for a certain repository, replace {owner} and {repo} with the actual name.

## Code

[Implementation code](https://github.com/X-lab2017/open-digger/blob/465d2e3ddb57c0da7fab18435f711d4fa0a63f22/src/metrics/chaoss.ts#L12).


## CodePen Demo

<iframe height="600" style="width: 100%;" scrolling="no" title="OpenDigger - [X-lab] Attention/Stars/Technical Fork/Bus Factor" src="https://codepen.io/frank-zsy/embed/abjMXBV?default-tab=js%2Cresult&editable=true" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href="https://codepen.io/frank-zsy/pen/MWBdpNg?type=technical_fork">
  OpenDigger - [X-lab] Attention/Stars/Technical Fork/Bus Factor</a> by Frank Zhao (<a href="https://codepen.io/frank-zsy">@frank-zsy</a>)
  on <a href="https://codepen.io">CodePen</a>.
</iframe>