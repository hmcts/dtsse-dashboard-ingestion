alter table jenkins.builds add column team_id varchar references team(id);

update jenkins.builds set team_id = t.id
from team_with_alias t
where
  t.alias = split_part(split_part(builds.git_url, '/', 5), '-', 1)
  or t.alias = product;
