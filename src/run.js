const Merge = require('./merge');
const Publish = require('./publish');

const Run = async (config, opts) => {
  await Publish(config, opts);
  await Merge(config, opts);
};

module.exports = Run;
