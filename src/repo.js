const fs = require('fs');
const Git = require("nodegit");

const run = async (config) => {
  const repo = await initializeRepo(config)
}

const initializeRepo = (config) => {
  const cloneDir = new URL(config.repository.url).pathname.replace(/\//g,'')
  const clonePath = `${process.cwd()}/glue_ops_repos/${cloneDir}`

  if (fs.existsSync(clonePath)) {
    return Git.Repository.init(clonePath, 0)
  } else {
    return clone(config.repository.url, clonePath)
  }
}

const clone = (repositoryUrl, clonePath) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const cloneOptions = {
    fetchOpts: {
      callbacks: {
        certificateCheck: function() { return 0; },
        credentials: function() {
          return Git.Cred.userpassPlaintextNew(GITHUB_TOKEN, "x-oauth-basic");
        }
      }
    }
  };

  return Git.Clone(repositoryUrl, clonePath, cloneOptions)
}

// const branch_prefix=`update-${config.repository}-$app-image`

const git_config = {
  user: {
    name: 'GitOps Bot',
    email: 'gitops-bot@medallia.com'
  }
}

const config = {
  repository: {
    url: 'https://github.com/stellaservice/k2'
  }
}
// initializeRepo(config)
run(config)
