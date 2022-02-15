const runCommand = {
  command: 'run',
  describe: 'Applies file syncs and publishes repository changes',
  builder: {
    'replacement-values': {
        alias: 'r',
        describe: 'Used to replace templated values in your config. \n Example option: -r \'image_name=foo\''
    },
    'dry-run': {
      type: 'boolean',
      describe: 'Prints file changes without updating the files',
      default: false
    }
  },
  handler: (argv) => {
    console.log("Running")
  }
}

module.exports = runCommand
