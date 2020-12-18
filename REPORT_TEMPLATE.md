# GitHub Analysis Report

We anaylsis {{sqls.total-record-count.text}} records of GitHub logs, there are {{sqls.total-repo-count.text}} active repositories and {{sqls.total-developer-count.text}} active developers on GitHub during year {{year}}.

## Top {{sqls.language-distribution.config.topN_language}} popular languages in top {{sqls.language-distribution.config.topN_repo}} repositories

We calculated the most popular languages in top {{sqls.language-distribution.config.topN_repo}} repositories, the number of top {{sqls.language-distribution.config.topN_repo}} repositories who are using the language, the most active repositiory using the language and all developers of the top {{sqls.language-distribution.config.topN_repo}} repositories who are using the language. The results are as follows.

{{sqls.language-distribution.text}}

## GitHub Word Cloud

We select topics of top 10w active repositories, filtered the topics with a frequency of more than 25. Then a word cloud map is generated based on the data. The word cloud visually highlights the topics that appear frequently, so that we can quickly get the more popular topics.

[wordcloud](/word-cloud.html ':include')

## Working Hour Distribution

We analyze the working hour distribution for GitHub logs all over the world during year {{year}}, we found that open source developers are predominantly European because local working hour period lays in UTC±1 as the image shows.

<embed src="{{sqls.working-hour-distribution.text}}&lang=en" style="width:600" />
