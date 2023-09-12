import RollbackPublish from './rollbackPublish';
import Merge from './merge';
import { ConfigurationType, CommandOptions } from './commonTypes';

const Rollback = async (config: ConfigurationType, opts: CommandOptions) => {
  await RollbackPublish(config, opts);
  await Merge(config, opts, { rollback: true });
};

export default Rollback;
