begin;

-- Remove the suppressed column from security.cve_report_to_cves table
ALTER TABLE security.cve_report_to_cves
DROP COLUMN IF EXISTS suppressed;

commit;
