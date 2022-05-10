 # Summer 2022
 
 OpenDigger is participatng in Summer 2022, see [details](https://summer-ospp.ac.cn/#/org/prodetail/227f00219) and welcome to apply!
 
 ## Task 1 - Python development environment support for OpenDigger
 
 Language: 中文/English
 
 Mentor of Project: 顾业鸣
 
 Degree of Difficulty: 基础/Basic
 
 Technical Field: NodeJS, Database
 
 Labels of Programming Language: Python, JavaScript, TypeScript
 
 Descrption:
 
 OpenDigger now has a built-in JavaScript SDK. The files are under the path in repo [/src/opendigger.js.](https://github.com/X-lab2017/open-digger/blob/master/src/open_digger.js) Through this development kit, users can quickly make statistical analysis of open source projects.

In order to meet the needs of more developers, we plan to implement a python SDK based on the existing JavaScript SDK. In this way, you can easily use Python SDK for development in jupyter notebook.

To complete this project, the applicant needs to:

1. Use the source code of GitHub warehouse to build the project and run it. (using data image and modified notebook image supporting node.js kernel)
2. Check the handbook in the notebook and use the JavaScript SDK for some analysis.
3. Understand the meaning of table fields in the database through some analysis tasks.
4. Based on the above, select the appropriate tool to implement a python SDK.

## Task 2 - Develop CHAOSS Common Metrics in OpenDigger
 
 Language: 中文/English
 
 Mentor of Project: 夏小雅
 
 Degree of Difficulty: 基础/Basic
 
 Technical Field: NodeJS, Database
 
 Labels of Programming Language: JavaScript, TypeScript
 
 Descrption:
 
OpenDigger supports a Nodejs development environment, and some built-in analysis functions to help users analyze the status of their open-source software repository.

The implemented analytical functions can be seen in the repository [/src/metrics](https://github.com/X-lab2017/open-digger/tree/master/src/metrics) path. 

OpenDigger plans to implement a batch of metrics that have been released by CHAOSS. Each metric would be tracked via an issue. For details, see [open-digger/issues](https://github.com/X-lab2017/open-digger/issues) and find issues starting with [Metrics].

This project requires mentees:
1. Refer to the existing analysis functions under /src/metrics to implement related metrics in `#issue570 - #issue577`.
2. Connect to the Clickhouse database and run the test in the nodejs environment.

## 任务 3 - OpenDigger 在线定时任务的持续集成与持续部署
 
 语言: 中文
 
 导师: Frank
 
 难度: 基础
 
 技术领域: NodeJS, Automation, Container
 
 编程语言: TypeScript, Shell, Jupyter Notebook

 描述：
 
OpenDigger 作为在木兰社区孵化的开源项目，承担了目前国内 GitHub 数据分析的绝大部分工作，例如[中国开源年报](https://kaiyuanshe.cn/document/china-os-report-2021/)、[GitHub 数字洞察报告](http://oss.x-lab.info/github-insight-report-2020.pdf)、[中国开源发展蓝皮书](http://www.copu.org.cn/new/308)、[中国开源码力榜](https://opensource.win/)等。

除一次性的数据报告外，OpenDigger 也支持定时为下游项目提供数据生产与更新的能力，例如为 [OpenLeaderboard](https://open-leaderboard.x-lab.info/)、[Hypercrx](https://github.com/hypertrons/hypertrons-crx/) 等项目提供持续的数据更新能力。目前这部分依然是由人工手动触发脚本完成的，希望在本次项目中，将该部分的定时任务做到线上，为后续的大规模数据生产提供有效的保障。

项目需要完成：
1. 与 GitHub CI/CD 流程的深度融合，实现代码更新后的实时部署
2. 完成线上定时任务的自动化部署，可定时执行脚本进行数据更新操作
3. 对线上任务进行监控与健康检查，服务异常需要有相应的重启与通知能力


