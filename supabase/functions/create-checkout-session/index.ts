/**
 * create-checkout-session — Creates a Stripe Checkout Session for contractor credit purchases.
 *
 * Auth: JWT required (contractor auth user).
 * Does NOT grant credits — that happens in the webhook fulfillment flow.
 *
 * POST body: { pack_code: string, success_url?: string, cancel_url?: string }
 * Returns:   { url: string }
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17.7.0";

/* ── CORS ────────────────────────────────────────────────────────────── */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ── Credit Pack Config ──────────────────────────────────────────────── */

interface CreditPack {
  code: string;
  label: string;
  credits: number;
  amount_cents: number;
}

const CREDIT_PACKS: Record<string, CreditPack> = {
  pack_10_credits: {
    code: "pack_10_credits",
    label: "10 Lead Credits",
    credits: 10,
    amount_cents: 50000,
  },
  pack_25_credits: {
    code: "pack_25_credits",
    label: "25 Lead Credits",
    credits: 25,
    amount_cents: 112500,
  },
  pack_50_credits: {
    code: "pack_50_credits",
    label: "50 Lead Credits",
    credits: 50,
    amount_cents: 200000,
  },
};

/* ── Handler ─────────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Authenticate ───────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "unauthenticated", message: "Missing auth token." }, 401);
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return json({ error: "unauthenticated", message: "Invalid auth token." }, 401);
    }
    const authUserId = userData.user.id;

    // ── 2. Service client ─────────────────────────────────────────
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 3. Resolve contractor identity ────────────────────────────
    const { data: profile } = await svc
      .from("contractor_profiles")
      .select("id, status")
      .eq("id", authUserId)
      .maybeSingle();

    if (!profile) {
      return json({ error: "no_contractor_profile", message: "No contractor profile found." }, 404);
    }

    if (profile.status !== "active") {
      return json({
        error: "contractor_inactive",
        message: `Contractor account is ${profile.status}.`,
        contractor_status: profile.status,
      }, 403);
    }

    // ── 4. Parse & validate request body ──────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_body", message: "Request body must be valid JSON." }, 400);
    }

    const packCode = body.pack_code as string | undefined;
    if (!packCode) {
      return json({ error: "missing_pack_code", message: "pack_code is required." }, 400);
    }

    const pack = CREDIT_PACKS[packCode];
    if (!pack) {
      return json({
        error: "invalid_pack_code",
        message: `Unknown pack_code: ${packCode}. Valid: ${Object.keys(CREDIT_PACKS).join(", ")}`,
      }, 400);
    }

    // ── 5. Build URLs ─────────────────────────────────────────────
    const origin = (body.origin as string) || Deno.env.get("REPORT_BASE_URL") || "https://wmmvp.lovable.app";
    const successUrl = `${origin}/partner/opportunities?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/partner/opportunities?payment=cancel`;

    // ── 6. Create Stripe Checkout Session ─────────────────────────
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[create-checkout-session] STRIPE_SECRET_KEY not configured");
      return json({ error: "config_error", message: "Payment system not configured." }, 500);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: pack.amount_cents,
            product_data: {
              name: pack.label,
              description: `${pack.credits} lead unlock credits for WindowMan.PRO`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        contractor_id: authUserId,
        credit_pack_code: pack.code,
        credits_purchased: String(pack.credits),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      console.error("[create-checkout-session] Stripe returned no URL", session.id);
      return json({ error: "stripe_error", message: "Failed to create checkout session." }, 500);
    }

    // ── 7. Create pending purchase row ────────────────────────────
    const { error: insertErr } = await svc
      .from("contractor_credit_purchases")
      .insert({
        contractor_id: authUserId,
        stripe_checkout_session_id: session.id,
        credit_pack_code: pack.code,
        credits_purchased: pack.credits,
        amount_total_cents: pack.amount_cents,
        currency: "usd",
        status: "pending",
      });

    if (insertErr) {
      console.error("[create-checkout-session] Failed to insert purchase row:", insertErr);
      // Still return URL — the webhook can reconcile later
    }

    // ── 8. Return checkout URL ────────────────────────────────────
    console.log(
      `[create-checkout-session] Created session ${session.id} for contractor ${authUserId}, pack ${pack.code}`,
    );

    return json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error("[create-checkout-session] Unhandled error:", err);
    return json({ error: "internal_error", message: "Internal server error." }, 500);
  }
});
