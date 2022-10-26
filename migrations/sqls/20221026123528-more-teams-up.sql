
alter table team rename to team_alias;

create table team as select distinct on(id) id, description from team_alias;
alter table team add primary key (id);
alter table team alter column description set not null;

alter table team_alias drop column description;
alter table team_alias add constraint alias_unique unique (alias);
alter table team_alias add constraint fk_aliases foreign key (id) references team (id);

delete from team_alias where id = alias;

INSERT INTO public.team VALUES ('mi', 'Management Information') ON CONFLICT DO NOTHING;
INSERT INTO public.team_alias VALUES ('bsp', 'bulk-scan') ON CONFLICT DO NOTHING;
INSERT INTO public.team_alias VALUES ('platform', 'camunda') ON CONFLICT DO NOTHING;
INSERT INTO public.team_alias VALUES ('ccd', 'cpo') ON CONFLICT DO NOTHING;
INSERT INTO public.team_alias VALUES ('em', 'dm') ON CONFLICT DO NOTHING;
INSERT INTO public.team_alias VALUES ('rpx', 'xui') ON CONFLICT DO NOTHING;
INSERT INTO public.team_alias VALUES ('ccd', 'ts') ON CONFLICT DO NOTHING;

delete from team_alias where id = 'iac';
delete from team where id = 'iac';

create view team_with_alias as
    select id, description, id as alias from team
  union
    select
      id, description, alias
    from team_alias
    join team using(id);

CREATE TABLE team_jira_project (
  team_id varchar primary key references team(id) on delete cascade,
  jira_project_id varchar NOT NULL references jira.project(id) on delete cascade
);

