import { Octokit } from '@octokit/rest';
import { config } from '../config';
import { Axios } from 'axios';

export const octokit = new Octokit({
  auth: `token ${config.githubToken}`,
});

export const listRepos = async () => {
  return JSON.stringify(await octokit.paginate(octokit.rest.repos.listForOrg, { org: 'hmcts' }));
};

export const listUpTo100PRsSince = async (isoDateSince: string) => {
  return (
    await octokit.rest.issues.list({
      filter: 'all',
      state: 'all',
      pulls: true,
      sort: 'updated',
      direction: 'asc',
      per_page: 100,
      since: isoDateSince,
    })
  ).data;
};

export const listPR = async (name: string, number: number) => {
  return await octokit.rest.pulls.get({
    owner: 'hmcts',
    repo: name,
    pull_number: number,
  });
};

const token = Buffer.from(config.sonarToken + ':').toString('base64');

const http = new Axios({
  baseURL: 'https://sonarcloud.io/api',
  headers: {
    Authorization: `Basic ${token}`,
    Accept: 'application/json',
    'Accept-Encoding': 'identity',
  },
});

export const getSonarProjects = async (page = 1, pageSize = 100) => {
  return (await http.get(`/projects/search?organization=hmcts&p=${page}&ps=${pageSize}`)).data;
};

export const getSonarProject = async (project: string, metrics: string[]) => {
  return (await http.get(`measures/component?component=${project}&metricKeys=${metrics.join(',')}`)).data;
};
