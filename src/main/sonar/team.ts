const etPetRepos = [
  'et-full-system-servers',
  'et-fake-ccd',
  'et-data-model-test',
  'et-atos-file-transfer',
  'et-admin',
  'et-ccd-export',
  'et-ccd-client-ruby',
  'et-azure-insights',
  'et-full-system',
  'et-api',
  'et1',
  'et3',
  'et_gds_design_system',
  'et_test_helpers',
  'et_full_system_gem',
  'et_exporter_gem',
];

export const getTeamName = (repo: string): string => {
  // split key on capital letters
  const [firstWord] = repo.split(/(?=[A-Z])/);
  // remove namespace
  const firstWordWithoutNamespace = firstWord.includes(':') ? firstWord.substring(firstWord.indexOf(':') + 1) : firstWord;
  // split firstWord on - or _
  const [name] = firstWordWithoutNamespace.split(/[-_]/);

  if (repo.startsWith('BAR')) {
    return 'bar';
  } else if (repo.startsWith('SSCS')) {
    return 'sscs';
  } else if (repo.startsWith('FPL')) {
    return 'fpl';
  } else if (repo.includes('civil-sdt')) {
    return 'sdt';
  } else if (etPetRepos.some(etRepoName => repo.toLowerCase().includes(etRepoName))) {
    return 'et-pet';
  } else {
    return name.toLowerCase();
  }
};
