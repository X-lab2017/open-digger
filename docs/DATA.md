# Data Description

## GitHub Event Log

### Data Source

The data source comes from [GH Archive](https://www.gharchive.org/) which is a project to record the public GitHub timeline, archive it and make it easily accessible for further analysis. Each archive contains JSON encoded events as reported by the GitHub API. The raw JSON data is showing below. There are 6 important data features in this data, namely `id`, `type`, `actor`, `repo`, `payload`, `created_at`.

![](./assets/gharchive_raw_data.png)

### Database

In order to meet the requirement for high-speed analysis among such big data, we parse the row data into well-defined structure and import it into [ClickHouse](https://clickhouse.tech/) server which is an open source column-oriented database management system capable of real time generation of analytical data reports using SQL queries. The Clickhouse database version is 20.8.7.15 in our server. 

### Data Schema in Database

The database table offered by the `Clickhouse` server is showing in [data description](https://github.com/X-lab2017/open-digger/blob/master/docs/assets/data_description.csv). You can find a table with 120+ rows of features which were parsed from the raw GHArchive datasets. Check the data descriptions and what features you want to play with.

### User Guide for Database Service

For the detailed documentations for Clickhouse SQL usage, check out the [SQL reference](https://clickhouse.tech/docs/en/).

### Examples

There is an example for query data from the Clickhouse database table. You can find more real examples from study SQL components.   

* Pull Request review comment data from an organization

```
SELECT actor_id, actor_login, repo_id, repo_name, issue_id, action, created_at
FROM {database}.{table}
WHERE type='PullRequestReviewCommentEvent' AND repo_name LIKE '{org}/%'
ORDER BY created_at ASC
```
