const fs = require('fs');
const YAML = require('yaml');
const Mustache = require('mustache');

/* eslint-disable no-param-reassign */
const parseCliReplacements = (replacements) => (
  replacements.replace(/\s+/g, '').split(',').reduce((options, currentOption) => {
    const optionKv = currentOption.split('=');
    const [key, value] = optionKv;
    options[key] = optionKv[value];

    return options;
  })
);
/* eslint-disable no-param-reassign */

const loadTemplatedConfiguration = (configPath, templateVariables = '') => {
  const file = fs.readFileSync(configPath, 'utf-8');
  const variables = parseCliReplacements(templateVariables);
  const templatedConfig = Mustache.render(file.toString(), variables);
  return YAML.parse(templatedConfig);
};

module.exports = loadTemplatedConfiguration;
