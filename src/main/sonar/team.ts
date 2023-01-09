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
  } else if (repo.includes('civil-sdt')) {
    return 'sdt';
  } else {
    return name.toLowerCase();
  }
};
