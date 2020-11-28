# GitHub Analysis Report

We anaylsis 788,383,677 records of GitHub logs, there are 49,152,453 active repositories and 13,614,441 active developers on GitHub during year 2020.

## Top 10 repositories

We calculated the activity of global repositories and the top 10 most active repositories are as follows.

| # | repo_id | repo_name | repo_activity | developer_count | open_issue | issue_comment | open_pull | pull_review_comment | merge_pull |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | 31792824 | flutter/flutter | 32669.22 | 15604 | 13688 | 118014 | 6748 | 17657 | 4641 |
| 2 | 41881900 | microsoft/vscode | 25365.79 | 13083 | 15127 | 93853 | 1680 | 1649 | 1284 |
| 3 | 72685026 | MicrosoftDocs/azure-docs | 22723.35 | 9050 | 11000 | 82189 | 2812 | 816 | 1668 |
| 4 | 12888993 | home-assistant/core | 20978.53 | 7538 | 4949 | 71673 | 7349 | 29360 | 6312 |
| 5 | 45717250 | tensorflow/tensorflow | 20260.2 | 9044 | 5751 | 59234 | 2695 | 7602 | 1978 |
| 6 | 20580498 | kubernetes/kubernetes | 18879.62 | 5763 | 3447 | 227214 | 6413 | 30014 | 4553 |
| 7 | 4542716 | NixOS/nixpkgs | 17093.23 | 2832 | 3973 | 73874 | 17850 | 26549 | 14591 |
| 8 | 65600975 | pytorch/pytorch | 13459.96 | 4451 | 4494 | 63096 | 10837 | 35546 | 325 |
| 9 | 210716005 | dotnet/runtime | 13203.9 | 3450 | 6470 | 76162 | 7003 | 38937 | 6064 |
| 10 | 6093316 | DefinitelyTyped/DefinitelyTyped | 12149.2 | 3743 | 501 | 48914 | 5979 | 6014 | 4975 |


## Top 20 active developers

We calculated the activity of global developers on GitHub and the top 20 most active developers are as follows.

| # | actor_login | activity | participant repo count | open issue | issue comment | open pull | pull review comment | pull merged |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | dependabot[bot] | 27147556 | 1218673 | 0 | 2820280 | 7136382 | 0 | 583626 |
| 2 | dependabot-preview[bot] | 18392273 | 54520 | 25848 | 1916456 | 3235007 | 0 | 1343820 |
| 3 | renovate[bot] | 4103019 | 10263 | 1117 | 53818 | 568489 | 0 | 468300 |
| 4 | github-learning-lab[bot] | 3390976 | 412033 | 607138 | 1404339 | 78075 | 47429 | 69684 |
| 5 | codecov[bot] | 775080 | 21868 | 0 | 775080 | 0 | 0 | 0 |
| 6 | github-actions[bot] | 748436 | 22332 | 26946 | 518760 | 22541 | 8874 | 14533 |
| 7 | pyup-bot | 746033 | 2541 | 238 | 121345 | 166624 | 0 | 24868 |
| 8 | bot-monkey-1 | 693289 | 3 | 67771 | 81939 | 82082 | 6218 | 40938 |
| 9 | sonarcloud[bot] | 670261 | 11269 | 0 | 670261 | 0 | 0 | 0 |
| 10 | greenkeeper[bot] | 628205 | 10493 | 11677 | 349854 | 49439 | 0 | 21336 |
| 11 | openshift-ci-robot | 581145 | 518 | 0 | 580633 | 0 | 128 | 0 |
| 12 | codeclimate[bot] | 417538 | 2154 | 0 | 248010 | 0 | 42382 | 0 |
| 13 | now[bot] | 380308 | 42131 | 0 | 380308 | 0 | 0 | 0 |
| 14 | k8s-ci-robot | 295249 | 252 | 0 | 293283 | 206 | 82 | 204 |
| 15 | stale[bot] | 293952 | 4542 | 0 | 293952 | 0 | 0 | 0 |
| 16 | liferay-continuous-integration | 279383 | 227 | 0 | 252827 | 8852 | 0 | 0 |
| 17 | depfu[bot] | 275175 | 1968 | 108 | 35025 | 51568 | 0 | 17046 |
| 18 | cjxd-bot-test | 262384 | 12780 | 190 | 39474 | 32030 | 0 | 25288 |
| 19 | coveralls | 204924 | 11345 | 0 | 204924 | 0 | 0 | 0 |
| 20 | openshift-bot | 194937 | 335 | 0 | 175864 | 2481 | 0 | 2326 |


## GitHub Word Cloud

We select topics of top 10w active repositories, filtered the topics with a frequency of more than 25. Then a word cloud map is generated based on the data. The word cloud visually highlights the topics that appear frequently, so that we can quickly get the more popular topics.

[wordcloud](/word-cloud.html ':include')

## Working Hour Distribution

We analyze the working hour distribution for GitHub logs all over the world during year 2020, we found that open source developers are predominantly European because local working hour period lays in UTC±1 as the image shows.

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[2,2,3,3,3,4,5,6,8,7,7,7,8,10,10,10,10,9,8,8,7,6,5,4,3,4,4,3,3,3,5,6,7,8,7,6,8,9,10,10,9,9,8,8,7,7,5,4,4,4,4,4,3,3,5,6,7,7,7,6,7,9,10,9,9,8,8,7,7,6,5,4,3,3,4,3,3,3,5,6,8,8,7,7,8,9,10,10,10,9,9,8,7,6,5,4,3,3,4,4,3,3,5,6,7,7,7,6,7,8,9,9,9,8,7,6,6,6,4,3,2,2,2,1,1,1,1,2,2,2,2,2,3,4,5,5,4,4,4,3,3,2,1,1,1,1,1,1,1,1,1,1,2,2,3,3,4,4,5,5,5,5,4,4,3,3,2,1]&lang=en" style="width:600" />
