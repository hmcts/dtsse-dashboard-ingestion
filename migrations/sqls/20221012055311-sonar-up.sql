
CREATE SCHEMA sonar;

CREATE TABLE sonar.project (
  id VARCHAR(255) NOT NULL,
  quality_gate_details VARCHAR(255) NOT NULL,
  bugs INT NULL,
  code_smells INT NULL,
  cognitive_complexity INT NULL,
  critical_violations INT NULL,
  complexity INT NULL,
  last_commit_date TIMESTAMP NULL,
  duplicated_blocks INT NULL,
  duplicated_lines INT NULL,
  duplicated_lines_density FLOAT NULL,
  files INT NULL,
  violations INT NULL,
  lines INT NULL,
  ncloc_language_distribution VARCHAR(255) NULL,
  vulnerabilities INT NULL,
  coverage FLOAT NULL,
  sqale_rating INT NULL,
  reliability_rating INT NULL,
  security_rating INT NULL,
  sqale_index FLOAT NULL,
  PRIMARY KEY (id)
);

