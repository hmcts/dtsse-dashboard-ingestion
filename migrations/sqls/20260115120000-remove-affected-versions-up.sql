begin;

-- Remove affected_versions column as it doesn't exist in OWASP JSON structure
ALTER TABLE security.cves
DROP COLUMN IF EXISTS affected_versions;

commit;
