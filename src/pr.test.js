const { Polly } = require('@pollyjs/core');
const { setupPolly } = require('setup-polly-jest');
const NodeHttpAdapter = require('@pollyjs/adapter-node-http');
const FSPersister = require('@pollyjs/persister-fs');
const ghUrlParser = require('parse-github-url');

const { createPr, cleanUpOldPrs } = require('./pr.js');

Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

describe('PR', () => {
  const context = setupPolly({ adapters: ['node-http'], persister: 'fs',
    mode: process.env['POLLY_RECORD'] === 'true' ? 'record' : 'replay',
    matchRequestsBy: {
      headers: false,
    }
  })

  beforeEach(() => {
    context.polly.server.any().on('beforePersist', (req, recording) => {
      recording.request.headers = recording.request.headers.filter(({ name }) => name !== 'authorization')
    })
  })

  const REPOSITORY_URL = new ghUrlParser('https://github.com/stellaservice/glue_ops')

  describe('createPR', () => {
    it('creates a PR and labels it', async () => {
      const pr = await createPr({
        title: 'testPR',
        owner: REPOSITORY_URL.owner,
        repo: REPOSITORY_URL.name,
        base: 'master',
        head: 'test3',
        jobName: 'TestPR'
      })

      expect(typeof(pr.data.number)).toBe('number')
    })
  })

  describe('cleanUpOldPrs', () => {
    it('deletes the existing PRs but not the current', async () => {
      await cleanUpOldPrs({
        owner: REPOSITORY_URL.owner,
        repo: REPOSITORY_URL.name,
        base: 'master',
        jobName: 'TestPR',
        newPrNumber: 8
      })
    })
  })

})
