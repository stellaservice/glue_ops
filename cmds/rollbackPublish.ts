import { commonOptionFlags, prepareConfig, CommonArgv } from './utils';
import RollbackPublish from '../src/rollbackPublish';

const rollbackPublishCommand = {
  command: 'rollbackPublish [jobName]',
  describe: 'Creates rollback PRs',
  builder: commonOptionFlags,
  handler: (argv: CommonArgv) => {
    const config = prepareConfig(argv);

    return RollbackPublish(config, { dryRun: argv.dryRun });
  },
};

export default rollbackPublishCommand;
