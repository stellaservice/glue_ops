#!/usr/bin/env node

const yargs = require('yargs')

const defaultOptions = {
  configPathOption: {
    'config-path': {
      alias: 'c',
      type: 'string',
      default: 'glue_ops.yaml',
      description: 'Sets the config path'
    }
  }
}

yargs
  .usage('$0 <cmd> [args] \n\n The glue for GitOps')
  .scriptName("glue_ops")
  .command(require('./cmds/run'))
  .command(require('./cmds/sync'))
  .command(require('./cmds/template'))
  .option(defaultOptions.configPathOption)
  .demandCommand()
  .argv


