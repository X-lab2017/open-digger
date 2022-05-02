# OpenDigger

[![apache2](https://img.shields.io/badge/license-Apache%202-blue)](LICENSE)

OpenDigger is an open source analysis report project for all open source data initiated by [X-lab](https://x-lab.info), this project aims to combine the wisdom of global developers to jointly analyze and insight into open source related data to help everyone better understand and participate in open source.

## Usage

OpenDigger can be used as an online analysis tool or cron task scripts, and is used to generate lots of data for open source reports and tools like:

- [OpenLeaderboard](https://open-leaderboard.x-lab.info/)([task](/src/cron/tasks/open_leaderboard.ts)): A leaderboard of GitHub world with labeled data.
- [Hypercrx](https://github.com/hypertrons/hypertrons-crx)([task](/src/cron//tasks/hypercrx_repo.ts)): A browser plugin helps to look into GitHub users and repos.
- [Hacking Force China](https://opensource.win/)([task](/src/cron/tasks/hacking_force_annual.ts),[notebook](/notebook/hacking_force.ipynb)): A ranking list of Chinese developers on GitHub.
- [China Open Source Report 2021](https://kaiyuanshe.cn/document/china-os-report-2021/)([notebook](/notebook/China_open_source_report_2021.ipynb)): Most comprehensive open source report in China by [kaiyuanshe](https://kaiyuanshe.cn/).
- [China Open Source Blue Paper 2022](http://www.copu.org.cn/new/308)([notebook](/notebook/China_open_source_blue_paper_2022.ipynb)): A blue paper of Chinese open source development by [COPU](http://www.copu.org.cn/).
- Supply China Report 2021([notebook](/notebook/supply_chain_report_2021.ipynb)): A brief case study of supply chain in Node.js (WIP).

## Data

### GitHub Event Log

We use [GHArchive](https://www.gharchive.org/) as our data source for GitHub event logs and the data service is provided by [clickhouse](https://clickhouse.tech/) cluster cloud service. For data details, please check the [data](https://github.com/X-lab2017/open-digger/blob/master/docs/DATA.md) docs.

## Communication

Welcome to join the WeChat group by scanning the QRCode and I will invite you into our WeChat group.

<div align=center>
<img src='./docs/assets/wechat-qrcode.png' width="250px">
</div>

<img src='./docs/assets/wechat-qrcode.png' width=300 />

## License

We use [Apache-2.0 license](LICENSE) for code part, please make sure abide by the licenses when using the project.
