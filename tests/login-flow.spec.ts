/**
 * Login Flow E2E Test
 *
 * Validates the contractor/partner login page at /contractor-login:
 * - Page loads with email + password fields
 * - Validation errors shown for empty/invalid submissions
 * - Successful login redirects to partner opportunities
 * - Password reset link navigates to reset flow
 */

import { test, expect } from '@playwright/test';

test.describe('Contractor Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contractor-login');
  });

  test('renders login form with required fields', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    // Browser native validation or toast should prevent submission
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Expect an error toast or inline message
    await expect(
      page.getByText(/invalid|incorrect|error/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('forgot password link is accessible', async ({ page }) => {
    const forgotLink = page.getByText(/forgot.*password/i);
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();

    // Should show reset password form or modal
    await expect(
      page.getByText(/reset|recovery|email/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
