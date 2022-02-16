const loadTemplatedConfiguration = require('../src/config')

const templateCommand = {
  command: 'template',
  describe: 'Prints your templated config file to STDOUT for debugging purposes',
  builder: {
  'replacement-values': {
      alias: 'r',
      describe: 'Used to replace templated values in your config. \n Example option: -r \'image_name=foo\''
    }
  },
  handler: (argv) => {
    const config = loadTemplatedConfiguration(argv.configPath, argv.replacementValues);
    console.log(config)
  }
}

module.exports = templateCommand
