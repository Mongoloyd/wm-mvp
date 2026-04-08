import { test, expect } from "@playwright/test";

// ═══════════════════════════════════════════════════════════
// VALID UUIDs for Session A and Session B
// ═══════════════════════════════════════════════════════════
const SESSION_A_ID = "a1b2c3d4-e5f6-4789-a012-111111111111";
const SESSION_B_ID = "a1b2c3d4-e5f6-4789-a012-222222222222";

// ═══════════════════════════════════════════════════════════
// MOCK DATA — Different grades to prove correct session renders
// ═══════════════════════════════════════════════════════════
const MOCK_SESSION_A_PREVIEW = [{
  grade: "A",
  flag_count: 1,
  flag_red_count: 0,
  flag_amber_count: 1,
  confidence_score: 0.95,
  document_type: "quote",
  rubric_version: "v3",
  analysis_status: "complete",
  preview_json: {
    pillar_scores: {
      safety_code: { score: 85 },
      install_scope: { score: 90 },
      price_fairness: { score: 80 },
      fine_print: { score: 88 },
      warranty: { score: 92 },
    },
  },
}];

const MOCK_SESSION_B_PREVIEW = [{
  grade: "C",
  flag_count: 4,
  flag_red_count: 3,
  flag_amber_count: 1,
  confidence_score: 0.65,
  document_type: "quote",
  rubric_version: "v3",
  analysis_status: "complete",
  preview_json: {
    pillar_scores: {
      safety_code: { score: 35 },
      install_scope: { score: 40 },
      price_fairness: { score: 25 },
      fine_print: { score: 30 },
      warranty: { score: 45 },
    },
  },
}];

const MOCK_COUNTY = [{ county_name: "Miami-Dade", state: "FL" }];

// ═══════════════════════════════════════════════════════════
// CRITICAL: Custom describe block WITHOUT automatic cleanup
// ═══════════════════════════════════════════════════════════
test.describe("Cross-Session Ghost — Identity Isolation", () => {

  test("Session B identity must not leak from Session A stored credentials", async ({ browser }) => {

    // ─────────────────────────────────────────────────────────
    // PHASE 1: Create persistent context (simulates returning user)
    // ─────────────────────────────────────────────────────────
    const context = await browser.newContext();
    const page = await context.newPage();

    // ─────────────────────────────────────────────────────────
    // PHASE 2: Set up session-aware RPC mocking
    // ─────────────────────────────────────────────────────────
    await page.route("**/rest/v1/rpc/get_analysis_preview", async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const requestedSessionId = body.p_scan_session_id;

      if (requestedSessionId === SESSION_A_ID) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SESSION_A_PREVIEW),
        });
      } else if (requestedSessionId === SESSION_B_ID) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SESSION_B_PREVIEW),
        });
      } else {
        await route.fulfill({ status: 404, body: JSON.stringify({ error: "Not found" }) });
      }
    });

    await page.route("**/rest/v1/rpc/get_county_by_scan_session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_COUNTY),
      });
    });

    // ─────────────────────────────────────────────────────────
    // PHASE 3: Simulate Session A with verified phone
    // ─────────────────────────────────────────────────────────
    await context.addInitScript(() => {
      localStorage.setItem('wm_funnel_phoneE164', '+13054561111');
      localStorage.setItem('wm_funnel_phoneStatus', 'verified');
      localStorage.setItem('wm_funnel_scanSessionId', 'a1b2c3d4-e5f6-4789-a012-111111111111');
      localStorage.setItem('wm_funnel_ts', String(Date.now()));
    });

    await page.goto(`/report/classic/${SESSION_A_ID}`);

    // Verify Session A identity is active
    const sessionAPhone = await page.evaluate(() =>
      localStorage.getItem('wm_funnel_phoneE164')
    );
    expect(sessionAPhone).toBe('+13054561111');

    // Verify Session A rendered (grade A visible)
    await expect(page.getByText(/Grade.*A/i)).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────
    // PHASE 4: Navigate to Session B WITHOUT clearing storage
    // (This is the "Ghost" scenario)
    // ─────────────────────────────────────────────────────────
    await page.goto(`/report/classic/${SESSION_B_ID}`);

    // ─────────────────────────────────────────────────────────
    // CRITICAL ASSERTIONS: The "Ghost" Must Not Appear
    // ─────────────────────────────────────────────────────────

    // 1. UI Assertion: Phone input must be EMPTY and VISIBLE
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.waitFor({ state: "visible", timeout: 10000 });

    const phoneValue = await phoneInput.inputValue();
    expect(phoneValue).toBe('');

    // 2. Negative Assertion: OTP UI must NOT be visible
    const otpInput = page.locator('input[autocomplete="one-time-code"]');
    await expect(otpInput).not.toBeVisible();

    // 3. Storage Purge: Session A credentials must be DELETED
    await page.waitForFunction(() => {
      return localStorage.getItem('wm_funnel_phoneE164') === null;
    }, { timeout: 5000 });

    const phoneAfterCleanup = await page.evaluate(() =>
      localStorage.getItem('wm_funnel_phoneE164')
    );
    expect(phoneAfterCleanup).toBeNull();

    const statusAfterCleanup = await page.evaluate(() =>
      localStorage.getItem('wm_funnel_phoneStatus')
    );
    expect(statusAfterCleanup).toBeNull();

    // 4. Verify Session B actually rendered (not stale Session A)
    await expect(page.getByText(/Grade.*C/i)).toBeVisible({ timeout: 5000 });

    // ─────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────
    await context.close();
  });

  // ═══════════════════════════════════════════════════════════
  // EDGE CASE: Same session in multiple navigations should PRESERVE
  // ═══════════════════════════════════════════════════════════
  test("Session A identity SHOULD persist when navigating back to Session A", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Mock RPCs
    await page.route("**/rest/v1/rpc/get_analysis_preview", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(MOCK_SESSION_A_PREVIEW),
      });
    });

    await page.route("**/rest/v1/rpc/get_county_by_scan_session", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(MOCK_COUNTY),
      });
    });

    // Seed Session A credentials
    await context.addInitScript(() => {
      localStorage.setItem('wm_funnel_phoneE164', '+13054561111');
      localStorage.setItem('wm_funnel_phoneStatus', 'verified');
      localStorage.setItem('wm_funnel_scanSessionId', 'a1b2c3d4-e5f6-4789-a012-111111111111');
      localStorage.setItem('wm_funnel_ts', String(Date.now()));
    });

    // Navigate to Session A
    await page.goto(`/report/classic/${SESSION_A_ID}`);

    // Navigate away and back to Session A
    await page.goto('/');
    await page.goto(`/report/classic/${SESSION_A_ID}`);

    // Credentials SHOULD still exist (session ID matches)
    const phonePreserved = await page.evaluate(() =>
      localStorage.getItem('wm_funnel_phoneE164')
    );
    expect(phonePreserved).toBe('+13054561111');

    await context.close();
  });
});
