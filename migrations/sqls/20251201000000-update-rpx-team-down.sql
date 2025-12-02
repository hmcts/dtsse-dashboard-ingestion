-- Revert team_id changes for specified EM repositories
-- Note: This sets team_id back to NULL. If you need to preserve the original values,
-- you should record them before running the up migration.
UPDATE github.repository
SET team_id = 'em'
WHERE id IN (
    'https://github.com/hmcts/em-media-viewer'
);
UPDATE github.repository
SET team_id = 'other'
WHERE id IN (
    'https://github.com/hmcts/em-showcase',
    'https://github.com/hmcts/em-icp-api'
);
UPDATE github.repository
SET team_id = 'ccd'
WHERE id IN (
    'https://github.com/hmcts/ccd-case-ui-toolkit'
);