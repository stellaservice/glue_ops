const fs = require('fs');
const YAML = require('yaml');
const Mustache = require('mustache');

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

const loadTemplatedConfiguration = (configPath, replacementValues = '') => {
  const file = fs.readFileSync(configPath, 'utf-8');
  const templateValues = parseCliReplacements(replacementValues);
  const templatedConfig = Mustache.render(file.toString(), templateValues);

  return YAML.parse(templatedConfig);
};

module.exports = loadTemplatedConfiguration;
