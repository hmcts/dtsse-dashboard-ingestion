-- Update team_id to 'rpx' for specified EM repositories
UPDATE github.repository
SET team_id = 'rpx'
WHERE id IN (
    'https://github.com/hmcts/em-media-viewer',
    'https://github.com/hmcts/em-showcase',
    'https://github.com/hmcts/em-icp-api',
    'https://github.com/hmcts/ccd-case-ui-toolkit'
);
