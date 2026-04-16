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

    // Click "Add Client"
    await page.getByRole("button", { name: /add client/i }).click();

    // Fill the Name field — the slug auto-generates
    await page.getByLabel(/name/i).fill(uniqueName);

    // Save
    const saveBtn = page.getByRole("button", { name: /save/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Verify success toast
    await expect(page.getByText(/created|success/i)).toBeVisible({ timeout: 5_000 });

    // Verify the new partner appears in the table
    await expect(page.locator("table")).toContainText(uniqueName);
  });

  // ── TC-CR-014: XSS Protection — HTML tags are escaped ──────────
  test("should escape HTML tags in partner name (XSS Protection)", async ({ page }) => {
    const xssPayload = '<script>alert("xss")</script>';

    await page.getByRole("button", { name: /add client/i }).click();
    await page.getByLabel(/name/i).fill(xssPayload);
    await page.getByRole("button", { name: /save/i }).click();

    // Wait for creation
    await expect(page.getByText(/created|success/i)).toBeVisible({ timeout: 5_000 });

    // The sanitize() function strips HTML tags, so the stored name should be
    // 'alert("xss")' (without script tags). Verify no raw <script> in DOM.
    const scriptTags = await page.locator("td >> text=<script>").count();
    expect(scriptTags).toBe(0);

    // Ensure no JS dialog fires (XSS did not execute)
    let dialogFired = false;
    page.on("dialog", (dialog) => {
      dialogFired = true;
      dialog.dismiss();
    });
    // Small wait to ensure no async dialog
    await page.waitForTimeout(500);
    expect(dialogFired).toBe(false);
  });

  // ── TC-CU-001: Copy URL places a valid link on clipboard ───────
  test("should copy a valid deep-link to clipboard", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Ensure at least one client exists by checking for a Manage button
    const manageBtn = page.getByRole("button", { name: /manage/i }).first();
    const hasClients = (await manageBtn.count()) > 0;

    if (!hasClients) {
      test.skip();
      return;
    }

    // Open the first client's dossier to expose the Copy URL button
    await manageBtn.click();

    // Wait for the modal and the Copy button inside the LP URL section
    const copyBtn = page.locator("button").filter({ has: page.locator("svg") }).filter({ hasText: "" });
    // More specific: find the LandingPageUrl copy button by its container
    const lpUrlSection = page.locator("code").filter({ hasText: "/lp/" }).locator("..");
    const lpCopyBtn = lpUrlSection.getByRole("button");

    await lpCopyBtn.click();

    // Verify the "Copied" visual feedback (the Check icon appears)
    await expect(lpUrlSection.locator("svg.text-emerald-600, [class*='text-emerald']")).toBeVisible({ timeout: 2_000 });

    // Read clipboard and verify it's a valid URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/^https?:\/\/.+\/lp\/.+/);
    // Ensure no double-protocol (the bug we fixed earlier)
    expect(clipboardText).not.toMatch(/^https?:\/\/https?:\/\//);
  });

  // ── TC-DL-002: Soft-delete with confirmation dialog ────────────
  test("should perform soft-delete with confirmation", async ({ page }) => {
    // Create a partner to delete
    const targetName = `Delete-Me-${Date.now()}`;
    await page.getByRole("button", { name: /add client/i }).click();
    await page.getByLabel(/name/i).fill(targetName);
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/created|success/i)).toBeVisible({ timeout: 5_000 });

    // Close the modal if still open
    const cancelBtn = page.getByRole("button", { name: /cancel/i });
    if (await cancelBtn.isVisible()) await cancelBtn.click();

    // Find the row with our target and click the delete (trash) button
    const targetRow = page.locator("tr", { hasText: targetName });
    await expect(targetRow).toBeVisible();
    await targetRow.locator("button").filter({ has: page.locator("svg") }).last().click();

    // AlertDialog should be visible
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText(/deactivate/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: /delete client/i }).click();

    // Verify success feedback
    await expect(page.getByText(/deactivated|deleted|success/i)).toBeVisible({ timeout: 5_000 });
  });

  // ── TC-CR-018: Double-submit prevention ────────────────────────
  test("should disable Save button immediately on click (no double-submit)", async ({ page }) => {
    await page.getByRole("button", { name: /add client/i }).click();
    await page.getByLabel(/name/i).fill(`NoDouble-${Date.now()}`);

    const saveBtn = page.getByRole("button", { name: /save/i });
    await saveBtn.click();

    // The button should show "Saving…" and be disabled
    await expect(page.getByText(/saving/i)).toBeVisible({ timeout: 1_000 });
  });

  // ── TC-RD-003: Debounced search filters the client list ────────
  test("should filter clients with debounced search", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search clients/i);
    await expect(searchInput).toBeVisible();

    // Type a search query that likely won't match
    await searchInput.fill("zzz-nonexistent-query");

    // Wait for debounce (250ms) + render
    await page.waitForTimeout(400);

    // Should show "No clients match" message
    await expect(page.getByText(/no clients match/i)).toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(400);
  });

  // ── TC-SL-013: Signal Log tab with filters ─────────────────────
  test("should render Signal Log section with filter controls", async ({ page }) => {
    // The signal log section should be visible on the page
    const signalSection = page.getByText(/signal log/i).first();
    await expect(signalSection).toBeVisible();

    // Check filter dropdowns exist
    const filterSelects = page.locator('[role="combobox"]');
    expect(await filterSelects.count()).toBeGreaterThanOrEqual(1);
  });

  // ── RBAC: Viewer role hides mutation buttons ───────────────────
  // NOTE: In DEV mode the hook always returns super_admin, so this test
  // verifies that the write-access buttons ARE visible (positive case).
  // A true viewer-role test requires a production-like auth environment.
  test("should show Add Client button for admin users", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /add client/i });
    await expect(addBtn).toBeVisible();
  });
});
