
ALTER TABLE pull_request DROP COLUMN timestamp;
ALTER TABLE pull_request ADD COLUMN id VARCHAR(255) NOT NULL DEFAULT ''::character varying;
UPDATE pull_request SET id = url;
ALTER TABLE pull_request ADD PRIMARY KEY (id);
