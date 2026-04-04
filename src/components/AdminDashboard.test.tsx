/**
 * Tests for AdminDashboard.tsx — Lead Sniper CRM v3.0
 *   - AuthGuard wraps content
 *   - 4 tab triggers render
 *   - Header shows "Lead Sniper CRM"
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Hoist mock refs ───────────────────────────────────────────────────────────
const { mockGetSession, mockOnAuthStateChange, mockFunctionsInvoke } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockFunctionsInvoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    functions: { invoke: mockFunctionsInvoke },
  },
}));

vi.mock("@/lib/trackConversion", () => ({ trackGtmEvent: vi.fn() }));

// ── Import after mocks ───────────────────────────────────────────────────────
import AdminDashboard from "./AdminDashboard";

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  // Authenticated session
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: "u1" }, access_token: "tok" } },
  });
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });

  // Edge function returns empty arrays
  mockFunctionsInvoke.mockResolvedValue({ data: { data: [] }, error: null });
});

describe("AdminDashboard – Lead Sniper CRM", () => {
  it("renders the 'Lead Sniper CRM' heading", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Lead Sniper CRM")).toBeInTheDocument();
    });
  });

  it("renders all 4 tab triggers", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Command Center/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Active Pipeline/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Ghost Recovery/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Engine Room/i })).toBeInTheDocument();
    });
  });

  it("shows settings link to /admin/settings", async () => {
    renderDashboard();
    await waitFor(() => {
      const link = screen.getByTitle("Admin Settings");
      expect(link).toHaveAttribute("href", "/admin/settings");
    });
  });
});
