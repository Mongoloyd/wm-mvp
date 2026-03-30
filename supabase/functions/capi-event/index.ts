/**
 * capi-event — Facebook Conversions API Edge Function
 *
 * Receives events from the browser and forwards them to Meta's
 * Conversions API for server-side deduplication.
 *
 * This survives iOS Safari Intelligent Tracking Prevention (ITP)
 * and ad blockers that strip the browser pixel.
 *
 * Deduplication: Both browser pixel and CAPI send the same event_id.
 * Meta automatically deduplicates, counting each event once.
 *
 * Required env vars:
 *   META_PIXEL_ID        — Your pixel ID
 *   META_CAPI_TOKEN      — Conversions API access token
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CAPIEvent {
  event_name: string;
  event_id: string;
  event_time: number;
  event_source_url: string;
  action_source: "website";
  user_data: {
    em?: string;
    ph?: string;
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

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pixelId = Deno.env.get("META_PIXEL_ID");
    const accessToken = Deno.env.get("META_CAPI_TOKEN");

    if (!pixelId || !accessToken) {
      console.warn("CAPI: Missing META_PIXEL_ID or META_CAPI_TOKEN");
      return new Response(
        JSON.stringify({ success: false, error: "CAPI not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json() as CAPIEvent;

    // Extract client IP from request headers (Supabase/Cloudflare provides this)
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    // Build CAPI payload
    const eventData: any = {
      event_name: body.event_name,
      event_time: body.event_time || Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      event_source_url: body.event_source_url,
      action_source: "website",
      user_data: {
        ...body.user_data,
        client_ip_address: clientIp,
      },
    };

    // Add custom data if present
    if (body.custom_data) {
      eventData.custom_data = body.custom_data;
    }

    // Hash external_id if present (Meta requires hashed external_id)
    if (eventData.user_data.external_id) {
      const encoder = new TextEncoder();
      const data = encoder.encode(eventData.user_data.external_id.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      eventData.user_data.external_id = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    // Send to Meta Conversions API
    const capiUrl = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

    const response = await fetch(capiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [eventData],
        // Test event code — remove in production
        // test_event_code: "TEST12345",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("CAPI error:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ success: false, error: result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, events_received: result.events_received }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("CAPI function error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
