CREATE SCHEMA jira;

CREATE TABLE jira.project (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE jira.issue (
  id VARCHAR(10) PRIMARY KEY,
  project_id VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  description TEXT,
  labels TEXT,
  status VARCHAR(225) NOT NULL,
  status_category VARCHAR(225) NOT NULL,
  creator VARCHAR(255) NOT NULL,
  assignee VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
