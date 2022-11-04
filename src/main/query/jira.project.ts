import JiraApi from 'jira-client';
import { config } from '../config';
import { store } from '../db/store';

const jira = new JiraApi({
  protocol: 'https',
  host: 'tools.hmcts.net',
  apiVersion: '2',
  strictSSL: true,
  base: '/jira',
  bearer: config.jiraToken,
});

export const run = async () => {
  const projects = await jira.listProjects();

  const rows = projects.flat().map(project => ({
    id: project.key,
    name: project.name,
  }));

  await store('jira.project', rows);
};
