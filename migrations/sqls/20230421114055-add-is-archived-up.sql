ALTER TABLE github.repository
    ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
