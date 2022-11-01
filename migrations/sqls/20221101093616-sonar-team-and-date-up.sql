
TRUNCATE TABLE sonar.project;
ALTER TABLE sonar.project ADD COLUMN team VARCHAR(255) NOT NULL;
ALTER TABLE sonar.project ADD COLUMN last_analysis_date TIMESTAMP NOT NULL;
