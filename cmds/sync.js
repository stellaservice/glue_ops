const { runAllSyncs, runSync } = require('../src/sync');
const { commonOptionFlags } = require('./utils');
const loadTemplatedConfiguration = require('../src/config');

const syncCommand = {
  command: 'sync [syncName]',
  describe: 'Applies your file syncs',
  builder: commonOptionFlags,
  handler: (argv) => {
    const config = loadTemplatedConfiguration(argv.configPath, argv.replacementValues);
    if (argv.syncName) {
      if (config.fileSyncs[argv.syncName]) {
        runSync(config.fileSyncs[argv.syncName], argv.dryRun);
      } else {
        console.log('Sync name not found');
      }
    } else {
      runAllSyncs(config.fileSyncs, argv.dryRun);
    }
  },
};

module.exports = syncCommand;
