import Publish from './publish';
import Merge from './merge';
import { ConfigurationType, CommandOptions } from './commonTypes';

const Run = async (config: ConfigurationType, opts: CommandOptions) => {
  await Publish(config, opts);
  await Merge(config, opts);
};

export default Run;
