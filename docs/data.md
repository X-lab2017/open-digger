# Data Description

## GitHub Event Log

### Data Source

The data source comes from [GH Archive](https://www.gharchive.org/) which is a project to record the public GitHub timeline event log, archive it and make it easily accessible for further analysis. Each archive contains JSON encoded events as reported by the GitHub API. The raw JSON data is showing below. There are 6 important data features in this data, namely `id`, `type`, `actor`, `repo`, `payload`, `created_at`.

### Database

In order to meet the requirement for high-speed analysis among such big data, we parse the row data into well-defined structure and import it into [ClickHouse](https://clickhouse.tech/) server which is an open source column-oriented database management system capable of real time generation of analytical data reports using SQL queries. The Clickhouse database version is 22.8 in our server.

### Data Schema in Database

The database table offered by the `Clickhouse` server is showing in [data description](https://github.com/X-lab2017/open-digger/blob/master/docs/assets/data_description.csv). You can find a table with 120+ rows of features which were parsed from the raw GHArchive datasets. Check the data descriptions and what features you want to play with.

### User Guide for Database Service

For the detailed documentations for Clickhouse SQL usage, check out the [SQL reference](https://clickhouse.tech/docs/en/).

### FAQ

- Q: Can OpenDigger analysis more detailed data for open source repos, like assignee, reactions, label related actions?

- A: No, since `assgin`, `reaction` and `label` events are not included in GitHub timeline event log, we don't have these data in OpenDigger, but you can use GitHub API to get more detailed data and analysis them yourself.

- Q: Why the exported data is not accurate for my open source repos?

- A: Since we are using GHAchive and GitHub timeline event log, there are some data lost due to GitHub API or GHArchive service failure, so the exported metrics can be used to observe the trending but the data can not be treated as an accurate result.
