

DROP INDEX github_repository_jenkins_name_idx;
ALTER TABLE github.repository DROP COLUMN jenkins_name;
