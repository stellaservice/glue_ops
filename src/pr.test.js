const GhUrlParser = require('parse-github-url');
const pollyContext = require('../test/setup/setup_api_recording');

const { createPr, cleanUpOldPrs } = require('./pr');

describe('PR', () => {
  beforeEach(() => {
    /* eslint-disable no-param-reassign */
    pollyContext.polly.server.any().on('beforePersist', (req, recording) => {
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
});
