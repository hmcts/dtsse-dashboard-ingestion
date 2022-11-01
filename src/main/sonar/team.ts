export const getTeamName = (repo: string): string => {
  // split key on capital letters
  const [firstWord] = repo.split(/(?=[A-Z])/);
  // remove namespace
  const firstWorthWithoutNamespace = firstWord.includes(':') ? firstWord.substring(firstWord.indexOf(':') + 1) : firstWord;
  // split firstWord on - or _
  const [name] = firstWorthWithoutNamespace.split(/[-_]/);
  // hardcoded checks for BAR and SSCS
  const teamName = repo.startsWith('BAR') ? 'bar' : repo.startsWith('SSCS') ? 'sscs' : name;

  return teamName.toLowerCase();
};
