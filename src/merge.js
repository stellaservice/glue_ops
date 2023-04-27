const consola = require('consola');
const GhUrlParser = require('parse-github-url');
const { GhClient } = require('./utils');
const MergeHooks = require('./mergeHooks');
const {
  approvePr, pollStatusCheck, mergePr, findGlueOpsBotPrs,
} = require('./pr');

const Merge = async (config, opts = { dryRun: false }) => {
  const repositoryUrl = new GhUrlParser(config.repository.url);
  const { owner, name: repo } = repositoryUrl;
  const ghClient = GhClient(config.repository.apiBaseUrl);

  for (let i = 0; i < config.jobs.length; i++) {
    const job = config.jobs[i];

    let pr;
    if (opts.dryRun === false) {
      const prs = await findGlueOpsBotPrs(ghClient, owner, repo, job.branch, job.name);
      if (prs.length === 0) {
        consola.error('No PR found for this job');
        process.exit(1);
      }
      [pr] = prs;
    }

    if (job.approval.enabled) {
      consola.info('Approving PR');
      if (opts.dryRun === false) {
        const approvalGhClient = GhClient(config.repository.apiBaseUrl, process.env.GITHUB_APPROVAL_TOKEN);
        await approvePr(approvalGhClient, pr, repositoryUrl);
      }
    }

    consola.info('Waiting for PR mergability');
    if (opts.dryRun === false) {
      const pollResult = await pollStatusCheck(ghClient, pr, repositoryUrl, job.merge.pollPrTimeout);

      if (pollResult === false) {
        consola.info(`Timeout reached ${job.merge.pollPrTimeout} seconds.  No mergable PR found.`);
        process.exit(1);
      }
    }

    consola.info('Merging PR');
    let mergeResult;
    if (opts.dryRun === false) {
      mergeResult = await mergePr(ghClient, pr, repositoryUrl, job.merge.method);
    }

    if (job.merge.hooks.length > 0) {
      consola.info('Running post merge hooks');
      if (opts.dryRun === false) {
        MergeHooks(job.merge.hooks, mergeResult.data.sha);
      }
    }
  }
};

module.exports = Merge;
