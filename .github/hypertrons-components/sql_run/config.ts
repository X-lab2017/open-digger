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
  description: 'Auto merge schedule config',
})
export default class Config {
  @configProp({
    description: 'Request url for run sql',
    defaultValue: defaultConfig.sqlRequestUrl,
  })
  sqlRequestUrl: string;

  @configProp({
    description: 'Run sql command',
    defaultValue: defaultConfig.command,
  })
  command: string;

  @configProp({
    description: 'Regex to find sql file',
    defaultValue: defaultConfig.sqlFileRegex,
  })
  sqlFileRegex: string;

  @configProp({
    description: 'Regex to find post processor file',
    defaultValue: defaultConfig.postProcessFileRegex,
  })
  postProcessFileRegex: string;

  @configProp({
    description: 'Regex to find manifest file',
    defaultValue: defaultConfig.manifestFileRegex,
  })
  manifestFileRegex: string;

  @configProp({
    description: 'SQL & report render params',
    defaultValue: defaultConfig.defaultRenderParams,
    type: 'any',
  })
  defaultRenderParams: any;

  @configProp({
    description: 'The item for render a SQL run result',
    type: 'render_string',
    renderParams: [ 'sqlName', 'data', 'text' ],
    defaultValue: defaultConfig.commentItemTemplate,
  })
  commentItemTemplate: string;


  @configProp({
    description: 'The label added to runned pull',
    defaultValue: defaultConfig.label,
  })
  label: string;
}
