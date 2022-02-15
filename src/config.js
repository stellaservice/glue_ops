const fs = require('fs');
const yaml = require('js-yaml')
const jp = require('jsonpath');
const Mustache = require('mustache');

const loadTemplatedConfiguration = (configPath, templateVariables = '') => {
  const file = fs.readFileSync(configPath)
  const variables = parseCliReplacements(templateVariables)
  const templatedConfig = Mustache.render(file.toString(), variables)
  return yaml.load(templatedConfig);
}

const parseCliReplacements = (replacements) => {
  return replacements.replace(/\s+/g, '').split(',').reduce((options, currentOption) => {
    const optionKv = currentOption.split('=')
    options[optionKv[0]] = optionKv[1]
    return options
  }, {})
}

module.exports = loadTemplatedConfiguration
