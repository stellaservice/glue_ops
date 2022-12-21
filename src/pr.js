const { Octokit } = require('@octokit/rest');
const LinkHeader = require('parse-link-header');

const GLUE_BOT_LABEL = 'GlueOpsBot';

const ghClient = (apiBaseUrl = 'https://api.github.com') => {
  const { GITHUB_TOKEN } = process.env;

  return new Octokit({
    baseUrl: apiBaseUrl,
    auth: GITHUB_TOKEN,
  });
};

const createPr = async ({
  title, owner, repo, head, base, jobName, apiBaseUrl,
}) => {
  const gh = ghClient(apiBaseUrl);

  const pr = await gh.rest.pulls.create({
    title, owner, repo, head, base,
  });

  await gh.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pr.data.number,
    labels: [GLUE_BOT_LABEL, jobName],
  });

  console.log(`Created PR: ${pr.data.html_url}`);
  return pr;
};

const cleanUpOldPrs = async ({
  owner, repo, base, jobName, newPrNumber, apiBaseUrl,
}) => {
  const gh = ghClient(apiBaseUrl);
  const prParams = {
    owner, repo, state: 'open', base, sort: 'created', direction: 'desc', per_page: 50,
  };

  // Get all pull requests
  let prs = await gh.rest.pulls.list(prParams);
  let prData = prs.data;
  let link = LinkHeader(prs.headers.link);

  if (link) {
    while (link.next) {
      prs = await gh.rest.pulls.list({ page: link.next.page, ...prParams });
      prData = prData.concat(prs.data);
      link = LinkHeader(prs.headers.link);
    }
  }

  // Find PRs created by this job (marked by labels)
  const botPrs = prData.filter((pr) => {
    const labelNames = pr.labels.map((label) => label.name);

    const labels = [GLUE_BOT_LABEL, jobName];
    const matchingLabels = labels.every((label) => labelNames.includes(label));

    return matchingLabels && pr.number !== newPrNumber;
  });

  for (let i = 0; i < botPrs.length; i++) {
    const botPr = botPrs[i];

    // Close PR
    await gh.rest.pulls.update({
      owner,
      repo,
      state: 'closed',
      pull_number: botPr.number,
    });

    // Delete branch
    await gh.rest.git.deleteRef({
      owner,
      repo,
      ref: `heads/${botPr.head.ref}`,
    });
  }
};

module.exports = { createPr, cleanUpOldPrs };
