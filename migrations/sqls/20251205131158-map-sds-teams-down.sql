-- Rollback: Remove team aliases added for SDS team mapping
DELETE FROM public.team_alias 
WHERE (id, alias) IN (
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
);

-- Rollback: Remove SDS team IDs that were inserted by the up migration
DELETE FROM public.team WHERE id IN ('appreg', 'opal', 'pdda', 'pdm', 'courtfines', 'dcs-automation', 'juror', 'mrd', 'hmi');

-- Rollback: Reset team_id to NULL for SDS repositories that were mapped
UPDATE github.repository SET team_id = NULL WHERE short_name IN (
  -- Applications Register team
  'appreg-frontend',
  'appreg-api',
  -- Green on Black (OPAL)
  'opal-frontend',
  'opal-fines-service',
  'opal-user-service',
  'opal-legacy-db-stub',
  -- PDDA
  'pdda-interfaces',
  -- PDM
  'pdm-interfaces',
  -- Court Fines
  'courtfines-app',
  -- DCS Automation
  'dcs-e2e-tests',
  'dcs-test-shared-infrastructure',
  -- Juror
  'juror-automation-tests',
  'juror-bureau',
  'juror-public',
  'juror-scheduler-api',
  'juror-shared-infrastructure',
  -- MRD
  'mrd-shared-infrastructure',
  -- HMI
  'hmi-apim-infrastructures',
  'hmi-shared-infrastructures',
  'hmi-shared-infrastructures-bootstrap',
  'list-assist-e2e-tests',
  -- Platform Operations 
  'sds-toffee-frontend',
  'sds-toffee-recipes-service',
  'sds-toffee-shared-infrastructure',
  'recipes-shared-infrastructure',
  'libragob-shared-infrastructure'
);
