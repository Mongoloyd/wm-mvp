ALTER TABLE public.phone_verifications
  ADD COLUMN IF NOT EXISTS ip_address text;