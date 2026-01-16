begin;

-- Re-add affected_versions column if migration needs to be rolled back
ALTER TABLE security.cves
ADD COLUMN IF NOT EXISTS affected_versions varchar(500);

commit;
