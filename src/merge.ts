import { consola } from 'consola';
import { RestGhClient as GhClient } from './utils';
import { ConfigurationType, CommandOptions } from './commonTypes';
import {
  approvePr, pollStatusCheck, mergePr, findGlueOpsBotPrs,
} from './pr';
import MergeHooks from './mergeHooks';
import { ROLLBACK_LABEL } from './rollbackPublish';

const GhUrlParser = require('parse-github-url');

const Merge = async (
  config: ConfigurationType,
  commandOpts: CommandOptions = { dryRun: false },
  mergeOpts: { rollback: boolean } = { rollback: false },
) => {
  const repositoryUrl = new GhUrlParser(config.repository.url);
  const { owner, name: repo } = repositoryUrl;
  const ghClient = GhClient({ apiBaseUrl: config.repository.apiBaseUrl });

  for (let i = 0; i < config.jobs.length; i++) {
    const job = config.jobs[i];

    let pr;
    if (commandOpts.dryRun === false) {
      const prs = await findGlueOpsBotPrs({
        ghClient,
        owner,
        repo,
        base: job.branch,
        jobName: job.name,
        additionalLabelsFilters: mergeOpts.rollback === true ? [ROLLBACK_LABEL] : [],
      });
      if (prs.length === 0) {
        consola.error('No PR found for this job');
        process.exit(1);
      }
      [pr] = prs;
    }

    if (job.approval.enabled) {
      consola.info('Approving PR');
      if (commandOpts.dryRun === false) {
        const approvalGhClient = GhClient({ apiBaseUrl: config.repository.apiBaseUrl, token: process.env.GITHUB_APPROVAL_TOKEN });
        await approvePr(approvalGhClient, pr, repositoryUrl);
      }
    }

    consola.info('Waiting for PR mergability');
    if (commandOpts.dryRun === false) {
      const pollResult = await pollStatusCheck(ghClient, pr, repositoryUrl, job.merge.pollPrTimeout);

      if (pollResult === false) {
        consola.fatal(`Timeout reached ${job.merge.pollPrTimeout} seconds.  No mergable PR found.`);
        process.exit(1);
      }
    }

    consola.info('Merging PR');
    let mergeResult;
    if (commandOpts.dryRun === false) {
      let commitMessage = job.merge.commit.message || undefined;
      if (commitMessage && job.merge.commit.includePrNumber) {
        commitMessage = `${commitMessage} (#${pr.number})`;
      }
      mergeResult = await mergePr(ghClient, pr, repositoryUrl, job.merge.method, commitMessage);
    }

    if (job.merge.hooks.length > 0) {
      consola.info('Running post merge hooks');
      if (commandOpts.dryRun === false) {
        MergeHooks(job.merge.hooks, mergeResult.data.sha);
      }
    }
  }
};

export default Merge;
