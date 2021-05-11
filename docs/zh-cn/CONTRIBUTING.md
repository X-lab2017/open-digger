# 贡献指南

这篇贡献指南会指导你如何为 `GitHub 全域数字报告` 贡献一份自己的力量，请在要提 `Issue` 或者 `Pull request` 之前花几分钟来阅读一遍这篇指南。

- [提交 Issue](#issue)
- [提交 Pull Request](#pr)

## <a name="issue"></a> 提交 issue

有任何疑问，欢迎[提交 Issue][new-issue]。提交 issue 之前:

- 避免提交重复的 issue，在提交之前搜索现有的 issue。
- 确定 issue 的类型，并在标题或内容中标明。如 `feature`, `bug`, `documentation`, `discussion`, `help wanted`等。机器人 `open-digger-bot` 将会自动为该 `issue` 打上对应的标签。[查看所有标签][issue-label]。

## <a name="pr"></a> 提交 Pull Request

如果你准备提交 Pull Request ，可参考以下流程：

### 1. 认领 issue

在 [Issue 列表](https://github.com/X-lab2017/open-digger/issues) 中挑选任务，然后在该 `issue` 下回复 `/self-assign`，表明你将认领该 issue，项目的机器人 `open-digger-bot` 会自动将该 `issue` 的 `Assignees` 指定为自己。

```shell
/self-assign
```

> 可以在 [Issue 流程相关](https://www.x-lab.info/open-digger/#/zh-cn/workflow?id=issue-%e6%b5%81%e7%a8%8b%e7%9b%b8%e5%85%b3) 中找到更多与 `Issue` 流程相关的信息。

### 2. 克隆仓库

访问 [X-lab2017/open-digger][repo] 仓库的主页，并 `Fork` 到自己的账号下。

回到自己的 `GitHub` 主页，并找到刚刚 `Fork` 过来的仓库，进入仓库主页, 将该仓库 `clone` 到本地，如：

```shell
# 将下面的 XXX 替换成你自己的用户名
$ git clone git@github.com:XXX/open-digger.git
$ cd open-digger
```

### 3. 新建 `branch`

> 非紧急修复，不建议在 `master` 分支进行开发修改。

根据该分支的用途，起一个恰当的分支名称，新建分支，如：

```shell
$ git checkout -b doc/add-contributing-guide
```

### 4. 修改内容，并提交

对相应文件做出修改，修改完成后，提交：

```shell
$ git add .
$ git commit -sm "docs: add contributing guide (#26)"
```

提交时尽量参考 [angular 提交规范][angular-commit-message-format]：

(1) 用一句话清楚的描述这次提交做了什么。

(2) 关联相关 `issue`，如 `fix #1` 、`close #2`、`#3`

### 5. 同步上游仓库变更

同步上游仓库变更，因为可能有其他人先于你提交到上游仓库，防止冲突：

```bash
$ git remote add upstream git@github.com:X-lab2017/open-digger.git
$ git fetch upstream
```

若上游仓库有变更，需要先进行 `rebase`:

```bash
$ git rebase upstream/master
```

如果发生冲突，你需要手动修改冲突文件，然后:

```shell
$ git add my-fix-file
$ git rebase --continue
```

### 6. 推送新分支到自己的远程仓库

```shell
$ git push -f origin your-branch-name:your-branch-name
```

### 7. 提交 `Pull Request`

在自己仓库的页面上提 `Pull Request` 到上游仓库 `X-lab2017/open-digger`。

其他人将会对你的 `Pull Request` 进行`review`， `review` 之后，如果需要再进行更改，就修改相关内容，然后执行以下操作，该 PR 将会自动同步该 `commit` 。

```shell
$ git add .
$ git commit --amend
$ git push -f origin your-branch-name
```

可以参考 [工作流](https://www.x-lab.info/open-digger/#/zh-cn/workflow) 查看更多与 `SQL` 类 Pull Request 的协作流程。

### 8. 代码合并之后，你可以：

- 删除远程分支:

  ```shell
  $ git push origin --delete branch-name
  ```

- 切回到 `master` 分支:

  ```shell
  $ git checkout master -f
  ```

- 删除本地分支(可选):

  ```shell
  $ git branch -D my-fix-branch
  ```

- 保持本地 `master` 分支与上游分支同步:

  ```shell
  $ git pull --ff upstream master
  ```

[new-issue]: https://github.com/X-lab2017/open-digger/issues/new

[issue-label]: https://github.com/X-lab2017/open-digger/labels

[repo]: https://github.com/X-lab2017/open-digger

[angular-commit-message-format]: https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines
