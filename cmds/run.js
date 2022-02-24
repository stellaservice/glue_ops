const loadTemplatedConfiguration = require('../src/config');
const run = require('../src/run');

const runCommand = {
  command: 'run [jobName]',
  describe: 'Applies file syncs and publishes repository changes',
  builder: {
    'replacement-values': {
      alias: 'r',
      describe: 'Used to replace templated values in your config. \n Example option: -r \'image_name=foo\'',
    },
  },
  handler: (argv) => {
    const config = loadTemplatedConfiguration(argv.configPath, argv.replacementValues);
    if (argv.jobName) {
      const filteredJob = config.jobs.filter((job) => (job.name === argv.jobName));
      if (filteredJob) {
        config.jobs = filteredJob;
      } else {
        console.log('Job name not found');
      }
    }

    run(config);
  },
};

module.exports = runCommand;
