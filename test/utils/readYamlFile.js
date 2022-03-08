const YAML = require('yaml');
const fs = require('fs');

module.exports = (fileName) => (
  YAML.parse(fs.readFileSync(fileName, 'utf-8'))
);
