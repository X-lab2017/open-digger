# OpenDigger

[![apache2](https://img.shields.io/badge/license-Apache%202-blue)](LICENSE) [![](https://img.shields.io/badge/Data-OpenDigger-2097FF)](https://github.com/X-lab2017/open-digger) [![Node.js CI](https://github.com/X-lab2017/open-digger/actions/workflows/node_ci.yml/badge.svg?branch=master)](https://github.com/X-lab2017/open-digger/actions/workflows/node_ci.yml)

OpenDigger is an open source analysis report project for all open source data initiated by [X-lab](https://x-lab.info), this project aims to combine the wisdom of global developers to jointly analyze and insight into open source related data to help everyone better understand and participate in open source.

## Metrics or Indices Usage

All implemented metrics are open for anyone to use, you can find the data with following URLs, The root URL of OpenDigger static data is `https://oss.x-lab.info/open-digger/github/` right now since we only have GitHub data for now, just replace the `org/repo` or user `login` to get your data.

Feel free to use the data to construct your own data application and you can refer OpenDigger as your data source and welcome to use the following badge in your project to show the data source.

[![](https://img.shields.io/badge/Data-OpenDigger-2097FF)](https://github.com/X-lab2017/open-digger)

### For repos

| Type | Name | From | Example | Code | CodePen |
| :--- | :--- | :--- | :------ | :--- | :------ |
| Index | OpenRank | [X-lab](https://blog.frankzhao.cn/how_to_measure_open_source_2/) | [openrank.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/openrank.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L21) | [Demo](https://codepen.io/frank-zsy/pen/bGjyqQj?type=openrank) |
| Index | Activity | [X-lab](https://blog.frankzhao.cn/how_to_measure_open_source_1/) | [activity.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/activity.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L109) | [Demo](https://codepen.io/frank-zsy/pen/bGjyqQj?type=activity) |
| Index | Attention | X-lab | [attention.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/attention.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L235) | [Demo](https://codepen.io/frank-zsy/pen/MWBdpNg?type=attention) |
| Metric | Active dates and times | [CHAOSS](https://chaoss.community/metric-activity-dates-and-times/) | [active_dates_and_times.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/active_dates_and_times.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L1050) | [Demo](https://codepen.io/frank-zsy/pen/jOpQdZZ) |
| Metric | Stars | X-lab | [stars.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/stars.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L15) | [Demo](https://codepen.io/frank-zsy/pen/MWBdpNg?type=stars) |
| Metric | Technical fork | [CHAOSS](https://chaoss.community/metric-technical-fork/) | [technical_fork.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/technical_fork.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L12) | [Demo](https://codepen.io/frank-zsy/pen/MWBdpNg?type=technical_fork) |
| Metric | Participants | X-lab | [participants.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/participants.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L89) | [Demo](https://codepen.io/frank-zsy/pen/RwBmpYZ) |
| Metric | New contributors | [CHAOSS](https://chaoss.community/metric-new-contributors/) | [new_contributors.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/new_contributors.json)<br />[new_contributors_detail.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/new_contributors_detail.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L862) | [Demo](https://codepen.io/frank-zsy/pen/RwBmpYZ) |
| Metric | Inactive contributors | [CHAOSS](https://chaoss.community/metric-inactive-contributors/) | [inactive_contributors.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/inactive_contributors.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L965) | [Demo](https://codepen.io/frank-zsy/pen/RwBmpYZ) |
| Metric | Bus factor | [CHAOSS](https://chaoss.community/metric-bus-factor/) | [bus_factor.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/bus_factor.json)<br />[bus_factor_detail.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/bus_factor_detail.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L780) | [Demo](https://codepen.io/frank-zsy/pen/bGjyqQj?type=bus_factor) |
| Metric | Issues new | [CHAOSS](https://chaoss.community/metric-issues-new/) | [issues_new.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issues_new.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L146) | [Demo](https://codepen.io/frank-zsy/pen/mdjaZMw) |
| Metric | Issues closed | [CHAOSS](https://chaoss.community/metric-issues-closed/) | [issues_new.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issues_new.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L223) | [Demo](https://codepen.io/frank-zsy/pen/mdjaZMw) |
| Metric | Issue comments | X-lab | [issue_comments.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_comments.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/metrics.ts#L52) | [Demo](https://codepen.io/frank-zsy/pen/mdjaZMw) |
| Metric | Issue response time | [CHAOSS](https://chaoss.community/metric-issue-response-time/) | [issue_response_time.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_response_time.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L413) | [Demo](https://codepen.io/frank-zsy/pen/VwBqwaP?type=issue_response_time) |
| Metric | Issue resolution duration | [CHAOSS](https://chaoss.community/metric-issue-resolution-duration/) | [issue_resolution_duration.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_resolution_duration.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L338) | [Demo](https://codepen.io/frank-zsy/pen/VwBqwaP?type=issue_resolution_duration) |
| Metric | Issue age | [CHAOSS](https://chaoss.community/metric-issue-age/) | [issue_age.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/issue_age.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L492) | [Demo](https://codepen.io/frank-zsy/pen/VwBqwaP?type=issue_age) |
| Metric | Code change lines | [CHAOSS](https://chaoss.community/metric-code-changes-lines/) | [code_change_lines_add.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/code_change_lines_add.json)<br />[code_change_lines_remove.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/code_change_lines_remove.json)<br />[code_change_lines_sum.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/code_change_lines_sum.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L94) | [Demo](https://codepen.io/frank-zsy/pen/dyjByKL) |
| Metric | Change requests<br />(Open PR) | [CHAOSS](https://chaoss.community/metric-change-requests/) | [change_requests.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_requests.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L697) | [Demo](https://codepen.io/frank-zsy/pen/bGjPGxw) |
| Metric | Change requests accepted<br />(Merged PR) | [CHAOSS](https://chaoss.community/metric-change-requests-accepted/) | [change_requests_accepted.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_requests_accepted.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L497) | [Demo](https://codepen.io/frank-zsy/pen/bGjPGxw) |
| Metric | Change requests reviews | [CHAOSS](https://chaoss.community/metric-change-request-reviews/) | [change_requests_reviews.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_requests_reviews.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L734) | [Demo](https://codepen.io/frank-zsy/pen/bGjPGxw) |
| Metric | Change request response time | [CHAOSS](https://chaoss.community/metric-issue-response-time/) | [change_request_response_time.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_request_response_time.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L415) | [Demo](https://codepen.io/frank-zsy/pen/VwBqwaP?type=change_request_response_time) |
| Metric | Change request resolution duration | [CHAOSS](https://chaoss.community/metric-issue-resolution-duration/) | [change_request_resolution_duration.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_request_resolution_duration.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L341) | [Demo](https://codepen.io/frank-zsy/pen/VwBqwaP?type=change_request_resolution_duration) |
| Metric | Change request age | [CHAOSS](https://chaoss.community/metric-issue-age/) | [change_request_age.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/change_request_age.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/chaoss.ts#L494) | [Demo](https://codepen.io/frank-zsy/pen/VwBqwaP?type=change_request_age) |
| Network | Developer network | [X-lab](https://blog.frankzhao.cn/github_activity_with_wpr/) | [developer_network.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/developer_network.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/cron/tasks/network_export.ts#L126) | [Demo](https://codepen.io/frank-zsy/pen/NWBVjpV?type=developer_network) |
| Network | Repo network | [X-lab](https://blog.frankzhao.cn/github_activity_with_wpr/) | [repo_network.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/repo_network.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/cron/tasks/network_export.ts#L126) | [Demo](https://codepen.io/frank-zsy/pen/NWBVjpV?type=repo_network) |
| Network | Project OpenRank | [X-lab](https://blog.frankzhao.cn/how_to_measure_open_source_3/) | [project_openrank_detail/2022-12.json](https://oss.x-lab.info/open_digger/github/X-lab2017/open-digger/project_openrank_detail/2022-12.json) | | [Demo](https://codepen.io/frank-zsy/pen/abjMXBV) |

### For users

| Type | Name | From | Example | Code | CodePen |
| :--- | :--- | :--- | :------ | :--- | :------ |
| Index | OpenRank | [X-lab](https://blog.frankzhao.cn/how_to_measure_open_source_2/) | [openrank.json](https://oss.x-lab.info/open_digger/github/frank-zsy/openrank.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L59) | [Demo](https://codepen.io/frank-zsy/pen/bGjyqQj?type=openrank) |
| Index | Activity | [X-lab](https://blog.frankzhao.cn/how_to_measure_open_source_1) | [activity.json](https://oss.x-lab.info/open_digger/github/frank-zsy/activity.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/metrics/indices.ts#L174) | [Demo](https://codepen.io/frank-zsy/pen/bGjyqQj?type=activity) |
| Network | Developer network | [X-lab](https://blog.frankzhao.cn/github_activity_with_wpr/) | [developer_network.json](https://oss.x-lab.info/open_digger/github/frank-zsy/developer_network.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/cron/tasks/network_export.ts#L63) | [Demo](https://codepen.io/frank-zsy/pen/NWBVjpV?type=developer_network) |
| Network | Repo network | [X-lab](https://blog.frankzhao.cn/github_activity_with_wpr/) | [repo_network.json](https://oss.x-lab.info/open_digger/github/frank-zsy/repo_network.json) | [Link](https://github.com/X-lab2017/open-digger/blob/master/src/cron/tasks/network_export.ts#L63) | [Demo](https://codepen.io/frank-zsy/pen/NWBVjpV?type=repo_network) |

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
