import { runSync, runAllSyncs } from './sync';

const fs = require('fs-extra');
const readYamlFile = require('../test/utils/readYamlFile');

describe('run', () => {
  const fixturePath = 'test/fixtures';

  describe('runSync', () => {
    describe('yaml target files', () => {
      const tmpFilePath = '/tmp/test-sync.yaml';

      beforeEach(() => {
        fs.copySync(`${fixturePath}/test_file.yaml`, tmpFilePath);
      });

      test('it syncs the image tag via yaml sync', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_yaml.fixture.yaml`;
        const fileSync = readYamlFile(configFilePath).fileSyncs.UpdateWebImage;

        runSync(fileSync);

        const testFile = readYamlFile(tmpFilePath);
        expect(testFile.image.tag).toBe('syncedTag');
      });

      test('it syncs the image repo via regex sync', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_regex.fixture.yaml`;
        const fileSync = readYamlFile(configFilePath).fileSyncs.UpdateWebImage;

        runSync(fileSync);

        const testFile = readYamlFile(tmpFilePath);
        expect(testFile.image.tag).toBe('syncedTag');
      });
    });

    describe('json target files', () => {
      const tmpFilePath = '/tmp/test-sync.json';

      beforeEach(() => {
        fs.copySync(`${fixturePath}/test_file.json`, tmpFilePath);
      });

      test('it syncs the image tag via json sync', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_json.fixture.yaml`;
        const fileSync = readYamlFile(configFilePath).fileSyncs.UpdateWebImage;

        runSync(fileSync);

        const testFile = JSON.parse(fs.readFileSync(tmpFilePath, 'utf-8'));
        expect(testFile.image.tag).toBe('syncedTag');
      });
    });

    describe('mirroring sync', () => {
      const tmpFilePath = '/tmp/test-sync-destination.yaml';

      test('it mirror syncs the two files', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_mirror.fixture.yaml`;
        const fileSync = readYamlFile(configFilePath).fileSyncs.UpdateWebImage;

        runSync(fileSync);

        const testFile = readYamlFile(tmpFilePath);
        expect(testFile.fileSyncs.UpdateWebImage.type).toBe('mirror');
      });
    });
  });

  describe('runAllSyncs', () => {
    const tmpFilePath = '/tmp/test-sync.yaml';

    beforeEach(() => {
      fs.copySync(`${fixturePath}/test_file.yaml`, tmpFilePath);
    });

    it('calls runSync with each file sync', () => {
      const config = readYamlFile(`${fixturePath}/glue_ops_file_sync_multi.yaml`);
      runAllSyncs(config.fileSyncs);

      const testFile = readYamlFile(tmpFilePath);
      expect(testFile.image.tag).toBe('syncedTag');
      expect(testFile.foo.bar).toBe('foobar');
    });
  });
});
