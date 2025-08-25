import { consola } from 'consola';
import { runSync, runAllSyncs } from './sync';
import loadTemplatedConfiguration from './config';

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
        const fileSync = loadTemplatedConfiguration(configFilePath).fileSyncs.UpdateWebImage;

        runSync(fileSync);

        const testFile = readYamlFile(tmpFilePath);
        expect(testFile.image.tag).toBe('syncedTag');
      });

      test('it syncs the image repo via regex sync', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_regex.fixture.yaml`;
        const fileSync = loadTemplatedConfiguration(configFilePath).fileSyncs.UpdateWebImage;

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
        const fileSync = loadTemplatedConfiguration(configFilePath).fileSyncs.UpdateWebImage;

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
        const fileSync = loadTemplatedConfiguration(configFilePath).fileSyncs.MirrorSyncConfig;

        runSync(fileSync);

        const testFile = readYamlFile(tmpFilePath);
        expect(testFile.fileSyncs.MirrorSyncConfig.type).toBe('mirror');
      });

      it('it can sync from specified directory', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_mirror.fixture.yaml`;
        const fileSync = loadTemplatedConfiguration(configFilePath).fileSyncs.MirrorSyncConfig;

        runSync(fileSync, { sourceDirectory: process.cwd() });

        const testFile = readYamlFile(tmpFilePath);
        expect(testFile.fileSyncs.MirrorSyncConfig.type).toBe('mirror');
      });

      it('includes the synchronization hash', () => {
        const configFilePath = `${fixturePath}/glue_ops_file_sync_mirror.fixture.yaml`;
        const fileSync = loadTemplatedConfiguration(configFilePath).fileSyncs.MirrorSyncConfig;

        runSync(fileSync);

        const sourceFile = fs.readFileSync(configFilePath, 'utf-8');
        const sha = crypto.createHash('sha256').update(sourceFile).digest('hex');
        const testFile = fs.readFileSync(tmpFilePath, 'utf-8');

        expect(testFile.match(new RegExp(sha))).toBeTruthy();
      });

      describe('synchronization hash with mirror and sync', () => {
        it('will update the hash ', () => {
          const configFilePath = `${fixturePath}/glue_ops_file_sync_hash.fixture.yaml`;
          const configFile = loadTemplatedConfiguration(configFilePath);
          const fileSyncMirror = configFile.fileSyncs.MirrorSyncConfig;
          const fileSyncYaml = configFile.fileSyncs.UpdateWebImage;

          const hashCommentRegex = /# Synchronization-Hash: ([a-z0-9]+)/;

          runSync(fileSyncMirror);
          const fileAfterMirror = fs.readFileSync(tmpFilePath, 'utf-8');
          const afterMirrorHash = fileAfterMirror.match(hashCommentRegex)[1];

          runSync(fileSyncYaml);
          const fileAfterSync = fs.readFileSync(tmpFilePath, 'utf-8');
          const afterSyncHash = fileAfterSync.match(hashCommentRegex)[1];

          expect(afterMirrorHash).not.toBe(afterSyncHash);
        });
      });

      it('will error if the hash has been modified', () => {
        const consolaFatalMock = jest.fn();
        consola.mockTypes((typeName) => typeName === 'fatal' && consolaFatalMock);
        const mockExit = jest.spyOn(process, 'exit').mockImplementation();
        fs.copySync(`${fixturePath}/bad_hash.yaml`, tmpFilePath);
        const configFilePath = `${fixturePath}/glue_ops_file_sync_mirror.fixture.yaml`;
        const fileSync = loadTemplatedConfiguration(configFilePath).fileSyncs.MirrorSyncConfig;

        runSync(fileSync);
        expect(consolaFatalMock).toBeCalled();
        expect(mockExit).toBeCalledWith(1);

        jest.restoreAllMocks();
      });
    });
  });

  describe('runAllSyncs', () => {
    const tmpFilePath = '/tmp/test-sync.yaml';

    beforeEach(() => {
      fs.copySync(`${fixturePath}/test_file.yaml`, tmpFilePath);
    });

    it('calls runSync with each file sync', () => {
      const config = loadTemplatedConfiguration(`${fixturePath}/glue_ops_file_sync_multi.yaml`);
      runAllSyncs(config.fileSyncs);

      const testFile = readYamlFile(tmpFilePath);
      expect(testFile.image.tag).toBe('syncedTag');
      expect(testFile.foo.bar).toBe('foobar');
    });
  });
});
