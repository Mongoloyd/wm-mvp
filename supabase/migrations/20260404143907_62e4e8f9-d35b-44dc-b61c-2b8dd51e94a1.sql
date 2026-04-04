-- Migration 1: voice_followups RLS policies
ALTER TABLE voice_followups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_followups'
      AND policyname = 'internal_operators_insert_voice_followups'
  ) THEN
    CREATE POLICY internal_operators_insert_voice_followups
      ON voice_followups
      FOR INSERT
      TO authenticated
      WITH CHECK (is_internal_operator());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_followups'
      AND policyname = 'internal_operators_update_voice_followups'
  ) THEN
    CREATE POLICY internal_operators_update_voice_followups
      ON voice_followups
      FOR UPDATE
      TO authenticated
      USING (is_internal_operator())
      WITH CHECK (is_internal_operator());
  END IF;
END
$$;

-- Migration 2: leads table — manual review columns
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS manually_reviewed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_entry_data JSONB;

-- Migration 3: contractor_opportunities — sent_at column
ALTER TABLE contractor_opportunities
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;