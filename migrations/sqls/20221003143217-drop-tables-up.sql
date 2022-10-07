DROP TABLE github.open_pull_requests;
DROP TABLE github.long_open_pull_requests;
ALTER TABLE github.pull_request DROP COLUMN review_decision;
ALTER TABLE github.pull_request ALTER COLUMN body_text DROP NOT NULL;
