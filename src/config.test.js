const fs = require('fs');
const loadTemplatedConfiguration = require('./config');

describe('loadTemplatedConfiguration', () => {
  const tmpFilePath = '/tmp/test-template.yaml';
  const fixturePath = 'test/fixtures';

  describe('multiple replacement values', () => {
    beforeEach(() => {
      const testFilePath = `${fixturePath}/glue_ops_template_multi.yaml`;
      const file = fs.readFileSync(testFilePath);
      fs.writeFileSync(tmpFilePath, file);
    });

    it('templates an array of replacements and returns config object', () => {
      const templateVariables = ['foo=bar', 'bar=foo'];
      const config = loadTemplatedConfiguration(tmpFilePath, templateVariables);

      expect(typeof config).toBe('object');
      expect(config.fileSyncs.UpdateWebImage.value).toBe('bar-foo');
    });
  });

  describe('single replacement value', () => {
    beforeEach(() => {
      const testFilePath = `${fixturePath}/glue_ops_template.yaml`;
      const file = fs.readFileSync(testFilePath);
      fs.writeFileSync(tmpFilePath, file);
    });

    it('templates an individual replacement', () => {
      const templateVariables = 'foo=bar';
      const config = loadTemplatedConfiguration(tmpFilePath, templateVariables);

      expect(typeof config).toBe('object');
      expect(config.fileSyncs.UpdateWebImage.value).toBe('bar');
    });
  });
});
