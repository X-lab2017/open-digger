# GitHub 标签项目 Issue/PR 时间段补充任务

## 目标

`updateGithubRepoIssuePullData` 不再持续同步仓库，也不枚举标签组织。它把已有的全域
`events` 日志作为仓库活跃度索引，只对配置时间段内活跃、且被 `flatten_labels` 覆盖的 GitHub
仓库，通过 GitHub REST API 重新枚举 Issue/PR 并补充相关日志。

补充范围包括：

- Issue 与 Pull Request 的 opened、closed；
- Issue/PR comment；
- PR review 与 review comment。

不处理 Star、Commit、PushEvent。Issue/PR 编号由 GitHub API 枚举，不要求它预先存在于全域日志。

## 时间段语义

`timeRanges` 可以配置多段时间，统一使用左闭右开区间 `[start, end)`。输入会转换为 UTC，
并自动合并重叠或首尾相接的区间。候选查询与 API 事件写入都使用相同的时间边界。

```ts
timeRanges: [
  { start: '2025-01-01T00:00:00Z', end: '2025-02-01T00:00:00Z' },
  { start: '2025-06-01T00:00:00Z', end: '2025-07-01T00:00:00Z' },
]
```

当 `timeRanges` 为空时，任务只输出一次停用提示，不查询候选，也不调用 GitHub API。
修改时间段会生成新的 scope，并清空新状态目录中的旧候选进度，从头处理新范围。

每组规范化后的时间段是一次性补充 scope：完成后，后续 cron 唤醒会直接退出，不会反复消耗
API 配额。应先确认对应全域日志已经稳定落库再启动；若必须对完全相同的时间段重新执行，可在
停掉任务后换一个 `stateDir`（或清理该任务自己的新状态目录）。

## 候选发现

任务首先从 `events` 读取不同的 `repo_id`：

- `platform = 'GitHub'`；
- `created_at` 位于任一配置时间段；
- 仓库 ID 有 Repo 标签，或事件的组织 ID 有 Org 标签；

候选按 `repo_id` 排序并使用持久游标分页。查询中的 `events` 列全部带表名前缀，
聚合结果使用不同别名，避免 ClickHouse 把 `argMax` 别名错误解析进 `WHERE`。

仓库活跃度查询不限定 `from_api`。`events` 使用 `ReplacingMergeTree(from_api)`，补充版本可能已经
替换原始版本；只查 `from_api = 0` 反而会漏掉有效仓库。仓库 scope 使用单向数值 ID 游标且只执行
一次，读取 API 版本不会造成循环发现。

已有全域日志只负责说明“哪个标签仓库在时间段内活跃”，不提供 Issue/PR 候选编号。因此只要
仓库在全域日志中有任意事件，即使某个 Issue/PR 的日志和编号完全缺失，也可以由 API 重新发现。
如果某仓库在目标时间段的所有全域事件都完全缺失，则系统没有依据判断它当时活跃；这是基于
“全域日志稳定”这一前提保留的边界。

对每个候选仓库，任务调用：

```text
GET /repos/{owner}/{repo}/issues
  ?state=all
  &sort=updated
  &direction=asc
  &since={所有时间段中最早的 start}
```

该接口同时返回 Issue 和 PR。任务会把每页得到的稳定 ID、number、类型以及 GitHub `Link` 响应的
下一页游标先追加到文件状态，完成整个仓库的枚举后再逐项获取 comments、用于 closed 事件的
timeline、review comments 和 reviews。任务始终沿用 GitHub 返回的 `rel="next"` URL，不自行递增
offset `page`，因此大型仓库超过 99 页后也可以继续，并且能从持久化游标恢复。
API 列表不能把 `end` 当成停止条件：某个对象可能在目标时间段内有活动，之后又被更新，其当前
`updated_at` 会晚于区间结束时间。因此必须枚举从最早 `start` 到当前仍满足 `updated_at >= start`
的全部对象，最后再按照每条事件自身的 `created_at` 精确过滤到多段 `[start, end)` 中。

## 运行与恢复

- cron 每 5 分钟启动一次，单次软上限默认 290 秒；
- `singleInstance` 开启，同一进程不会重叠执行；
- 单线程调度、多 Token 异步并发；
- 全局并发由 `maxConcurrency` 限制，每个 GitHub 主体的并发由
  `maxConcurrencyPerPrincipal` 限制；
- 每轮重新读取 Token 文件；
- 只读取该任务的 `tokens` 和 `tokenFile`，不继承全局 `github.tokens`；
- 每个仓库的 Issue/PR 列表页先持久化并按稳定 ID 去重；
- 每个 API 子资源页成功写入后立即记录 item/stage/page checkpoint；
- 404/410/451 的仓库或 Issue/PR 会记为跳过，不再重试；
- 网络或服务错误指数退避；primary/secondary rate limit 沿用 Token 池统一处理。

默认新状态目录为 `local_files/github_issue_pull_window_sync`，与此前任何任务状态隔离：

```text
state.snapshot.json
state.journal.jsonl
runner.lock
```

状态采用 snapshot + append-only journal。处理语义是 at-least-once：写入 ClickHouse 后、写入
checkpoint 前崩溃，恢复时可能重做最后一页，但不会跳页。任务不会为 `events` 新增 `event_key`；
查询端继续使用各事件类型的自然字段去重。

所有 API 补充记录都带 `from_api = 1`。

## 配置

```ts
task: {
  configs: {
    updateGithubRepoIssuePullData: {
      tokenFile: 'local_files/github_issue_pull_sync/github-tokens.json',
      stateDir: 'local_files/github_issue_pull_window_sync',
      maxConcurrency: 16,
      maxConcurrencyPerPrincipal: 2,
      maxRunSeconds: 290,
      timeRanges: [
        { start: '2025-01-01T00:00:00Z', end: '2025-02-01T00:00:00Z' },
        { start: '2025-06-01T00:00:00Z', end: '2025-07-01T00:00:00Z' },
      ],
      candidateBatchSize: 5000,
      candidatePagesPerJob: 10,
      snapshotEvery: 500,
      rateLimitReserve: 100,
    }
  }
}
```

`candidateBatchSize` 控制一次从 ClickHouse 载入本地状态的候选仓库数；
`candidatePagesPerJob` 控制一个 lane 连续处理同一仓库的最大 API 分页工作量，包含 Issue/PR
列表页和对象子资源页，防止超大仓库长期占用 lane。

## 运行与查看状态

```bash
npm run build
node lib/cron/index.js updateGithubRepoIssuePullData
npm run github-sync-status
```

状态脚本展示配置时间段、scope、仓库扫描游标、累计仓库与 Issue/PR 的发现/处理/跳过数量、
当前对象的 stage 分布、Token 主体与限额，以及当前错误。也支持：

```bash
npm run github-sync-status -- --json
npm run github-sync-status -- --state-dir /path/to/state
```
