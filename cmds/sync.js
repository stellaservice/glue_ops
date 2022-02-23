const { runAllSyncs, runSync } = require('../src/sync');
const loadTemplatedConfiguration = require('../src/config');

const syncCommand = {
  command: 'sync',
  describe: 'Applies your file syncs',
  builder: {
    'replacement-values': {
      alias: 'r',
      describe: 'Used to replace templated values in your config. \n Example option: -r \'image_name=foo\'',
      type: 'string',
    },
    'dry-run': {
      type: 'boolean',
      describe: 'Prints file changes without updating the files',
      default: false,
    },
  },
  handler: (argv) => {
    const config = loadTemplatedConfiguration(argv.configPath, argv.replacementValues);
    runAllSyncs(config, argv.dryRun);
  },
};

module.exports = syncCommand;
