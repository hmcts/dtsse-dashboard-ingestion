import { getCVEs } from './src/main/jenkins/cosmos';

async function checkVersionFields() {
  const items = JSON.parse(await getCVEs(BigInt(Date.now() / 1000) - BigInt(86400 * 7)));
  
  if (items.length > 0) {
    console.log('Checking for version-related fields in OWASP reports...\n');
    
    for (let i = 0; i < Math.min(3, items.length); i++) {
      const report = items[i];
      if (report.report?.dependencies && report.report.dependencies.length > 0) {
        const dep = report.report.dependencies[0];
        const vuln = dep.vulnerabilities?.[0] || dep.suppressedVulnerabilities?.[0];
        
        if (vuln) {
          console.log(`=== Sample ${i + 1} ===`);
          console.log('CVE:', vuln.name);
          console.log('\nAvailable fields:', Object.keys(vuln));
          
          // Check vulnerableSoftware array
          if (vuln.vulnerableSoftware && vuln.vulnerableSoftware.length > 0) {
            console.log('\nvulnerableSoftware (first 3):');
            vuln.vulnerableSoftware.slice(0, 3).forEach((sw: any) => {
              console.log('  -', sw);
            });
          }
          
          // Check if there's version info in the dependency itself
          console.log('\nDependency info:');
          console.log('  fileName:', dep.fileName);
          console.log('  filePath:', dep.filePath);
          if (dep.packages) {
            console.log('  packages:', JSON.stringify(dep.packages, null, 2));
          }
          
          console.log('\n' + '-'.repeat(80) + '\n');
          break;
        }
      }
    }
  } else {
    console.log('No recent CVE reports found');
  }
}

checkVersionFields().catch(console.error);
