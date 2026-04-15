-- ============================================================
-- Add 'sending' value to contractor_followup_status enum
--
-- Required to support atomic claiming in contractor-send-followups:
-- a worker atomically updates status to 'sending' before processing,
-- preventing duplicate sends when multiple cron invocations overlap.
-- ============================================================

alter type contractor_followup_status add value if not exists 'sending';
