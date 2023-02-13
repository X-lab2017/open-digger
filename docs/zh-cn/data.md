# Data Description

## GitHub 事件日志

### 数据源

该数据来源于 [GH Archive](https://www.gharchive.org/)，这是一个用于记录和归档 GitHub 事件日志的项目。归档的数据为 GitHub 事件日志的 JSON 格式数据，主要包含 6 个重要的字段： `id`, `type`, `actor`, `repo`, `payload`, `created_at`。

### 数据库

为了满足在大规模数据上的高速查询的需求，我们将 GitHub 日志数据解析为结构化数据并导入了开源的列存储高性能实时分析数据库 [ClickHouse](https://clickhouse.tech/) 中，目前该项目使用的 ClickHouse 服务器版本为 22.8。

### 数据结构

`ClickHouse` 服务器中数据表的结构如[数据描述表](https://github.com/X-lab2017/open-digger/blob/master/docs/assets/data_description.csv)所示。该表中包含了超过 120 行数据列，可以根据该表决定自己想要分析的数据和分析方法。

### 数据库用户指南

ClickHouse SQL 的详细用法，请参阅 [Clickhouse SQL 文档](https://clickhouse.tech/docs/en/)。

### FAQ

- Q：OpenDigger 可以做开源项目更细化的分析吗，例如任务分配、表情、Issue 标签事件等？

- A：目前不行，因为任务分配（assign）、表情（reaction）、Issue 标签（label）等事件不在 GitHub 日志数据中，因此 OpenDigger 中没有这部分数据。但开发者可以通过 GitHub API 来获取等详细的数据来进行分析。

- Q：OpenDigger 开放的指标数据为何不是很准确？

- A：由于 OpenDigger 使用的是 GHArchive 服务与 GitHub 归档日志数据，可能会由于服务稳定性等原因出现部分的数据丢失，所以 OpenDigger 提供的指标数据可以很好的被用于观察项目的指标变化趋势，但不是精确的结果。
