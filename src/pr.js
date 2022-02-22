const { Octokit } = require("@octokit/rest");

const GLUE_BOT_LABEL = "GlueOpsBot"

const createPr = async ({ title, owner, repo, head, base, jobName, apiBaseUrl }) => {
  const gh = ghClient(apiBaseUrl)

  const pr = await gh.rest.pulls.create({ title, owner, repo, head, base });

  await gh.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pr.data.number,
    labels: [GLUE_BOT_LABEL, jobName]
  })

  console.log(`Created PR: ${pr.data.number}`)
  return pr
}

const cleanUpOldPrs = async ({ owner, repo, base, jobName, newPrNumber, apiBaseUrl }) => {
  const gh = ghClient(apiBaseUrl)

  const prs = await gh.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    base,
    sort: 'created',
    direction: 'desc'
  });

  // Get PRs created by this job
  const botPrs = prs.data.filter(pr => {
    const labelNames = pr.labels.map(label => {
      return label.name
    })

    const labels = [GLUE_BOT_LABEL, jobName]
    const matchingLabels = labels.every(label => {
      return labelNames.includes(label);
    });

    return matchingLabels && pr.number !== newPrNumber
  })

  for (i = 0; i < botPrs.length; i++) {
    const botPr = botPrs[i]

    // Close PR
    const closePR = await gh.rest.pulls.update({
      owner,
      repo,
      state: 'closed',
      pull_number: botPr.number,
    });

    // Delete branch
    const branchRes = await gh.rest.git.deleteRef({
      owner,
      repo,
      ref: `heads/${botPr.head.ref}`
    });
  }
}

const ghClient = (apiBaseUrl = 'https://api.github.com') => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  return new Octokit({
    baseUrl: apiBaseUrl,
    auth: GITHUB_TOKEN,
  });
}


module.exports = { createPr, cleanUpOldPrs }
