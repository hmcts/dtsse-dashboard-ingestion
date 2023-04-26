ALTER TABLE team ADD COLUMN programme VARCHAR(255) NOT NULL DEFAULT 'cft';

UPDATE team SET programme = 'dts' WHERE id IN ('dtsse', 'platform');
UPDATE team SET programme = 'sds' WHERE id IN ('ctsc', 'fact', 'lau', 'pcq', 'pre', 'rpts', 'snl', 'pip', 'vh');

INSERT INTO team (id, description, programme) VALUES ('et-pet', 'Employment Tribunals (Legacy)', 'cft');

INSERT INTO team_alias (id, alias) VALUES
  ('et-pet', 'et-full-system-servers'),
  ('et-pet', 'et-fake-ccd'),
  ('et-pet', 'et-data-model-test'),
  ('et-pet', 'et-atos-file-transfer'),
  ('et-pet', 'et-admin'),
  ('et-pet', 'et-ccd-export'),
  ('et-pet', 'et-ccd-client-ruby'),
  ('et-pet', 'et-azure-insights'),
  ('et-pet', 'et-full-system'),
  ('et-pet', 'et-api'),
  ('et-pet', 'et1'),
  ('et-pet', 'et3'),
  ('et-pet', 'et_gds_design_system'),
  ('et-pet', 'et_test_helpers'),
  ('et-pet', 'et_full_system_gem'),
  ('et-pet', 'et_exporter_gem');

DELETE FROM team_alias WHERE id = 'fprl';
DELETE FROM team WHERE id = 'fprl';
