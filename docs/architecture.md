# Architecture

This project consists of several independent components, the architecture of the system is as follows:

![architect-img](http://gar2020.opensource-service.cn/umlrenderer/github/X-lab2017/github-analysis-report-2020?path=docs/diagrams/architect.uml)

Developers only collaborate in this project on GitHub platform, the technical details of the backend are hidden from developers. The backend consists of several services includes:

## Analysis-report-bot

This account is a robot account which is a GitHub App, the backend is powered by [Hypertrons](https://www.github.com/hypertrons/hypertrons), the robot will load configs from [`.github/hypertrons.json`](https://github.com/X-lab2017/github-analysis-report-2020/blob/master/.github/hypertrons.json) and load custom workflows for this project from [`.github/hypretrons-components`](https://github.com/X-lab2017/github-analysis-report-2020/tree/master/.github/hypertrons-components).

Refer to [workflow](./workflow.md) docs to learn more about the workflow of this project.

## Data service

Data service is a set of data continuous integration and query services hosted by X-lab which includes:

- Collecting GitHub logs from [GHArchive](https://www.gharchive.org/) every day and import into database for later use.
- Provide data query interface with internal query queue to ensure that the database will not be overloaded.

## Database

The database for GitHub logs is a [Clickhouse](https://clickhouse.tech/) cluster hosted by X-lab. Currently, the cluster contains more than 2.5 billion records of GitHub logs from 2015.01.01 till now and supports full access to all logs and real time calculation. For this project, only data during 2020 is used for analysis.

Refer [data description](./data.md) doc to learn more about schema of the database.
