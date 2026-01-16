// Quick script to check Cosmos DB structure for affected_versions field
const { CosmosClient } = require('@azure/cosmos');
const { config } = require('./dist/config');

const client = new CosmosClient({
  endpoint: `https://${config.cosmosDbName}.documents.azure.com:443/`,
  key: config.cosmosKey,
});

async function checkStructure() {
  const database = client.database('platform-metrics');
  const container = database.container('owasp-dependency-check');
  
  const querySpec = {
    query: 'SELECT TOP 1 * FROM c WHERE c.build.codebase_type = "java" ORDER BY c._ts DESC',
  };
  
  const { resources: items } = await container.items.query(querySpec).fetchAll();
  
  if (items.length > 0) {
    const report = items[0];
    console.log('=== Checking Java OWASP Report Structure ===\n');
    console.log('Git URL:', report.build.git_url);
    console.log('Timestamp:', new Date(report._ts * 1000).toISOString());
    
    const dep = report.report.dependencies[0];
    console.log('\n=== First Dependency ===');
    console.log('fileName:', dep.fileName);
    console.log('All dependency keys:', Object.keys(dep).sort());
    
    if (dep.vulnerabilities && dep.vulnerabilities.length > 0) {
      const vuln = dep.vulnerabilities[0];
      console.log('\n=== First Vulnerability ===');
      console.log('name (CVE):', vuln.name);
      console.log('All vulnerability keys:', Object.keys(vuln).sort());
      console.log('\nChecking for affectedVersions field...');
      console.log('vuln.affectedVersions:', vuln.affectedVersions);
      console.log('EXISTS:', 'affectedVersions' in vuln ? 'YES ✓' : 'NO ✗');
      
      console.log('\n=== Full Vulnerability Object (first 500 chars) ===');
      console.log(JSON.stringify(vuln, null, 2).substring(0, 500));
    }
  } else {
    console.log('No Java OWASP reports found in Cosmos DB');
  }
}

checkStructure().catch(console.error);
