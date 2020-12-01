# GitHub Analysis Report

We anaylsis 798,491,493 records of GitHub logs, there are 49,735,724 active repositories and 13,727,199 active developers on GitHub during year 2020.

## Top 10 repositories

We calculated the activity of global repositories and the top 10 most active repositories are as follows.

| # | repo_id | repo_name | repo_activity | developer_count | open_issue | issue_comment | open_pull | pull_review_comment | merge_pull |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | 31792824 | flutter/flutter | 32967.78 | 15753 | 13825 | 119128 | 6788 | 17702 | 4666 |
| 2 | 41881900 | microsoft/vscode | 25612.11 | 13229 | 15250 | 94607 | 1691 | 1666 | 1296 |
| 3 | 72685026 | MicrosoftDocs/azure-docs | 22867.55 | 9104 | 11090 | 82758 | 2839 | 823 | 1682 |
| 4 | 12888993 | home-assistant/core | 21168.15 | 7613 | 4998 | 72389 | 7413 | 29548 | 6374 |
| 5 | 45717250 | tensorflow/tensorflow | 20423.92 | 9126 | 5804 | 59705 | 2714 | 7630 | 1995 |
| 6 | 20580498 | kubernetes/kubernetes | 18992.75 | 5806 | 3475 | 228722 | 6456 | 30170 | 4575 |
| 7 | 4542716 | NixOS/nixpkgs | 17343.48 | 2859 | 4029 | 75710 | 18132 | 27395 | 14878 |
| 8 | 65600975 | pytorch/pytorch | 13560.9 | 4496 | 4531 | 63530 | 10917 | 35820 | 326 |
| 9 | 210716005 | dotnet/runtime | 13316.99 | 3496 | 6546 | 76989 | 7058 | 39202 | 6104 |
| 10 | 6093316 | DefinitelyTyped/DefinitelyTyped | 12233.8 | 3776 | 502 | 49376 | 6025 | 6069 | 5002 |


## Top 20 active developers

We calculated the activity of global developers on GitHub and the top 20 most active developers are as follows.

| # | actor_login | activity | participant repo count | open issue | issue comment | open pull | pull review comment | pull merged |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | dependabot[bot] | 27385573 | 1224553 | 0 | 2846464 | 7188728 | 0 | 594585 |
| 2 | dependabot-preview[bot] | 18536691 | 54689 | 26292 | 1934791 | 3260587 | 0 | 1353511 |
| 3 | renovate[bot] | 4158866 | 10380 | 1138 | 54526 | 577183 | 0 | 474103 |
| 4 | github-learning-lab[bot] | 3443815 | 419053 | 616612 | 1425431 | 79360 | 48100 | 70936 |
| 5 | codecov[bot] | 782814 | 22025 | 0 | 782814 | 0 | 0 | 0 |
| 6 | github-actions[bot] | 766178 | 22634 | 27156 | 531957 | 22947 | 9252 | 14812 |
| 7 | pyup-bot | 753185 | 2550 | 244 | 122513 | 168363 | 0 | 25019 |
| 8 | bot-monkey-1 | 705502 | 3 | 69073 | 83344 | 83507 | 6329 | 41635 |
| 9 | sonarcloud[bot] | 680590 | 11382 | 0 | 680590 | 0 | 0 | 0 |
| 10 | greenkeeper[bot] | 628255 | 10493 | 11677 | 349854 | 49439 | 0 | 21346 |
| 11 | openshift-ci-robot | 582989 | 523 | 0 | 582477 | 0 | 128 | 0 |
| 12 | codeclimate[bot] | 423246 | 2164 | 0 | 252598 | 0 | 42662 | 0 |
| 13 | vercel[bot] | 385981 | 42595 | 0 | 385981 | 0 | 0 | 0 |
| 14 | stale[bot] | 300704 | 4576 | 0 | 300704 | 0 | 0 | 0 |
| 15 | k8s-ci-robot | 297322 | 252 | 0 | 295356 | 206 | 82 | 204 |
| 16 | liferay-continuous-integration | 282430 | 227 | 0 | 255523 | 8969 | 0 | 0 |
| 17 | depfu[bot] | 279666 | 1982 | 110 | 35604 | 52394 | 0 | 17332 |
| 18 | cjxd-bot-test | 262384 | 12780 | 190 | 39474 | 32030 | 0 | 25288 |
| 19 | coveralls | 206677 | 11388 | 0 | 206677 | 0 | 0 | 0 |
| 20 | openshift-bot | 198028 | 336 | 0 | 178803 | 2500 | 0 | 2345 |


## GitHub Word Cloud

We select topics of top 10w active repositories, filtered the topics with a frequency of more than 25. Then a word cloud map is generated based on the data. The word cloud visually highlights the topics that appear frequently, so that we can quickly get the more popular topics.

[wordcloud](/word-cloud.html ':include')

## Working Hour Distribution

We analyze the working hour distribution for GitHub logs all over the world during year 2020, we found that open source developers are predominantly European because local working hour period lays in UTC±1 as the image shows.

<embed src="http://gar2020.opensource-service.cn/svgrenderer/github/X-lab2017/github-analysis-report?path=sqls/working-hour-distribution/image.svg&data=[2,2,3,3,2,4,5,6,7,7,7,7,8,9,10,10,9,9,8,8,7,6,5,3,3,4,4,4,3,3,5,6,7,8,7,7,8,9,10,10,9,9,8,7,7,7,5,4,3,3,4,4,3,3,5,6,7,7,7,6,7,9,10,10,9,8,8,8,7,6,5,4,3,3,4,4,3,3,5,6,8,8,7,7,8,9,10,10,10,9,8,8,7,6,5,4,3,3,4,4,3,3,5,6,7,7,7,5,6,8,9,9,9,7,7,6,6,6,4,3,2,2,2,2,1,1,1,2,2,2,2,2,3,4,4,5,4,4,4,3,3,2,2,1,1,1,1,1,1,1,1,1,2,2,3,3,4,4,5,5,5,5,4,4,3,3,2,1]&lang=en" style="width:600" />
