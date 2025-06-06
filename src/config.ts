import { ConfigurationType } from './commonTypes';

const fs = require('fs');
const merge = require('deepmerge');
const YAML = require('yaml');
const Mustache = require('mustache');

const CONFIGURATION_DEFAULTS = {
  repository: {
    cloneDirectory: '/tmp/glue_ops_repos',
  },
};

const JOB_CONFIGURATION_DEFAULTS = {
  approval: {
    enabled: true,
  },
  pr: {
    body: '',
  },
  merge: {
    method: 'squash',
    pollPrTimeout: 600,
    hooks: [],
  },
};
/* eslint-disable no-param-reassign */
const parseCliReplacements = (replacementValues) => {
  if (!Array.isArray(replacementValues)) {
    replacementValues = [replacementValues];
  }

  return replacementValues.reduce((templateValues, replacement) => {
    const replacementKv = replacement.replace(/\s+/g, '').split('=');
    const [key, value] = replacementKv;

    templateValues[key] = value;

    return templateValues;
  }, {});
};
/* eslint-disable no-param-reassign */

const mergeDefaults = (config: ConfigurationType) => {
  config = merge(CONFIGURATION_DEFAULTS, config);

  if (config.jobs) {
    for (let i = 0; i < config.jobs.length; i++) {
      config.jobs[i] = merge(JOB_CONFIGURATION_DEFAULTS, config.jobs[i]);
    }
  }
  return config;
};

const loadTemplatedConfiguration = (configPath: string, replacementValues = ''): ConfigurationType => {
  const file = fs.readFileSync(configPath, 'utf-8');
  const templateValues = parseCliReplacements(replacementValues);
  const templatedConfig = Mustache.render(file.toString(), templateValues);
  const parsedConfig = YAML.parse(templatedConfig);

  return mergeDefaults(parsedConfig);
};

export default loadTemplatedConfiguration;
