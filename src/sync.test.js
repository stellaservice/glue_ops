const fs = require('fs');
const yaml = require('js-yaml')
const { runSync } = require('./sync.js');

describe('runSync', () => {
  describe('yaml target files', () => {
    const tmpFilePath = '/tmp/test-sync.yaml'

    beforeEach(() => {
      const testFilePath = 'fixtures/test_file.yaml'
      const file = fs.readFileSync(testFilePath)
      fs.writeFileSync(tmpFilePath, file)
    });

    test('it syncs the image tag via yaml sync', () => {
      const configFilePath = 'fixtures/glue_ops_file_sync_yaml.fixture.yaml'
      const fileSync = yaml.load(fs.readFileSync(configFilePath)).fileSyncs.UpdateWebImage;

      runSync(fileSync)

      const testFile = yaml.load(fs.readFileSync(tmpFilePath))
      expect(testFile.image.tag).toBe('syncedTag')
    });

    test('it syncs the image repo via regex sync', () => {
      const configFilePath = 'fixtures/glue_ops_file_sync_regex.fixture.yaml'
      const fileSync = yaml.load(fs.readFileSync(configFilePath)).fileSyncs.UpdateWebImage;

      runSync(fileSync)

      const testFile = yaml.load(fs.readFileSync(tmpFilePath))
      expect(testFile.image.tag).toBe('syncedTag')
    });
  })

  describe('json target files', () => {
    const tmpFilePath = '/tmp/test-sync.json'

    beforeEach(() => {
      const testFilePath = 'fixtures/test_file.json'
      const file = fs.readFileSync(testFilePath)
      fs.writeFileSync(tmpFilePath, file)
    });

    test('it syncs the image tag via json sync', () => {
      const configFilePath = 'fixtures/glue_ops_file_sync_json.fixture.yaml'
      const fileSync = yaml.load(fs.readFileSync(configFilePath)).fileSyncs.UpdateWebImage;

      runSync(fileSync)

      const testFile = JSON.parse(fs.readFileSync(tmpFilePath))
      expect(testFile.image.tag).toBe('syncedTag')
    });
  })
})
