DELETE FROM public.team_alias WHERE alias = 'hmc';
INSERT INTO public.team VALUES ('hmc', 'hmc') ON CONFLICT DO NOTHING;
