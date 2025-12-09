-- Map SDS repositories to their correct team IDs based on Helm values configuration
-- This migration manually maps SDS repositories based on confirmed team ownership

-- Applications Register team repos → appreg 
UPDATE github.repository SET team_id = 'appreg' WHERE short_name IN (
  'appreg-frontend',
  'appreg-api'
);

-- Green on Black (OPAL) team repos → opal 
UPDATE github.repository SET team_id = 'opal' WHERE short_name IN (
  'opal-frontend',
  'opal-fines-service',
  'opal-user-service',
  'opal-legacy-db-stub'
);

-- PDDA (Public Display Data Aggregator) → pdda 
UPDATE github.repository SET team_id = 'pdda' WHERE short_name IN (
  'pdda-interfaces'
);

-- PDM (Public Display Manager) → pdm
UPDATE github.repository SET team_id = 'pdm' WHERE short_name IN (
  'pdm-interfaces'
);

-- Court Fines → courtfines
UPDATE github.repository SET team_id = 'courtfines' WHERE short_name IN (
  'courtfines-app'
);

-- DCS Automation → dcs-automation (Source: team-config.yml namespace: dcs-automation)
UPDATE github.repository SET team_id = 'dcs-automation' WHERE short_name IN (
  'dcs-e2e-tests',
  'dcs-test-shared-infrastructure'
);

-- Juror team repos → juror 
UPDATE github.repository SET team_id = 'juror' WHERE short_name IN (
  'juror-automation-tests',
  'juror-bureau',
  'juror-public',
  'juror-scheduler-api',
  'juror-shared-infrastructure'
);

-- MRD (Master Reference Data) → mrd 
UPDATE github.repository SET team_id = 'mrd' WHERE short_name IN (
  'mrd-shared-infrastructure'
);

-- Future Hearings - Hearing Management Information → hmi
UPDATE github.repository SET team_id = 'hmi' WHERE short_name IN (
  'hmi-apim-infrastructures',
  'hmi-shared-infrastructures',
  'hmi-shared-infrastructures-bootstrap',
  'list-assist-e2e-tests'
);

-- Platform Operations repos → platform
UPDATE github.repository SET team_id = 'platform' WHERE short_name IN (
  'libragob-shared-infrastructure',
  'recipes-shared-infrastructure',
  'sds-toffee-frontend',
  'sds-toffee-recipes-service',
  'sds-toffee-shared-infrastructure'
);

-- Ensure all SDS team IDs exist in the team table
INSERT INTO public.team (id, description) VALUES
  ('appreg', 'Applications Register'),
  ('opal', 'Green on Black'),
  ('pdda', 'PDDA'),
  ('pdm', 'PDM'),
  ('courtfines', 'Court Fines'),
  ('dcs-automation', 'DCS Automation'),
  ('juror', 'Juror'),
  ('mrd', 'MRD'),
  ('hmi', 'Hearing Management Information')
ON CONFLICT DO NOTHING;

-- Add team aliases for future repository discovery via GitHub API pattern matching
INSERT INTO public.team_alias (id, alias) VALUES
  ('appreg', 'appreg'),
  ('opal', 'opal'),
  ('pdda', 'pdda'),
  ('pdm', 'pdm'),
  ('courtfines', 'courtfines'),
  ('dcs-automation', 'dcs-automation'),
  ('juror', 'juror'),
  ('mrd', 'mrd'),
  ('hmi', 'hmi'),
  ('platform', 'sds-toffee'),
  ('platform', 'libragob'),
  ('platform', 'recipes')
ON CONFLICT DO NOTHING;
