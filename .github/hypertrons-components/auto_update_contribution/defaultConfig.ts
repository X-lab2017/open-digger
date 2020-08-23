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
  schedName: 'Auto update contribution',
  sched: '0 0 22 * * *',
  roles: [
    'committer',
    'sql-reviewer',
    'replier',
    'contributor',
    'participant',
    'follower',
  ],
  filePath: 'CONTRIBUTORS',
  defaultBranch: 'master',
  newBranchName: 'auto-update-contributors-{{timestamp}}',
  commitMessage: 'docs: {{branchName}}',
  pullTitle: '[Docs] Update report {{branchName}}',
  pullBody: 'Update contributors automatically by robot from {{branchName}}',
};

export default defaultConfig;
