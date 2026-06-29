-- Re-add affected_versions column
ALTER TABLE security.cves
ADD COLUMN IF NOT EXISTS affected_versions varchar(500);

commit;