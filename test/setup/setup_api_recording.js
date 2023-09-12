const { setupPolly } = require('setup-polly-jest');
const NodeHttpAdapter = require('@pollyjs/adapter-node-http');
const FetchAdapter = require('@pollyjs/adapter-fetch'); // Needed with node18 builtin global fetch
const FSPersister = require('@pollyjs/persister-fs');

module.exports = setupPolly({
  adapters: [NodeHttpAdapter, FetchAdapter],
  persister: FSPersister,
  persisterOptions: {
    fs: {
      recordingsDir: 'test/recordings',
    },
  },
  mode: process.env.POLLY_RECORD === 'true' ? 'record' : 'replay',
  matchRequestsBy: {
    headers: false,
  },
  recordIfMissing: true
});
