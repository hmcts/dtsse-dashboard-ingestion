export const getJenkinsName = (repoName: string) => {
  return repoName.replace('/hmcts/', '/HMCTS/') + '.git';
};
