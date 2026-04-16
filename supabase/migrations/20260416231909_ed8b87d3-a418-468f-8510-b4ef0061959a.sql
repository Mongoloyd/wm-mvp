-- Arc 4 — Snapshot Receipt delivery state (narrow, explicit, idempotent).
-- Adds three fields to leads to track the *full* Snapshot Receipt email lifecycle
-- without overloading the existing legacy report_email_sent_at / report_email_type fields.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS snapshot_email_status text
    NOT NULL DEFAULT 'not_sent'
    CHECK (snapshot_email_status IN ('not_sent','sent','failed','suppressed')),
  ADD COLUMN IF NOT EXISTS snapshot_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS snapshot_email_last_error text;

CREATE INDEX IF NOT EXISTS leads_snapshot_email_status_idx
  ON public.leads(snapshot_email_status)
  WHERE snapshot_email_status <> 'sent';