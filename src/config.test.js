const loadTemplatedConfiguration = require('./config');

describe('loadTemplatedConfiguration', () => {
  const fixturePath = 'test/fixtures';

  describe('multiple replacement values', () => {
    it('templates an array of replacements and returns config object', () => {
      const testFilePath = `${fixturePath}/glue_ops_template_multi.yaml`;
      const templateVariables = ['foo=bar', 'bar=foo'];
      const config = loadTemplatedConfiguration(testFilePath, templateVariables);

      expect(typeof config).toBe('object');
      expect(config.fileSyncs.UpdateWebImage.value).toBe('bar-foo');
    });
  });

  describe('single replacement value', () => {
    it('templates an individual replacement', () => {
      const testFilePath = `${fixturePath}/glue_ops_template.yaml`;
      const templateVariables = 'foo=bar';
      const config = loadTemplatedConfiguration(testFilePath, templateVariables);

      expect(typeof config).toBe('object');
      expect(config.fileSyncs.UpdateWebImage.value).toBe('bar');
    });
  });

  describe('Merges default values', () => {
    it('merges config defaults', () => {
      const config = loadTemplatedConfiguration(`${fixturePath}/glue_ops_jobs_standard.yaml`);

      expect(config.repository.cloneDirectory).toBe('/tmp/glue_ops_repos');
    });

    it('merges job defaults', () => {
      const config = loadTemplatedConfiguration(`${fixturePath}/glue_ops_jobs_standard.yaml`);

      expect(config.jobs[0].merge.pollPrTimeout).toBe(600);
      expect(config.jobs[0].approval.enabled).toBe(true);
    });
  });
});
