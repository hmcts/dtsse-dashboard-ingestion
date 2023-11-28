-- Repositories belong to teams and builds belong to repositories
-- We cannot always identify these so nulls are allowed
alter table github.repository add column team_id text references team(id), add column hasDependabotOrRenovate boolean default false;
alter table jenkins_impl.builds add column repo_id integer references github.repository(repo_id);
alter table github.pull_request add column repo_id integer references github.repository(repo_id);

-- Backfill pull request ownership
update github.pull_request
set repo_id = repo.repo_id
from github.repository repo
where repo.short_name = repository;

alter table github.pull_request drop column team, drop column repository;

-- Backfill repo ownership
update github.repository
set team_id = team
from (
    select distinct on (r.id)
    r.id, t.id as team
    from github.repository r
    left join team_with_alias t  on
    --    r.id = '5'
        split_part(r.id, '/', 5) like (t.alias || '%')
    -- Pick the most specific team alias, ie. the longest.
    order by r.id, t.alias desc
) c
where github.repository.id = c.id;

-- Backfill build ownership
update jenkins_impl.builds 
set repo_id = repo.repo_id
from github.repository repo
where lower(repo.web_url) = replace(lower(jenkins_impl.builds.git_url), '.git', '');

-- Have to drop and recreate this view to amend builds.
drop view jenkins.build_summaries;

alter table jenkins_impl.builds 
  alter column build_number type integer using build_number::integer,
  --   Redundant information stored on github repository relation
  drop column git_url,
  drop column product,
  drop column component,
  drop column team_id,
  drop column is_nightly;
create index on jenkins_impl.builds(repo_id);

create view jenkins.build_summaries as
select builds.correlation_id,
    builds.branch_name,
    builds.build_number,
    repo.git_url,
    builds.build_url,
    builds.git_commit,
    build_url like '%Nightly%' is_nightly,
    repo.team_id,
    steps.current_step_name as final_step_name,
    steps.current_build_current_result as result,
    steps.stage_timestamp as "timestamp",
    steps.duration
   from jenkins_impl.terminal_build_steps_materialized steps
     join jenkins_impl.builds builds using (correlation_id)
     join github.repository repo using (repo_id)
  where steps.current_build_current_result <> 'SUCCESS'::jenkins.buildresult or steps.current_step_name::text = 'Pipeline Succeeded'::text;