import JiraApi from 'jira-client';
import { config } from '../config';

const jira = new JiraApi({
  protocol: 'https',
  host: 'tools.hmcts.net',
  apiVersion: '2',
  strictSSL: true,
  base: '/jira',
  bearer: config.jiraToken,
});

const run = async () => {
  const projects = await jira.listProjects();

  return projects.flat().map(project => ({
    id: project.key,
    name: project.name,
  }));
};

export default run;
