/**
 * contractor-booking-confirmed
 *
 * Handle contractor booking confirmation after Calendly redirect or webhook handoff.
 * Updates contractor CRM state and queues followup emails.
 *
 * POST body:
 *   lead_id: string (required)
 *   calendly_event_uri?: string | null
 *   calendly_invitee_uri?: string | null
 *   calendly_event_start?: string | null
 *   calendly_event_end?: string | null
 *
 * Uses service role — no end-user auth required.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[contractor-booking-confirmed] Missing Supabase env vars");
    return json({ error: "Server configuration error" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    lead_id,
    calendly_event_uri = null,
    calendly_invitee_uri = null,
    calendly_event_start = null,
    calendly_event_end = null,
  } = body as {
    lead_id?: string;
    calendly_event_uri?: string | null;
    calendly_invitee_uri?: string | null;
    calendly_event_start?: string | null;
    calendly_event_end?: string | null;
  };

  if (!lead_id || typeof lead_id !== "string") {
    return json({ error: "lead_id is required" }, 400);
  }

  // 1. Fetch contractor_leads row
  const { data: lead, error: fetchErr } = await supabase
    .from("contractor_leads")
    .select("id, booking_status, calendly_event_start")
    .eq("id", lead_id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[contractor-booking-confirmed] fetch lead error:", fetchErr);
    return json({ error: "Failed to fetch lead" }, 500);
  }

  if (!lead) {
    return json({ error: "Lead not found" }, 404);
  }

  const alreadyBooked = lead.booking_status === "booked";

  // 2. Update contractor_leads
  const { error: updateErr } = await supabase
    .from("contractor_leads")
    .update({
      booking_status: "booked",
      pipeline_stage: "booked",
      calendly_event_uri: calendly_event_uri ?? null,
      calendly_invitee_uri: calendly_invitee_uri ?? null,
      calendly_event_start: calendly_event_start ?? null,
      calendly_event_end: calendly_event_end ?? null,
    })
    .eq("id", lead_id);

  if (updateErr) {
    console.error("[contractor-booking-confirmed] update lead error:", updateErr);
    return json({ error: "Failed to update lead" }, 500);
  }

  // 3. Insert activity log
  const { error: activityErr } = await supabase
    .from("contractor_activity_log")
    .insert({
      contractor_lead_id: lead_id,
      activity_type: "booking_created",
      activity_data: {
        calendly_event_uri: calendly_event_uri ?? null,
        calendly_invitee_uri: calendly_invitee_uri ?? null,
        calendly_event_start: calendly_event_start ?? null,
        calendly_event_end: calendly_event_end ?? null,
        was_already_booked: alreadyBooked,
      },
    });

  if (activityErr) {
    console.error("[contractor-booking-confirmed] activity log error:", activityErr);
    // Non-fatal — continue
  }

  // 4. Queue followup emails (idempotent — no duplicate followup of same type + scheduled_for)
  const now = new Date();

  const followupsToInsert: Array<{
    contractor_lead_id: string;
    followup_type: string;
    scheduled_for: string;
    status: string;
    payload: Record<string, unknown>;
  }> = [];

  // confirmation_email — always, scheduled now
  const confirmScheduled = now.toISOString();
  const confirmExists = alreadyBooked
    ? await checkFollowupExists(supabase, lead_id, "confirmation_email", confirmScheduled)
    : false;

  if (!confirmExists) {
    followupsToInsert.push({
      contractor_lead_id: lead_id,
      followup_type: "confirmation_email",
      scheduled_for: confirmScheduled,
      status: "pending",
      payload: {
        calendly_event_start: calendly_event_start ?? null,
        calendly_event_end: calendly_event_end ?? null,
      },
    });
  }

  // reminder_24h / reminder_1h — only if event start is provided and sufficiently far away
  if (calendly_event_start) {
    const eventStart = new Date(calendly_event_start);

    if (!isNaN(eventStart.getTime())) {
      const msUntilEvent = eventStart.getTime() - now.getTime();
      const MS_24H = 24 * 60 * 60 * 1000;
      const MS_1H = 60 * 60 * 1000;

      if (msUntilEvent > MS_24H) {
        const reminder24Scheduled = new Date(eventStart.getTime() - MS_24H).toISOString();
        const exists24h = alreadyBooked
          ? await checkFollowupExists(supabase, lead_id, "reminder_24h", reminder24Scheduled)
          : false;

        if (!exists24h) {
          followupsToInsert.push({
            contractor_lead_id: lead_id,
            followup_type: "reminder_24h",
            scheduled_for: reminder24Scheduled,
            status: "pending",
            payload: {
              calendly_event_start: calendly_event_start,
              calendly_event_end: calendly_event_end ?? null,
            },
          });
        }
      }

      if (msUntilEvent > MS_1H) {
        const reminder1hScheduled = new Date(eventStart.getTime() - MS_1H).toISOString();
        const exists1h = alreadyBooked
          ? await checkFollowupExists(supabase, lead_id, "reminder_1h", reminder1hScheduled)
          : false;

        if (!exists1h) {
          followupsToInsert.push({
            contractor_lead_id: lead_id,
            followup_type: "reminder_1h",
            scheduled_for: reminder1hScheduled,
            status: "pending",
            payload: {
              calendly_event_start: calendly_event_start,
              calendly_event_end: calendly_event_end ?? null,
            },
          });
        }
      }
    }
  }

  if (followupsToInsert.length > 0) {
    const { error: followupErr } = await supabase
      .from("contractor_followups")
      .insert(followupsToInsert);

    if (followupErr) {
      console.error("[contractor-booking-confirmed] followup insert error:", followupErr);
      // Non-fatal — return success but log
    }
  }

  return json({
    success: true,
    lead_id,
    booking_status: "booked",
    followups_queued: followupsToInsert.length,
  });
});

// ── Helper: check if a followup already exists (pending or sent) ─────────────
async function checkFollowupExists(
  supabase: ReturnType<typeof createClient>,
  leadId: string,
  followupType: string,
  scheduledFor: string
): Promise<boolean> {
  // Match within a 60-second window to handle minor timestamp drift
  const lower = new Date(new Date(scheduledFor).getTime() - 60_000).toISOString();
  const upper = new Date(new Date(scheduledFor).getTime() + 60_000).toISOString();

  const { data, error } = await supabase
    .from("contractor_followups")
    .select("id")
    .eq("contractor_lead_id", leadId)
    .eq("followup_type", followupType)
    .in("status", ["pending", "sent"])
    .gte("scheduled_for", lower)
    .lte("scheduled_for", upper)
    .limit(1);

  if (error) {
    console.error("[contractor-booking-confirmed] checkFollowupExists error:", error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}
