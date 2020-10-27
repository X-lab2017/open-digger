# GitHub Analysis Report

We anaylsis {{sqls.total-record-count.text}} records of GitHub logs, there are {{sqls.total-repo-count.text}} active repositories and {{sqls.total-developer-count.text}} active developers on GitHub during year {{year}}.

## Top 10 repositories

We calculated the activity of global repositories and the top 10 most active repositories are as follows.



{{sqls.activity-repo-top.text}}



## GitHub Word Cloud

We select topics of top 10w active repositories, filtered the topics with a frequency of more than 25. Then a word cloud map is generated based on the data. The word cloud visually highlights the topics that appear frequently, so that we can quickly get the more popular topics.

[wordcloud](/word-cloud.html ':include')

## Working Hour Distribution

We analyze the working hour distribution for GitHub logs all over the world during year {{year}}, we found that open source developers are predominantly European because local working hour period lays in UTC±1 as the image shows.

<embed src="{{sqls.working-hour-distribution.text}}&lang=en" style="width:600" />
