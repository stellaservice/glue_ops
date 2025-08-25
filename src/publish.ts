import { consola } from 'consola';
import { runSync } from './sync';
import { createPr, cleanUpOldPrs } from './pr';
import {
  ConfigurationType,
  CommandOptions,
  Job,
} from './commonTypes';
import { runInDirectory } from './utils';

const fs = require('fs');
const simpleGit = require('simple-git');
const uuid = require('uuid');
const GhUrlParser = require('parse-github-url');

const emptyPromise = () => (
  new Promise((resolve) => { resolve(undefined); })
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

  return simpleGit().clone(authRepoUrl, clonePath);
};

const configureGit = async (clonePath, dryRun) => {
  if (dryRun) return emptyPromise();

  const git = simpleGit({}, { config: ['user.name="GlueOpsBot"', 'user.email="glueops-bot@medallia.com"'] });
  await git.cwd({ path: clonePath, root: true });

  return git;
};

const checkoutBranch = ({ git, job, prBranchName }, dryRun = false) => {
  consola.info(`Checking out branch ${prBranchName} from ${job.branch}`);

  if (dryRun) return new Promise((resolve) => { resolve(undefined); });

  return git
    .checkout(job.branch)
    .fetch()
    .reset('hard', [`origin/${job.branch}`])
    .checkoutBranch(prBranchName, job.branch);
};

const commitPushChanges = ({ git, prBranchName, commitMessage }, dryRun = false) => {
  consola.info(`Commiting: '${commitMessage}'\nPushing: ${prBranchName}`);

  if (dryRun) return new Promise((resolve) => { resolve(undefined); });

  return git
    .add('.')
    .commit(commitMessage)
    .push('origin', prBranchName);
};

const runFilesyncs = (config: ConfigurationType, job: Job, sourceDirectory: string, workingDirectory: string, dryRun: boolean) => {
  job.fileSyncs.forEach((sync) => {
    consola.info(`Running file sync: ${sync}`);

    if (!dryRun) {
      runInDirectory(workingDirectory, () => {
        runSync(config.fileSyncs[sync], { sourceDirectory });
      });
    }
  });
};

const Publish = async (config: ConfigurationType, opts: CommandOptions = { dryRun: false }) => {
  const repositoryUrl = new GhUrlParser(config.repository.url);

  const sourceDirectory = process.cwd();
  let workingDirectory = sourceDirectory;

  if (!config.repository.local) {
    workingDirectory = `${config.repository.cloneDirectory}/${repositoryUrl.name}`;
  }

  await initializeRepo(repositoryUrl, workingDirectory, opts.dryRun);
  const git = await configureGit(workingDirectory, opts.dryRun);

  for (let i = 0; i < config.jobs.length; i++) {
    const job = config.jobs[i];
    const prBranchName = `${job.name}-${uuid.v4()}`;
    const commitMessage = `GlueOps bot: ${job.name}`;

    await checkoutBranch({ git, job, prBranchName }, opts.dryRun);

    runFilesyncs(config, job, sourceDirectory, workingDirectory, opts.dryRun);

    await commitPushChanges({ git, prBranchName, commitMessage }, opts.dryRun);

    const prInfo = {
      title: commitMessage,
      body: job.pr.body || commitMessage,
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

export default Publish;
