ALTER TABLE github.pull_request ADD COLUMN timestamp TIMESTAMP NOT NULL;
ALTER TABLE github.pull_request DROP COLUMN id;
