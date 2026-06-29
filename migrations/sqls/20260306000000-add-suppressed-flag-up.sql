begin;

-- Add suppressed column to track whether a CVE was suppressed in a specific report
ALTER TABLE security.cve_report_to_cves
ADD COLUMN IF NOT EXISTS suppressed boolean NOT NULL DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN security.cve_report_to_cves.suppressed IS 'Indicates whether this CVE was suppressed in this specific report';

commit;
