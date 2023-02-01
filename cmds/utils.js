const consola = require('consola');
const loadTemplatedConfiguration = require('../src/config');

const commonOptionFlags = {
  'replacement-values': {
    alias: 'r',
    describe: 'Used to replace templated values in your config. \n Example option: -r \'image_name=foo\'',
  },
  'dry-run': {
    type: 'boolean',
    describe: 'Prints changes without real updates',
    default: false,
  },
};

const prepareConfig = (argv) => {
  const config = loadTemplatedConfiguration(argv.configPath, argv.replacementValues);
  if (argv.jobName) {
    const filteredJob = config.jobs.filter((job) => (job.name === argv.jobName));
    if (filteredJob.length > 0) {
      config.jobs = filteredJob;
    } else {
      consola.error('Job name not found');
      process.exit(1);
    }
  }

  return config;
};

module.exports = { commonOptionFlags, prepareConfig };
