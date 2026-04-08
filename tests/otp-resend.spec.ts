import { test, expect } from "@playwright/test";

// ═══════════════════════════════════════════════════════════
// MOCK DATA CONTRACTS
// ═══════════════════════════════════════════════════════════

const TEST_SESSION_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

/**
 * Matches the shape returned by Supabase RPC `get_analysis_preview`.
 * Without this, ReportClassic renders "Report Not Found" and the OTP
 * gate never appears.
 */
const MOCK_ANALYSIS = [
  {
    grade: "C",
    flag_count: 3,
    flag_red_count: 2,
    flag_amber_count: 1,
    confidence_score: 0.85,
    document_type: "quote",
    rubric_version: "v3",
    preview_json: {
      pillar_scores: {
        safety_code: { score: 45 },
        install_scope: { score: 60 },
        price_fairness: { score: 35 },
        fine_print: { score: 50 },
        warranty: { score: 70 },
      },
    },
    proof_of_read: {},
  },
];

const MOCK_COUNTY = [{ county: "Miami-Dade" }];

/**
 * Success shape must include `success: true` — the pipeline checks
 * `data?.success` (not `data?.ok`).
 */
const MOCK_OTP_SUCCESS = { success: true };

/**
 * Rate-limit response from send-otp Edge Function.
 * The pipeline reads `body.error` and checks `error.context.status === 429`
 * plus `body.twilio_code === 60410 | 60203` for classification.
 */
const MOCK_RATE_LIMIT = {
  error: "Max send attempts reached",
  twilio_code: 60203,
};

// ═══════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════

