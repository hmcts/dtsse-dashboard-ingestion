import { config } from '../config';
import { Axios } from 'axios';
import { getTeamName } from '../sonar/team';

const token = Buffer.from(config.sonarToken + ':').toString('base64');

const http = new Axios({
  baseURL: 'https://sonarcloud.io/api',
  headers: {
    Authorization: `Basic ${token}`,
    Accept: 'application/json',
    'Accept-Encoding': 'identity',
  },
});

const metrics = [
  'bugs',
  'code_smells',
  'cognitive_complexity',
  'critical_violations',
  'complexity',
  'last_commit_date',
  'duplicated_blocks',
  'duplicated_lines',
  'duplicated_lines_density',
  'files',
  'violations',
  'lines',
  'ncloc_language_distribution',
  'vulnerabilities',
  'coverage',
  'sqale_rating',
  'reliability_rating',
  'security_rating',
  'sqale_index',
  'quality_gate_details',
];

export const run = async () => {
  const projects = await getProjects();

  return Promise.all(projects.map(getMetrics));
};

const getProjects = async (page = 1, pageSize = 100): Promise<Project[]> => {
  const response = await http.get(`/projects/search?organization=hmcts&p=${page}&ps=${pageSize}`);
  const projects = JSON.parse(response.data);
  const filteredProjects = projects.components.filter(analysedRecently);

  if (projects.paging.total > page * pageSize) {
    return filteredProjects.concat(await getProjects(page + 1, pageSize));
  } else {
    return filteredProjects;
  }
};

const analysedRecently = (project: Project): boolean => {
  const lastAnalysis = new Date(project.lastAnalysisDate);
  const now = new Date();
  const diff = now.getTime() - lastAnalysis.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));

  return !isNaN(days) && days <= 90;
};

const getMetrics = async (project: Project): Promise<Row> => {
  const response = await http.get(`measures/component?component=${project.key}&metricKeys=${metrics.join(',')}`);
  const data = JSON.parse(response.data);
  const row: Row = {
    id: project.key,
    last_analysis_date: new Date(project.lastAnalysisDate),
    team: getTeamName(project.key),
  };

  for (const metric of metrics) {
    row[metric] = getMetric(metric, data.component.measures.find((m: any) => m.metric === metric)?.value);
  }

  return row;
};

const getMetric = (metric: string, value: string | undefined): string | number | Date | null => {
  switch (metric) {
    case 'last_commit_date':
      return value ? new Date(+value) : null;
    case 'ncloc_language_distribution':
      return value || null;
    case 'quality_gate_details':
      return value ? JSON.parse(value).level : 'UNKNOWN';
    default:
      return value ? +value : null;
  }
};

interface Project {
  organization: string;
  key: string;
  name: string;
  lastAnalysisDate: string;
}

type Row = Record<string, number | Date | string | null>;
