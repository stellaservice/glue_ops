const { readFileSync, rmSync } = require('fs');
const MergeHooks = require('./mergeHooks');

describe('MergeHooks', () => {
  const testPath = '/tmp/mergeHookTest.txt';

  it('runs hooks and has MERGE_SHA available in env', async () => {
    const hooks = [`/bin/bash -c "echo -n $MERGE_SHA" > ${testPath}`];
    const sha = 'a5024d32342sdfa3234';

    MergeHooks(hooks, sha);

    const contents = readFileSync(testPath, 'utf-8');
    expect(contents).toEqual(sha);
  });

  afterEach(() => {
    rmSync(testPath);
  });
});
