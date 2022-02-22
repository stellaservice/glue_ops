const fs = require('fs');
const YAML = require('yaml')
const { YAMLMap } = require('yaml')
const jp = require('jsonpath');

Object.getPrototypeOf(YAMLMap).maxFlowStringSingleLineLength = 10000 // Stops yaml collections from wrapping

const runAllSyncs = (configuration, dryRun = false) => {
  configuration.jobs.forEach(job => {
    runSync(configuration.fileSyncs[job.fileSync], dryRun)
  })
}

const runSync = (fileSync, dryRun = false) => {
  fileSync.files.forEach(file => {
    const target_file_contents = fs.readFileSync(file, 'utf8');
    let synced_contents = ''

    switch (fileSync.type) {
      case 'json':
        synced_contents = jsonSync(target_file_contents, fileSync)
        break;
      case 'yaml':
        synced_contents = yamlSync(target_file_contents, fileSync)
        break;
      case 'regex':
        synced_contents = regexSync(target_file_contents, fileSync)
        break;
    }

    if (dryRun) {
      console.log(synced_contents);
    } else {
      fs.writeFileSync(file, synced_contents)
    }
  })
}

const jsonSync = (target_file_contents, fileSync) => {
  let contents = JSON.parse(target_file_contents);

  const jsonPath = fileSync.target.map(i => `['${i}']`).join('')
  jp.apply(contents, `$${jsonPath}`, (value) => {
    return fileSync.value;
  })

  return JSON.stringify(contents)
}

const yamlSync = (target_file_contents, fileSync) => {
  let doc = YAML.parseDocument(target_file_contents);

  doc.setIn(fileSync.target, fileSync.value)

  return doc.toString({ lineWidth: 0, minContentWidth: 0 })
}

const regexSync = (target_file_contents, fileSync) => {
  const contents = target_file_contents.toString();

  return contents.replace(new RegExp(fileSync.target), fileSync.value)
}

module.exports = { runAllSyncs, runSync }
