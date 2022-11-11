
CREATE TABLE jira.incident_team (
  id VARCHAR(255) NOT NULL,
  team_id VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);



INSERT INTO jira.incident_team (id, team_id) VALUES
('IDAM', 'idam'),
('DTS Platform Operations', 'platform'),
('Divorce', 'div'),
('Fees / Payment', 'fees-and-pay'),
('Criminal Courts (CC1)', ''),
('Expert UI', 'rpx'),
('Bulk Printing & Scanning', 'bsp'),
('Criminal Courts (CC2)', ''),
('Family Public Law Support Team', 'fpla'),
('Financial Remedy Support Team', 'finrem'),
('No Fault Divorce Support Team', 'nfdiv'),
('Design', ''),
('Civil Money Claims (CMC)', 'cmc'),
('Digital Operations', ''),
('Digital Architecture & Cyber Security (DACS)', ''),
('ITSM Tooling', ''),
('Civil Jurisdiction', 'civil'),
('3rd Line Support Tech Lead', ''),
('Video Hearing Service', ''),
('Family Jurisdiction', ''),
('Social Security & Child Support (SSCS)', 'sscs'),
('DTS IT Service Desk', ''),
('Operational Services', ''),
('Civil Unspec', 'cmc'),
('3rd Line Delivery Manager', ''),
('Common Platform', ''),
('Tribunal Jurisdiction', ''),
('Financial Remedy', 'finrem'),
('Divorce Support Team', 'div'),
('Fee and Payments Support Team', 'fees-and-pay'),
('Managed Payments Support Team', ''),
('Criminal Courts', ''),
('Reference Data', 'rd'),
('Private law', 'prl'),
('3rd Line Support Devs', ''),
('Immigration & Asylum', 'ia'),
('Civil Enforcement', ''),
('Probate', 'probate'),
('CCD', 'ccd'),
('Family Public Law & Adoption (FPLA)', 'fpla')
;
