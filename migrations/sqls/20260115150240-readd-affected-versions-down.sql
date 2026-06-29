-- Re-remove affected_versions column if migration needs to be rolled back
ALTER TABLE security.cves
DROP COLUMN IF EXISTS affected_versions;

commit;