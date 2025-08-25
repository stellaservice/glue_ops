import { consola } from 'consola';
import loadTemplatedConfiguration from '../src/config';
import { runAllSyncs, runSync } from '../src/sync';
import { commonOptionFlags, CommonArgv } from './utils';

const syncCommand = {
  command: 'sync [syncName]',
  describe: 'Applies your file syncs',
  builder: commonOptionFlags,
  handler: (argv: CommonArgv) => {
    const config = loadTemplatedConfiguration(argv.configPath, argv.replacementValues);
    if (argv.syncName) {
      if (config.fileSyncs[argv.syncName]) {
        return runSync(config.fileSyncs[argv.syncName], { dryRun: argv.dryRun });
      }
      consola.error('Sync name not found');
      process.exit(1);
    } else {
      return runAllSyncs(config.fileSyncs, argv.dryRun);
    }
  },
};

export default syncCommand;
