import { SyncType, FileSyncType, FileSyncsType, MirrorSyncType } from './commonTypes';

const consola = require('consola');
const fs = require('fs');
const YAML = require('yaml');
const { YAMLMap } = require('yaml');

Object.getPrototypeOf(YAMLMap).maxFlowStringSingleLineLength = 10000; // Stops yaml collections from wrapping

const setValueOnPath = (obj: any, path: string[], value: any) => {
  const last = path.pop();
  const parent = path.reduce((accum, p) => (accum[p]), obj);
  parent[last] = value;
};

const jsonSync = (targetFileContents: string, fileSync: FileSyncType) => {
  const contents = JSON.parse(targetFileContents);

  const target = <string[]>fileSync.target;

  setValueOnPath(contents, target, fileSync.value);

  return JSON.stringify(contents, null, 2);
};

const yamlSync = (targetFileContents: string, fileSync: FileSyncType) => {
  const contents = YAML.parseDocument(targetFileContents).toJS();
  const target = <string[]>fileSync.target;

  setValueOnPath(contents, target, fileSync.value);

  return YAML.stringify(contents, { lineWidth: 0, minContentWidth: 0 });
};

const regexSync = (targetFileContents: string, fileSync: FileSyncType) => {
  const contents = targetFileContents.toString();

  const target = <string>fileSync.target;
  return contents.replace(new RegExp(target), fileSync.value);
};

const mirrorSync = (fileSync: MirrorSyncType) => (
  fs.readFileSync(fileSync.source, 'utf8')
);

export const runSync = (fileSync: SyncType, dryRun = false) => {
  fileSync.files.forEach((file) => {
    let syncedContents = '';
    let targetFileContents = '';

    if (!(fileSync.type === 'mirror')) {
      targetFileContents = fs.readFileSync(file, 'utf8');
    }

    switch (fileSync.type) {
      case 'json':
        syncedContents = jsonSync(targetFileContents, fileSync);
        break;
      case 'yaml':
        syncedContents = yamlSync(targetFileContents, fileSync);
        break;
      case 'regex':
        syncedContents = regexSync(targetFileContents, fileSync);
        break;
      case 'mirror':
        syncedContents = mirrorSync(fileSync);
        break;
      default:
        return consola.error('Unsupported file sync type');
    }

    if (dryRun) {
      console.log(syncedContents);
    } else {
      fs.writeFileSync(file, syncedContents);
    }
  });
};

export const runAllSyncs = (fileSyncs: FileSyncsType, dryRun = false) => {
  Object.keys(fileSyncs).forEach((fileSyncName) => {
    runSync(fileSyncs[fileSyncName], dryRun);
  });
};
