import { FileSyncType, FileSyncsType } from './commonTypes';

const consola = require('consola');
const fs = require('fs');
const YAML = require('yaml');
const { YAMLMap } = require('yaml');
const jp = require('jsonpath');

Object.getPrototypeOf(YAMLMap).maxFlowStringSingleLineLength = 10000; // Stops yaml collections from wrapping

const jsonSync = (targetFileContents: string, fileSync: FileSyncType) => {
  const contents = JSON.parse(targetFileContents);

  const target = <string[]>fileSync.target;
  const jsonPath = target.map((i) => `['${i}']`).join('');
  jp.apply(contents, `$${jsonPath}`, () => fileSync.value);

  return JSON.stringify(contents, null, 2);
};

const yamlSync = (targetFileContents: string, fileSync: FileSyncType) => {
  const doc = YAML.parseDocument(targetFileContents);

  doc.setIn(fileSync.target, fileSync.value);

  return doc.toString({ lineWidth: 0, minContentWidth: 0 });
};

const regexSync = (targetFileContents: string, fileSync: FileSyncType) => {
  const contents = targetFileContents.toString();

  const target = <string>fileSync.target;
  return contents.replace(new RegExp(target), fileSync.value);
};

export const runSync = (fileSync: FileSyncType, dryRun = false) => {
  fileSync.files.forEach((file) => {
    const targetFileContents = fs.readFileSync(file, 'utf8');
    let syncedContents = '';

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
