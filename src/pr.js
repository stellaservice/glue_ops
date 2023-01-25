const consola = require('consola');
const LinkHeader = require('parse-link-header');
const { GhClient } = require('./utils');

const GLUE_OPS_BOT_LABEL = 'GlueOpsBot';

const createPr = async ({
  title, owner, repo, head, base, jobName, apiBaseUrl,
}) => {
  const gh = GhClient(apiBaseUrl);

  let pr;
  try {
    pr = await gh.rest.pulls.create({
      title, owner, repo, head, base,
    });

    await gh.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pr.data.number,
      labels: [GLUE_OPS_BOT_LABEL, jobName],
    });
  } catch (e) {
    consola.error(e.message);
    process.exit(1);
  }

  consola.success(`Created PR: ${pr.data.html_url}`);
  return pr;
};

const findGlueOpsBotPrs = async (ghClient, owner, repo, base, jobName) => {
  const prParams = {
    owner,
    repo,
    state: 'open',
    base,
    sort: 'created',
    direction: 'desc',
    per_page: 50,
  };

  let prs;
  try {
    prs = await ghClient.rest.pulls.list(prParams);
  } catch (e) {
    consola.error(e.message);
    process.exit(1);
  }
  let prData = prs.data;
  let link = LinkHeader(prs.headers.link);

  if (link) {
    while (link.next) {
      try {
        prs = await ghClient.rest.pulls.list({ page: link.next.page, ...prParams });
      } catch (e) {
        consola.error(e.message);
        process.exit(1);
      }
      prData = prData.concat(prs.data);
      link = LinkHeader(prs.headers.link);
    }
  }

  const botPrs = prData.filter((pr) => {
    const labelNames = pr.labels.map((label) => label.name);
    const labels = [GLUE_OPS_BOT_LABEL, jobName];

    return labels.every((label) => labelNames.includes(label));
  });

  return botPrs;
};

const cleanUpOldPrs = async ({
  owner, repo, base, jobName, newPrNumber, apiBaseUrl,
}) => {
  const ghClient = GhClient(apiBaseUrl);

  // Get all bot PRs filtering the newly opened PR
  const botPrs = await findGlueOpsBotPrs(ghClient, owner, repo, base, jobName);
  const oldPrs = botPrs.filter((pr) => pr.number !== newPrNumber);

  for (let i = 0; i < oldPrs.length; i++) {
    const botPr = oldPrs[i];

    try {
      // Close PR
      await ghClient.rest.pulls.update({
        owner,
        repo,
        state: 'closed',
        pull_number: botPr.number,
      });

      // Delete branch
      await ghClient.rest.git.deleteRef({
        owner,
        repo,
        ref: `heads/${botPr.head.ref}`,
      });
    } catch (e) {
      consola.error(e.message);
      process.exit(1);
    }
  }
};

const dateEpochSeconds = () => (
  Math.floor(Date.now() / 1000)
);

const approvePr = async (ghClient, pr, repositoryUrl) => {
  const { owner, name: repo } = repositoryUrl;

  try {
    const result = await ghClient.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pr.number,
      event: 'APPROVE',
    });
    consola.success(`PR approved: ${pr.number}`);
    return result;
  } catch (e) {
    consola.error(e.message);
    process.exit(1);
  }
};

const pollStatusCheck = async (ghClient, pr, repositoryUrl, timeout) => {
  const { owner, name: repo } = repositoryUrl;
  const startPollTime = dateEpochSeconds();

  while (true) {
    const pullState = await ghClient.pulls.get({ owner, repo, pull_number: pr.number });
    if (pullState.data.mergeable === true && pullState.data.mergeable_state === 'clean') {
      return true;
    }

    const timeElapsed = (dateEpochSeconds() - startPollTime);
    if (timeElapsed >= timeout) {
      return false;
    }

    const waitMs = 10000;
    consola.info(`PR not yet mergable, waiting: ${waitMs / 1000} seconds`);
    await new Promise((resolve) => { setTimeout(resolve, waitMs); });
  }
};

const mergePr = async (ghClient, pr, repositoryUrl, mergeMethod) => {
  const { owner, name: repo } = repositoryUrl;

  try {
    const result = await ghClient.rest.pulls.merge({
      owner,
      repo,
      merge_method: mergeMethod,
      pull_number: pr.number,
    });

    consola.success(`Merged PR: ${repositoryUrl.href}/pull/${pr.number}`);
    return result;
  } catch (e) {
    consola.error(e.message);
  }
};

module.exports = {
  createPr, cleanUpOldPrs, approvePr, mergePr, pollStatusCheck, findGlueOpsBotPrs,
};
