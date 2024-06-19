# OpenDigger

[![apache2](https://img.shields.io/badge/license-Apache%202-blue)](LICENSE) [![](https://img.shields.io/badge/Data-OpenDigger-2097FF)](https://github.com/X-lab2017/open-digger) [![Node.js CI](https://github.com/X-lab2017/open-digger/actions/workflows/node_ci.yml/badge.svg?branch=master)](https://github.com/X-lab2017/open-digger/actions/workflows/node_ci.yml)

OpenDigger is an open source analysis report project for all open source data initiated by [X-lab](https://x-lab.info), this project aims to combine the wisdom of global developers to jointly analyze and insight into open source related data to help everyone better understand and participate in open source.

## Metrics or Indices Usage

All implemented metrics are open for anyone to use, you can find the data with following URLs, The root URL of OpenDigger static data is `https://oss.x-lab.info/open-digger/github/` right now since we only have GitHub data for now, just replace the `org/repo` or `owner` to get your data.

Feel free to use the data to construct your own data application and you can refer OpenDigger as your data source and welcome to use the following badge in your project to show the data source.

[![](https://img.shields.io/badge/Data-OpenDigger-2097FF)](https://github.com/X-lab2017/open-digger)

### For repos

<table>
  <thead>
    <tr>
      <th>Type</th><th>Name</th><th>From</th><th>Example</th><th>Code</th><th>CodePen</th><th>Notebook</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3">Index</td>
      <td>OpenRank</td>
      <td><a href="https://blog.frankzhao.cn/how_to_measure_open_source_2/">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/openrank.json">openrank.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L21">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjyqQj?type=openrank">Demo</a></td>
      <td><a href="https://cocalc.com/share/public_paths/123f89e46ce77e62183ce01bf81e0cc1590e7a0f">Demo</a></td>
    </tr>
    <tr>
      <td>Activity</td>
      <td><a href="https://blog.frankzhao.cn/how_to_measure_open_source_1/">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/activity.json">activity.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L109">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjyqQj?type=activity">Demo</a></td>
      <td><a href="https://cocalc.com/share/public_paths/faf82100d1cf7f0294d424e9107d912d4ffe02d0">Demo</a></td>
    </tr>
    <tr>
      <td>Attention</td>
      <td><a href="https://cocalc.com/share/public_paths/27cf7ab61ff44e8770b85859104d1b3faa387d3a">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/attention.json">attention.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L235">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/MWBdpNg?type=attention">Demo</a></td>
      <td><a href="https://cocalc.com/share/public_paths/548083147655b0795d456b5013d896b91dbaba26">Demo</a></td>
    </tr>
    <tr>
      <td rowspan="25">Metric</td>
      <td>Active dates and times</td>
      <td><a href="https://chaoss.community/metric-activity-dates-and-times/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/active_dates_and_times.json">active_dates_and_times.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L1050">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/jOpQdZZ">Demo</a></td>
    </tr>
    <tr>
      <td>Stars</td>
      <td><a href="https://cocalc.com/share/public_paths/e87d04aae2b8f71cddd10b17d6d86f15c0088f23">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/stars.json">stars.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L15">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/MWBdpNg?type=stars">Demo</a></td>
      <td><a href="https://cocalc.com/share/public_paths/dbfc7d704bcbba998c4860c56bec6d823e20af39">Demo</a></td>
    </tr>
    <tr>
      <td>Technical fork</td>
      <td><a href="https://chaoss.community/metric-technical-fork/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/technical_fork.json">technical_fork.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L12">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/MWBdpNg?type=technical_fork">Demo</a></td>
      <td><a href="https://cocalc.com/share/public_paths/a5487c04a61b4aea3f38afcf575b65226ab53ad6">Demo</a></td>
    </tr>
    <tr>
      <td>Participants</td>
      <td><a href="https://cocalc.com/share/public_paths/f9f0abf6fab71259b06158009bd7fd7b017011a3">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/participants.json">participants.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L89">Link</a></td>
      <td rowspan="3"><a href="https://codepen.io/frank-zsy/pen/RwBmpYZ">Demo</a></td>
      <td><a href="https://cocalc.com/share/public_paths/5fec1dfc224c29314fce666738f79840a0f962b6">Demo</a></td>
    </tr>
    <tr>
      <td rowspan="2">New contributors</td>
      <td rowspan="2"><a href="https://chaoss.community/metric-new-contributors/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/new_contributors.json">new_contributors.json</a></td>
      <td rowspan="2"><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L862">Link</a></td>
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
      <td rowspan="2"><a href="https://cocalc.com/share/public_paths/70cfcbffa2b87092d79cd76a5646fd4d881351bc">Demo</a></td>
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
      <td><a href="https://cocalc.com/share/public_paths/b8caf1261246c925ac34cecb8effe9320e64d295">Demo</a></td>
    </tr>
    <tr>
      <td>Issues closed</td>
      <td><a href="https://chaoss.community/metric-issues-closed/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issues_closed.json">issues_closed.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L223">Link</a></td>
      <td><a href="https://cocalc.com/share/public_paths/880e322e1e05c101fbba374b453017a2f11b8391">Demo</a></td>
    </tr>
    <tr>
      <td>Issue comments</td>
      <td><a href="https://cocalc.com/share/public_paths/22e0616f6e0d3be5f6f112d0d755c0f92e6ca94f">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_comments.json">issue_comments.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L52">Link</a></td>
      <td><a href="https://cocalc.com/share/public_paths/22e0616f6e0d3be5f6f112d0d755c0f92e6ca94f">Demo</a></td>
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
      <td rowspan="3">Code change lines</td>
      <td rowspan="3"><a href="https://chaoss.community/metric-code-changes-lines/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/code_change_lines_add.json">code_change_lines_add.json</a></td>
      <td rowspan="3"><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L94">Link</a></td>
      <td rowspan="3"><a href="https://codepen.io/frank-zsy/pen/dyjByKL">Demo</a></td>
    </tr>
    <tr>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/code_change_lines_remove.json">code_change_lines_remove.json</a></td>
    </tr>
    <tr>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/code_change_lines_sum.json">code_change_lines_sum.json</a></td>
    </tr>
    <tr>
      <td>Change requests<br />(Open PR)</td>
      <td><a href="https://chaoss.community/metric-change-requests/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_requests.json">change_requests.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L697">Link</a></td>
      <td rowspan="3"><a href="https://codepen.io/frank-zsy/pen/bGjPGxw">Demo</a></td>
    </tr>
    <tr>
      <td>Change requests accepted<br />(Merged PR)</td>
      <td><a href="https://chaoss.community/metric-change-requests-accepted/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_requests_accepted.json">change_requests_accepted.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L497">Link</a></td>
    </tr>
    <tr>
      <td>Change requests reviews</td>
      <td><a href="https://chaoss.community/metric-change-request-reviews/">CHAOSS</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_requests_reviews.json">change_requests_reviews.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L734">Link</a></td>
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
      <td>Activity Details</td>
      <td><a href="https://github.com/X-lab2017/open-digger/issues/1186">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/activity_details.json">activity_details.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/0432ecbd9b9d75d36b249fb5eb2b101d16a414be/src/metrics/indices.ts#L112">Link</a></td>
      <td><a href="https://codepen.io/tyn1998/pen/KKGxVrm">Demo</a></td>
    </tr>
    <tr>
      <td rowspan="3">Network</td>
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

### For users

<table>
  <thead>
    <tr>
      <th>Type</th><th>Name</th><th>From</th><th>Example</th><th>Code</th><th>CodePen</th><th>Notebook</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2">Index</td>
      <td>OpenRank</td>
      <td><a href="https://blog.frankzhao.cn/how_to_measure_open_source_3">X-lab</a ></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/frank-zsy/openrank.json">openrank.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L59">Link</a></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjyqQj?type=openrank&name=frank-zsy">Demo</a></td>
      <td><a href="https://cocalc.com/share/public_paths/099b0c2d55a3d56a362225b303332e8ebae4ebd8">Demo</a></td>
    </tr>
    <tr>
      <td>Activity</td>
      <td><a href="https://blog.frankzhao.cn/how_to_measure_open_source_1">X-lab</a></td>
      <td><a href="https://oss.x-lab.info/open_digger/github/frank-zsy/activity.json">activity.json</a></td>
      <td><a href="https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L174">Link</a ></td>
      <td><a href="https://codepen.io/frank-zsy/pen/bGjyqQj?type=activity&name=frank-zsy">Demo</a></td>
      <td><a href="https://cocalc.com/share/public_paths/38aa0f7c5877a5b63c0624cc9c582bff7d5f4395">Demo</a></td>
    </tr>
    <tr>
      <td rowspan="2">Network</td>
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

## Users

For above data, there are some users of OpenDigger right now.

### Applications

- [OpenLeaderboard](https://open-leaderboard.x-lab.info/): A leaderboard of GitHub world with labeled data.
- [Hypercrx](https://github.com/hypertrons/hypertrons-crx): A browser plugin helps to look into GitHub users and repos.
- [Mulan Dashboard](http://dataease.nzcer.cn/link/1VxPsUCX): A dashboard for [Mulan community](https://portal.mulanos.cn/).
- [Hacking Force China](https://opensource.win/): A ranking list of Chinese developers on GitHub cooperate with [SegmentFault](https://segmentfault.com/).

### Open source reports

- [China Open Source Report 2021](https://kaiyuanshe.cn/document/china-os-report-2021/): Most comprehensive open source report in China by [kaiyuanshe](https://kaiyuanshe.cn/).
- [China Open Source Blue Paper 2022](http://www.copu.org.cn/new/308): A blue paper of Chinese open source development by [COPU](http://www.copu.org.cn/).
- [Big Data Open Source Heat Report](cooperations/big_data_open_source_heat_report/开源大数据热力报告2022.pdf): A heat report of open source projects in big data area.

## Events

OpenDigger community also open to inter-community cooperation events, like contests or hackathons.

- [PaddlePaddle Hackathon 3rd](https://www.paddlepaddle.org.cn/PaddlePaddleHackathon-2022-6), the hackathon final reports are [here](https://github.com/X-lab2017/open-digger/tree/master/cooperations/paddle_hackathon_3rd).

## Data

### GitHub Event Log

We use [GHArchive](https://www.gharchive.org/) as our data source for GitHub event logs and the data service is provided by [clickhouse](https://clickhouse.tech/) cluster cloud service. For data details, please check the [data](https://github.com/X-lab2017/open-digger/blob/master/docs/data.md) docs.

### Labeled Data

We are collecting labeled data for more deeper analysis. You can view the corresponding data in the `labeled_data` folder. For more details, please check [labeled_data](labeled_data/README.md) docs.

### Sample Data Usage

OpenDigger provides ClickHouse sample data and Jupyter notebook image to run OpenDigger in local environment, please refer to [sample data doc](./sample_data/README.md).

## Communication

Welcome to join the WeChat group by scanning the QRCode and I will invite you into our WeChat group.

<div align=center>
<img src='./docs/assets/wechat-qrcode.png' width="250px">
</div>

## License

We use [Apache-2.0 license](LICENSE) for code part, please make sure abide by the licenses when using the project.
