# 工作流

该项目使用 [Hypertrons](https://www.github.com/hypertrons/hypertrons) 作为工作流引擎，使用了部分 Hypertrons 自带组件和部分项目定制组件用于项目流程管理，可通过 [`.github/hypertrons.json`](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json) 配置文件查看当前项目启用的所有组件，其中项目定制组件存放在 [`.github/hypretrons-components`](https://github.com/X-lab2017/open-digger/tree/master/.github/hypertrons-components) 文件夹中。

该项目的自动化流程由 `open-digger-bot`（后称机器人）代为管理执行，该文档会通过介绍该项目使用的流程组件说明本项目的工作流程。

## 社区治理相关

### role

[Role](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L82) 组件定义社区中的角色信息，并配置不同角色的命令权限。在该社区中，特殊角色分为 committer、replier、sql-reviewer 三种，每种角色同时配置了其有权限执行的命令，关于这些命令的详细说明，会在各自对应的逻辑组件中说明。

### label_setup

[Lable setup](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L2) 组件用于管理项目中的 label，可以通过修改配置自动添加 label，包含描述与颜色信息（删除 label 需在页面上删除，以避免错误配置误删）。除该项目定制的 label 外，该组件继承了 Hypertrons 该组件[默认配置](https://github.com/hypertrons/hypertrons/blob/master/app/component/label_setup/defaultConfig.ts#L21) 中的所有 Label。

### weekly_report

[Weekly report](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L78) 组件用于每周发送项目数字周报，该项目定义的数字周报发送时间为每周一 12:00 UTC+8。

### auto_update_contribution（本项目特有）

[Auto update contribution]() 组件会每日 22 时统计本项目中所有参与开发者活跃度，并创建分支、提交 PR 以更新 [CONTRIBUTORS](https://github.com/X-lab2017/open-digger/blob/master/CONTRIBUTORS) 文件。该文件包含所有社区角色及 contributor（所有对项目有 commit 的开发者）、participant（参与项目讨论的开发者）、follower（star 或 fork 该项目的开发者）等角色，若某账号在较靠前的角色中出现，则之后的角色中不再统计。

角色顺序为 committer、sql-reviwer、replier、contributor、participant、follower，每个角色内部通过活跃度排序，并将活跃度附在账号之后，活跃度具体计算规则请参考 [GitHub 2019 数字年报](https://github.com/X-lab2017/github-analysis-report-2019)。

## Issue 流程相关

### difficulty

[Difficulty](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L133) 组件使 `committer` 可以通过 `/difficulty n` 命令对 issue 或 PR 打上 `difficulty/n` 的 label 以标识该 issue 或 PR 的解决难度，目前 n 所支持的数字即 Label 配置中的 1、2、3、5、8，为斐波那契（Fibonacci）数列。

### auto_label

[Auto label](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L139) 组件使机器人可以自动为 issue 或 PR 加注 label，目前的规则为大小写不敏感关键字匹配，具体配置为 `label_setup` 组件中 label 所对应的 `keywords` 字段，支持多个关键字匹配。

### issue_remainder

[Issue remainder](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L136) 组件用于提醒 `replier` 角色对尚未回复的社区 issue 及时进行回复。目前的设定为非 `replier` 创建的 issue 如果在 24 小时内没有回复，则机器人会 @ 所有 `replier` 角色以提醒回复该 issue。

### self_assign
[Self assign](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L142) 组件使任何开发者可以自助认领任务，任意开发者可以通过在 issue 中评论 `/self-assign` 来认领任务，则机器人会将该 issue 指派给该开发者。

## PR 流程相关

### approve

[Approve](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L126) 组件使 committer 可以通过 `/approve` 命令为 PR 打上 `pull/approved` label，用于后续机器人自动合入。

### auto_merge

[Auto merge](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L129) 组件会定时查询当前尚未合入且带有 `pull/approved` label 的 PR，并自动合入。检查的时间间隔目前为 5 分钟。

### pr_uml_renderer

[PR UML renderer]() 组件用于渲染 PR 中的 UML 文件，UML 为本项目所有图表类绘制的标准格式，通过 UML 绘制的图表支持代码化协作，并支持通过 Hypertrons 提供渲染能力，可直接渲染为图片。当 PR 提交中包含 UML 文件时，对于 reviewer 会较为困难，故该组件会在 PR 提交和更新时查询 PR 中包含的 UML 文件，并将其图片地址评论到 PR 中，以便作者和 reviewer 进行查看和校验。
