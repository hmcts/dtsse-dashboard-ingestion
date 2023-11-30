import { getSonarProject, getSonarProjects } from '../github/rest';
import { Pool } from 'pg';

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

export const run = async (pool: Pool) => {
  const projects = await getProjects();

  const results = await Promise.all(projects.map(getMetrics));
  const sql = `
  insert into sonar.project
  select r.* 
  from jsonb_array_elements($1::jsonb) e
    -- Find which repo this belongs to
    join github.repository repo on repo.short_name = e->>'id',
    -- Insert the repo_id we've looked up into the json before populating the record.
    jsonb_populate_record(null::sonar.project, e || jsonb_build_object('repo_id', repo.repo_id)) r
  on conflict do nothing
  `;
  await pool.query(sql, [JSON.stringify(results)]);
  return [];
};

const getProjects = async (page = 1, pageSize = 100): Promise<Project[]> => {
  const response = await getSonarProjects(page, pageSize);
  const projects = JSON.parse(response);
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
  const response = await getSonarProject(project.key, metrics);
  const data = JSON.parse(response);
  const row: Row = {
    id: project.key,
    last_analysis_date: new Date(project.lastAnalysisDate),
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
