ALTER TABLE github.pull_request ADD COLUMN state VARCHAR(255) NOT NULL DEFAULT 'open'::character varying;
