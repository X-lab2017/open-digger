# GitHub Analysis Report

We anaylsis {{sqls.total-record-count.text}} records of GitHub logs, there are {{sqls.total-repo-count.text}} active repositories and {{sqls.total-developer-count.text}} active developers on GitHub during year {{year}}.

## GitHub Word Cloud

[wordcloud](/word-cloud.html ':include')

## Working Hour Distribution

We analyze the working hour distribution for GitHub logs all over the world during year {{year}}, we found that open source developers are predominantly European because local working hour period lays in UTC±1 as the image shows.

<embed src="{{sqls.working-hour-distribution.text}}&lang=en" style="width:600" />
