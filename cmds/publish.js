const { commonOptionFlags, prepareConfig } = require('./utils');
const Publish = require('../src/publish');

const runCommand = {
  command: 'publish [jobName]',
  describe: 'Applies file syncs and publishes to repository',
  builder: commonOptionFlags,
  handler: (argv) => {
    const config = prepareConfig(argv);
    Publish(config, { dryRun: argv.dryRun });
  },
};

module.exports = runCommand;
