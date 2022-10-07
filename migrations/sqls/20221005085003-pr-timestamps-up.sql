TRUNCATE github.pull_request;
ALTER TABLE github.pull_request DROP COLUMN created_at;
ALTER TABLE github.pull_request DROP COLUMN closed_at;
ALTER TABLE github.pull_request ADD COLUMN created_at TIMESTAMP NOT NULL;
ALTER TABLE github.pull_request ADD COLUMN closed_at TIMESTAMP DEFAULT NULL;
