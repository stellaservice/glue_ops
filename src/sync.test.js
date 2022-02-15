const fs = require('fs');
const yaml = require('js-yaml')
const { runSync } = require('./sync.js');

beforeEach(() => {
  const filePath = 'fixtures/test_file.yaml'
  const file = fs.readFileSync(filePath)
  const tmpPath = '/tmp/test-sync.yaml'
  fs.writeFileSync(tmpPath, file)
});

describe('runSync', () => {
  test('it syncs the image tag via yaml replacement', () => {
    const configFilePath = 'fixtures/glue_ops_file_sync_yaml.fixture.yaml'
    const fileSync = yaml.load(fs.readFileSync(configFilePath)).fileSyncs.UpdateWebImage;

    runSync(fileSync)

    const tmpFilePath = '/tmp/test-sync.yaml'
    const testFile = yaml.load(fs.readFileSync(tmpFilePath))

    expect(testFile.image.tag).toBe('testTag')
  });
})
