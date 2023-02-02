const { commonOptionFlags, prepareConfig } = require('./utils');
const Run = require('../src/run');

const runCommand = {
  command: 'run [jobName]',
  describe: 'Runs publish and merge',
  builder: commonOptionFlags,
  handler: (argv) => {
    const config = prepareConfig(argv);
    return Run(config, { dryRun: argv.dryRun });
  },
};

module.exports = runCommand;
