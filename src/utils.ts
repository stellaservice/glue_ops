import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
import type { Octokit as OctokitRest } from '@octokit/rest';

interface ClientArgs {
  apiBaseUrl?: string
  token?: string
}

export const RestGhClient = ({
  apiBaseUrl = 'https://api.github.com',
  token = process.env.GITHUB_TOKEN,
}: ClientArgs = {}): OctokitRest => (

  new Octokit({
    baseUrl: apiBaseUrl,
    auth: token,
  })
);

export const GraphqlGhClient = ({
  apiBaseUrl = 'https://api.github.com',
  token = process.env.GITHUB_TOKEN,
}: ClientArgs = {}): typeof graphql => (

  graphql.defaults({
    baseUrl: apiBaseUrl,
    headers: { authorization: `token ${token}` },
  })
);
