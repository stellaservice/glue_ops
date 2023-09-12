#!/usr/bin/env node

/* eslint-disable no-unused-expressions */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { DefaultOptions } from './cmds/utils';
import runCommand from './cmds/run';
import publishCommand from './cmds/publish';
import mergeCommand from './cmds/merge';
import syncCommand from './cmds/sync';
import rollbackPublishCommand from './cmds/rollbackPublish';
import rollbackCommand from './cmds/rollback';
import templateCommand from './cmds/template';

const yargs = require('yargs');
const consola = require('consola');

yargs
  .usage('$0 <cmd> [args] \n\n The glue for GitOps')
  .scriptName('glue_ops')
  .command(runCommand)
  .command(publishCommand)
  .command(mergeCommand)
  .command(rollbackCommand)
  .command(rollbackPublishCommand)
  .command(syncCommand)
  .command(templateCommand)
  .option(DefaultOptions.configPathOption)
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
