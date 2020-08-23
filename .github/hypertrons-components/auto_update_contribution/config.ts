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

import { configClass, configProp } from '../../config-generator/decorators';
import defaultConfig from './defaultConfig';

@configClass({
  description: 'Difficulty command config',
})
export default class Config {

  @configProp({
    description: 'Schedule Name',
    defaultValue: defaultConfig.schedName,
  })
  schedName: string;

  @configProp({
    description: 'Schedule expression',
    defaultValue: defaultConfig.sched,
  })
  sched: string;

  @configProp({
    description: 'Roles to render',
    defaultValue: defaultConfig.roles,
    type: 'array',
    arrayType: 'string',
  })
  roles: string[];

  @configProp({
    description: 'Contribution file path',
    defaultValue: defaultConfig.filePath,
  })
  filePath: string;

  @configProp({
    description: 'Default branch to make pull',
    defaultValue: defaultConfig.defaultBranch,
  })
  defaultBranch: string;

  @configProp({
    description: 'New report commit branch name',
    defaultValue: defaultConfig.newBranchName,
    type: 'render_string',
    renderParams: [ 'timestamp' ],
  })
  newBranchName: string;

  @configProp({
    description: 'New report commit message',
    defaultValue: defaultConfig.commitMessage,
    type: 'render_string',
    renderParams: [ 'branchName' ],
  })
  commitMessage: string;

  @configProp({
    description: 'New report pull title',
    defaultValue: defaultConfig.pullTitle,
    type: 'render_string',
    renderParams: [ 'branchName' ],
  })
  pullTitle: string;

  @configProp({
    description: 'New report pull body',
    defaultValue: defaultConfig.pullBody,
    type: 'render_string',
    renderParams: [ 'branchName' ],
  })
  pullBody: string;
}
