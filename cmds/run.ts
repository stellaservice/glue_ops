import { commonOptionFlags, prepareConfig, CommonArgv } from './utils';
import Run from '../src/run';

const runCommand = {
  command: 'run [jobName]',
  describe: 'Runs publish and merge',
  builder: commonOptionFlags,
  handler: (argv: CommonArgv) => {
    const config = prepareConfig(argv);
    return Run(config, { dryRun: argv.dryRun });
  },
};

export default runCommand;
