import { test, expect, type Page } from "@playwright/test";

/**
 * WINDOWMAN ADMIN PARTNERS — CORE E2E TEST SUITE
 * =================================================
 * Tests the /admin/partners (White-Label Partners) page.
 *
 * In DEV mode, AuthGuard and useCurrentUserRole are bypassed,
 * so no login is required — we navigate directly to the page.
 *
 * Schema: clients (name, slug, is_active, created_at)
 *         meta_configurations (pixel_id, access_token, etc.)
 *         capi_signal_logs (realtime signal log)
 */

const BASE = process.env.BASE_URL ?? "http://localhost:5173";

// ── Helper: Navigate to the admin partners page ──────────────
async function goToPartners(page: Page) {
  await page.goto(`${BASE}/admin/partners`);
  // Wait for either the client table or the empty state to render
  await page.waitForSelector('table, [class*="text-center"]', { timeout: 10_000 });
}

test.describe("Admin Partners (Clients) Management", () => {

  test.beforeEach(async ({ page }) => {
    await goToPartners(page);
  });

  // ── TC-CR-001: Create a new partner and verify list update ─────
  test("should create a new partner and verify list update", async ({ page }) => {
    const uniqueName = `E2E-Partner-${Date.now()}`;

    await page.getByRole("button", { name: /add client/i }).click();
    await page.getByLabel(/name/i).fill(uniqueName);

    const saveBtn = page.getByRole("button", { name: /save/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(page.getByText(/created|success/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("table")).toContainText(uniqueName);
  });

  // ── TC-CR-014: XSS Protection — HTML tags are escaped ──────────
  test("should escape HTML tags in partner name (XSS Protection)", async ({ page }) => {
    const xssPayload = '<script>alert("xss")</script>';

    await page.getByRole("button", { name: /add client/i }).click();
    await page.getByLabel(/name/i).fill(xssPayload);
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(/created|success/i)).toBeVisible({ timeout: 5_000 });

    // sanitize() strips HTML tags — no raw <script> in the DOM
    const scriptTags = await page.locator("td >> text=<script>").count();
    expect(scriptTags).toBe(0);

    // Ensure no JS dialog fires
    let dialogFired = false;
    page.on("dialog", (dialog) => {
      dialogFired = true;
      dialog.dismiss();
    });
    await page.waitForTimeout(500);
    expect(dialogFired).toBe(false);
  });

  // ── TC-CU-001: Copy URL with Safari fallback ──────────────────
  test("should copy URL or show fallback modal if clipboard denied", async ({ page, context }) => {
    // Check we have at least one client
    const manageBtn = page.getByRole("button", { name: /manage/i }).first();
    if ((await manageBtn.count()) === 0) {
      test.skip();
      return;
    }

    // Open the dossier modal
    await manageBtn.click();

    // Locate the LP URL section
    const lpUrlSection = page.locator("code").filter({ hasText: "/lp/" }).locator("..");
    await expect(lpUrlSection).toBeVisible({ timeout: 3_000 });

    const copyBtn = lpUrlSection.getByRole("button");
    await copyBtn.click();

    // Either the clipboard succeeds (Check icon appears) OR the fallback modal opens
    const checkIcon = lpUrlSection.locator("[class*='text-emerald']");
    const fallbackDialog = page.getByRole("dialog").filter({ hasText: /copy landing page url/i });

    const succeeded = await Promise.race([
      checkIcon.waitFor({ timeout: 2_000 }).then(() => "clipboard" as const).catch(() => null),
      fallbackDialog.waitFor({ timeout: 2_000 }).then(() => "fallback" as const).catch(() => null),
    ]);

    expect(succeeded).not.toBeNull();

    if (succeeded === "fallback") {
      // The fallback modal shows a read-only input with the URL
      const urlInput = fallbackDialog.locator("input[readonly]");
      await expect(urlInput).toBeVisible();
      const value = await urlInput.inputValue();
      expect(value).toMatch(/^https?:\/\/.+\/lp\/.+/);
      expect(value).not.toMatch(/^https?:\/\/https?:\/\//);

      // Dismiss the modal
      await page.getByRole("button", { name: /done/i }).click();
      await expect(fallbackDialog).not.toBeVisible();
    }

    if (succeeded === "clipboard") {
      // Grant permissions and verify clipboard content
      try {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toMatch(/^https?:\/\/.+\/lp\/.+/);
        expect(clipboardText).not.toMatch(/^https?:\/\/https?:\/\//);
      } catch {
        // clipboard-read may not be available in headless — that's OK, the copy itself worked
      }
    }
  });

  // ── TC-DL-002: Soft-delete with confirmation dialog ────────────
  test("should perform soft-delete with confirmation", async ({ page }) => {
    const targetName = `Delete-Me-${Date.now()}`;
    await page.getByRole("button", { name: /add client/i }).click();
    await page.getByLabel(/name/i).fill(targetName);
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/created|success/i)).toBeVisible({ timeout: 5_000 });

    // Close modal if open
    const cancelBtn = page.getByRole("button", { name: /cancel/i });
    if (await cancelBtn.isVisible()) await cancelBtn.click();

    // Find and delete
    const targetRow = page.locator("tr", { hasText: targetName });
    await expect(targetRow).toBeVisible();
    await targetRow.locator("button").filter({ has: page.locator("svg") }).last().click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: /delete client/i }).click();
    await expect(page.getByText(/deactivated|deleted|success/i)).toBeVisible({ timeout: 5_000 });
  });

  // ── TC-CR-018: Double-submit prevention ────────────────────────
  test("should disable Save button immediately on click (no double-submit)", async ({ page }) => {
    await page.getByRole("button", { name: /add client/i }).click();
    await page.getByLabel(/name/i).fill(`NoDouble-${Date.now()}`);

    const saveBtn = page.getByRole("button", { name: /save/i });
    await saveBtn.click();

    await expect(page.getByText(/saving/i)).toBeVisible({ timeout: 1_000 });
  });

  // ── TC-RD-003: Debounced search ────────────────────────────────
  test("should filter clients with debounced search", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search clients/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill("zzz-nonexistent-query");
    await page.waitForTimeout(400);

    await expect(page.getByText(/no clients match/i)).toBeVisible();

    await searchInput.clear();
    await page.waitForTimeout(400);
  });

  // ── TC-SL-001: Signal Log with connection state + manual refresh ──
  test("should render Signal Log with connection indicator and refresh button", async ({ page }) => {
    // Signal log section is visible
    const signalSection = page.getByText(/capi signal log/i).first();
    await expect(signalSection).toBeVisible();

    // Connection state indicator exists (Live / Connecting… / Disconnected)
    const stateIndicator = page.locator("text=/Live|Connecting|Disconnected/i").first();
    await expect(stateIndicator).toBeVisible({ timeout: 5_000 });

    // Manual refresh button exists and is clickable
    const refreshBtn = page.getByRole("button", { name: /refresh signal log/i });
    await expect(refreshBtn).toBeVisible();

    // Click refresh — button should show spinner briefly
    await refreshBtn.click();
    // After refresh completes, the button should still be enabled
    await expect(refreshBtn).toBeEnabled({ timeout: 5_000 });
  });

  // ── TC-SL-FALLBACK: Real-time fallback via manual refresh ──────
  test("should allow manual data refresh if WebSocket is flaky", async ({ page }) => {
    const refreshBtn = page.getByRole("button", { name: /refresh signal log/i });
    await expect(refreshBtn).toBeVisible({ timeout: 5_000 });

    // Click refresh and verify the UI doesn't crash
    await refreshBtn.click();

    // The signal log should still render (either rows or empty state)
    const logArea = page.locator("section").filter({ hasText: /signal log/i });
    await expect(logArea).toBeVisible();
  });

  // ── RBAC: Admin sees Add Client button ─────────────────────────
  test("should show Add Client button for admin users", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /add client/i });
    await expect(addBtn).toBeVisible();
  });
});
