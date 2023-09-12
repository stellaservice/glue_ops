import { commonOptionFlags, prepareConfig, CommonArgv } from './utils';
import Publish from '../src/publish';

const publishCommand = {
  command: 'publish [jobName]',
  describe: 'Applies file syncs and publishes to repository',
  builder: commonOptionFlags,
  handler: (argv: CommonArgv) => {
    const config = prepareConfig(argv);
    return Publish(config, { dryRun: argv.dryRun });
  },
};

export default publishCommand;
