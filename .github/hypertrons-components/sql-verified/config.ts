import { configClass, configProp } from '../../config-generator/decorators';
import defaultConfig from './defaultConfig';

@configClass({
  description: 'Sql verified command config',
})
export default class Config {

  @configProp({
    description: 'Label name',
    defaultValue: defaultConfig.label,
  })
  label: string;

  @configProp({
    description: 'Command name',
    defaultValue: defaultConfig.command,
  })
  command: string;

}
