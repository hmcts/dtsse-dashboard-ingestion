ALTER TABLE github.dependabot ADD COLUMN date_recorded DATE DEFAULT CURRENT_DATE;
ALTER TABLE github.dependabot DROP CONSTRAINT dependabot_pkey;
ALTER TABLE github.dependabot ADD PRIMARY KEY (id, date_recorded);

ALTER TABLE github.pull_request ADD COLUMN date_recorded DATE DEFAULT CURRENT_DATE;
ALTER TABLE github.pull_request DROP CONSTRAINT pull_request_pkey;
ALTER TABLE github.pull_request ADD PRIMARY KEY (id, date_recorded);

ALTER TABLE github.repository ADD COLUMN date_recorded DATE DEFAULT CURRENT_DATE;
ALTER TABLE github.repository DROP CONSTRAINT repository_pkey;
ALTER TABLE github.repository ADD PRIMARY KEY (id, date_recorded);

ALTER TABLE snow.incident ADD COLUMN date_recorded DATE DEFAULT CURRENT_DATE;
ALTER TABLE snow.incident DROP CONSTRAINT incident_pkey;
ALTER TABLE snow.incident ADD PRIMARY KEY (id, date_recorded);

ALTER TABLE sonar.project ADD COLUMN date_recorded DATE DEFAULT CURRENT_DATE;
ALTER TABLE sonar.project DROP CONSTRAINT project_pkey;
ALTER TABLE sonar.project ADD PRIMARY KEY (id, date_recorded);
