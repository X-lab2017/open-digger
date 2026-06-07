# events 表完整字段参考

`events` 表是 OpenDigger ClickHouse（数据库 `opensource`）中最核心的表，存储所有平台（GitHub / Gitee / GitLab / AtomGit）的事件日志，是所有指标计算的基础数据源。

- **引擎**: `ReplacingMergeTree(from_api)`（以 `from_api` 作为版本列去重）
- **分区**: `toYYYYMM(created_at)`
- **主键/排序键**: `(platform, org_id, repo_id, actor_id, type, action, toYear(created_at), toYYYYMM(created_at))`

字段按事件类型分组列出。多数字段仅在对应 `type` 的事件行上有有效值，其余事件行该字段为默认空值。

## 基础字段（所有事件都有）

| 字段 | 类型 | 说明 |
|---|---|---|
| platform | LowCardinality(String) | 平台来源（GitHub, Gitee, GitLab, AtomGit） |
| type | Enum | 事件类型（12 种，见下方枚举） |
| action | LowCardinality(String) | 事件动作（opened, closed, created 等） |
| actor_id | UInt64 | 用户 ID |
| actor_login | LowCardinality(String) | 用户登录名 |
| repo_id | UInt64 | 仓库 ID |
| repo_name | LowCardinality(String) | 仓库全名 |
| org_id | UInt64 | 组织 ID（个人仓库为 0） |
| org_login | LowCardinality(String) | 组织名 |
| created_at | DateTime | 事件时间（UTC） |

**type 枚举值（12 种）**：
`CommitCommentEvent`、`ForkEvent`、`ReleaseEvent`、`IssueCommentEvent`、`IssuesEvent`、`PullRequestEvent`、`PullRequestReviewCommentEvent`、`PushEvent`、`WatchEvent`、`PullRequestReviewEvent`、`IssuesReactionEvent`、`IssueCommentsReactionEvent`

## Issue / PR 通用字段

`IssuesEvent`、`PullRequestEvent`、`IssueCommentEvent` 等都会带这组字段（PR 在底层也作为 issue 处理，共用 `issue_*` 字段）。

| 字段 | 类型 | 说明 |
|---|---|---|
| issue_id | UInt64 | Issue/PR 平台 ID |
| issue_number | UInt32 | Issue/PR 仓库内编号 |
| issue_title | String | 标题 |
| body | String | 正文 |
| issue_labels | Nested(name String, color String, default UInt8, description String) | 标签 |
| issue_author_id | UInt64 | 作者 ID |
| issue_author_login | LowCardinality(String) | 作者登录名 |
| issue_author_type | Enum(Bot, Mannequin, Organization, User) | 作者类型 |
| issue_author_association | Enum(COLLABORATOR, CONTRIBUTOR, MEMBER, NONE, OWNER, MANNEQUIN) | 作者与仓库关系 |
| issue_assignee_id | UInt64 | 指派人 ID |
| issue_assignee_login | LowCardinality(String) | 指派人登录名 |
| issue_assignees | Nested(login, id) | 多指派人 |
| issue_created_at | Nullable(DateTime) | 创建时间 |
| issue_updated_at | Nullable(DateTime) | 更新时间 |
| issue_comments | UInt16 | 评论数 |
| issue_closed_at | Nullable(DateTime) | 关闭时间 |
| issue_closed_by_pull_request_numbers | Array(UInt32) | 关闭该 Issue 的 PR 编号 |

## Issue Comment 字段

`IssueCommentEvent` 专有。

| 字段 | 类型 | 说明 |
|---|---|---|
| issue_comment_id | UInt64 | 评论 ID |
| issue_comment_created_at | Nullable(DateTime) | 创建时间 |
| issue_comment_updated_at | Nullable(DateTime) | 更新时间 |
| issue_comment_author_id | UInt64 | 作者 ID |
| issue_comment_author_login | LowCardinality(String) | 作者登录名 |
| issue_comment_author_type | Enum | 作者类型 |
| issue_comment_author_association | Enum | 作者关系 |

## Pull Request 特有字段

`PullRequestEvent` 专有。

