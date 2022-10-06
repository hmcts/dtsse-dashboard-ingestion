export const getTeamName = (repository: string) => repository.substring(0, repository.indexOf('-')).toLowerCase();
