import JiraApi from 'jira-client';
import { config } from '../config';

// Initialize
const jira = new JiraApi({
  protocol: 'https',
  host: 'tools.hmcts.net',
  apiVersion: '2',
  strictSSL: true,
  base: '/jira',
  bearer: config.jiraToken,
});

export const run = async () => {
  const issues = await getIssues();
  const uniqueIssues = issues.reduce((acc, issue) => {
    acc[issue.key] = issue;
    return acc;
  }, {} as Record<string, JiraApi.IssueObject>);

  return Object.values(uniqueIssues).map(issue => ({
    id: issue.key,
    project_id: issue.fields.project.key,
    title: issue.fields.summary,
    type: issue.fields.issuetype.name,
    description: issue.fields.description,
    labels: issue.fields.labels.map((l: string) => l.toLowerCase()).join(','),
    status: issue.fields.status.name,
    status_category: issue.fields.status.statusCategory.name,
    creator: issue.fields.creator.name,
    assignee: issue.fields.assignee?.name,
    created_at: issue.fields.created,
    updated_at: issue.fields.updated,
    resolved_at: issue.fields.resolutiondate,
  }));
};

const getIssues = async (startAt = 0): Promise<JiraApi.IssueObject[]> => {
  const results = await jira.searchJira(`updated >= -30m`, { startAt });

  if (results.startAt + results.maxResults < results.total) {
    return [...results.issues, ...(await getIssues(startAt + results.maxResults))];
  } else {
    return results.issues;
  }
};
