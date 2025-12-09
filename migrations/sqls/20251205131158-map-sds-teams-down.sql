-- Rollback: Remove team aliases added for SDS team mapping
DELETE FROM public.team_alias 
WHERE (id, alias) IN (
  ('appreg', 'appreg'),
  ('opal', 'opal'),
  ('pdda', 'pdda'),
  ('pdm', 'pdm'),
  ('courtfines', 'courtfines'),
  ('courtfines', 'dcs'),
  ('juror', 'juror'),
  ('mrd', 'mrd'),
  ('hmi', 'hmi'),
  ('pre', 'sds-toffee'),
  ('platform', 'libragob'),
  ('platform', 'recipes')
);

-- Rollback: Remove SDS team IDs that were inserted by the up migration
DELETE FROM public.team WHERE id IN ('appreg', 'opal', 'pdda', 'pdm', 'courtfines', 'juror', 'mrd', 'hmi');

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
  -- Platform Operations (Recipes)
  'recipes-shared-infrastructure',
  -- HMI
  'hmi-apim-infrastructures',
  'hmi-shared-infrastructures',
  'hmi-shared-infrastructures-bootstrap',
  'list-assist-e2e-tests',
  -- Pre-Recorded Evidence
  'sds-toffee-frontend',
  'sds-toffee-recipes-service',
  'sds-toffee-shared-infrastructure',
  -- Libra GoB
  'libragob-shared-infrastructure'
);
