truncate table sonar.project;
alter table sonar.project
add column repo_id integer not null references github.repository(repo_id),
drop column id,
drop column team,
add constraint unique_report unique (repo_id, last_analysis_date);

alter table github.repository
rename column hasdependabotorrenovate to has_dependabot_or_renovate;

alter table github.repository
drop column jenkins_name,
drop column team_alias;

-- Merge all duplicate github repositories
with predecessors as (
    select id, lag(id) over w, repo_id, lag(repo_id) over w as prev_id
    from github.repository
    window w as (partition by lower(id) order by repo_id asc)
), prs as (
update github.pull_request p
set repo_id = prev_id
from predecessors
where p.repo_id = predecessors.repo_id
and predecessors.prev_id is not null
), builds as (
update jenkins_impl.builds p
set repo_id = prev_id
from predecessors
where p.repo_id = predecessors.repo_id
and predecessors.prev_id is not null
)
delete from github.repository where repo_id in (select repo_id from predecessors where prev_id is not null);

alter table github.repository drop constraint repository_pkey;

-- Ensure we can't have any more duplicate git repos
create unique index unique_id on github.repository (upper(id));
create unique index unique_short_name on github.repository (upper(short_name));

-- Clean this up since it has been migrated to the main github repository table
drop table github.dependabot;