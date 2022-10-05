TRUNCATE pull_request;
ALTER TABLE pull_request DROP COLUMN created_at;
ALTER TABLE pull_request DROP COLUMN closed_at;
ALTER TABLE pull_request ADD COLUMN created_at TIMESTAMP NOT NULL;
ALTER TABLE pull_request ADD COLUMN closed_at TIMESTAMP DEFAULT NULL;