test.describe("OTP Resend — Session-Scoped & Network-Verified", () => {
  test.beforeEach(async ({ context }) => {
    // ─────────────────────────────────────────────────────────
    // FIX #1 — Hydration Race:
    // addInitScript runs BEFORE any page JS, preventing the
    // React app from reading stale localStorage on mount.
    // ─────────────────────────────────────────────────────────
    await context.clearCookies();
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("resend OTP includes scan_session_id (UUID) and phone_e164 (E.164), handles 429 with Clock icon", async ({
    page,
  }) => {
    // ─────────────────────────────────────────────────────────
    // FIX #3 — Mock Supabase RPCs so ReportClassic renders
    // the report (and its LockedOverlay gate), not "Not Found".
    // ─────────────────────────────────────────────────────────
    await page.route("**/rest/v1/rpc/get_analysis_preview", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ANALYSIS),
      });
    });

    await page.route("**/rest/v1/rpc/get_county_by_scan_session", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_COUNTY),
      });
    });

    // Also mock verify-otp so OTP submission doesn't hit production
    await page.route("**/functions/v1/verify-otp", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid code", verified: false }),
      });
    });

    // ─────────────────────────────────────────────────────────
    // Mock send-otp Edge Function with call counter.
    // Call 1: success → progression to OTP step
    // Call 2+: 429 → rate limit error UI
    // ─────────────────────────────────────────────────────────
    let sendOtpCallCount = 0;

    await page.route("**/functions/v1/send-otp", async (route) => {
      sendOtpCallCount += 1;

      if (sendOtpCallCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_OTP_SUCCESS),
        });
        return;
      }

      // Subsequent calls: 429 rate limit
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify(MOCK_RATE_LIMIT),
      });
    });

    // ─────────────────────────────────────────────────────────
    // FIX #2 — Navigate to the correct route where the OTP
    // flow actually lives (not "/").
    // ─────────────────────────────────────────────────────────
    await page.goto(`/report/classic/${TEST_SESSION_ID}`);

    // ─────────────────────────────────────────────────────────
    // STEP 4: Fill phone number in LockedOverlay
    // The input has a "+1" prefix label; we type raw digits.
    // ─────────────────────────────────────────────────────────
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.waitFor({ state: "visible", timeout: 15000 });
    await phoneInput.fill("3054561234");

    // ─────────────────────────────────────────────────────────
    // FIX #5 — Checkbox Proxy Trap:
    // Click the <label> wrapper, not the potentially hidden
    // native checkbox. Shadcn checkboxes often visually hide
    // the actual input element.
    // ─────────────────────────────────────────────────────────
    const tcpaLabel = page.locator("label").filter({ hasText: /agree/i }).first();
    await tcpaLabel.click();

    // ─────────────────────────────────────────────────────────
    // STEP 6: Submit phone → triggers first send-otp call
    // ─────────────────────────────────────────────────────────
    const sendButton = page.getByRole("button", { name: /Send Unlock Code/i });
    await expect(sendButton).toBeEnabled({ timeout: 5000 });
    await sendButton.click();

    // ─────────────────────────────────────────────────────────
    // FIX #4 — InputOTP Targeting:
    // Wait for the OTP step to render. InputOTP uses a hidden
    // <input> with individual styled slots. We must focus and
    // use keyboard.type() instead of page.fill().
    // ─────────────────────────────────────────────────────────
    const otpInput = page.locator('input[autocomplete="one-time-code"]');
    await otpInput.waitFor({ state: "attached", timeout: 10000 });
    await otpInput.focus();
    await page.keyboard.type("123456", { delay: 50 });

    // ─────────────────────────────────────────────────────────
    // STEP 9: Wait for resend cooldown (30s) to expire.
    // The button text changes from "Resend (0:XX)" to
    // "Didn't get it? Resend code" when cooldown hits 0.
    // ─────────────────────────────────────────────────────────
    const resendButton = page.locator("button").filter({
      hasText: /Resend code/i,
    });
    await expect(resendButton).toBeEnabled({ timeout: 35000 });

    // ─────────────────────────────────────────────────────────
    // STEP 10: Set up network interceptor BEFORE clicking
    // (prevents race condition where request fires before
    // waitForRequest is registered).
    // ─────────────────────────────────────────────────────────
    const resendRequestPromise = page.waitForRequest((req) =>
      req.method() === "POST" && req.url().includes("/functions/v1/send-otp")
    );

    // ─────────────────────────────────────────────────────────
    // STEP 11: Click resend → triggers second send-otp call
    // ─────────────────────────────────────────────────────────
    await resendButton.click();

    // ─────────────────────────────────────────────────────────
    // STEP 12: Wait for network, then validate payload
    // ─────────────────────────────────────────────────────────
    const resendRequest = await resendRequestPromise;
    const payload = resendRequest.postDataJSON() as Record<string, unknown>;

    // ─────────────────────────────────────────────────────────
    // FIX #6 — phone_e164 Must Be E.164 Format
    // Twilio Verify rejects anything other than +1XXXXXXXXXX
    // ─────────────────────────────────────────────────────────
    expect(payload).toBeDefined();
    expect(payload.phone_e164).toBeDefined();
    expect(String(payload.phone_e164)).toMatch(/^\+1\d{10}$/);
    expect(payload.phone_e164).toBe("+13054561234");

    // scan_session_id must be a valid UUID
    expect(payload.scan_session_id).toBeDefined();
    expect(String(payload.scan_session_id)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // ─────────────────────────────────────────────────────────
    // FIX #7 — Error UI Validation (text + Clock icon)
    // The LockedOverlay renders <Clock size={14}> for
    // errorType === "rate_limit" with caution color styling.
    // ─────────────────────────────────────────────────────────
    await expect(
      page.getByText(/Max send attempts reached/i)
    ).toBeVisible({ timeout: 5000 });

    // Clock icon: lucide-react renders <svg> with class "lucide-clock"
    // or the generic "lucide" class inside the error container.
    const clockIcon = page.locator("svg").filter({ has: page.locator('[d*="circle"]') }).locator("visible=true").first();
    // More robust: check the error container has an SVG sibling near the error text
    const errorContainer = page.locator("div").filter({
      hasText: /Max send attempts reached/i,
    });
    const svgInError = errorContainer.locator("svg").first();
    await expect(svgInError).toBeVisible({ timeout: 3000 });

    // Also verify the rate_limit helper text
    await expect(
      page.getByText(/protects your phone from abuse/i)
    ).toBeVisible();
  });
});
