/**
 * capi-event — Facebook Conversions API Edge Function
 *
 * Production-grade, multi-pixel, white-label ready.
 *
 * Routing Priority:
 *   1. clientSlug → look up meta_configurations for that client
 *   2. is_default = true row in meta_configurations (platform default)
 *   3. META_PIXEL_ID + META_CAPI_TOKEN env vars (hardcoded fallback)
 *
 * Features:
 *   - SHA-256 hashing of PII (em, ph) before sending to Meta
 *   - Multi-pixel routing via clientSlug
 *   - Signal logging to capi_signal_logs table
 *   - test_event_code support via env var (no code changes to toggle)
 *   - IP extraction from Cloudflare/proxy headers
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CAPIEvent {
  event_name: "CompleteRegistration" | "ViewContent" | "Lead" | "PageView";
  event_id: string;
  event_time?: number;
  event_source_url: string;
  action_source: "website";
  client_slug?: string; // Used to resolve which pixel to fire to
  user_data: {
    em?: string; // Raw email — will be hashed here
    ph?: string; // Raw phone — will be normalized and hashed here
    fbc?: string;
    fbp?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fn?: string;
    st?: string;
    country?: string;
  };
  custom_data?: Record<string, unknown>;
}

// --- UTILITY: SHA-256 hash any string ---
async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- UTILITY: Normalize phone (strip all non-digits) then hash ---
async function hashPhone(phone: string): Promise<string> {
  const normalized = phone.replace(/\D/g, "");
  return sha256(normalized);
}

// --- UTILITY: Resolve which pixel config to use ---
// Priority: clientSlug → default row → env vars
async function resolvePixelConfig(
  supabase: ReturnType<typeof createClient>,
  clientSlug?: string,
): Promise<{ pixelId: string; accessToken: string; testEventCode?: string } | null> {
  // Tier 1: Client-specific pixel
  if (clientSlug) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("slug", clientSlug)
      .eq("is_active", true)
      .single();

    if (client) {
      const { data: config } = await supabase
        .from("meta_configurations")
        .select("pixel_id, access_token, test_event_code")
        .eq("client_id", client.id)
        .single();

      if (config?.pixel_id && config?.access_token) {
        return {
          pixelId: config.pixel_id,
          accessToken: config.access_token,
          testEventCode: config.test_event_code ?? undefined,
        };
      }
    }
  }

  // Tier 2: Platform default pixel
  const { data: defaultConfig } = await supabase
    .from("meta_configurations")
    .select("pixel_id, access_token, test_event_code")
    .eq("is_default", true)
    .single();

  if (defaultConfig?.pixel_id && defaultConfig?.access_token) {
    return {
      pixelId: defaultConfig.pixel_id,
      accessToken: defaultConfig.access_token,
      testEventCode: defaultConfig.test_event_code ?? undefined,
    };
  }

  // Tier 3: Environment variable fallback
  const pixelId = Deno.env.get("META_PIXEL_ID");
  const accessToken = Deno.env.get("META_CAPI_TOKEN");
  const testEventCode = Deno.env.get("META_TEST_EVENT_CODE");

  if (pixelId && accessToken) {
    return { pixelId, accessToken, testEventCode: testEventCode ?? undefined };
  }

  return null; // Nothing configured — abort
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client for DB lookups and logging
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let resolvedPixelId: string | undefined;
  let body: CAPIEvent | undefined;

  try {
    body = (await req.json()) as CAPIEvent;

    // Resolve pixel config
    const config = await resolvePixelConfig(supabase, body.client_slug);

    if (!config) {
      console.warn("CAPI: No pixel configuration found. Aborting.");
      return new Response(JSON.stringify({ success: false, error: "CAPI not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    resolvedPixelId = config.pixelId;

    // Extract client IP
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    // Hash PII — NEVER send raw email or phone to Meta
    const hashedUserData: Record<string, unknown> = {
      ...body.user_data,
      client_ip_address: clientIp,
    };

    if (body.user_data.em) {
      hashedUserData.em = [await sha256(body.user_data.em)];
    }
    if (body.user_data.ph) {
      hashedUserData.ph = [await hashPhone(body.user_data.ph)];
    }
    if (body.user_data.external_id) {
      hashedUserData.external_id = await sha256(body.user_data.external_id);
    }

    // Build final CAPI payload
    const eventData: Record<string, unknown> = {
      event_name: body.event_name,
      event_time: body.event_time || Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      event_source_url: body.event_source_url,
      action_source: "website",
      user_data: hashedUserData,
    };

    if (body.custom_data) {
      eventData.custom_data = body.custom_data;
    }

    // Build the top-level payload
    // test_event_code comes from DB config or env var — never hardcoded
    const capiPayload: Record<string, unknown> = {
      data: [eventData],
    };

    if (config.testEventCode) {
      capiPayload.test_event_code = config.testEventCode;
    }

    // Fire to Meta
    const capiUrl = `https://graph.facebook.com/v19.0/${config.pixelId}/events?access_token=${config.accessToken}`;

    const response = await fetch(capiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(capiPayload),
    });

    const result = await response.json();

    // Log to capi_signal_logs — always, success or failure
    // Payload logged with PII already hashed (hashedUserData, not raw body.user_data)
    await supabase.from("capi_signal_logs").insert({
      client_slug: body.client_slug ?? "default",
      pixel_id: config.pixelId,
      event_name: body.event_name,
      status_code: response.status,
      payload: capiPayload, // Already hashed — safe to log
      response: result,
      fired_at: new Date().toISOString(),
    });

    if (!response.ok) {
      console.error("CAPI error:", JSON.stringify(result));
      return new Response(JSON.stringify({ success: false, error: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, events_received: result.events_received }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("CAPI function error:", err);

    // Still attempt to log the failure if we have enough context
    if (resolvedPixelId && body) {
      await supabase
        .from("capi_signal_logs")
        .insert({
          client_slug: body.client_slug ?? "default",
          pixel_id: resolvedPixelId,
          event_name: body.event_name ?? "unknown",
          status_code: 500,
          payload: {},
          response: { error: String(err) },
          fired_at: new Date().toISOString(),
        })
        .catch(() => {}); // Don't let logging failure crash the handler
    }

    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
