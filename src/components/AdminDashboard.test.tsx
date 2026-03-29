/**
 * Tests for AdminDashboard.tsx — focused on the PR changes:
 *   - Importing useCurrentUserRole
 *   - Conditionally rendering the "Access Control" link for super_admin only
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Mock heavy dependencies ───────────────────────────────────────────────────
// vi.mock is hoisted, so factory variables must be declared with vi.hoisted().
const {
  mockFunctionsInvoke,
  mockChannelOn,
  mockChannelSubscribe,
  mockChannelUnsubscribe,
  mockChannel,
  mockAuthGetSession,
  mockAuthOnAuthStateChange,
  mockUnsubscribe,
} = vi.hoisted(() => ({
  mockFunctionsInvoke: vi.fn(),
  mockChannelOn: vi.fn(),
  mockChannelSubscribe: vi.fn(),
  mockChannelUnsubscribe: vi.fn(),
  mockChannel: vi.fn(),
  mockAuthGetSession: vi.fn(),
  mockAuthOnAuthStateChange: vi.fn(),
  mockUnsubscribe: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: mockFunctionsInvoke,
    },
    channel: mockChannel,
    auth: {
      getSession: mockAuthGetSession,
      onAuthStateChange: mockAuthOnAuthStateChange,
    },
  },
}));

vi.mock("@/hooks/useCurrentUserRole", () => ({
  useCurrentUserRole: vi.fn(),
}));

vi.mock("@/lib/trackConversion", () => ({
  trackGtmEvent: vi.fn(),
}));

vi.mock("./admin/VoiceFollowupsPanel", () => ({
  default: () => <div data-testid="voice-followups-panel" />,
}));

vi.mock("@/lib/statusConstants", () => ({
  ROUTE_STATUS: {},
  RELEASE_STATUS: {},
  BILLING_STATUS: {},
  BILLING_MODEL: {},
  EVENTS: {},
  APPOINTMENT_STATUS: {},
  QUOTE_STATUS: {},
  DEAL_STATUS: {},
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import AdminDashboard from "./AdminDashboard";

const mockUseCurrentUserRole = useCurrentUserRole as ReturnType<typeof vi.fn>;

// ── Default mock setup helpers ────────────────────────────────────────────────

function setupSupabaseMocks() {
  // Channel mock: support method chaining
  const channelObj = {
    on: mockChannelOn,
    subscribe: mockChannelSubscribe,
    unsubscribe: mockChannelUnsubscribe,
  };
  mockChannelOn.mockReturnValue(channelObj);
  mockChannelSubscribe.mockReturnValue(channelObj);
  mockChannel.mockReturnValue(channelObj);

  // auth mocks
  mockAuthGetSession.mockResolvedValue({ data: { session: null } });
  mockAuthOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });

  // functions.invoke: return empty data by default (prevents unhandled rejections)
  mockFunctionsInvoke.mockResolvedValue({ data: { data: [] }, error: null });
}

function setupRoleHook(isSuperAdmin: boolean) {
  mockUseCurrentUserRole.mockReturnValue({
    role: isSuperAdmin ? "super_admin" : "operator",
    userId: "u1",
    email: "user@example.com",
    isLoading: false,
    error: null,
    isSuperAdmin,
    isOperator: !isSuperAdmin,
    isViewer: false,
    hasWriteAccess: true,
    hasAnyRole: true,
    refetch: vi.fn(),
  });
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setupSupabaseMocks();
  // AdminPasswordGate reads sessionStorage to check if already authenticated.
  // The .env file sets VITE_ADMIN_SECRET, so we must set this flag to skip
  // the password gate and render the dashboard content directly.
  sessionStorage.setItem("wm_admin_authed", "1");
});

// ── Access Control button visibility ─────────────────────────────────────────
describe("AdminDashboard – Access Control button visibility", () => {
  it("renders the 'Access Control' link when the user is super_admin", async () => {
    setupRoleHook(true);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Access Control/i })).toBeInTheDocument();
    });
  });

  it("'Access Control' link points to /admin/settings for super_admin", async () => {
    setupRoleHook(true);

    renderDashboard();

    await waitFor(() => {
      const link = screen.getByRole("link", { name: /Access Control/i });
      expect(link).toHaveAttribute("href", "/admin/settings");
    });
  });

  it("does NOT render 'Access Control' link when user is operator (not super_admin)", async () => {
    setupRoleHook(false);

    renderDashboard();

    // Give the component time to render and settle
    await waitFor(() => {
      expect(screen.queryByRole("link", { name: /Access Control/i })).not.toBeInTheDocument();
    });
  });

  it("hides 'Access Control' link when isSuperAdmin is false", async () => {
    mockUseCurrentUserRole.mockReturnValue({
      role: "viewer",
      userId: "u2",
      email: "viewer@example.com",
      isLoading: false,
      error: null,
      isSuperAdmin: false,
      isOperator: false,
      isViewer: true,
      hasWriteAccess: false,
      hasAnyRole: true,
      refetch: vi.fn(),
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Access Control")).not.toBeInTheDocument();
    });
  });

  it("hides 'Access Control' link when user has no role at all", async () => {
    mockUseCurrentUserRole.mockReturnValue({
      role: null,
      userId: null,
      email: null,
      isLoading: false,
      error: null,
      isSuperAdmin: false,
      isOperator: false,
      isViewer: false,
      hasWriteAccess: false,
      hasAnyRole: false,
      refetch: vi.fn(),
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText("Access Control")).not.toBeInTheDocument();
    });
  });
});

// ── Header always rendered ────────────────────────────────────────────────────
describe("AdminDashboard – header content", () => {
  it("always renders the 'OPERATOR COMMAND CENTER' heading", async () => {
    setupRoleHook(false);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("OPERATOR COMMAND CENTER")).toBeInTheDocument();
    });
  });

  it("renders the LIVE indicator regardless of role", async () => {
    setupRoleHook(true);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("LIVE")).toBeInTheDocument();
    });
  });
});