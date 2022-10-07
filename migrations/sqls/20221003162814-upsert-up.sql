
ALTER TABLE github.pull_request DROP COLUMN timestamp;
ALTER TABLE github.pull_request ADD COLUMN id VARCHAR(255) NOT NULL DEFAULT ''::character varying;
UPDATE github.pull_request SET id = url;
ALTER TABLE github.pull_request ADD PRIMARY KEY (id);
