const fs = require('fs');
const yaml = require('js-yaml')
const jp = require('jsonpath');

const runAllSyncs = (configuration, dryRun = false) => {
  configuration.jobs.forEach(job => {
    runSync(configuration.fileSyncs[job.file_sync], dryRun)
  })
}

const runSync = (fileSync, dryRun = false) => {
  fileSync.files.forEach(file => {
    let target_file_contents = loadTargetFileContents(file, fileSync.type)
    jp.apply(target_file_contents, `$${fileSync.target}`, (value) => {
      return fileSync.replacementValue;
    })

    switch (fileSync.type) {
      case 'json':
        target_file_contents = target_file_contents.toJson()
        break;
      case 'yaml':
        target_file_contents = yaml.dump(target_file_contents)
        break;
    }

    if (dryRun) {
      console.log(target_file_contents);
    } else {
      fs.writeFileSync(file, target_file_contents)
    }
  })
}

function loadTargetFileContents(file, type) {
  const contents = fs.readFileSync(file);
  if (type === 'json') {
    return JSON.parse(contents);
  } else if (type === 'yaml') {
    return yaml.load(contents);
  }
}

module.exports = { runAllSyncs, runSync }
