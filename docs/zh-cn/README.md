# OpenDigger

[![apache2](https://img.shields.io/badge/license-Apache%202-blue)](LICENSE) [![](https://img.shields.io/badge/Data-OpenDigger-2097FF)](https://github.com/X-lab2017/open-digger) [![Node.js CI](https://github.com/X-lab2017/open-digger/actions/workflows/node_ci.yml/badge.svg?branch=master)](https://github.com/X-lab2017/open-digger/actions/workflows/node_ci.yml)

[OpenDigger](https://github.com/X-lab2017/open-digger) 是由 X-lab 发起的一个开源数据分析报告开源项目，这个项目旨在凝聚全球开发者的智慧共同对开源相关数据进行分析统计，以使开发者可以更好的理解和参与开源。

## 指标或索引的使用

实现的所有指标对所有人开放使用, 您可以通过以下链接找到数据, 因为当前我们只有 Github 的数据，所以OpenDigger 的静态数据根链接为 `https://oss.x-lab.info/open-digger/github/`  , 只需要替换 `org/repo` 或 用户 `login` 即可获取数据。

您可随意使用这些数据来构建自己的数据应用程序，您可以将OpenDigger作为您的数据源，并且欢迎在您的项目中使用以下徽章来展示数据源。

[![](https://img.shields.io/badge/Data-OpenDigger-2097FF)](https://github.com/X-lab2017/open-digger)

### 对仓库而言

<table>
  <thead>
    <tr>
      <th>类型</th><th>名称</th><th>来源</th><th>例子</th><th>代码</th><th>CodePen</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3">索引</td>
      <td>OpenRank</td>
      <td><a href="https://blog.frankzhao.cn/how_to_measure_open_source_2/">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/openrank.json">openrank.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L21">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjyqQj?type=openrank">Demo</a></td>
    </tr>
    <tr>
      <td>Activity</td>
      <td><a href="https://blog.frankzhao.cn/how_to_measure_open_source_1/">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/activity.json">activity.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L109">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjyqQj?type=activity">Demo</a></td>
    </tr>
    <tr>
      <td>Attention</td>
      <td>X-lab</td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/attention.json">attention.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L235">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/MWBdpNg?type=attention">Demo</a></td>
    </tr>
    <tr>
      <td rowspan="24">指标</td>
      <td>Active dates and times</td>
      <td><a href="https://chaoss.community/metric-activity-dates-and-times/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/active_dates_and_times.json">active_dates_and_times.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L1050">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/jOpQdZZ">Demo</a></td>
    </tr>
    <tr>
      <td>Stars</td>
      <td>X-lab</td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/stars.json">stars.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L15">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/MWBdpNg?type=stars">Demo</a></td>
    </tr>
    <tr>
      <td>Technical fork</td>
      <td><a href="https://chaoss.community/metric-technical-fork/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/technical_fork.json">technical_fork.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L12">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/MWBdpNg?type=technical_fork">Demo</a></td>
    </tr>
    <tr>
      <td>Participants</td>
      <td>X-lab</td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/participants.json">participants.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L89">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/RwBmpYZ">Demo</a></td>
    </tr>
    <tr>
      <td rowspan="2">New contributors</td>
      <td rowspan="2"><a href="https://chaoss.community/metric-new-contributors/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/new_contributors.json">new_contributors.json</a></td>
      <td rowspan="2"><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L862">Link</a></td>
      <td rowspan="2"><a href="https://codepen.io/frank-zsy/pen/RwBmpYZ">Demo</a></td>
    </tr>
    <tr>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/new_contributors_detail.json">new_contributors_detail.json</a></td>
    </tr>
    <tr>
      <td>Inactive contributors</td>
      <td><a href="https://chaoss.community/metric-inactive-contributors/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/inactive_contributors.json">inactive_contributors.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L965">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/RwBmpYZ">Demo</a></td>
    </tr>
    <tr>
      <td rowspan="2">Bus factor</td>
      <td rowspan="2"><a href="https://chaoss.community/metric-bus-factor/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/bus_factor.json">bus_factor.json</a></td>
      <td rowspan="2"><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L780">Link</a></td>
      <td rowspan="2"><a href="https://codepen.io/frank-zsy/pen/bGjyqQj?type=bus_factor">Demo</a></td>
    </tr>
    <tr>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/bus_factor_detail.json">bus_factor_detail.json</a></td>
    </tr>
    <tr>
      <td>Issues new</td>
      <td><a href="https://chaoss.community/metric-issues-new/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issues_new.json">issues_new.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L146">Link</a></td>
      <td rowspan="3"><a href="https://codepen.io/frank-zsy/pen/mdjaZMw">Demo</a></td>
    </tr>
    <tr>
      <td>Issues closed</td>
      <td><a href="https://chaoss.community/metric-issues-closed/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issues_closed.json">issues_closed.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L223">Link</a></td>
    </tr>
    <tr>
      <td>Issue comments</td>
      <td>X-lab</td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_comments.json">issue_comments.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L52">Link</a></td>
    </tr>
    <tr>
      <td>Issue response time</td>
      <td><a href="https://chaoss.community/metric-issue-response-time/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_response_time.json">issue_response_time.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L413">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/VwBqwaP?type=issue_response_time">Demo</a></td>
    </tr>
    <tr>
      <td>Issue resolution duration</td>
      <td><a href="https://chaoss.community/metric-issue-resolution-duration/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_resolution_duration.json">issue_resolution_duration.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L338">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/VwBqwaP?type=issue_resolution_duration">Demo</a></td>
    </tr>
    <tr>
      <td>Issue age</td>
      <td><a href="https://chaoss.community/metric-issue-age/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_age.json">issue_age.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L492">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/VwBqwaP?type=issue_age">Demo</a></td>
    </tr>
    <tr>
      <td>Code change lines</td>
      <td><a href="https://chaoss.community/metric-code-changes-lines/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/code_change_lines_add.json">code_change_lines_add.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L94">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/dyjByKL">Demo</a></td>
    </tr>
    <tr>
      <td>Code change lines</td>
      <td><a href="https://chaoss.community/metric-code-changes-lines/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/code_change_lines_remove.json">code_change_lines_remove.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L94">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/dyjByKL">Demo</a></td>
    </tr>
    <tr>
      <td>Code change lines</td>
      <td><a href="https://chaoss.community/metric-code-changes-lines/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/code_change_lines_sum.json">code_change_lines_sum.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L94">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/dyjByKL">Demo</a></td>
    </tr>
    <tr>
      <td>Change requests<br />(Open PR)</td>
      <td><a href="https://chaoss.community/metric-change-requests/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_requests.json">change_requests.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L697">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjPGxw">Demo</a></td>
    </tr>
    <tr>
      <td>Change requests accepted<br />(Merged PR)</td>
      <td><a href="https://chaoss.community/metric-change-requests-accepted/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_requests_accepted.json">change_requests_accepted.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L497">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjPGxw">Demo</a></td>
    </tr>
    <tr>
      <td>Change requests reviews</td>
      <td><a href="https://chaoss.community/metric-change-request-reviews/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_requests_reviews.json">change_requests_reviews.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L734">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjPGxw">Demo</a></td>
    </tr>
    <tr>
      <td>Change request response time</td>
      <td><a href="https://chaoss.community/metric-issue-response-time/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_request_response_time.json">change_request_response_time.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L415">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/VwBqwaP?type=change_request_response_time">Demo</a></td>
    </tr>
    <tr>
      <td>Change request resolution duration</td>
      <td><a href="https://chaoss.community/metric-issue-resolution-duration/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_request_resolution_duration.json">change_request_resolution_duration.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L341">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/VwBqwaP?type=change_request_resolution_duration">Demo</a></td>
    </tr>
    <tr>
      <td>Change request age</td>
      <td><a href="https://chaoss.community/metric-issue-age/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_request_age.json">change_request_age.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L494">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/VwBqwaP?type=change_request_age">Demo</a></td>
    </tr>
    <tr>
      <td rowspan="3">网络</td>
      <td>Developer network</td>
      <td><a href="https://blog.frankzhao.cn/github_activity_with_wpr/">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/developer_network.json">developer_network.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/cron/tasks/network_export.ts#L126">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/NWBVjpV?type=developer_network">Demo</a></td>
    </tr>
    <tr>
      <td>Repo network</td>
      <td><a href="https://blog.frankzhao.cn/github_activity_with_wpr/">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/repo_network.json">repo_network.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/cron/tasks/network_export.ts#L126">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/NWBVjpV?type=repo_network">Demo</a></td>
    </tr>
    <tr>
      <td>Project OpenRank</td>
      <td><a href="https://blog.frankzhao.cn/how_to_measure_open_source_3/">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/project_openrank_detail/2022-12.json">project_openrank_detail/2022-12.json</a></td>
      <td></td>
      <td><a href="https://codepen.io/frank-zsy/pen/abjMXBV">Demo</a></td>
    </tr>
  </tbody>
</table>

### 对用户而言

<table>
  <thead>
    <tr>
      <th>类型</th><th>名称</th><th>来源</th><th>例子</th><th>代码</th><th>CodePen</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">索引</td>
      <td>OpenRank</td>
      <td><a href="https://blog.frankzhao.cn/how_to_measure_open_source_3">X-lab</a ></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/frank-zsy/openrank.json">openrank.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L59">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjyqQj?type=openrank&name=frank-zsy">Demo</a></td>
    </tr>
    <tr>
      <td>Activity</td>
      <td><a href="https://blog.frankzhao.cn/how_to_measure_open_source_1">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/frank-zsy/activity.json">activity.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L174">Link</a ></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjyqQj?type=activity&name=frank-zsy">Demo</a></td>
    </tr>
    <tr>
      <td rowspan="2">网络</td>
      <td>Developer network</td>
      <td><a href="https://blog.frankzhao.cn/github_activity_with_wpr/">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/frank-zsy/developer_network.json">developer_network.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/cron/tasks/network_export.ts#L63">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/NWBVjpV?type=developer_network&name=frank-zsy">Demo</a></td>
    </tr>
    <tr>
      <td>Repo network</td>
      <td><a href="https://blog.frankzhao.cn/github_activity_with_wpr/">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/frank-zsy/repo_network.json">repo_network.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/cron/tasks/network_export.ts#L63">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/NWBVjpV?type=repo_network&name=frank-zsy">Demo</a></td>
    </tr>
  </tbody>
</table>

## 用户

对于以上数据，OpenDigger 目前有一些用户。

### 应用

- [OpenLeaderboard](https://open-leaderboard.x-lab.info/): 带有标签数据的 Github 排行榜
- [Hypercrx](https://github.com/hypertrons/hypertrons-crx): 对查看 Github 用户和仓库有帮助的浏览器插件
- [Mulan Dashboard](http://dataease.nzcer.cn/link/1VxPsUCX): 用于 [木兰社区](https://portal.mulanos.cn/) 的仪表板.
- [Hacking Force China](https://opensource.win/): 与 [思否](https://segmentfault.com/) 合作发布的 Github 中国开发者排行榜

### 开源报告

- [2021中国开源报告](https://kaiyuanshe.cn/document/china-os-report-2021/): 中国最全面的开源报告 [开源社](https://kaiyuanshe.cn/).
- [2022中国开源蓝皮书](http://www.copu.org.cn/new/308): 中国开源开发蓝皮书 [COPU](http://www.copu.org.cn/).
- [开源大数据热力报告](cooperations/big_data_open_source_heat_report/开源大数据热力报告2022.pdf): 大数据领域内开源项目热力报告


## 活动

OpenDigger 社区也参加社区间的合作活动，如竞赛或黑客松。

- [PaddlePaddle Hackathon 3rd](https://www.paddlepaddle.org.cn/PaddlePaddleHackathon-2022-6), 黑客马拉松的最终报告在 [这里](https://github.com/X-lab2017/open-digger/tree/master/cooperations/paddle_hackathon_3rd).

## 报告

我们生成了静态网页的报告用于查看，目前的报告有：

- [全球分析报告](http://opendigger-oss.x-lab.info/global-study.html)
- [Apache 软件基金会报告](http://opendigger-oss.x-lab.info/case-study-ASF.html)

## 数据

### GitHub Event Log

我们使用 [GHArchive](https://www.gharchive.org/) 作为 GitHub 日志数据源，数据服务由 X-lab 维护的 [clickhouse](https://clickhouse.tech/) 云服务。关于数据的详细细节，请查看[数据](https://www.x-lab.info/open-digger/#/zh-cn/data)文档。

### Labeled Data

为了进行更深入的分析，我们正在收集打过标签的数据。您可以在 “labeled_data” 文件夹中查看相应的数据。关于数据的详细细节，请查看[已标签数据](labeled_data/README.md) 文档.

### Sample Data Usage

OpenDigger 提供 ClickHouse 示例数据和 Jupyter notebook，从而可以在本地环境运行 OpenDigger，详情可参考 [示例数据文档](./sample_data/README.md).

## 贡献指南

在对项目贡献之前，请务必查阅我们的[贡献指南](https://www.x-lab.info/open-digger/#/zh-cn/CONTRIBUTING)。

## 架构与工作流

如果想更加深入的理解本项目，请点击[架构文档](https://www.x-lab.info/open-digger/#/zh-cn/architecture)和[工作流文档](https://www.x-lab.info/open-digger/#/zh-cn/workflow)。

## 沟通

如果想和我们取得联系，欢迎通过我们 GitHub 主页 README 文档中的 Slack 徽章加入我们的 Slack 交流群。或通过下面的微信群二维码加入微信群交流。

![](../assets/wechat-qrcode.png)

## 许可证

对于代码部分，我们使用了 [Apache-2.0 许可证](https://github.com/X-lab2017/open-digger/blob/master/LICENSE)，对于文档目前，我们使用了 [CC-BY-4.0 许可证](https://github.com/X-lab2017/open-digger/blob/master/LICENSE-CC-BY)。在使用项目输出内容前请确保使用符合许可证要求。