| 字段 | 类型 | 说明 |
|---|---|---|
| pull_commits | UInt16 | 提交数 |
| pull_additions | UInt16 | 新增行数 |
| pull_deletions | UInt16 | 删除行数 |
| pull_changed_files | UInt32 | 变更文件数 |
| pull_merged | UInt8 | 是否合并 |
| pull_merge_commit_sha | String | 合并提交 SHA |
| pull_merged_at | Nullable(DateTime) | 合并时间 |
| pull_merged_by_id | UInt64 | 合并人 ID |
| pull_merged_by_login | LowCardinality(String) | 合并人登录名 |
| pull_merged_by_type | Enum | 合并人类型 |
| pull_requested_reviewer_id | UInt64 | 请求审查人 ID |
| pull_requested_reviewer_login | LowCardinality(String) | 请求审查人登录名 |
| pull_requested_reviewer_type | Enum | 请求审查人类型 |
| pull_review_comments | UInt16 | Review 评论数 |
| pull_base_ref | String | 目标分支 |
| pull_head_repo_id | UInt64 | 来源仓库 ID |
| pull_head_repo_name | LowCardinality(String) | 来源仓库名 |
| pull_head_ref | String | 来源分支 |

## PR Review 字段

`PullRequestReviewEvent` 专有。

| 字段 | 类型 | 说明 |
|---|---|---|
| pull_review_state | Enum(approved, commented, dismissed, changes_requested, pending) | 审查状态 |
| pull_review_id | UInt64 | 审查 ID |
| pull_review_author_association | Enum | 审查人关系 |

## PR Review Comment 字段

`PullRequestReviewCommentEvent` 专有。

| 字段 | 类型 | 说明 |
|---|---|---|
| pull_review_comment_id | UInt64 | 审查评论 ID |
| pull_review_comment_path | String | 评论文件路径 |
| pull_review_comment_position | String | 评论位置 |
| pull_review_comment_author_id | UInt64 | 作者 ID |
| pull_review_comment_author_login | LowCardinality(String) | 作者登录名 |
| pull_review_comment_author_type | Enum | 作者类型 |
| pull_review_comment_author_association | Enum | 作者关系 |
| pull_review_comment_created_at | Nullable(DateTime) | 创建时间 |
| pull_review_comment_updated_at | Nullable(DateTime) | 更新时间 |

## Push 事件字段

`PushEvent` 专有。

| 字段 | 类型 | 说明 |
|---|---|---|
| push_id | UInt64 | Push ID |
| push_size | UInt32 | 总提交数 |
| push_distinct_size | UInt32 | 唯一提交数 |
| push_ref | String | 分支名 |
| push_head | String | Head SHA |
| push_commits | Nested(name, email, message) | 提交详情 |

## Fork 事件字段

`ForkEvent` 专有。

| 字段 | 类型 | 说明 |
|---|---|---|
| fork_forkee_id | UInt64 | Fork 仓库 ID |
| fork_forkee_full_name | LowCardinality(String) | Fork 仓库全名 |
| fork_forkee_owner_id | UInt64 | Fork 所有者 ID |
| fork_forkee_owner_login | LowCardinality(String) | Fork 所有者登录名 |
| fork_forkee_owner_type | Enum | Fork 所有者类型 |

## Release 事件字段

`ReleaseEvent` 专有。

| 字段 | 类型 | 说明 |
|---|---|---|
| release_id | UInt64 | Release ID |
| release_tag_name | String | Tag 名称 |
| release_target_commitish | String | 目标 Commit |
| release_name | String | Release 名称 |
| release_draft | UInt8 | 是否草稿 |
| release_prerelease | UInt8 | 是否预发布 |
| release_author_id | UInt64 | 作者 ID |
| release_author_login | LowCardinality(String) | 作者登录名 |
| release_author_type | Enum | 作者类型 |
| release_created_at | Nullable(DateTime) | 创建时间 |
| release_published_at | Nullable(DateTime) | 发布时间 |
| release_body | String | Release 说明 |
| release_assets | Nested(name, uploader_login, uploader_id, content_type, state, size, download_count) | 附件 |

## Commit Comment 字段

`CommitCommentEvent` 专有。

| 字段 | 类型 | 说明 |
|---|---|---|
| commit_comment_id | UInt64 | 评论 ID |
| commit_comment_author_id | UInt64 | 作者 ID |
| commit_comment_author_login | LowCardinality(String) | 作者登录名 |
| commit_comment_author_type | Enum | 作者类型 |
| commit_comment_author_association | Enum | 作者关系 |
| commit_comment_path | String | 文件路径 |
| commit_comment_position | String | 位置 |
| commit_comment_line | String | 行号 |
| commit_comment_sha | String | Commit SHA |
| commit_comment_created_at | Nullable(DateTime) | 创建时间 |
| commit_comment_updated_at | Nullable(DateTime) | 更新时间 |

## 元数据

| 字段 | 类型 | 说明 |
|---|---|---|
| from_api | UInt8 | 来源：0=日志采集，1=API 采集（同时是 ReplacingMergeTree 的版本列） |
