INSERT INTO public.contractor_profiles (id, company_name, contact_email, status)
VALUES ('f184e9db-dcc4-4a54-a818-7a8e95db8697', 'Your Partner LLC', 'preview@windowman.pro', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.contractor_credits (contractor_id, balance)
VALUES ('f184e9db-dcc4-4a54-a818-7a8e95db8697', 0)
ON CONFLICT (contractor_id) DO NOTHING;