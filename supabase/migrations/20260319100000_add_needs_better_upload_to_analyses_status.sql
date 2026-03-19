-- Refactor analysis_status from TEXT+CHECK to a PostgreSQL ENUM type.
-- Benefits: type-safe, efficient ALTER TYPE ADD VALUE for future statuses,
-- and stricter generated TypeScript types from Supabase.

-- 1. Create the ENUM type with all current valid statuses (including the new
--    'needs_better_upload' value for unreadable/incomplete quote uploads).
CREATE TYPE public.analysis_status_enum AS ENUM (
  'pending',
  'processing',
  'complete',
  'failed',
  'invalid_document',
  'needs_better_upload'
);

-- 2. Drop the old CHECK constraint.
ALTER TABLE public.analyses
  DROP CONSTRAINT IF EXISTS analyses_analysis_status_check;

-- 3. Convert the column to the new ENUM type, casting all existing values.
ALTER TABLE public.analyses
  ALTER COLUMN analysis_status DROP DEFAULT;

ALTER TABLE public.analyses
  ALTER COLUMN analysis_status TYPE public.analysis_status_enum
  USING analysis_status::public.analysis_status_enum;

ALTER TABLE public.analyses
  ALTER COLUMN analysis_status SET DEFAULT 'pending'::public.analysis_status_enum;
