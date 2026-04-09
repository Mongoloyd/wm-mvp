
ALTER TABLE public.contractors
  ADD COLUMN preferred_contact_method text,
  ADD COLUMN schedule_notes text,
  ADD COLUMN max_leads_per_week integer,
  ADD COLUMN budget_bands text[] NOT NULL DEFAULT '{}',
  ADD COLUMN routing_setup_completed_at timestamptz;
