# 项目架构

本项目由多个独立但相关的系统组成，系统的架构图如下：

![architect-img](http://frank-local.opensource-service.com/umlrenderer/github/X-lab2017/github-analysis-report-2020?path=docs/diagrams/architect.uml)

在该年报项目中，开发者仅在 GitHub 平台上产生项目协作行为，而后端的技术细节对开发者是屏蔽的。后端由多个服务应用协同构成本项目的协作体系，这些系统包含：

## Analysis-report-bot

该账号为本项目的协作机器人账号，为一个该项目专用的 GitHub App，其后端由 [Hypertrons](https://www.github.com/hypertrons/hypertrons) 项目提供支持，该机器人会从该项目的 [`.github/hypertrons.json`](https://github.com/X-lab2017/github-analysis-report-2020/blob/master/.github/hypertrons.json) 文件中读取对应的配置信息，并从 [`.github/hypretrons-components`](https://github.com/X-lab2017/github-analysis-report-2020/tree/master/.github/hypertrons-components) 文件夹中加载该项目专用的管理流程组件并执行。

关于本项目的定制管理流程请参考[工作流](./workflow.md)文档。

## 数据服务

数据服务层是 X-lab 实验室私有部署的一套数据持续集成和查询服务。其主要功能包括：

- 每日自动从 [GHArchive](https://www.gharchive.org/) 网站上采集最新的日志数据，并解压和导入到数据库中，以便后续查询使用。
- 提供访问数据的查询接口，内部有查询队列以保证数据库不会查询过载。

## 数据库

GitHub 全域日志的数据库服务是 X-lab 实验室私有部署的 [Clickhouse](https://clickhouse.tech/) 集群，目前该集群中包含了 2015.01.01 至今共计超过 25 亿条日志数据，支持对全域数据的实时查询与计算。该项目目前仅针对 2020 年全域数据进行分析展示工作。

对于该数据库的数据表结构，请参考[数据描述](./data.md)文档。
