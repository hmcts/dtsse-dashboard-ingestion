-- Map SDS repositories to their correct team IDs based on Helm values configuration
-- This migration manually maps SDS repositories based on confirmed team ownership

-- Applications Register team repos → FACT
UPDATE github.repository SET team_id = 'fact' WHERE short_name IN (
  'appreg-frontend',
  'appreg-api'
);

-- Green on Black (OPAL) team repos → PCQ  
UPDATE github.repository SET team_id = 'pcq' WHERE short_name IN (
  'opal-frontend',
  'opal-fines-service',
  'opal-user-service',
  'opal-legacy-db-stub'
);

-- PDDA (Public Display Data Aggregator) → CTSC
UPDATE github.repository SET team_id = 'ctsc' WHERE short_name IN (
  'pdda-interfaces'
);

-- PDM (Public Display Manager) → CTSC  
UPDATE github.repository SET team_id = 'ctsc' WHERE short_name IN (
  'pdm-interfaces'
);

-- Court Fines + DCS (Dispatch Case Services) → CTSC
UPDATE github.repository SET team_id = 'ctsc' WHERE short_name IN (
  'courtfines-app',
  'dcs-e2e-tests',
  'dcs-test-shared-infrastructure'
);

-- Juror team repos → RPTS
UPDATE github.repository SET team_id = 'rpts' WHERE short_name IN (
  'juror-automation-tests',
  'juror-bureau',
  'juror-public',
  'juror-scheduler-api',
  'juror-shared-infrastructure'
);

-- MRD (Master Reference Data) → RPTS
UPDATE github.repository SET team_id = 'rpts' WHERE short_name IN (
  'mrd-shared-infrastructure'
);

-- Future Hearings - Hearing Management Information (HMI) → VH
UPDATE github.repository SET team_id = 'vh' WHERE short_name IN (
  'hmi-apim-infrastructures',
  'hmi-shared-infrastructures',
  'hmi-shared-infrastructures-bootstrap',
  'list-assist-e2e-tests'
);

-- Pre-Recorded Evidence (PRE/TOFFEE) → PRE
UPDATE github.repository SET team_id = 'pre' WHERE short_name IN (
  'sds-toffee-frontend',
  'sds-toffee-recipes-service',
  'sds-toffee-shared-infrastructure'
);

-- Platform Operations repos → PLATFORM
UPDATE github.repository SET team_id = 'platform' WHERE short_name IN (
  'libragob-shared-infrastructure',
  'recipes-shared-infrastructure'
);

-- Ensure all SDS team IDs exist in the team table (in case they haven't been created by prior migrations)
INSERT INTO public.team (id, description) VALUES
  ('vh', 'Video Hearings')
ON CONFLICT DO NOTHING;

-- Add team aliases for future repository discovery via GitHub API pattern matching
INSERT INTO public.team_alias (id, alias) VALUES
  ('fact', 'appreg'),
  ('pcq', 'opal'),
  ('ctsc', 'pdda'),
  ('ctsc', 'pdm'),
  ('ctsc', 'courtfines'),
  ('ctsc', 'dcs'),
  ('rpts', 'juror'),
  ('rpts', 'mrd'),
  ('vh', 'hmi'),
  ('pre', 'sds-toffee'),
  ('platform', 'libragob'),
  ('platform', 'recipes')
ON CONFLICT DO NOTHING;
