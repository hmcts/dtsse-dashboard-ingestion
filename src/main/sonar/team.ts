export const getTeamName = (repo: string): string => {
  // split key on capital letters
  const [firstWord] = repo.split(/(?=[A-Z])/);
  // remove namespace
  const firstWordWithoutNamespace = firstWord.includes(':') ? firstWord.substring(firstWord.indexOf(':') + 1) : firstWord;
  // split firstWord on - or _
  const [name] = firstWordWithoutNamespace.split(/[-_]/);
  // hardcoded checks for BAR and SSCS
  const teamName = repo.startsWith('BAR') ? 'bar' : repo.startsWith('SSCS') ? 'sscs' : repo.includes('civil-sdt') ? 'sdt' : name;

  return teamName.toLowerCase();
};
