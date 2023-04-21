ALTER TABLE github.dependabot ADD COLUMN date_recorded DATE DEFAULT CURRENT_DATE;
ALTER TABLE github.dependabot DROP CONSTRAINT dependabot_pkey;
ALTER TABLE github.dependabot ADD PRIMARY KEY (id, date_recorded);

ALTER TABLE sonar.project ADD COLUMN date_recorded DATE DEFAULT CURRENT_DATE;
ALTER TABLE sonar.project DROP CONSTRAINT project_pkey;
ALTER TABLE sonar.project ADD PRIMARY KEY (id, date_recorded);
