
ALTER TABLE github.repository ADD COLUMN jenkins_name VARCHAR(255) NULL;
-- add index for jenkins_name
CREATE INDEX github_repository_jenkins_name_idx ON github.repository (jenkins_name);
