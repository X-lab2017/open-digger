# GitHub Analysis Report

We anaylsis 789,273,567 records of GitHub logs, there are 49,228,284 active repositories and 13,629,686 active developers on GitHub during year 2020.

## Top 10 repositories

We calculated the activity of global repositories and the top 10 most active repositories are as follows.

| # | repo_id | repo_name | repo_activity | developer_count | open_issue | issue_comment | open_pull | pull_review_comment | merge_pull |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | 31792824 | flutter/flutter | 32692.78 | 15618 | 13695 | 118085 | 6751 | 17660 | 4641 |
| 2 | 41881900 | microsoft/vscode | 25376.88 | 13091 | 15129 | 93886 | 1680 | 1649 | 1285 |
| 3 | 72685026 | MicrosoftDocs/azure-docs | 22735.17 | 9055 | 11007 | 82244 | 2818 | 817 | 1672 |
| 4 | 12888993 | home-assistant/home-assistant | 20992.67 | 7548 | 4951 | 71719 | 7353 | 29366 | 6313 |
| 5 | 45717250 | tensorflow/tensorflow | 20273.6 | 9051 | 5757 | 59278 | 2697 | 7604 | 1978 |
| 6 | 20580498 | kubernetes/kubernetes | 18892.31 | 5768 | 3452 | 227337 | 6414 | 30028 | 4555 |
| 7 | 4542716 | NixOS/nixpkgs | 17112.62 | 2833 | 3976 | 74038 | 17875 | 26661 | 14623 |
| 8 | 65600975 | pytorch/pytorch | 13468.52 | 4456 | 4496 | 63130 | 10841 | 35562 | 325 |
| 9 | 210716005 | dotnet/runtime | 13212.28 | 3453 | 6477 | 76239 | 7005 | 38963 | 6069 |
| 10 | 6093316 | DefinitelyTyped/DefinitelyTyped | 12154.01 | 3747 | 501 | 48931 | 5981 | 6014 | 4975 |


## Top 20 active developers

We calculated the activity of global developers on GitHub and the top 20 most active developers are as follows.

| # | actor_login | activity | participant repo count | open issue | issue comment | open pull | pull review comment | pull merged |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | dependabot[bot] | 27160455 | 1218843 | 0 | 2821981 | 7138908 | 0 | 584350 |
| 2 | dependabot-preview[bot] | 18408223 | 54538 | 25875 | 1918491 | 3237974 | 0 | 1344812 |
| 3 | renovate[bot] | 4108228 | 10276 | 1119 | 53874 | 569577 | 0 | 468677 |
| 4 | github-learning-lab[bot] | 3395541 | 412790 | 607998 | 1406218 | 78170 | 47483 | 69777 |
| 5 | codecov[bot] | 775834 | 21892 | 0 | 775834 | 0 | 0 | 0 |
| 6 | github-actions[bot] | 750021 | 22369 | 26977 | 520066 | 22569 | 8881 | 14554 |
| 7 | pyup-bot | 746722 | 2542 | 238 | 121480 | 166792 | 0 | 24878 |
| 8 | bot-monkey-1 | 695140 | 3 | 67969 | 82154 | 82298 | 6236 | 41042 |
| 9 | sonarcloud[bot] | 671219 | 11283 | 0 | 671219 | 0 | 0 | 0 |
| 10 | greenkeeper[bot] | 628210 | 10493 | 11677 | 349854 | 49439 | 0 | 21337 |
| 11 | openshift-ci-robot | 581302 | 519 | 0 | 580790 | 0 | 128 | 0 |
| 12 | codeclimate[bot] | 418279 | 2156 | 0 | 248611 | 0 | 42417 | 0 |
| 13 | now[bot] | 380832 | 42175 | 0 | 380832 | 0 | 0 | 0 |
| 14 | k8s-ci-robot | 295409 | 252 | 0 | 293443 | 206 | 82 | 204 |
| 15 | stale[bot] | 294628 | 4545 | 0 | 294628 | 0 | 0 | 0 |
| 16 | liferay-continuous-integration | 279593 | 227 | 0 | 253010 | 8861 | 0 | 0 |
| 17 | depfu[bot] | 275823 | 1970 | 108 | 35077 | 51670 | 0 | 17104 |
| 18 | cjxd-bot-test | 262384 | 12780 | 190 | 39474 | 32030 | 0 | 25288 |
| 19 | coveralls | 205107 | 11352 | 0 | 205107 | 0 | 0 | 0 |
| 20 | openshift-bot | 195260 | 335 | 0 | 176171 | 2483 | 0 | 2328 |


## GitHub Word Cloud

We select topics of top 10w active repositories, filtered the topics with a frequency of more than 25. Then a word cloud map is generated based on the data. The word cloud visually highlights the topics that appear frequently, so that we can quickly get the more popular topics.

[wordcloud](/word-cloud.html ':include')

## Working Hour Distribution

We analyze the working hour distribution for GitHub logs all over the world during year 2020, we found that open source developers are predominantly European because local working hour period lays in UTC±1 as the image shows.

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[2,2,3,3,3,4,5,6,8,7,7,7,8,10,10,10,10,9,8,8,7,6,5,4,3,4,4,3,3,4,5,6,7,8,7,6,8,9,10,10,9,9,8,8,7,7,5,4,4,4,4,4,3,3,5,6,7,7,7,6,7,9,10,9,9,8,8,7,7,6,5,4,3,3,4,4,3,3,5,6,8,8,7,7,8,9,10,10,10,9,9,8,7,6,5,4,3,4,4,4,3,3,5,6,7,7,7,6,7,8,9,9,9,8,7,7,6,6,4,3,3,2,2,1,1,1,2,2,2,2,2,2,3,4,5,5,5,4,4,3,3,2,1,1,1,1,1,1,1,1,1,1,2,2,3,3,4,4,5,5,5,5,4,4,3,3,2,1]&lang=en" style="width:600" />
