const fs = require('fs');
const yaml = require('js-yaml')
const yargs = require('yargs')
const jp = require('jsonpath');
const Mustache = require('mustache');

// const args = yargs(process.argv.slice(2)).argv


// yargs
//   .command('run', 'Applies replacements, and handles repository changes', (yargs) =>  (
//       yargs
//         .option('replacement_values',
//           { alias: 'r', describe: 'Used to replace templated values in your config. \n Example option: -r \'image_name=foo\'' }
//         )
//   ), (argv) => {
//     console.log(argv.replacement_values)
//   })
//   .command('replace', 'Runs your .glue_ops replacements')
//   .command('template', 'Prints your templated .glue_ops to STDOUT for debugging')
//   .argv


function loadConfiguration(templateVariables = '') {
  const file = fs.readFileSync('./glue_ops.yaml')
  const variables = parseCliReplacements(templateVariables)
  const templatedConfig = Mustache.render(file.toString(), variables)
  return yaml.load(templatedConfig);
}

function loadTargetFileContents(file, type) {
  const contents = fs.readFileSync(file);
  if (type === 'json') {
    return JSON.parse(contents);
  } else if (type === 'yaml') {
    return yaml.load(contents);
  }
}

function runReplacements(configuration) {
  configuration.replacements.forEach(replacement => {
    replacement.files.forEach(file => {
      const algorithm = configuration.replace_algorithm[replacement.replace_algorithm];
      const target_file_contents = loadTargetFileContents(file, algorithm.type);

      jp.apply(target_file_contents, `$${algorithm.target}`, (value) => {
        return algorithm.replaceValue;
      })

      console.log(target_file_contents);
    })
  })
}

function parseCliReplacements(replacements) {
  return replacements.replace(/\s+/g, '').split(',').reduce((options, currentOption) => {
    const optionKv = currentOption.split('=')
    options[optionKv[0]] = optionKv[1]
    return options
  }, {})
}

const templateVariables = "image_name=dockerhub:/foo"
const config = loadConfiguration(templateVariables)
runReplacements(config)
