const fs = require('fs');
const simpleGit = require('simple-git');
const { createPr, cleanUpOldPrs } = require('./pr');
const Publish = require('./publish');
const readYamlFile = require('../test/utils/readYamlFile');
const loadTemplatedConfiguration = require('./config');

jest.mock('simple-git', () => {
  const mGit = jest.requireActual('simple-git')({}, { config: ['user.name="test"', 'user.email="test@test.com"'] });

  mGit.clone = jest.fn(() => {
    /* eslint-disable global-require */
    const fsExtra = require('fs-extra');
    /* eslint-disable global-require */
    const testRepoPath = '/tmp/glue_ops_repos/testRepo';
    fsExtra.copySync('./test/fixtures/testRepo', testRepoPath);
    fsExtra.moveSync(`${testRepoPath}/.git.fake`, `${testRepoPath}/.git`);
  });
  mGit.fetch = jest.fn(() => (mGit));
  mGit.reset = jest.fn(() => (mGit));
  mGit.push = jest.fn(() => (new Promise((resolve) => { setTimeout(() => { resolve(mGit); }, 100); })));

  return jest.fn(() => mGit);
});

jest.mock('./pr', () => {
  const mPr = {
    createPr: jest.fn(() => ({ data: { number: 3 } })),
    cleanUpOldPrs: jest.fn(),
  };

  return mPr;
});

describe('Publish', () => {
  const OLD_ENV = process.env;
  const OLD_CWD = process.cwd();
  const config = loadTemplatedConfiguration('test/fixtures/glue_ops_jobs_standard.yaml');
  const ghToken = 'ghToken';
  const { cloneDirectory, url: repositoryUrl } = config.repository;
  const repoPath = `${cloneDirectory}/${repositoryUrl.split('/').slice(-1)}`;
  const { branch: baseBranch, name: jobName } = config.jobs[0];
  const commitMessage = `GlueOps bot: ${jobName}`;
  const syncReplacmentValue = config.fileSyncs.UpdateWebImage.value;

  beforeEach(() => {
    process.env = { GITHUB_TOKEN: ghToken };
    fs.rmdirSync(cloneDirectory, { recursive: true });
  });

  afterEach(() => {
    fs.rmdirSync(cloneDirectory, { recursive: true });
    jest.clearAllMocks();
    process.env = OLD_ENV;
    process.chdir(OLD_CWD);
  });

  it('checks out a branch, runs syncs, commits and PRs changes', async () => {
    const git = await simpleGit();

    await Publish(config);

    expect(git.clone).toBeCalledWith(
      `https://ghToken@${repositoryUrl.split('https://').slice(-1)}`,
      repoPath,
    );

    await git.cwd(repoPath);
    const branchSummary = await git.branch();

    // Test branch creation
    const testBranch = Object.keys(branchSummary.branches).find((b) => b.match(jobName));
    expect(testBranch).toBeDefined();
    expect(branchSummary.branches[testBranch].current).toBe(true);

    // Test change commited
    const log = await git.log();
    expect(log.latest.message).toBe(commitMessage);
    const syncedFile = readYamlFile(`${config.repository.cloneDirectory}/testRepo/config.yaml`);
    expect(syncedFile.image.tag).toBe(syncReplacmentValue);

    // Test push called
    expect(git.push).toBeCalledWith('origin', testBranch);

    // Test PR integration
    const prInfo = { base: baseBranch, title: commitMessage };
    expect(createPr).toBeCalledWith(expect.objectContaining(prInfo));
    expect(cleanUpOldPrs).toBeCalledWith(expect.objectContaining({ ...prInfo, newPrNumber: 3 }));
  });

  describe('when dryRun is set', () => {
    it('doesn\'t attempt to make any changes', async () => {
      const git = await simpleGit();

      await Publish(config, { dryRun: true });

      expect(git.clone).not.toBeCalled();
      expect(git.fetch).not.toBeCalled();
      expect(git.reset).not.toBeCalled();
      expect(git.push).not.toBeCalled();
      expect(createPr).not.toBeCalled();
      expect(cleanUpOldPrs).not.toBeCalled();
    });
  });
});
