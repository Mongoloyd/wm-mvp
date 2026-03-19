-- Allow first-class analysis outcomes for unreadable/incomplete quote uploads.
ALTER TABLE public.analyses
  DROP CONSTRAINT IF EXISTS analyses_analysis_status_check;

ALTER TABLE public.analyses
  ADD CONSTRAINT analyses_analysis_status_check
  CHECK (
    analysis_status IN (
      'pending',
      'processing',
      'complete',
      'failed',
      'invalid_document',
      'needs_better_upload'
    )
  );
