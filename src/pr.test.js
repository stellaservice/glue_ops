const GhUrlParser = require('parse-github-url');
const pollyContext = require('../test/setup/setup_api_recording');
const { GhClient } = require('./utils');

const {
  createPr, cleanUpOldPrs, pollStatusCheck, approvePr, mergePr, findGlueOpsBotPrs,
} = require('./pr');

describe('PR', () => {
  beforeEach(() => {
    /* eslint-disable no-param-reassign */
    pollyContext.polly.server.any().on('beforePersist', (_, recording) => {
      recording.request.headers = recording.request.headers.filter(({ name }) => name !== 'authorization');
    });
    /* eslint-disable no-param-reassign */
  });

  let REPOSITORY_URL = new GhUrlParser('https://github.com/stellaservice/glue_ops');

  describe('createPR', () => {
    it('creates a PR and labels it', async () => {
      const pr = await createPr({
        title: 'testPR',
        owner: REPOSITORY_URL.owner,
        repo: REPOSITORY_URL.name,
        base: 'master',
        head: 'test3',
        jobName: 'TestPR',
      });

      expect(typeof (pr.data.number)).toBe('number');
    });
  });

  describe('cleanUpOldPrs', () => {
    it('deletes the existing PRs but not the current', async () => {
      await cleanUpOldPrs({
        owner: REPOSITORY_URL.owner,
        repo: REPOSITORY_URL.name,
        base: 'master',
        jobName: 'TestPR',
        newPrNumber: 8,
      });
    });
  });

  describe('cleanUpOldPrsPaginate', () => {
    it('can paginate through multiple pages of PRs', async () => {
      REPOSITORY_URL = new GhUrlParser('https://github.medallia.com/atlas/deployment');
      await cleanUpOldPrs({
        apiBaseUrl: 'https://github.medallia.com/api/v3',
        owner: REPOSITORY_URL.owner,
        repo: REPOSITORY_URL.name,
        base: 'master',
        jobName: 'TestPR',
        newPrNumber: 8,
      });
    });
  });

  describe('pollStatusCheck', () => {
    const repositoryUrl = new GhUrlParser('https://github.com/stellaservice/glueops-test-repo');

    it('returns true if mergable', async () => {
      const pr = { number: 1 };
      const returnValue = await pollStatusCheck(GhClient(), pr, repositoryUrl);

      expect(returnValue).toBe(true);
    });

    it('returns false if status checks are running', async () => {
      const pr = { number: 2 };
      const timeout = -1;
      const returnValue = await pollStatusCheck(GhClient(), pr, repositoryUrl, timeout);

      expect(returnValue).toBe(false);
    });
  });

  describe('approvePr', () => {
    const repositoryUrl = new GhUrlParser('https://github.com/stellaservice/glueops-test-repo');
    const pr = { number: 2 };

    it('creates a PR approval', async () => {
      const returnValue = await approvePr(GhClient(), pr, repositoryUrl);

      expect(returnValue.status).toBe(200);
    });
  });

  describe('mergePr', () => {
    const pr = { number: 3 };
    const repositoryUrl = new GhUrlParser('https://github.com/stellaservice/glueops-test-repo');
    const mergeMethod = 'squash';

    it('merges PR', async () => {
      const returnValue = await mergePr(GhClient(), pr, repositoryUrl, mergeMethod);

      expect(returnValue.status).toBe(200);
    });
  });

  describe('findGlueOpsBotPrs', () => {
    it('returns an array of botPrs', async () => {
      const repositoryUrl = new GhUrlParser('https://github.com/stellaservice/glueops-test-repo');
      const result = await findGlueOpsBotPrs(GhClient(), repositoryUrl.owner, repositoryUrl.name, 'main', 'TestJob');

      expect(result[0].number).toBe(2);
    });
  });
});
