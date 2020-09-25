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
  description: 'Auto update report config',
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
    description: 'SQLs directory',
    defaultValue: defaultConfig.sqlsDir,
  })
  sqlsDir: string;

  @configProp({
    description: 'SQL file path',
    defaultValue: defaultConfig.sqlFile,
  })
  sqlFile: string;

  @configProp({
    description: 'SQL manifest file path',
    defaultValue: defaultConfig.sqlManifestFile,
  })
  sqlManifestFile: string;

  @configProp({
    description: 'SQL post processor file path',
    defaultValue: defaultConfig.sqlPostProcessorFile,
  })
  sqlPostProcessorFile: string;

  @configProp({
    description: 'SQL & report render params',
    defaultValue: defaultConfig.defaultRenderParams,
    type: 'any',
  })
  defaultRenderParams: any;

  @configProp({
    description: 'Run SQL url',
    defaultValue: defaultConfig.sqlRequestUrl,
  })
  sqlRequestUrl: string;

  @configProp({
    description: 'Report template file path',
    defaultValue: defaultConfig.reportTemplateFile,
  })
  reportTemplateFile: string;

  @configProp({
    description: 'Report file path',
    defaultValue: defaultConfig.reportFile,
  })
  reportFile: string;

  @configProp({
    description: 'Report file path',
    defaultValue: defaultConfig.reportWebFile,
  })
  reportWebFile: string;

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
