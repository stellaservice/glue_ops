#!/usr/bin/env node

/* eslint-disable no-unused-expressions */
/* eslint-disable global-require */

const yargs = require('yargs');
const consola = require('consola');

const defaultOptions = {
  configPathOption: {
    'config-path': {
      alias: 'c',
      type: 'string',
      default: 'glue_ops.yaml',
      description: 'Sets the config path',
    },
  },
};

yargs
  .usage('$0 <cmd> [args] \n\n The glue for GitOps')
  .scriptName('glue_ops')
  .command(require('./cmds/run'))
  .command(require('./cmds/publish'))
  .command(require('./cmds/merge'))
  .command(require('./cmds/sync'))
  .command(require('./cmds/template'))
  .option(defaultOptions.configPathOption)
  .demandCommand()
  .fail((message, error, yarg) => {
    if (error) {
      consola.error(error.message);
    } else {
      yarg.showHelp();
      console.error(`\n ${message}`);
    }
    process.exit(1);
  })
  .argv;
