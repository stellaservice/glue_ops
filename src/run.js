const fs = require('fs');
const simpleGit = require('simple-git');
const uuid = require('uuid');

const { runSync } = require('../src/sync')

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const run = async (config, dryRun) => {
  const repositoryUrl = new URL(config.repository.url)
  const cloneDirName = repositoryUrl.pathname.replace(/\//g,'')
  const clonePath = `${process.cwd()}/glue_ops_repos/${cloneDirName}`

  await initializeRepo(repositoryUrl, clonePath)
  const git = await configureGit(clonePath)

  for (i=0; i < config.jobs.length; i++) {
    const job = config.jobs[i]
    const prBranchName = `${job.fileSync}-${uuid.v4()}`

    try {
      await git
        .checkout(job.branch)
        .fetch()
        .reset('hard', [`origin/${job.branch}`])
        .checkoutBranch(prBranchName, job.branch)

      process.chdir(clonePath)
      runSync(config.fileSyncs[job.fileSync])

      await git
          .add('.')
          .commit(`GlueOps bot: ${job.fileSync}`)
          // .push()
    } catch(err) {
      console.log(err)
    }
  }
}

const initializeRepo = async (repositoryUrl, clonePath) => {
  if (!fs.existsSync(clonePath)) {
    fs.mkdirSync(clonePath, { recursive: true })
    const auth_repo_url = `${repositoryUrl.protocol}//${GITHUB_TOKEN}@${repositoryUrl.host}${repositoryUrl.pathname}`
    return await simpleGit().clone(auth_repo_url, clonePath)
  }
}

const configureGit = async (clonePath) => {
  const git = simpleGit()
  await git.cwd({ path: clonePath, root: true });
  await git
    .addConfig('user.name', 'GlueOps Bot')
    .addConfig('user.email', 'glueops-bot@medallia.com')

  return git
}

module.exports = run
