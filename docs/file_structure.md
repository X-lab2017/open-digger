# File structure

The file structure of OpenDigger are shown as below

.  
+-- .github  
|&nbsp;&nbsp;&nbsp;+-- hypertrons-components  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- auto_update_contribution  # A hypertrons workflow to generate CONTRIBUTORS file every week  
|&nbsp;&nbsp;&nbsp;+-- workflows  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- check_label_pr.yml  # Action to check label data in pull request  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- node_ci.yml  # Action to run unit tests for Node.js libs  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- parse_github_id.yml  # Action to parse GitHub ID in label data issue  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- reply-label-issue*.yml  # Action to add reply status to issue  
|&nbsp;&nbsp;&nbsp;+-- hypertrons.json  # Hypertrons config file  
+-- cooperations  # Cooperations events or reports with OpenDigger  
+-- docs  # OpenDigger website root folder, host by GitHub Pages and powered by docsify  
+-- labeled_data  # All labeled data in OpenDigger  
+-- notebook  # Notebooks about how to use OpenDigger  
+-- python  # Python lib to access OpenDigger  
+-- sample_data  
|&nbsp;&nbsp;&nbsp;+-- build  # Files to build sample data ClickHouse images  
|&nbsp;&nbsp;&nbsp;+-- sql_files  # SQL files to export data from ClickHouse  
|&nbsp;&nbsp;&nbsp;+-- export_sample.sh  # Shell to export sample data  
+-- src  # Node.js lib to access OpenDigger  
|&nbsp;&nbsp;&nbsp;+-- ci  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- pull_label_file_test.ts  # Source file for pull request label data test action  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- utils.ts  # Basic utils to run actions  
|&nbsp;&nbsp;&nbsp;+-- cron  # Scheduled tasks  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; +-- tasks  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- monthly_export.ts  # Task to export metrics data for every month  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- network_export.ts  # Task to export network data for Hypercrx  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- open_galaxy.ts  # Task to export data for OpenGalaxy  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- open_leaderboard.ts  # Task to export data for OpenLeaderboard  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- remove_renames.ts  # Task to remove renamed repos and users on OSS  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; +-- index.ts  # Task control  
|&nbsp;&nbsp;&nbsp;+-- db  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- clickhouse.ts  # Driver to access ClickHouse database  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- neo4j.ts  # Driver to access Neo4j database  
|&nbsp;&nbsp;&nbsp;+-- metrics  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- basic.ts  # Basic function to generate SQLs  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- chaoss.ts  # Metric implementations of CHAOSS metrics  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- indices.ts  # Index implementations  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- metrics.ts  # Metrics implementations not from CHAOSS  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- related_users.ts  # Related user from graph database  
|&nbsp;&nbsp;&nbsp;+-- config.ts  # Config file  
|&nbsp;&nbsp;&nbsp;+-- label_data_utils.ts  # Utils to access label data  
|&nbsp;&nbsp;&nbsp;+-- open_digger.js  # Expose to Node.js kernel notebook  
+-- test  
|&nbsp;&nbsp;&nbsp;+-- driver.test.ts  # Unit tests for database drivers  
|&nbsp;&nbsp;&nbsp;+-- label.test.ts  # Unit tests for label data and label utils  
|&nbsp;&nbsp;&nbsp;+-- metrics.test.ts  # Unit tests for metrics functions  
+-- CITATION.cff  # Citation file to citate OpenDigger in papers  
+-- COUNTRIBUTING.md  # Contributing guide  
+-- LICENSE  # License declaration  
