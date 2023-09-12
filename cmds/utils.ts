import loadTemplatedConfiguration from '../src/config';
import { ConfigurationType } from '../src/commonTypes';

const consola = require('consola');

export const DefaultOptions = {
  configPathOption: {
    'config-path': {
      alias: 'c',
      type: 'string',
      default: 'glue_ops.yaml',
      description: 'Sets the config path',
    },
  },
};

export const commonOptionFlags = {
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

export interface CommonArgv {
  configPath: string
  replacementValues?: string
  dryRun: boolean
  jobName?: string
  syncName?: string
}

export const prepareConfig = (argv: CommonArgv): ConfigurationType => {
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
