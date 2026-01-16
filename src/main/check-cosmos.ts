import { config } from './src/main/config';
import { getCVEs } from './src/main/jenkins/cosmos';

async function checkStructure() {
  const items = JSON.parse(await getCVEs(BigInt(Date.now() / 1000) - BigInt(86400 * 7)));
  
  if (items.length > 0) {
    const report = items[0];
    console.log('=== Sample Java OWASP CVE Report ===\n');
    console.log('Build info keys:', Object.keys(report.build));
    console.log('Git URL:', report.build.git_url);
    console.log('\nReport keys:', Object.keys(report.report));
    console.log('\n=== First Dependency ===');
    const dep = report.report.dependencies[0];
    console.log('Dependency keys:', Object.keys(dep));
    console.log('fileName:', dep.fileName);
    
    if (dep.vulnerabilities && dep.vulnerabilities.length > 0) {
      console.log('\n=== First Vulnerability ===');
      const vuln = dep.vulnerabilities[0];
      console.log('Vulnerability keys:', Object.keys(vuln));
      console.log('\nFull vulnerability object:');
      console.log(JSON.stringify(vuln, null, 2));
    }
  }
}

checkStructure().catch(console.error);
