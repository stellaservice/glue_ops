const consola = require('consola');
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
    consola.info(`Respository already exists: ${clonePath}`);
    return emptyPromise();
  }

  consola.info(`Cloning: ${repositoryUrl.href} to: ${clonePath}`);

  if (dryRun) return emptyPromise();

  fs.mkdirSync(clonePath, { recursive: true });
  const authRepoUrl = `${repositoryUrl.protocol}//${GITHUB_TOKEN}@${repositoryUrl.host}/${repositoryUrl.pathname}`;
  let response;
  try {
    response = await simpleGit().clone(authRepoUrl, clonePath);
  } catch (e) {
    consola.error(e.message);
    process.exit(1);
  }
  return response;
};

const configureGit = async (clonePath, dryRun) => {
  if (dryRun) return emptyPromise();

  const git = simpleGit({}, { config: ['user.name="GlueOpsBot"', 'user.email="glueops-bot@medallia.com"'] });
  await git.cwd({ path: clonePath, root: true });

  return git;
};

const checkoutBranch = ({ git, job, prBranchName }, dryRun = false) => {
  consola.info(`Checking out branch ${prBranchName} from ${job.branch}`);

  if (dryRun) return new Promise((resolve) => { resolve(); });

  return git
    .checkout(job.branch)
    .fetch()
    .reset('hard', [`origin/${job.branch}`])
    .checkoutBranch(prBranchName, job.branch);
};

const commitPushChanges = ({ git, prBranchName, commitMessage }, dryRun = false) => {
  consola.info(`Commiting: '${commitMessage}'\nPushing: ${prBranchName}`);

  if (dryRun) return new Promise((resolve) => { resolve(); });

  return git
    .add('.')
    .commit(commitMessage)
    .push('origin', prBranchName);
};

const runFilesyncs = (config, job, workingDirectory, dryRun) => {
  job.fileSyncs.forEach((sync) => {
    consola.info(`Running file sync: ${sync}`);

    if (!dryRun) {
      process.chdir(workingDirectory);
      runSync(config.fileSyncs[sync]);
    }
  });
};

const Publish = async (config, opts = { dryRun: false }) => {
  const repositoryUrl = new GhUrlParser(config.repository.url);

  let workingDirectory = process.cwd();

  if (!config.repository.local) {
    workingDirectory = `${config.repository.cloneDirectory}/${repositoryUrl.name}`;
  }

  initializeRepo(repositoryUrl, workingDirectory, opts.dryRun);
  const git = await configureGit(workingDirectory, opts.dryRun);

  for (let i = 0; i < config.jobs.length; i++) {
    const job = config.jobs[i];
    const prBranchName = `${job.name}-${uuid.v4()}`;
    const commitMessage = `GlueOps bot: ${job.name}`;

    await checkoutBranch({ git, job, prBranchName }, opts.dryRun);

    runFilesyncs(config, job, workingDirectory, opts.dryRun);

    await commitPushChanges({ git, prBranchName, commitMessage }, opts.dryRun);

    const prInfo = {
      title: commitMessage,
      owner: repositoryUrl.owner,
      repo: repositoryUrl.name,
      base: job.branch,
      head: prBranchName,
      jobName: job.name,
      apiBaseUrl: config.repository.apiBaseUrl,
    };

    if (opts.dryRun) {
      consola.info(`PR: ${prInfo.title}, From ${prInfo.head} to ${prInfo.base}`);
    } else {
      const pr = await createPr(prInfo);
      await cleanUpOldPrs({ ...prInfo, newPrNumber: pr.data.number });
    }
  }
};

module.exports = Publish;