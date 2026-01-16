import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({
  endpoint: 'https://sandbox-pipeline-metrics.documents.azure.com:443/',
  key: process.env.COSMOS_KEY || '',
});

const database = client.database('platform-metrics');
const container = database.container('owasp-dependency-check');

async function checkStructure() {
  const querySpec = {
    query: 'SELECT TOP 1 * FROM c WHERE c.build.codebase_type = "java" ORDER BY c._ts DESC',
  };
  
  const { resources: items } = await container.items.query(querySpec).fetchAll();
  
  if (items.length > 0) {
    const report = items[0];
    console.log('=== Sample CVE Report Structure ===\n');
    console.log('Report keys:', Object.keys(report.report));
    console.log('\n=== First Dependency ===');
    const dep = report.report.dependencies[0];
    console.log('Dependency keys:', Object.keys(dep));
    console.log('fileName:', dep.fileName);
    
    if (dep.vulnerabilities && dep.vulnerabilities.length > 0) {
      console.log('\n=== First Vulnerability ===');
      const vuln = dep.vulnerabilities[0];
      console.log('Vulnerability keys:', Object.keys(vuln));
      console.log(JSON.stringify(vuln, null, 2));
    }
    
    if (dep.suppressedVulnerabilities && dep.suppressedVulnerabilities.length > 0) {
      console.log('\n=== First Suppressed Vulnerability ===');
      const suppressed = dep.suppressedVulnerabilities[0];
      console.log('Suppressed keys:', Object.keys(suppressed));
      console.log(JSON.stringify(suppressed, null, 2));
    }
  }
}

checkStructure().catch(console.error);
