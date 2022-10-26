CREATE TABLE IF NOT EXISTS public.team (
    id character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    alias character varying(255) NOT NULL,
    primary key (id, alias)
);

INSERT INTO public.team VALUES ('platform', 'Platform', 'draft') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('platform', 'Platform', 'rpe') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('platform', 'Platform', 'spring') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('platform', 'Platform', 'node') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('platform', 'Platform', 'service') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('platform', 'Platform', 'cnp') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('platform', 'Platform', 'rdo') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('bsp', 'Bulk Scan and Print', 'send') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('bsp', 'Bulk Scan and Print', 'blob') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('bsp', 'Bulk Scan and Print', 'reform') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('ccd', 'CCD', 'ccd') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('ccd', 'CCD', 'aac') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('sscs', 'SSCS', 'sscs') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('ia', 'I & A', 'ia') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('fees-and-pay', 'Fees & Pay', 'bar') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('fees-and-pay', 'Fees & Pay', 'ccfr') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('fees-and-pay', 'Fees & Pay', 'ccpay') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('fees-and-pay', 'Fees & Pay', 'ccpayfr') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('probate', 'Probate', 'probate') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('div', 'Divorce', 'div') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('nfdiv', 'No Fault Divorce', 'nfdiv') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('sptribs', 'Special Tribunals', 'sptribs') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('am', 'Access Management', 'am') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('ctsc', 'CTSC', 'ctsc') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('ethos', 'ETHOS', 'ecm') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('cmc', 'CMC', 'cmc') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('rd', 'Ref Data', 'rd') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('fpla', 'FPLA', 'fpl') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('pcq', 'PCQ', 'pcq') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('lau', 'LAU', 'lau') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('dtsse', 'DTSSE', 'dtsse') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('dtsse', 'DTSSE', 'rse') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('em', 'Evidence Management', 'em') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('em', 'Evidence Management', 'document') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('em', 'Evidence Management', 'dg') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('civil', 'Civil Damages', 'civil') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('wa', 'Work Allocation', 'wa') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('idam', 'IDAM', 'idam') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('fact', 'FACT', 'fact') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('rpts', 'RPTS', 'rpts') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('prl', 'Private Law', 'prl') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('finrem', 'FinRem Dashboard', 'finrem') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('et', 'Employment Tribunals', 'etc') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('fis', 'Family Integration', 'fis') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('rpx', 'XUI', 'rpx') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('bsp', 'Bulk Scan and Print', 'bulkprint') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('hwf', 'Help With Fees', 'hwf') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('ccd', 'CCD', 'hmc') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('snl', 'Scheduling and Listing', 'snl') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('pre', 'Pre-recorded Evidence', 'pre') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('prl', 'Private Law', 'privatelaw') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('iac', 'IAC', 'lgy') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('fpla', 'FPLA', 'family') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('ccd', 'CCD', 'befta') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('fees-and-pay', 'Fees & Pay', 'paybubble') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('em', 'Evidence Management', 'doc') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('da', 'Domestic Abuse', 'da') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('et', 'Employment Tribunals', 'et') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('et', 'Employment Tribunals', 'employment') ON CONFLICT DO NOTHING;
INSERT INTO public.team VALUES ('adoption', 'Adoption', 'adoption') ON CONFLICT DO NOTHING;
