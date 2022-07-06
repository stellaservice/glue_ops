const fs = require('fs');
const simpleGit = require('simple-git');
const uuid = require('uuid');
const GhUrlParser = require('parse-github-url');

const { runSync } = require('./sync');
const { createPr, cleanUpOldPrs } = require('./pr');

const emptyPromise = () => (
  new Promise((resolve) => { resolve(); })
);

const initializeRepo = async (repositoryUrl, clonePath, dryRun) => {
  const { GITHUB_TOKEN } = process.env;

  if (fs.existsSync(clonePath)) {
    console.log(`Respository already exists: ${clonePath}`);
    return emptyPromise();
  }

  console.log(`Cloning: ${repositoryUrl.href} to: ${clonePath}`);

  if (dryRun) return emptyPromise();

  fs.mkdirSync(clonePath, { recursive: true });
  const authRepoUrl = `${repositoryUrl.protocol}//${GITHUB_TOKEN}@${repositoryUrl.host}/${repositoryUrl.pathname}`;
  return simpleGit().clone(authRepoUrl, clonePath);
};

const configureGit = async (clonePath, dryRun) => {
  if (dryRun) return emptyPromise();

  const git = simpleGit({}, { config: ['user.name="GlueOpsBot"', 'user.email="glueops-bot@medallia.com"'] });
  await git.cwd({ path: clonePath, root: true });

  return git;
};

const checkoutBranch = ({ git, job, prBranchName }, dryRun = false) => {
  console.log(`Checking out branch ${prBranchName} from ${job.branch}`);

  if (dryRun) return new Promise((resolve) => { resolve(); });

  return git
    .checkout(job.branch)
    .fetch()
    .reset('hard', [`origin/${job.branch}`])
    .checkoutBranch(prBranchName, job.branch);
};

const commitPushChanges = ({ git, prBranchName, commitMessage }, dryRun = false) => {
  console.log(`Commiting: '${commitMessage}'\nPushing: ${prBranchName}`);

  if (dryRun) return new Promise((resolve) => { resolve(); });

  return git
    .add('.')
    .commit(commitMessage)
    .push('origin', prBranchName);
};

const runFilesyncs = (config, job, workingDirectory, dryRun) => {
  job.fileSyncs.forEach((sync) => {
    console.log(`Running file sync: ${sync}`);

    if (!dryRun) {
      process.chdir(workingDirectory);
      runSync(config.fileSyncs[sync]);
    }
  });
};

const run = async (config, dryRun) => {
  const repositoryUrl = new GhUrlParser(config.repository.url);

  let workingDirectory = process.cwd();

  if (!config.repository.local) {
    workingDirectory = `${config.repository.cloneDirectory
        || `${process.cwd()}/glue_ops_repos`}/${repositoryUrl.name}`;
  }

  await initializeRepo(repositoryUrl, workingDirectory, dryRun);
  const git = await configureGit(workingDirectory, dryRun);

  for (let i = 0; i < config.jobs.length; i++) {
    const job = config.jobs[i];
    const prBranchName = `${job.name}-${uuid.v4()}`;
    const commitMessage = `GlueOps bot: ${job.name}`;

    await checkoutBranch({ git, job, prBranchName }, dryRun);

    runFilesyncs(config, job, workingDirectory, dryRun);

    await commitPushChanges({ git, prBranchName, commitMessage }, dryRun);

    const prInfo = {
      title: commitMessage,
      owner: repositoryUrl.owner,
      repo: repositoryUrl.name,
      base: job.branch,
      head: prBranchName,
      jobName: job.name,
      apiBaseUrl: config.repository.apiBaseUrl,
    };

    if (dryRun) {
      console.log(`PR: ${prInfo.title}, From ${prInfo.head} to ${prInfo.base}`);
    } else {
      const pr = await createPr(prInfo);
      await cleanUpOldPrs({ ...prInfo, newPrNumber: pr.data.number });
    }
  }
};

module.exports = run;
