ALTER TABLE github.pull_request DROP COLUMN created_at;
ALTER TABLE github.pull_request DROP COLUMN closed_at;
ALTER TABLE github.pull_request ADD COLUMN created_at TIME WITHOUT TIME ZONE NOT NULL;
ALTER TABLE github.pull_request ADD COLUMN closed_at TIME WITHOUT TIME ZONE DEFAULT NULL;
