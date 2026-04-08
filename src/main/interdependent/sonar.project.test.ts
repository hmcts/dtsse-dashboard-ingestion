import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { run } from './sonar.project';
import { getSonarProject, getSonarProjects } from '../github/rest';

jest.mock('../github/rest', () => ({
  getSonarProject: jest.fn(),
  getSonarProjects: jest.fn(),
}));

const mockGetSonarProjects = getSonarProjects as jest.MockedFunction<typeof getSonarProjects>;
const mockGetSonarProject = getSonarProject as jest.MockedFunction<typeof getSonarProject>;

describe('sonar.project', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = { query: (jest.fn() as any).mockResolvedValue({ rows: [] }) };
    jest.clearAllMocks();
  });

  test('run returns count of processed Sonar projects', async () => {
    mockGetSonarProjects.mockResolvedValue(
      JSON.stringify({
        paging: { pageIndex: 1, pageSize: 100, total: 1 },
        components: [{ organization: 'hmcts', key: 'my-repo', name: 'my-repo', lastAnalysisDate: new Date().toISOString() }],
      })
    );
    mockGetSonarProject.mockResolvedValue(JSON.stringify({ component: { measures: [] } }));
    const result = await run(mockPool);
    expect(result).toBe('processed 1 Sonar projects');
  });

  test('run returns 0 when no recently analysed projects', async () => {
    mockGetSonarProjects.mockResolvedValue(
      JSON.stringify({
        paging: { pageIndex: 1, pageSize: 100, total: 0 },
        components: [],
      })
    );
    const result = await run(mockPool);
    expect(result).toBe('processed 0 Sonar projects');
  });
});