INSERT INTO jira.project VALUES ('TIF', 'CFT Tech Improvement Focus Areas') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CFTA', 'CFT-Architecture') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CDI', 'Change Theme') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('EM', 'Evidence Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('EXCSI', 'Exela CSI Requests') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('EUI', 'ExpertUI') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FPET', 'Family - PET Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PRLC100', 'Family Private Law C100') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FPL', 'Family Public Law') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FPLA', 'Family Public Law and Adoption') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FAULT', 'Faults') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FS', 'Feature Switching') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FUSE', 'Future Services') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('GOAL', 'Goals') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('GPE', 'GP E2E') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('VRH', 'Hearing Channels') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HMI', 'Hearing Management Interface') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HMIS', 'Hearing Management Interface Scrum') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HMAN', 'Hearings Management Component') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HE', 'Helen M') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HM', 'Helen Milner') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('IDAM', 'IDAM') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('IDAMJL', 'IDAM - JusticeLeague') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RIA', 'Immigration and Asylum') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ISDB', 'Integration Stream - Delivery Board') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ITSM', 'ITSM Tooling') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('JI', 'Joint Initiative Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RIUI', 'JUI - Dev') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('JUIX', 'JUI - UX') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('LGR', 'Libra GoB Replacement') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('MYT', 'MyTime') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('NS', 'National Services Change Portfolio') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('NFTI', 'NFT Improvements') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('NFDIV', 'No Fault Divorce') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('NTSB', 'Non-Tech_Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('OCM', 'Online Civil Moneyclaims') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('OPA', 'Online Plea and Allocation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('OPAMI', 'OPAMI') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('OPS', 'Operational Services') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PET', 'Product Enhancement Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PAPI', 'Professional APIs') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PAP', 'Professional Applications') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PDG', 'Programme Design Group - Submissions') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SBOX', 'Public Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PUB', 'Publications & Information Hub') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PIDTS', 'Publishing & Information-DTS') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PUID', 'PUI - Dev') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SCMI', 'SC: Management Information') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SCSL', 'SC: Scheduling and Listing') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SCTP', 'SC: Tech Pod') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SCUS', 'SC: Unified Search') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SCH', 'Scheduling') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SL', 'Scheduling & Listing') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SLR', 'Scheduling and Listing') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SNIT', 'ServiceNow Integration Test') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SNI', 'ServiceNow Integrations') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SC', 'Shared Components') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SJS', 'Single Justice Service') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SE', 'Small Enhancements') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SDM', 'Software Development Managers') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SPT', 'Special Tribunals') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SREI', 'SRE - Improvements') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TPMO', 'TCEP PMO') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TP', 'Tech Pod') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TEC', 'Technical') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TA', 'Test Automation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TSTSEC', 'Test Crime Programme') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TFR', 'Test for Replatforming') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TFU', 'Test for upgrade') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TJWM', 'Test Jira Work Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CMC', 'Unspecified Legal Reps / Damages') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CSC', 'Customer Service Centres') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CYBER', 'CYBER') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CSP', 'Cyber Security Risk Remediation Planning') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SECOPS', 'Cyber Security: Strategy, Architecture and Delivery') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DCT', 'DACS-Central Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CPAWG', 'DASI Cloud & Platform AWG') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DME', 'Data Management and Engineering') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DX', 'DCD 8x8') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DSD', 'DCD SMS Demand') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DAS', 'Decree Absolute Search Service') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DP', 'Defence Portals') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTM', 'Departmental Time and Materials') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DXT', 'Departmental Xtra Time') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('AD', 'DEPRECATED - Adoption') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DESIGN', 'DEPRECATED - Family Public Law - Design') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DPK', 'Derek - PT Kanban') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DSB', 'Dev Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DB', 'DevOps Backlog') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DI', 'DevOps Improvements') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DASI', 'Digital Architecture, Strategy & Innovation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DD', 'Digital Delivery') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DDD', 'Digital Delivery - Dependencies') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RI', 'Digital Delivery - Risk and Issues') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DMUSUP', 'Digital Markup Support') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DMUB', 'Digital Markup – Data Exchange Service Bugs') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DSS', 'Digital Support Services ') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DT', 'Digital Tools') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DARM', 'DLRM ARM') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DDRM', 'DLRM DRM') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DJUROR', 'DLRM Juror') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DLRMSS', 'DLRM_SmallSystems') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DMUCD', 'DMU Continuous Delivery') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DMLI', 'DMU MRP1 - Live Incidents') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DSO', 'DSO') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSBP', 'DTS Bulk Print') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DCD', 'DTS Capability Development') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CSI', 'DTS CSI') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CTSCT', 'DTS CTSC (tactical)') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DDT', 'DTS Digital Delivery Transitions') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DDR', 'DTS Digital Recruitment ') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DFR', 'DTS Divorce and Financial Remedy') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DEE', 'DTS Email Elimination') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DFPL', 'DTS Family Public Law') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TRBA', 'DTS ITSM Delivery Transformation Backlog') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PDM', 'DTS PDMs') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSPO', 'DTS Platform Operations') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSPB', 'DTS Probate') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DPM', 'DTS Product Managers') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RAID', 'DTS RAID') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RR', 'DTS Release Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DSRE', 'DTS Site Reliability Engineers') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSSE', 'DTS Software Engineering') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSBPS', 'DTS Support Team (BPS, Tactical)') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSTP', 'DTS Transformation Programme') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSD', 'DTS-SSCS Delivery') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('EAS', 'EA Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('EDM', 'EDAMM') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ELMR', 'eLinks Magistrates Rota Project') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ECM', 'Employment Case Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('EI', 'EMS Development') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('EA', 'Environment Automation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('EBD', 'ETHOS BI Development') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ERP', 'ETHOS Replacement Project') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SCRD', 'SC: Reference Data') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TSTRBC', 'Test Project reform-Business Change') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('UIFW2', 'UI Framework 2.0') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CUI', 'Citizen User Interaction') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CIV', 'Civil') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CDR', 'Civil Design Runway') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CET', 'Civil Enforcement') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ROC', 'Civil Money Claims (CMC)') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FHOSB', 'FH Programme Overview Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FC', 'Finance and Commercial') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FR', 'Financial Remedy') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FACT', 'Find a Court or Tribunal') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FAL', 'FrameworkAndLibraries') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FH', 'Future Hearings PMO') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FHPD', 'Future Hearings Programme Delivery') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('FOT', 'Future Operations Technology') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HC', 'HMCTS Comms') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSDO', 'HMCTS DTS Phase 1 Devops') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSP', 'HMCTS DTS Phase 1 Project') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSS', 'HMCTS DTS Staging Server Refresh') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('MSC', 'HMCTS MCOL Migration Project') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HAI', 'HMCTS-CPS API Interface') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HQAM', 'HQ Account Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('IT', 'I2T') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('IBD', 'IA BI Development') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('LAT', 'ListAssist Administration & Training') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('LAU', 'Log and Audit') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('MCFT', 'Magistrates Court First Tier') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('MAGR', 'MagsRota-LACA') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('MI', 'Management Information') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('IFD', 'MI - In Flight Dashboard') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('MSS', 'Milestone sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('MO', 'Model Office') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('NPI', 'NPI') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PI', 'Performance Improvement') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PTP', 'Performance Test Project') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RPET', 'PET: Divorce and FR') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PIPE', 'Pipeline') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CWR', 'Playbook Requests') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PS', 'PMO Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PRL', 'Private Law') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PRI', 'Probate Intestacy') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RPA', 'Process Automation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PUIX', 'PUI - UX') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ROTAFIRST', 'ROTA - Release 1') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RM', 'Rota Migration') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ROTASCH', 'Rota Scheduler') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RCJUT', 'Royal Courts of Justice & Upper Tribunal') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ROYS', 'Roys Test') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RRSB', 'RR Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SSP', 'Sample Scrum Project') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SCAG', 'SC: API Gateway') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SDLCI', 'SDLC Implementation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('S28', 'Section-28 Pre-recorded Evidence') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SDT', 'Secure Data Transfer') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SDP', 'Service Design Practice') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SDR', 'Service Design Requests & BAU') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SMO', 'Service Management Office') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('STRM', 'Service Transition Release Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SBDT', 'Store/Bench and DCS transition') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SSMO', 'Store/Bench Support Model Oct 17') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SM', 'Strategic Migration') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SP', 'Strategic Platform & Pipeline Delivery') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SIDM', 'Strategic Reform IdAM') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HSSLI', 'Support - Crown Court Scheduling') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TCEP', 'TCEP') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TMS', 'Timesheet Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TSB', 'Tooling Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TPB', 'Transformation Priorities') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('UCDDTS', 'UCD DTS') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CFT', 'Civil, Family & Tribunals') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CPPTI', 'CJSCP Programme Testing') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CDDRAID', 'CJSS CP Digital Delivery Increment') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CO', 'CO') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CCDT', 'Common Components Delivery Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CCUX', 'Common Components UX ') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CCT', 'Common Platform') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CPPSD', 'Common Platform - Production Services Delivery') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('NFR', 'Common Platform Programme NFRs') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CD', 'Content_Design') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('COH', 'Continuous Online Hearing') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CPI', 'Continuous Platform Improvements') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CCM', 'Core Case Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ICH', 'Court Hearings') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('IWF', 'Court Wi-FI') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CA', 'CPP Automation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CBD', 'CPP BI Development') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('USER', 'User Profiles') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('UXD', 'UX Debt') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('VIH', 'Video Hearings') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('VUL', 'Vulnerability Management Project') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('WLA', 'Welsh Language') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('WLTS', 'Welsh Language Translation Service') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('XM', 'xHibit Migrations') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('TS', 'Technical Services') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DSN', 'DSN') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PTS', '8x8 Product Team - Scrum') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('AM', 'Access Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ADOP', 'Adoption') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ADE', 'AEA: Data Engineering') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('APD', 'AP Data Engineering') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('APF', 'AP Front End') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('APMPO', 'APM - Project Overview') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('APM', 'Application Performance Monitoring') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ACA', 'Assign Access to a Case') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SAM', 'Assignment Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('AT', 'Atlassian Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ATCM', 'Automated Track Case Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('AV', 'Avengers CPP Code Improvements') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('BAR', 'Banking and Accounting Returns Digitisation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('BRF', 'Benefits Realisation Framework') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('BID', 'BI Dasboards') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('BCD', 'Business Change Design') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('BEM', 'Business Engagement Requests') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('COT', 'Capability Onboarding Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CPO', 'Case Payment Order') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CCD', 'CCD PET') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CFTBC', 'CFT Business Change') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HMC', 'CFT Hearings Management Component') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CFTINN', 'CFT Innovations') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CFTS', 'CFT Level-2 Support') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PPS', 'CFT Platform - Product Services') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SMT', 'CFT Senior Management Team ') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SOT', 'CFT Service Onboarding Template') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CBC', 'CPP Business Change') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CCOM', 'CPP Communications') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CPPID', 'CPP Incidents and Defects') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('MS', 'CPP Milestones') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CARCH', 'Crime Architecture') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CBA', 'Crime Business Assurance') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CDW', 'Crime Design Work') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PE', 'Crime Programme') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SEC', 'Crime Programme Cyber Security') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CPLAN', 'Crime Programme Planning') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('YP', 'Crime Programme Youth Project') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CSDT', 'Crime Service Discovery Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SIT', 'Crime_CFT_FH SIT') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CT', 'Cross-Cutting Transformation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CRC', 'Crown Court') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CCDC', 'Crown Court Digital Case System') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CCR', 'Crown Court Resulting') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CRIME', 'CTDD Crime') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CTSEO', 'CTS Early One') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CTSET', 'CTS Early Two') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PMO', 'PMO') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RCJSB', 'RCJUT Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RDCC', 'Reference Data Common Capability') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('REFDATA', 'Reference Data for Crime Programme') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RBA', 'Reform Business Analysis') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RDM', 'Reform Case Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('CNP', 'Reform CNP') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DCNP', 'Reform Devops CNP') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RLT', 'Reform Learning Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RMI', 'Reform MI') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RPE', 'Reform Platform Engineering') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('QA', 'Reform QA Team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RSE', 'Reform Software Engineering') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RSA', 'Reform Solution Architecture') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ST', 'Reform Special Tribunals') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RCC', 'Reform Tech Change Control') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RTL', 'Reform Tech Leads') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RPMO', 'Reform Technology-PMO') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RTM', 'Reform Time and Materials') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RTRAN', 'Reform Transition') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RWA', 'Reform Work Allocation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RXT', 'Reform Xtra Time') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RBC', 'Reform-Business Change') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DIV', 'Reform-Divorce') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RIDM', 'Reform-IdAM') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PAY', 'Reform-Payments') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PRO', 'Reform-Probate') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('SSCS', 'Reform-SSCS') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('HWFI', 'Reform-Sustaining HwFI') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RST', 'Reform-Sustaining team') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RET', 'Reform- Employment Tribunal') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RDO', 'Reform: DevOps') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('PCQ', 'Reform: Protected Characteristics Questions') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RWF', 'Reform: Workflow') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RF', 'Reframe Implementation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RCS', 'Release Checklist Sandbox') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('RQA', 'Release Quality Assurance') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('REM', 'Resource Management') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('REF', 'Results Reference Data') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('DTSRPA', 'Robotic Process Automation') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ROTAPIL', 'Rota - Pilot') ON CONFLICT DO NOTHING;
INSERT INTO jira.project VALUES ('ROTA', 'Rota - Portal') ON CONFLICT DO NOTHING;


insert into team_jira_project values
('ia', 'RIA'),
('finrem', 'DFR'),
('sscs', 'SSCS'),
('rd', 'RDCC'),
('div', 'DFR'),
('am', 'AM'),
('pre', 'S28'),
('em', 'EM'),
('ethos', 'ERP'),
('ctsc', 'CTSCT'),
('hwf', 'RST'),
('civil', 'CIV'),
('dtsse', 'DTSSE'),
('bsp', 'DTSBP'),
('et', 'RET'),
('ccd', 'CCM'),
('wa', 'RWA'),
('rpx', 'EUI'),
('platform', 'DTSPO'),
('cmc', 'CMC'),
('snl', 'SL'),
('fpla', 'FPLA'),
('pcq', 'PCQ'),
('probate', 'DTSPB'),
('idam', 'SIDM'),
('adoption', 'ADOP'),
('sptribs', 'SPT'),
('fees-and-pay', 'PAY'),
('lau', 'LAU'),
('fact', 'FACT'),
('prl', 'PRL'),
('nfdiv', 'NFDIV');
