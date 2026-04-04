

## P3: Outbound Calling — Autodial Button + `dial-lead` Edge Function

### What We Have Today

Two existing Edge Functions fire webhooks to phonecall.bot:
- `voice-followup` — admin-auth gated, takes `scan_session_id` + `phone_e164` + `call_intent`
- `request-callback` — public-facing, takes `scan_session_id` + `call_intent`, looks up phone from lead

Neither is suitable as a one-click "Dial" from the CRM table because:
1. `voice-followup` requires the operator to know `scan_session_id` and `phone_e164` (not exposed in the row action)
2. `request-callback` is public-facing with homeowner-level security (checks `phone_verified`)
3. Both insert `voice_followups` rows + fire the webhook — good, but the CRM needs a simpler entry point keyed by `lead_id`

### What P3 Builds

**1. New Edge Function: `dial-lead`**
- Admin-auth gated (operator or super_admin via `validateAdminRequestWithRole`)
- Input: `{ lead_id, call_intent }` (defaults to `"operator_outbound"`)
- Looks up `lead.phone_e164`, `lead.latest_scan_session_id`, `lead.first_name`, `lead.county`, `lead.grade`, `lead.flag_count`
- Validates lead exists and has a phone number
- Inserts a `voice_followups` row with status `queued`, provider `phonecall.bot`
- Fires `PHONECALL_BOT_WEBHOOK_URL` webhook (graceful skip if unset, same pattern as existing functions)
- Updates `lead.deal_status` to `"attempted"` if currently `"new"` or null
- Logs `voice_followup_queued` event to `lead_events`
- Returns `{ success, followup_id, webhook_status }`

**2. Autodial Button in `InternalCRMDesk.tsx`**
- Add a phone-dial icon button next to each lead's phone number cell (or as a new action)
- On click: calls `dial-lead` Edge Function with `lead_id`
- Shows loading spinner on the button during the call
- On success: toast "Call queued for {first_name}", optimistically update pipeline badge to "AI Calling"
- On failure: toast error, no state change
- Disabled when: no `phone_e164`, or a dial is already in-flight for that lead

**3. No other changes**
- No new DB tables or columns
- No changes to `AdminDashboard.tsx` fetch cycle
- No changes to types (uses existing `voice_followups` table shape)

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/dial-lead/index.ts` | **New** — admin-auth dial proxy |
| `src/components/admin/InternalCRMDesk.tsx` | Add Autodial button + invoke logic |

### Constraints Respected
- No new Supabase queries in the frontend
- No schema migrations
- Admin-auth only (operator/super_admin)
- Reuses existing `PHONECALL_BOT_WEBHOOK_URL` + `voice_followups` table
- Pipeline badge already handles "AI Calling" state via `latestFollowups` (will reflect on next poll)

