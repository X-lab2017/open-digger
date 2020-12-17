// Copyright 2019 - present Xlab
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Config from './config';

const defaultConfig: Config = {
  // schedule
  schedName: 'Auto report update',
  sched: '0 0 23 * * *', // update on 11pm UTC+8 by default
  // sqls
  sqlsDir: 'case-study/sqls',
  sqlFile: '/sql',
  sqlManifestFile: '/manifest.json',
  sqlPostProcessorFile: '/post-processor.js',
  defaultRenderParams: {
    year: 2020,
    table: 'github_log.year2020',
    owner: 'X-lab2017',
    repo: 'github-analysis-report',
    baseUrl: 'http://gar2020.opensource-service.cn/',
  },
  sqlRequestUrl: 'http://localhost:7001/query',
  // report
  reportDir: 'case-study',
  reportTemplateFile: 'REPORT_TEMPLATE.md',
  reportFile: 'REPORT.md',
  // commit and pull
  defaultBranch: 'master',
  newBranchName: 'auto-update-case-study-report-{{timestamp}}',
  commitMessage: 'docs: {{branchName}}',
  pullTitle: '[Docs] Update case study report {{branchName}}',
  pullBody: 'Update report automatically by robot from {{branchName}}',
};

export default defaultConfig;
