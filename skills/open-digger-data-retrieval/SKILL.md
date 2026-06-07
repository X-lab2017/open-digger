---
name: open-digger-data-retrieval
description: Retrieve OpenDigger open-source metric data via public URLs. Use this skill when the user wants to query open-source metrics for a repository, developer, or project (e.g. OpenRank, activity, attention, stars, contributors, PR/issue stats, collaboration networks, or project/repo leaderboards). It explains the public OSS endpoints, URL patterns, supported platforms, the full metric catalog, and the JSON data formats so you can fetch and interpret the data directly without authentication.
---

# OpenDigger 静态指标数据获取

OpenDigger 将各类开源指标数据预先计算并导出为静态 JSON/CSV 文件，托管在公开 OSS 上。任何人都可以通过固定 URL 直接获取，无需鉴权。

## 1. 两个域名及 CORS 区别

| 域名 | 用途 | CORS |
|---|---|---|
| `https://oss.open-digger.cn/` | 指标数据（仓库/用户级别） | **完全开放**，任何网站都可直接调用 |
| `https://self-oss.open-digger.cn/` | 排行榜数据（leaderboardNext） | **有限制**，仅供 OpenDigger 网站和 OpenShare 网站使用 |

> 在浏览器前端调用排行榜数据时，若非上述白名单站点会被 CORS 拦截；需通过服务端代理获取。指标数据则无此限制。

## 2. 仓库指标数据

**URL 模式**:

```
https://oss.open-digger.cn/{platform}/{owner}/{repo}/{metric}.json
```

**支持的平台路径**: `github`、`gitee`、`gitlab`、`atomgit`

**示例**:

```
https://oss.open-digger.cn/github/X-lab2017/open-digger/openrank.json
```

### 完整指标清单

| 指标文件名 | 含义 | 数据类型 |
|---|---|---|
| openrank.json | OpenRank 指数（全局网络影响力排名） | 数值 |
| activity.json | 仓库活跃度 | 数值 |
| attention.json | 仓库关注度 | 数值 |
| technical_fork.json | 技术性 Fork 数量 | 数值 |
| stars.json | Star 数量 | 数值 |
| issues_new.json | 新建 Issue 数量 | 数值 |
| issues_closed.json | 关闭 Issue 数量 | 数值 |
| issue_comments.json | Issue 评论数量 | 数值 |
| issue_response_time.json | Issue 首次响应时间 | 数值 |
| issue_resolution_duration.json | Issue 解决时长 | 数值 |
| issue_age.json | Issue 存活时长 | 数值 |
| code_change_lines_add.json | 代码新增行数 | 数值 |
| code_change_lines_remove.json | 代码删除行数 | 数值 |
| code_change_lines_sum.json | 代码总变更行数 | 数值 |
| change_requests.json | 新开 Pull Request 数 | 数值 |
| change_requests_accepted.json | 已合并 Pull Request 数 | 数值 |
| change_requests_reviews.json | Pull Request Review 数量 | 数值 |
| change_request_response_time.json | PR 首次响应时间 | 数值 |
| change_request_resolution_duration.json | PR 解决时长 | 数值 |
| change_request_age.json | PR 存活时长 | 数值 |
| participants.json | 参与者人数（见下方定义说明） | 数值 |
| contributors.json | 贡献者总数（见下方定义说明） | 数值 |
| new_contributors.json | 新贡献者数（首次贡献在该时段内） | 数值 |
| inactive_contributors.json | 不活跃贡献者数（曾贡献但近期无活动） | 数值 |
| bus_factor.json | 巴士因子 | 数值 |
| active_dates_and_times.json | 活跃时间分布 | 数值 |
| contributor_email_suffixes.json | 贡献者邮箱域名分布 | 数值 |
| activity_details.json | 按贡献者分解的活跃度详情 | 数组 |
| contributors_detail.json | 贡献者详情列表 | 数组 |
| new_contributors_detail.json | 新贡献者详情列表 | 数组 |
| bus_factor_detail.json | 巴士因子贡献者详情 | 数组 |

### 贡献者（Contributors）、参与者（Participants）与活跃开发者定义

这几个指标在 OpenDigger 中有明确区分（范围从小到大）：

- **贡献者（Contributors）**: 在统计周期内，**有 PR 被合并**的去重作者数。条件最严格——只统计代码被实际接受（merged）的 PR 作者。

- **参与者（Participants）**: 在统计周期内，对仓库的 Issue 或 PR 有过**任何互动**的去重用户数。包含以下事件类型的所有参与人：
  - `IssuesEvent` — 创建/关闭/重开 Issue
  - `IssueCommentEvent` — Issue 评论
  - `PullRequestEvent` — 创建/关闭/重开 PR
  - `PullRequestReviewCommentEvent` — PR Review 评论

- **活跃开发者（Active Developers）**: 在统计周期内，在仓库事件日志中出现过的去重用户数。**不限定事件类型**，只要在 events 表中有记录即算（包含 Star、Fork、Push 等所有事件）。范围最广。

