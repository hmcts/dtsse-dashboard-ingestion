alter table jenkins.builds add column is_nightly boolean;

update jenkins.builds set is_nightly = build_url LIKE '%Nightly%';

alter table jenkins.builds alter column is_nightly set not null;

