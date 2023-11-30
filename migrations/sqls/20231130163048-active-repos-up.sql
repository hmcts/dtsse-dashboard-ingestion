create view github.active_repository as
select * from github.repository where is_archived = false;