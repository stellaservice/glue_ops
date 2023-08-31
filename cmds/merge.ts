import Merge from '../src/merge';

import { commonOptionFlags, prepareConfig, CommonArgv } from './utils';

const mergeCommand = {
  command: 'merge [jobName]',
  describe: 'Merges PRs opened by GlueOps',
  builder: commonOptionFlags,
  handler: (argv: CommonArgv) => {
    const config = prepareConfig(argv);
    return Merge(config, { dryRun: argv.dryRun });
  },
};

export default mergeCommand;
