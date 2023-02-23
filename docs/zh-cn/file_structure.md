# 文件结构

以下是 OpenDigger 的文件结构

.  
+-- .github  
|&nbsp;&nbsp;&nbsp;+-- hypertrons-components  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- auto_update_contribution  # 用于每周生成 CONTRIBUTORS 文件的 Hypertrons 组件  
|&nbsp;&nbsp;&nbsp;+-- workflows  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- check_label_pr.yml  # 测试 PR 中标签数据的 action  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- node_ci.yml  # 为 Node.js 代码提供测试的 action  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- parse_github_id.yml  # 用来解析 Issue 中的 GitHub ID 的 action  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- reply-label-issue*.yml  # 用来为 Issue 添加回复状态的 action  
|&nbsp;&nbsp;&nbsp;+-- hypertrons.json  # Hypertrons 配置文件  
+-- cooperations  # OpenDigger 合作的大赛或报告  
+-- docs  # OpenDigger 官网文件夹，由 GitHub Pages 与 Docsify 服务  
+-- labeled_data  # OpenDigger 中的所有标签数据  
+-- notebook  # 使用 OpenDigger 的 Notebook 文件  
+-- python  # 用于使用 OpenDigger 的 Python 库  
+-- sample_data  # 样例数据的相关文件  
|&nbsp;&nbsp;&nbsp;+-- build  # 用于构建 ClickHouse 镜像的文件  
|&nbsp;&nbsp;&nbsp;+-- sql_files  # 从 ClickHouse 导出样例数据的 SQL 文件  
|&nbsp;&nbsp;&nbsp;+-- export_sample.sh  # 用于导出样例数据的脚本  
+-- src  # 用于使用 OpenDigger 的 Node.js 库  
|&nbsp;&nbsp;&nbsp;+-- ci  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- pull_label_file_test.ts  # PR 测试标签数据文件的 action 源文件  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- utils.ts  # 运行 action 的基础工具  
|&nbsp;&nbsp;&nbsp;+-- cron  # 定时任务  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- tasks  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- monthly_export.ts  # 用于每月导出指标数据的任务  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- network_export.ts  # 用于为 Hypercrx 导出网络数据的任务  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- open_galaxy.ts  # 用于为 OpenGalaxy 导出数据的任务  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- open_leaderboard.ts  # 用于为 OpenLeaderboard 导出数据的任务  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- remove_renames.ts  # 用于删除 OSS 上更名仓库或用户数据的任务  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- index.ts  # 任务控制器  
|&nbsp;&nbsp;&nbsp;+-- db  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- clickhouse.ts  # 用于访问 ClickHouse 数据库的底层库  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- neo4j.ts  # 用于访问 Neo4j 图数据库的底层库  
|&nbsp;&nbsp;&nbsp;+-- metrics  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- basic.ts  # 用于生成 SQL 的底层通用函数  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- chaoss.ts  # CHAOSS 度量的具体实现  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- indices.ts  # 指标的具体实现  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- metrics.ts  # 非 CHAOSS 度量的具体实现  
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-- related_users.ts  # 图数据库获取关联用户的实现  
|&nbsp;&nbsp;&nbsp;+-- config.ts  # 配置文件  
|&nbsp;&nbsp;&nbsp;+-- label_data_utils.ts  # 访问标签数据的函数库  
|&nbsp;&nbsp;&nbsp;+-- open_digger.js  # 向 Node.js 内核的 Notebook 暴露的接口  
+-- test  
|&nbsp;&nbsp;&nbsp;+-- driver.test.ts  # 数据库底层库的单元测试  
|&nbsp;&nbsp;&nbsp;+-- label.test.ts  # 标签数据与工具的单元测试  
|&nbsp;&nbsp;&nbsp;+-- metrics.test.ts  # 度量与指标函数的单元测试  
+-- CITATION.cff  # 在论文中引用 OpenDigger 的文本  
+-- COUNTRIBUTING.md  # 贡献指南  
+-- LICENSE  # 许可声明  
