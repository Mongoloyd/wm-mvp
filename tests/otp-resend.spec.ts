import { test, expect } from "@playwright/test";

test.describe("OTP Resend — Session-Scoped & Network-Verified", () => {
  test.beforeEach(async ({ context, page }) => {
    // --- STATE ISOLATION (CRITICAL): must happen BEFORE navigation ---
    await context.clearCookies();

    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.removeItem("wm_funnel_scanSessionId");
    });
  });

  test("resend OTP includes scan_session_id and handles rate limits gracefully", async ({
    page,
  }) => {
    // --- MOCK SUPABASE EDGE FUNCTION (SAVES TWILIO CREDITS) ---
    // Playwright cannot see server-to-server Twilio calls; mock the Edge Function response instead.
    let sendOtpCallCount = 0;

    await page.route("**/functions/v1/send-otp", async (route, request) => {
      sendOtpCallCount += 1;

      // First call: succeed so we can reach OTP gate
      if (sendOtpCallCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, otp_challenge_id: "mock-uuid" }),
        });
        return;
      }

      // Second call (resend): simulate Twilio rate limit
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: "rate_limit",
          details: { twilio_code: 60203, message: "Max send attempts reached" },
        }),
      });
    });

    // --- NAVIGATE & INITIAL SUBMIT ---
    await page.goto("/");

    await page.getByRole("textbox", { name: /name/i }).fill("Test User");
    await page.getByRole("textbox", { name: /email/i }).fill("test@example.com");
    await page.getByRole("textbox", { name: /phone/i }).fill("+15551234567");

    // Initial send
    await page.getByRole("button", { name: /send unlock code/i }).click();

    // OTP UI should render after successful first send
    await expect(page.getByText(/enter the 6-digit code/i)).toBeVisible();

    // --- SET UP INTERCEPTOR FOR THE RESEND REQUEST ---
    const resendRequestPromise = page.waitForRequest((req) => {
      return (
        req.method() === "POST" &&
        req.url().includes("/functions/v1/send-otp")
      );
    });

    // --- TRIGGER RESEND ---
    await page.getByRole("button", { name: /resend code/i }).click();

    // --- WAIT FOR NETWORK, NOT UI ---
    const resendRequest = await resendRequestPromise;
    const payload = resendRequest.postDataJSON() as Record<string, unknown>;

    // --- PAYLOAD CONTRACT ASSERTIONS ---
    expect(payload).toBeDefined();

    expect(payload.scan_session_id).toBeDefined();
    expect(String(payload.scan_session_id)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    expect(payload.phone_e164).toBe("+15551234567");

    // --- FAIL-CLOSED ERROR ASSERTION ---
    await expect(page.getByText(/max send attempts reached/i)).toBeVisible();
  });
});
