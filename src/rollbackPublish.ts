import { consola } from 'consola';
import { GraphqlGhClient, RestGhClient } from './utils';
import {
  findGlueOpsBotPrs,
  revertPr,
  addLabelsToPr,
} from './pr';
import { ConfigurationType, CommandOptions } from './commonTypes';

const GhUrlParser = require('parse-github-url');

export const ROLLBACK_LABEL = 'Rollback';

const RollbackPublish = async (config: ConfigurationType, opts: CommandOptions = { dryRun: false }) => {
  const graphQlClient = GraphqlGhClient({ apiBaseUrl: config.repository.apiBaseUrl });
  const restClient = RestGhClient({ apiBaseUrl: config.repository.apiBaseUrl });
  const repositoryUrl = new GhUrlParser(config.repository.url);

  for (let i = 0; i < config.jobs.length; i++) {
    // Find latest pull request created by GlueOps
    const job = config.jobs[i];

    const closedPrs = await findGlueOpsBotPrs({
      ghClient: restClient,
      owner: repositoryUrl.owner,
      repo: repositoryUrl.name,
      base: job.branch,
      jobName: job.name,
      state: 'closed',
      sort: 'updated',
      paginate: false,
    });

    const lastPrId = closedPrs[0].node_id;

    // Revert PR
    consola.info(`Reverting PR: ${closedPrs[0].url}`);
    let prNumber: number;
    if (opts.dryRun === false) {
      const body = job?.pr?.body || '';
      const revertPrResponse = await revertPr(graphQlClient, lastPrId, body);
      prNumber = revertPrResponse.revertPullRequest.revertPullRequest.number;
      consola.success(`Created revert PR: ${revertPrResponse.revertPullRequest.revertPullRequest.url}`);
    }

    // Add GlueOps labels
    if (opts.dryRun === false) {
      await addLabelsToPr({
        ghClient: restClient,
        repositoryUrl,
        prNumber,
        job,
        additionalLabels: [ROLLBACK_LABEL],
      });
    }
  }
};

export default RollbackPublish;
