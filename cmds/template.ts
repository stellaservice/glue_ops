import loadTemplatedConfiguration from '../src/config';
import { commonOptionFlags, CommonArgv } from './utils';

const templateCommand = {
  command: 'template',
  describe: 'Prints your templated config file to STDOUT for debugging purposes',
  builder: { 'replacement-values': commonOptionFlags['replacement-values'] },
  handler: (argv: CommonArgv) => {
    const config = loadTemplatedConfiguration(argv.configPath, argv.replacementValues);
    return console.log(JSON.stringify(config, null, 2));
  },
};

export default templateCommand;
