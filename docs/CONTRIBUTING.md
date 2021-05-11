# Contributing Guide
We would love for you to contribute to `OpenDigger` and help make it even better than it is today! As a contributor, here are the guidelines we would like you to follow:

- [Submitting an Issue](#issue)
- [Submitting a Pull Request](#pr)

## <a name="issue"></a> Submitting an issue

If you have any questions or feature requests, please feel free to [submit an issue][new-issue].

Before you submit an issue, consider the following guidelines:

- Please search for related issues. Make sure you are not going to open a duplicate issue.
- Please specify what kind of issue it is and explain it in the title or content, e.g. `feature`, `bug`, `documentation`, `discussion`, `help wanted`... The issue will be tagged automatically by the robot of the project(`open-digger-bot`).

## <a name="pr"></a> Submitting a Pull Request

Before you submit your Pull Request, consider the following guidelines.

### 1. Claim an issue

Be sure that an issue describes the problem you're fixing, or documents the design for the feature you'd like to add.

If you decide to fix an issue, please be sure to check the comment thread in case somebody is already working on a fix. If nobody is working on it at the moment, please leave a comment with `/self-assign` stating that you intend to work on it so other people don't accidentally duplicate your effort. `open-digger-bot` will set assignees of the issue to yourself automatically. Check [self_assign](https://www.x-lab.info/open-digger#/workflow?id=self_assign) to get more information.

```shell
/self-assign
```

If somebody claims an issue but doesn't follow up for more than two weeks, it's fine to take over it but you should still leave a comment.

### 2. Fork and clone the repository

Visit [X-lab2017/open-digger][repo] repo and make your own copy of the repository by **forking** it.

Then **clone** your own copy of the repository to local, like :

```shell
# replace the XXX with your own user name
$ git clone git@github.com:xxx/open-digger.git
$ cd open-digger
```

### 3. Create a new branch

Create a new branch for development.

```shell
$ git checkout -b your-branch-name
```

The name of branch should be semantic, avoiding words like `update` or `tmp`. We suggest to use `feature/xxx` if the modification is about to implement a new feature.

### 4. Commit your changes

Now you can create your patch or add `SQL` statement in the new branch, and commit your changes by:

```shell
$ git add .
$ git commit -sm "docs: add workflow doc (#26)"
```

You are encouraged to use [angular commit-message-format][angular-commit-message-format] to write commit message. In this way, we could have a more trackable history and an automatically generated changelog.

### 5. Sync your local repository with the upstream

Keep your local repository updated with upstream repository by:

```shell
$ git remote add upstream git@github.com:X-lab2017/open-digger.git
$ git fetch upstream master
$ git rebase upstream/master
```

If conflicts arise, you need to resolve the conflicts manually, then:

```shell
$ git add my-fix-file
$ git rebase --continue
```

### 6. Push your branch to GitHub

```shell
$ git push -f origin your-branch-name
```

### 7. Create a Pull Request

In GitHub, send a pull request to [`X-lab2017/open-digger`][repo].

The core team is monitoring for pull requests. We will review your pull request and either merge it, request changes to it, or close it with an explanation.

If we suggest changes then:

-   Make the required updates.

-   Commit your changes with `--amend` and force push to your GitHub repository (this will update your Pull Request):

    ```shell
    $ git add .
    $ git commit --amend
    $ git push -f origin branch-name
    ```

That's it! Thank you for your contribution!

You can refer to [workflow](https://www.x-lab.info/open-digger/#/workflow?id=appendix) to see more information about the `PR` workflow with `SQL` files invovled.

### 8. After your pull request is merged

After your pull request is merged, you can safely delete your branch and pull the changes from the upstream repository:

-   Delete the remote branch on GitHub either through the GitHub web UI or your local shell as follows:

    ```shell
    $ git push origin --delete your-branch-name
    ```

-   Check out the master branch:

    ```shell
    $ git checkout master -f
    ```

-   Delete the local branch:

    ```shell
    $ git branch -D your-branch-name
    ```

-   Update your master with the latest upstream version:

    ```shell
    $ git pull --ff upstream master
    ```

[new-issue]: https://github.com/X-lab2017/open-digger/issues/new

[issue-label]: https://github.com/X-lab2017/open-digger/labels

[repo]: https://github.com/X-lab2017/open-digger

[angular-commit-message-format]: https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines
