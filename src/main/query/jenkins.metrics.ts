import { getMetrics } from '../jenkins/cosmos';

export const processCosmosResults = async (rows: any) => {
  return rows.map((row: any) => ({
    id: row.id,
    product: row.product,
    branch_name: row.branch_name,
    correlation_id: row.correlation_id,
    component: row.component,
    build_number: row.build_number,
    build_url: row.build_url,
    current_step_name: row.current_step_name,
    current_build_current_result: row.current_build_current_result,
    timestamp: new Date(row._ts * 1000).toISOString(),
  }));
};

const run = async () => {
  const items = await getMetrics();
  return processCosmosResults(items);
};

export default run;
