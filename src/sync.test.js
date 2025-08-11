import { runSync, runAllSyncs } from './sync';
const crypto = require('crypto');

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

      afterEach(() => {
        fs.removeSync(tmpFilePath);
      });

      it('it mirror syncs from a soure to destination', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_mirror.fixture.yaml`;
        const fileSync = readYamlFile(configFilePath).fileSyncs.UpdateWebImage;

        runSync(fileSync);

        const testFile = readYamlFile(tmpFilePath);
        expect(testFile.fileSyncs.UpdateWebImage.type).toBe('mirror');
      });

      it('it can sync from specified directory', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_mirror.fixture.yaml`;
        console.log('huh');
        const fileSync = readYamlFile(configFilePath).fileSyncs.UpdateWebImage;
        console.log('okay');

        runSync(fileSync, { sourceDirectory: process.cwd() });

        const testFile = readYamlFile(tmpFilePath);
        expect(testFile.fileSyncs.UpdateWebImage.type).toBe('mirror');
      });

      it('includes the synchronization hash', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_mirror.fixture.yaml`;
        const fileSync = readYamlFile(configFilePath).fileSyncs.UpdateWebImage;

        runSync(fileSync);

        const sourceFile = fs.readFileSync(configFilePath, 'utf-8');
        const sha = crypto.createHash('sha256').update(sourceFile).digest('hex');
        const testFile = fs.readFileSync(tmpFilePath, 'utf-8');

        expect(testFile.match(new RegExp(sha))).toBeTruthy();
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
