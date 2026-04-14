import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { mapToGoogle } from "../_shared/canonical/mapToGoogle.ts";
import { mapToMeta } from "../_shared/canonical/mapToMeta.ts";
import { RETRY_DELAYS_MS } from "../_shared/canonical/constants.ts";
import type { WMCanonicalEvent, WMPlatformName } from "../_shared/canonical/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isRetryableStatus(code: number): boolean {
  return code === 429 || code >= 500;
}

function nextRetry(attemptCount: number): string | null {
  if (attemptCount >= RETRY_DELAYS_MS.length) return null;
  return new Date(Date.now() + RETRY_DELAYS_MS[attemptCount]).toISOString();
}

const EXTERNAL_FETCH_TIMEOUT_MS = 30000; // 30 second timeout for external API calls

async function sendMeta(payload: Record<string, unknown>) {
  const pixelId = Deno.env.get("META_PIXEL_ID");
  const token = Deno.env.get("META_CAPI_TOKEN");
  if (!pixelId || !token) {
    return { ok: false, status: 400, response: { error: "meta_not_configured" }, retryable: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [payload] }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const response = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, response, retryable: isRetryableStatus(res.status) };
  } catch (err) {
    clearTimeout(timeoutId);
    // AbortController throws DOMException in Deno, Error in some Node environments
    if ((err instanceof DOMException || err instanceof Error) && err.name === "AbortError") {
      return { ok: false, status: 408, response: { error: "request_timeout" }, retryable: true };
    }
    throw err;
  }
}

async function sendGoogle(payload: Record<string, unknown>) {
  const endpoint = Deno.env.get("GOOGLE_OFFLINE_CONVERSION_ENDPOINT");
  const apiKey = Deno.env.get("GOOGLE_OFFLINE_CONVERSION_API_KEY");
  if (!endpoint) {
    return { ok: false, status: 400, response: { error: "google_endpoint_not_configured" }, retryable: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const response = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, response, retryable: isRetryableStatus(res.status) };
  } catch (err) {
    clearTimeout(timeoutId);
    // AbortController throws DOMException in Deno, Error in some Node environments
    if ((err instanceof DOMException || err instanceof Error) && err.name === "AbortError") {
      return { ok: false, status: 408, response: { error: "request_timeout" }, retryable: true };
    }
    throw err;
  }
}

async function markEventPlatformStatus(
  supabase: any,
  eventId: string,
  platform: WMPlatformName,
  status: string,
) {
  const field = platform === "meta" ? "meta_dispatch_status" : "google_dispatch_status";
  await supabase.from("wm_event_log").update({ [field]: status }).eq("event_id", eventId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const nowIso = new Date().toISOString();

  const { data: jobs, error: fetchErr } = await supabase
    .from("wm_platform_dispatch_log")
    .select("id,event_id,platform,status,attempt_count,max_attempts")
    .in("status", ["pending", "failed"])
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order("created_at", { ascending: true })
    .limit(20);

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!jobs?.length) {
    return new Response(JSON.stringify({ processed: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<Record<string, unknown>> = [];

  for (const job of jobs) {
    const lockToken = crypto.randomUUID();

    const { data: locked, error: lockErr } = await supabase
      .from("wm_platform_dispatch_log")
      .update({ status: "processing", lock_token: lockToken, locked_at: nowIso, last_attempt_at: nowIso })
      .eq("id", job.id)
      .in("status", ["pending", "failed"])
      .select("id,event_id,platform,attempt_count,max_attempts")
      .maybeSingle();

    if (lockErr || !locked) continue;

    const attemptCount = (locked.attempt_count ?? 0) + 1;

    const { data: eventRow } = await supabase
      .from("wm_event_log")
      .select("payload")
      .eq("event_id", locked.event_id)
      .maybeSingle();

    const event = eventRow?.payload as WMCanonicalEvent | undefined;
    if (!event) {
      await supabase.from("wm_platform_dispatch_log").update({
        status: "dead_letter",
        attempt_count: attemptCount,
        last_error: "canonical_event_missing",
        next_retry_at: null,
      }).eq("id", locked.id).eq("lock_token", lockToken);
      await markEventPlatformStatus(supabase, locked.event_id, locked.platform, "dead_letter");
      continue;
    }

    const mappedPayload = locked.platform === "meta" ? mapToMeta(event) : mapToGoogle(event);

    if (!mappedPayload) {
      await supabase.from("wm_platform_dispatch_log").update({
        status: "suppressed",
        suppression_reason: "mapper_suppressed",
        request_payload: null,
        response_payload: null,
        attempt_count: attemptCount,
        next_retry_at: null,
      }).eq("id", locked.id).eq("lock_token", lockToken);
      await markEventPlatformStatus(supabase, locked.event_id, locked.platform, "suppressed");
      results.push({ id: locked.id, status: "suppressed" });
      continue;
    }

    try {
      const sendResult = locked.platform === "meta"
        ? await sendMeta(mappedPayload as Record<string, unknown>)
        : await sendGoogle(mappedPayload as Record<string, unknown>);

      if (sendResult.ok) {
        await supabase.from("wm_platform_dispatch_log").update({
          status: "sent",
          attempt_count: attemptCount,
          request_payload: mappedPayload,
          response_payload: sendResult.response,
          last_http_status: sendResult.status,
          last_error: null,
          next_retry_at: null,
        }).eq("id", locked.id).eq("lock_token", lockToken);
        await markEventPlatformStatus(supabase, locked.event_id, locked.platform, "sent");
        results.push({ id: locked.id, status: "sent" });
      } else {
        const retryable = sendResult.retryable && attemptCount < Math.min(locked.max_attempts, RETRY_DELAYS_MS.length);
        const status = retryable ? "failed" : "dead_letter";
        await supabase.from("wm_platform_dispatch_log").update({
          status,
          attempt_count: attemptCount,
          request_payload: mappedPayload,
          response_payload: sendResult.response,
          last_http_status: sendResult.status,
          last_error: JSON.stringify(sendResult.response),
          next_retry_at: retryable ? nextRetry(attemptCount) : null,
        }).eq("id", locked.id).eq("lock_token", lockToken);
        await markEventPlatformStatus(supabase, locked.event_id, locked.platform, status);
        results.push({ id: locked.id, status });
      }
    } catch (error) {
      const retryable = attemptCount < Math.min(locked.max_attempts, RETRY_DELAYS_MS.length);
      const status = retryable ? "failed" : "dead_letter";
      await supabase.from("wm_platform_dispatch_log").update({
        status,
        attempt_count: attemptCount,
        request_payload: mappedPayload,
        last_error: error instanceof Error ? error.message : String(error),
        next_retry_at: retryable ? nextRetry(attemptCount) : null,
      }).eq("id", locked.id).eq("lock_token", lockToken);
      await markEventPlatformStatus(supabase, locked.event_id, locked.platform, status);
      results.push({ id: locked.id, status });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
