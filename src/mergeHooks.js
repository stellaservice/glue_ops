const consola = require('consola');
const { execSync } = require('child_process');

const MergeHooks = (hooks, sha) => {
  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];

    consola.info(`Running: ${hook}`);
    execSync(hook, { env: { MERGE_SHA: sha }, stdio: 'inherit' });
  }
};

module.exports = MergeHooks;
