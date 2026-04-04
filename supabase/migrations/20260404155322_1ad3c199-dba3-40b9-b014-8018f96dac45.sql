ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_deal_status_check;

ALTER TABLE public.leads ADD CONSTRAINT leads_deal_status_check CHECK (
  deal_status IS NULL OR deal_status IN (
    'new', 'attempted', 'in_conversation',
    'appointment_booked', 'ghosted',
    'open', 'won', 'lost', 'dead'
  )
);