DROP VIEW IF EXISTS "team_with_alias";

create view team_with_alias as
    select id, description, id as alias, programme from team
  union
    select
      id, description, alias, programme
    from team_alias
    join team using(id);

