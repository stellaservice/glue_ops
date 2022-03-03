const fs = require('fs');
const YAML = require('yaml');
const { YAMLMap } = require('yaml');
const jp = require('jsonpath');

Object.getPrototypeOf(YAMLMap).maxFlowStringSingleLineLength = 10000; // Stops yaml collections from wrapping

const jsonSync = (targetFileContents, fileSync) => {
  const contents = JSON.parse(targetFileContents);

  const jsonPath = fileSync.target.map((i) => `['${i}']`).join('');
  jp.apply(contents, `$${jsonPath}`, () => fileSync.value);

  return JSON.stringify(contents, null, 2);
};

const yamlSync = (targetFileContents, fileSync) => {
  const doc = YAML.parseDocument(targetFileContents);

  doc.setIn(fileSync.target, fileSync.value);

  return doc.toString({ lineWidth: 0, minContentWidth: 0 });
};

const regexSync = (targetFileContents, fileSync) => {
  const contents = targetFileContents.toString();

  return contents.replace(new RegExp(fileSync.target), fileSync.value);
};

const runSync = (fileSync, dryRun = false) => {
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
        return console.log('Unsupported file sync type');
    }

    if (dryRun) {
      console.log(syncedContents);
    } else {
      fs.writeFileSync(file, syncedContents);
    }
  });
};

const runAllSyncs = (configuration, dryRun = false) => {
  Object.keys(configuration.fileSyncs).forEach((fileSyncName) => {
    runSync(configuration.fileSyncs[fileSyncName], dryRun);
  });
};

module.exports = { runAllSyncs, runSync };
