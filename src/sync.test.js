const fs = require('fs');
const YAML = require('yaml');
const { runSync } = require('./sync');

describe('runSync', () => {
  describe('yaml target files', () => {
    const tmpFilePath = '/tmp/test-sync.yaml';

    beforeEach(() => {
      const testFilePath = 'fixtures/test_file.yaml';
      const file = fs.readFileSync(testFilePath);
      fs.writeFileSync(tmpFilePath, file);
    });

    test('it syncs the image tag via yaml sync', () => {
      const configFilePath = 'fixtures/glue_ops_file_sync_yaml.fixture.yaml';
      const fileSync = YAML.parse(fs.readFileSync(configFilePath, 'utf-8')).fileSyncs.UpdateWebImage;

      runSync(fileSync);

      const testFile = YAML.parse(fs.readFileSync(tmpFilePath, 'utf-8'));
      expect(testFile.image.tag).toBe('syncedTag');
    });

    test('it syncs the image repo via regex sync', () => {
      const configFilePath = 'fixtures/glue_ops_file_sync_regex.fixture.yaml';
      const fileSync = YAML.parse(fs.readFileSync(configFilePath, 'utf-8')).fileSyncs.UpdateWebImage;

      runSync(fileSync);

      const testFile = YAML.parse(fs.readFileSync(tmpFilePath, 'utf-8'));
      expect(testFile.image.tag).toBe('syncedTag');
    });
  });

  describe('json target files', () => {
    const tmpFilePath = '/tmp/test-sync.json';

    beforeEach(() => {
      const testFilePath = 'fixtures/test_file.json';
      const file = fs.readFileSync(testFilePath, 'utf-8');
      fs.writeFileSync(tmpFilePath, file);
    });

    test('it syncs the image tag via json sync', () => {
      const configFilePath = 'fixtures/glue_ops_file_sync_json.fixture.yaml';
      const fileSync = YAML.parse(fs.readFileSync(configFilePath, 'utf-8')).fileSyncs.UpdateWebImage;

      runSync(fileSync);

      const testFile = JSON.parse(fs.readFileSync(tmpFilePath, 'utf-8'));
      expect(testFile.image.tag).toBe('syncedTag');
    });
  });
});
