#!/usr/bin/env node

const yargs = require('yargs')

const configPathOption = {
  'config-path': {
    alias: 'c',
    type: 'string',
    default: 'glue_ops.yaml',
    description: 'Sets the config path'
  }
}

yargs
  .command(require('./cmds/run'))
  .command(require('./cmds/sync'))
  .command(require('./cmds/template'))
  .option(configPathOption)
  .demandCommand()
  .argv


