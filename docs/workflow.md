# Workflow

This project uses [Hypertrons](https://www.github.com/hypertrons/hypertrons) for workflow management, it uses several default components of Hypertrons and some customized components to manage the project, read [`.github/hypertrons.json`](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json) to find out all the components enabled for now and the customized components are under folder [`.github/hypretrons-components`](https://github.com/X-lab2017/open-digger/tree/master/.github/hypertrons-components).

The automatic procedure of this project is executed by `open-digger-bot`(bot) and this document will go through the workflow by introducing the components.

## Community governance

### role

Component [role](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L82) is used to define the roles and their authorities in the community. We have `committer`, `replier` in this project and details about their authorities will be introduced in each component.

### label_setup

Component [lable setup](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L2) is used to manage the labels of this project and change the config will add new label to the project along with its description and color(deletion not supported in case false operation, can delete label from GitHub web interface). Besides the customized labels, the component also includes all the [default labels](https://github.com/hypertrons/hypertrons/blob/master/app/component/label_setup/defaultConfig.ts#L21) from Hypertrons.

### weekly_report

Component [weekly report](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L78) is used to send digital report by issue and the time is every Monday 12:00 UTC+8.

### auto_update_contribution(customize component)

Component [auto update contribution]() will give a statistics of all developers in the project and create a pull request with a new branch to update [CONTRIBUTORS](https://github.com/X-lab2017/open-digger/blob/master/CONTRIBUTORS) file. This file contains all the roles in the community and `contributor`(developers with commit), `participant`(developers participate in discussion) and `follower`(developers who star or fork the project), if an account appears in a prior role then it will not included in other roles.

The sequence of the roles is `committer`, `replier`, `contributor`, `participant` and `follower`, we use activity score to sort within a role and the score is appended to the account. For activity calculation, please refer to [GitHub Analysis Report 2019](https://github.com/X-lab2017/github-analysis-report-2019).

## Issues

### auto_label

Component [auto label](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L139) allows the bot to add label to issue or PR automatically, the config details are under `label_setup` component in the `keywords` field of each label which supports multiple keyword to match.

### issue_remainder

Component [issue reminder](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L136) are used to remind `replier` to reply issues. For now, if an issue is not replied in 24 hours and the author is not a `replier`, the bot will @ all accounts in `replier` roles to remind them.

### self_assign

Component [self assign](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L142) allows anyone to clain an issue task. Any developer can use `/self-assign` command to claim the issue and the bot will assign the issue to him or her.

## PRs

### approve

Component [approve](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L126) allows `committer` to use `/approve` command to add `pull/approved` label to PR for later use.

### auto_merge

Component [auto merge](https://github.com/X-lab2017/open-digger/blob/master/.github/hypertrons.json#L129) will check all open PR with `pull/approved` label and merge them automatically, the check interval is 5 minutes for now.