- **新贡献者（New Contributors）**: 统计周期内首次有 PR 被合并的用户（历史上从未有过合并 PR）。

- **不活跃贡献者（Inactive Contributors）**: 曾经有 PR 被合并，但在近 6 个月内无新的合并 PR 的用户。

> 范围关系：Active Developers ⊇ Participants ⊇ Contributors。活跃开发者统计所有事件参与人，参与者仅统计 Issue/PR 相关互动，贡献者仅统计代码被合并的人。

## 3. 用户指标数据

**URL 模式**:

```
https://oss.open-digger.cn/{platform}/{username}/{metric}.json
```

**可用指标**: `openrank.json`、`activity.json`、`open_issue.json`、`issue_comment.json`, `open_pull.json`、`merged_pull.json`、`review_comment.json`

**示例**:

```
https://oss.open-digger.cn/github/frank-zsy/openrank.json
```

## 4. JSON 数据格式

### 数值型指标（时间序列）

```json
{
  "2020": 37.82,
  "2021": 54.97,
  "2020-08": 6.78,
  "2020Q3": 12.8,
  "2021-10-raw": 1.27
}
```

键格式说明:

- `YYYY` — 年度值，如 `2020`
- `YYYY-MM` — 月度值，如 `2020-08`
- `YYYYQN` — 季度值，如 `2020Q3`
- `YYYY-MM-raw` — 未插值的原始值，如 `2021-10-raw`

### 数组型指标（detail 类）

每个时间键对应一个二维数组，元素一般为 `[名称, 数值]`:

```json
{
  "2022-08": [
    ["contributor1", 15],
    ["contributor2", 12]
  ]
}
```

## 5. 排行榜数据（leaderboardNext）

**Base URL**: `https://self-oss.open-digger.cn/open_leaderboard_next/`

**路径模式**:

```
{scope}/{groupType}/{timeType}/{timeKey}/data.json
```

| 维度 | 可选值 |
|---|---|
| Scope | global, agentic_ai, database, big_data, cloud_native, development_tools, operating_system, web_frameworks, china_division |
| Group Type | project, repo, initiator, foundation |
| Time Type / Key | `year`/`YYYY` 或 `month`/`YYYYMM` |

**示例**:

```
https://self-oss.open-digger.cn/open_leaderboard_next/global/project/month/202501/data.json
```

**数据格式**:

```json
{
  "data": [
    {
      "rank": 1,
      "rankDelta": 0,
      "id": "label_id",
      "platform": "GitHub",
      "avatar": "https://oss.open-digger.cn/logos/...",
      "name": "Project Name",
      "name_zh": "项目中文名",
      "description": "...",
      "description_zh": "...",
      "openrank": 123.45,
      "openrankDelta": 5.2,
      "participants": 456,
      "participantsDelta": 10
    }
  ]
}
```

**meta.json**: 排行榜根目录下有一个 `meta.json` 文件，包含所有可用的 scope、groupType 和 timeType 结构，可用于动态发现可访问的排行榜组合:

```
https://self-oss.open-digger.cn/open_leaderboard_next/meta.json
```

## 6. 辅助文件

| URL | 内容 |
|---|---|
| `https://oss.open-digger.cn/repo_list.csv` | 所有已导出仓库列表（id, platform, repo_name） |
| `https://oss.open-digger.cn/user_list.csv` | 所有已导出用户列表（id, platform, actor_login） |

> 在不确定某个仓库/用户是否已导出时，可先查这两个清单。

## 7. meta.json（仓库/用户目录级）

每个仓库或用户目录下可能存在 `meta.json`，例如:

```
https://oss.open-digger.cn/github/X-lab2017/open-digger/meta.json
```

字段含义:

- `updatedAt`: 最后更新时间戳
- `type`: 类型（`repo` / `user`）
- `labels`: 关联的标签列表
- `repos`: 关联的仓库列表
- `contributions`: 按国家/地区的贡献者分布

## 8. 特殊说明

- **2021 年 10 月数据不完整**: GHArchive 服务在 2021-10-02 至 2021-10-16 期间中断，该月数据缺失部分。
- **`-raw` 后缀**: 表示原始未插值数据。
- **无后缀的月份值**（如 `2021-10`）: 对于缺失月份，是通过前后月份插值估算的数据。
- **更新频率**: 数据每月 5 号自动更新。

## 9. 使用流程建议

1. 确认目标对象类型：仓库、用户，还是排行榜。
2. 拼接对应 URL（注意平台路径与指标文件名）。
3. 获取 JSON 后，按数据类型（数值 / 数组 / 网络）解析。
4. 时间序列指标优先使用月度键 `YYYY-MM` 做趋势分析，年度键 `YYYY` 做总览。
5. 涉及排行榜时记得 CORS 限制，必要时走服务端代理。
6. 拿不准对象是否存在时，先查 `repo_list.csv` / `user_list.csv`。
