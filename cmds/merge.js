const { commonOptionFlags, prepareConfig } = require('./utils');
const { Merge } = require('../src/merge');

const mergeCommand = {
  command: 'merge [jobName]',
  describe: 'Merges PRs opened by GlueOps',
  builder: commonOptionFlags,
  handler: (argv) => {
    const config = prepareConfig(argv);
    return Merge(config, { dryRun: argv.dryRun });
  },
};

module.exports = mergeCommand;
