-- Rollback: Reset team_id to NULL for SDS repositories that were mapped
UPDATE github.repository SET team_id = NULL WHERE short_name IN (
  'appreg-frontend', 'appreg-api',
  'opal-frontend', 'opal-fines-service', 'opal-user-service', 'opal-legacy-db-stub',
  'pdda-interfaces',
  'pdm-interfaces',
  'courtfines-app',
  'dcs-e2e-tests', 'dcs-test-shared-infrastructure',
  'juror-automation-tests', 'juror-bureau', 'juror-public', 'juror-scheduler-api', 'juror-shared-infrastructure',
  'mrd-shared-infrastructure',
  'hmi-apim-infrastructures', 'hmi-shared-infrastructures', 'hmi-shared-infrastructures-bootstrap', 'list-assist-e2e-tests',
  'libragob-shared-infrastructure', 'recipes-shared-infrastructure',
  'sds-toffee-frontend', 'sds-toffee-recipes-service', 'sds-toffee-shared-infrastructure'
);

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

-- Rollback: Remove SDS teams that were inserted by the up migration
DELETE FROM public.team WHERE id IN ('appreg', 'opal', 'pdda', 'pdm', 'courtfines', 'dcs-automation', 'juror', 'mrd', 'hmi', 'platform');
