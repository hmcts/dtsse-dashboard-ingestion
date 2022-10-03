DROP TABLE open_pull_requests;
DROP TABLE long_open_pull_requests;
ALTER TABLE pull_request DROP COLUMN review_decision;
ALTER TABLE pull_request ALTER COLUMN body_text DROP NOT NULL;
