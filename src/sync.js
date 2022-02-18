const fs = require('fs');
const yaml = require('js-yaml')
const jp = require('jsonpath');

const runAllSyncs = (configuration, dryRun = false) => {
  configuration.jobs.forEach(job => {
    runSync(configuration.fileSyncs[job.fileSync], dryRun)
  })
}

const runSync = (fileSync, dryRun = false) => {
  fileSync.files.forEach(file => {
    const target_file_contents = fs.readFileSync(file);
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

const jpApply = (contents, fileSync) => {
  jp.apply(contents, `$${fileSync.target}`, (value) => {
    return fileSync.value;
  })

  return contents
}

const jsonSync = (target_file_contents, fileSync) => {
  let contents = JSON.parse(target_file_contents);

  contents = jpApply(contents, fileSync)

  return JSON.stringify(contents)
}

const yamlSync = (target_file_contents, fileSync) => {
  let contents = yaml.load(target_file_contents);

  contents = jpApply(contents, fileSync)

  return yaml.dump(contents, {
    lineWidth: -1,
    forceQuotes: true,
  })
}

const regexSync = (target_file_contents, fileSync) => {
  const contents = target_file_contents.toString();

  return contents.replace(new RegExp(fileSync.target), fileSync.value)
}

module.exports = { runAllSyncs, runSync }
