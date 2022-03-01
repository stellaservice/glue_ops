const { Polly } = require('@pollyjs/core');
const { setupPolly } = require('setup-polly-jest');
const NodeHttpAdapter = require('@pollyjs/adapter-node-http');
const FSPersister = require('@pollyjs/persister-fs');

Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

module.exports = setupPolly({
  adapters: ['node-http'],
  persister: 'fs',
  persisterOptions: {
    fs: {
      recordingsDir: 'test/recordings',
    },
  },
  mode: process.env.POLLY_RECORD === 'true' ? 'record' : 'replay',
  matchRequestsBy: {
    headers: false,
  },
});
