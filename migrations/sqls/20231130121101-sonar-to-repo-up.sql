truncate table sonar.project;
alter table sonar.project
add column repo_id integer not null references github.repository(repo_id),
drop column id,
drop column team,
add constraint unique_report unique (repo_id, last_analysis_date);