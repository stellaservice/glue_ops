const fs = require('fs');
const simpleGit = require('simple-git');
const uuid = require('uuid');
const GhUrlParser = require('parse-github-url');

const { runSync } = require('./sync');
const { createPr, cleanUpOldPrs } = require('./pr');

const { GITHUB_TOKEN } = process.env;

const initializeRepo = async (repositoryUrl, clonePath) => {
  if (!fs.existsSync(clonePath)) {
    fs.mkdirSync(clonePath, { recursive: true });
    const authRepoUrl = `${repositoryUrl.protocol}//${GITHUB_TOKEN}@${repositoryUrl.host}/${repositoryUrl.pathname}`;
    console.log(`Cloning: ${repositoryUrl.href} to: ${clonePath}`);
    return simpleGit().clone(authRepoUrl, clonePath);
  }
  console.log(`Respository already exists: ${clonePath}`);
};

const configureGit = async (clonePath) => {
  const git = simpleGit();
  await git.cwd({ path: clonePath, root: true });
  await git
    .addConfig('user.name', 'GlueOpsBot')
    .addConfig('user.email', 'glueops-bot@medallia.com');

  return git;
};

const run = async (config, dryRun) => {
  const repositoryUrl = new GhUrlParser(config.repository.url);
  const cloneDirName = repositoryUrl.repo.replace(/\//g, '');
  const clonePath = `${process.cwd()}/glue_ops_repos/${cloneDirName}`;

  await initializeRepo(repositoryUrl, clonePath);
  const git = await configureGit(clonePath);

  for (let i = 0; i < config.jobs.length; i++) {
    const job = config.jobs[i];
    const prBranchName = `${job.name}-${uuid.v4()}`;

    try {
      await git
        .checkout(job.branch)
        .fetch()
        .reset('hard', [`origin/${job.branch}`])
        .checkoutBranch(prBranchName, job.branch);

      process.chdir(clonePath);
      runSync(config.fileSyncs[job.fileSync]);

      const commitMessage = `GlueOps bot: ${job.name}`;
      await git
        .add('.')
        .commit(commitMessage)
        .push('origin', prBranchName);

      const prInfo = {
        title: commitMessage,
        owner: repositoryUrl.owner,
        repo: repositoryUrl.name,
        base: job.branch,
        head: prBranchName,
        jobName: job.name,
        apiBaseUrl: config.repository.apiBaseUrl,
      };

      const pr = await createPr(prInfo);
      await cleanUpOldPrs({ ...prInfo, newPrNumber: pr.data.number });
    } catch (err) {
      console.log(err);
    }
  }
};

module.exports = run;
