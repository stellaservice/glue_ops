import { commonOptionFlags, prepareConfig, CommonArgv } from './utils';
import Rollback from '../src/rollback';

const rollbackCommand = {
  command: 'rollback [jobName]',
  describe: 'Runs rollbackPublish and merges PRs',
  builder: commonOptionFlags,
  handler: (argv: CommonArgv) => {
    const config = prepareConfig(argv);

    return Rollback(config, { dryRun: argv.dryRun });
  },
};

export default rollbackCommand;
