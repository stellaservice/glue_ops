# Glue Ops

## Description
This project aims at improving automation in GitOps by helping you make changes to git repositories, publishing changes as pull requests, and merging pull requests.


```
glue_ops <cmd> [args]

The glue for GitOps

Commands:
  glue_ops run [jobName]              Runs publish and merge
  glue_ops publish [jobName]          Applies file syncs and publishes to
                                      repository
  glue_ops merge [jobName]            Merges PRs opened by GlueOps
  glue_ops rollback [jobName]         Runs rollbackPublish and merges PRs
  glue_ops rollbackPublish [jobName]  Creates rollback PRs
  glue_ops sync [syncName]            Applies your file syncs
  glue_ops template                   Prints your templated config file to
                                      STDOUT for debugging purposes

Options:
      --help         Show help                                         [boolean]
      --version      Show version number                               [boolean]
  -c, --config-path  Sets the config path    [string] [default: "glue_ops.yaml"]
```

## Install

```
npm install glue_ops
```

## Functionality

Glue Ops automates GitOps by:
1. Helping you automate changes to a file or group of files. *Command: [sync]*
2. Helping you automate the process of cloning, branching, committing, PRing changes and cleaning up old PRs. *Command: [publish]*
3. Helping you automate the process of waiting for PR status checks to pass, approve the PR and merge the PR. *Command: [merge]*
4. Helping you automate the process of rolling back your previous PR. *Command: [rollbackPublish]*

## Configuration:
glue_ops requires a configuration file (default glue_ops.yaml) to run.  It allows dynamic values via mustache templating.  Template values must be provided via the CLI with the `-r, --replacement-values` flag.  For multiple replacement values, use the flag multiple times.

Example:

`glue_ops sync -r foo=bar -r otherVar=foo`


Configuration schema:
```

repository:
  apiBaseUrl: https://github.enterpriserepo.com/api/v3 # Required for GH enterprise
  url: https://github.enterpriserepo.com/stellaservice/jenkins-testing # Required for remote repository
  local: true # Can be used to target the current working directory
  cloneDirectory: /tmp/glue_ops_repos # [default]

fileSyncs:
  namedSync:
    type: 'yaml' # Also supports json/regex
    target: ['path', 'to', 'replacement']
    value: {{{mustacheTemplating}}}
    files:
      - filePath1
      - filePath2
  namedMirrorSync:
    type: mirror
    synchronizationHash:
      enabled: false # [default] - Only use this if GlueOps is the exclusive author (mirroring)
      commentSyntax: '#' # [default]
    source:
      path: "path/from/rootDir" # Operates from source dir not cloned dir
    files: [filePath1, filePath2]

jobs:
  - name: UniqueName # Make this name unique (collisions for the same repo & base branch can be dangerous)
    fileSyncs: [] namedSync # This must be a reference to a named fileSync
    branch: master # Used to branch off of and PR back to
    approval:
      enabled: true # [default]
    merge:
      method: 'squash'  # [default] Can be one of: merge, squash, rebase
      pollPrTimeout: 600 # [default] (in seconds)
      hooks: [] # Arbitrary shell command hooks to be run post merge
```

## Authentication

For actions (run/publish/merge command) that rely on communicating with Github (cloning, PRing, merging) the CLI relies on the environment variable: `GITHUB_TOKEN` being set with proper scopes.

Additionally for PR approval functionality, typically the PR creator cannot be the PR approver.  To solve this the CLI will opt to use the environment variable `GITHUB_APPROVAL_TOKEN` if available.

This CLI has been tested with a personal access token including the following scopes: `repo, read:org`

## File Syncs

File syncs helps you automate changes to a file or group of files.  It currently supports targeting changes via YAML, JSON, and Regex. It can be used as part of a job which would include the branching and PR automation or completely independently ony requiring the `fileSyncs` configuration in your `glue_ops.yaml`

## Merge hooks

Merge hooks allows you to run arbitrary scripts post merge. This can be useful for monitoring changes to your infrastructure post merge. Additionally the environment will include: MERGE_SHA variable allowing you to associate an action with the current merge commit.

## Run command

The run command automates the entire process of publish/merge as a single call.  It implements the following steps:
1. Clones and checks out repository if necessary *[publish]*
2. Branches off your desired branch *[publish]*
3. Runs the fileSyncs for the job *[publish]*
4. Commits and pushes the changes *[publish]*
5. Creates a pull request for the changes *[publish]*
6. Deletes old PRs created by the job *[publish]*
7. Approves PR (w/ alternative token) *[merge]*
8. Polls PR status *[merge]*
9. Merges PR *[merge]*
10. Runs merge hooks if applicable *[merge]*

## Synchronization Hash
This feature leaves a comment at the top of modified files to indicate it was authored by a machine and includes a synchronization hash.
```
# This file is being modified by glue-ops. Do not edit manually.
# Synchronization-Hash: 84de908c8f0c39b395e91e815d2073d30ca9211611e6bfe81da305edf688fb0f
```

This hash is validated on future runs to ensure the file was not modified by someone other than GlueOps.  Validation failure will raise an error.  This is a saftey mechanism  to avoid overriding changes made outside the scope of GlueOps.  This is typically used with `type: mirror` where you only want changes to your desintation to come from the source defined in GlueOps.

If you use mirror and another sync on the same file for example a `type: yaml` you should also enabled synchronizationHash so that the hash will be updated with the changes from your YAML sync.  The YAML sync should come after the mirror.
