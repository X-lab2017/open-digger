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
  defaultRenderParams: {
    owner: 'X-lab2017',
    repo: 'github-analysis-report',
    baseUrl: 'http://gar2020.opensource-service.cn/',
  },
  db: {
    githubEventLog: {
      url: 'http://localhost:7001/query',
    },
  },
};

export default defaultConfig;
