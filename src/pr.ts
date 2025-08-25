import { consola } from 'consola';
import type { GraphQlQueryResponseData } from '@octokit/graphql';
import type { Octokit as OctokitRest } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
import type { Job } from './commonTypes';
import { RestGhClient as GhClient } from './utils';

const LinkHeader = require('parse-link-header');

const GLUE_OPS_BOT_LABEL = 'GlueOpsBot';

export const createPr = async ({
  title, body, owner, repo, head, base, jobName, apiBaseUrl,
}) => {
  const gh = GhClient({ apiBaseUrl });

  let pr;
  try {
    pr = await gh.rest.pulls.create({
      title, body, owner, repo, head, base,
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

interface FindGlueOpsBotPrsOptions {
  ghClient: OctokitRest
  owner: string
  repo: string
  base: string
  jobName: string
  state?: 'open' | 'closed' | 'all'
  sort?: 'created' | 'updated' | 'popularity' | 'long-running'
  paginate?: boolean
  additionalLabelsFilters?: string[]
}

export const findGlueOpsBotPrs = async ({
  ghClient,
  owner,
  repo,
  base,
  jobName,
  state = 'open',
  sort = 'created',
  paginate = true,
  additionalLabelsFilters = [],
}: FindGlueOpsBotPrsOptions) => {
  const prParams = {
    owner,
    repo,
    state,
    base,
    sort,
    direction: <'desc' | 'asc'>'desc',
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

  if (link && paginate === true) {
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
    const labels = [GLUE_OPS_BOT_LABEL, jobName].concat(additionalLabelsFilters);

    return labels.every((label) => labelNames.includes(label));
  });

  return botPrs;
};

export const cleanUpOldPrs = async ({
  owner, repo, base, jobName, newPrNumber, apiBaseUrl,
}) => {
  const ghClient = GhClient({ apiBaseUrl });

  // Get all bot PRs filtering the newly opened PR
  const botPrs = await findGlueOpsBotPrs({
    ghClient, owner, repo, base, jobName,
  });
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

export const approvePr = async (ghClient: OctokitRest, pr: { number: number }, repositoryUrl: RepositoryUrlType) => {
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

export const updatePrBase = async (
  ghClient: OctokitRest,
  prData: PrDetails,
) => {
  consola.info("PR's branch is behind upstream, updating branch with latest changes");
  await ghClient.rest.pulls.updateBranch({ ...prData });
};

export const pollStatusCheck = async (ghClient: OctokitRest, pr, repositoryUrl: RepositoryUrlType, timeout: number) => {
  const { owner, name: repo } = repositoryUrl;
  const startPollTime = dateEpochSeconds();

  while (true) {
    const prData = { owner, repo, pull_number: pr.number };
    const pullState = await ghClient.pulls.get(prData);
    if (pullState.data.mergeable === true && pullState.data.mergeable_state === 'clean') {
      return true;
    }

    if (pullState.data.mergeable_state === 'behind') {
      updatePrBase(ghClient, prData);
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

export const mergePr = async (
  ghClient: OctokitRest,
  pr: { number: number },
  repositoryUrl: RepositoryUrlType,
  mergeMethod: 'merge' | 'squash' | 'rebase',
) => {
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

export const revertPr = async (ghGraphQlClient: typeof graphql, pullRequestId: string, body: string): Promise<GraphQlQueryResponseData> => {
  const response: GraphQlQueryResponseData = await ghGraphQlClient({
    query: `mutation revertPR($input: RevertPullRequestInput!) {
                 revertPullRequest(input: $input) {
                   revertPullRequest {
                     id
                     url
                     number
                   }
                 }
               }
    `,
    input: { pullRequestId, body },
  });

  return response;
};

interface RepositoryUrlType {
  owner: string
  name: string
  href: string
}

interface AddLabelsInput {
  ghClient: OctokitRest
  repositoryUrl: RepositoryUrlType
  prNumber: number
  job: Job
  additionalLabels?: string[]
}

interface PrDetails {
  owner: string,
  repo: string,
  pull_number: number,
}

export const addLabelsToPr = async ({
  ghClient,
  repositoryUrl,
  prNumber,
  job,
  additionalLabels = [],
}: AddLabelsInput) => (

  ghClient.rest.issues.addLabels({
    owner: repositoryUrl.owner,
    repo: repositoryUrl.name,
    issue_number: prNumber,
    labels: [GLUE_OPS_BOT_LABEL, job.name].concat(additionalLabels),
  })
);
