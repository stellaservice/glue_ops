const { Octokit } = require('@octokit/rest');

const GhClient = (apiBaseUrl = 'https://api.github.com', token = process.env.GITHUB_TOKEN) => (
  new Octokit({
    baseUrl: apiBaseUrl,
    auth: token,
  })
);

module.exports = { GhClient };
