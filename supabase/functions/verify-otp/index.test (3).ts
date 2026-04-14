import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

/*
 * Twilio Mock Blueprint – even though the verify‑otp function uses the
 * fetch API to hit the Twilio Verify endpoint, all OTP tests require
 * this mock to ensure no stray network calls are made through the Twilio
 * SDK.  The mock provides stubbed methods on the default export.
 */
vi.mock('twilio', () => {
  return {
    default: vi.fn(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({ sid: 'mock_message_sid' }),
      },
      verify: {
        v2: {
          services: vi.fn().mockReturnThis(),
          verifications: {
            create: vi.fn().mockResolvedValue({ status: 'pending' }),
          },
          verificationChecks: {
            create: vi.fn().mockResolvedValue({ status: 'approved' }),
          },
        },
      },
    })),
  };
});

/*
 * Supabase Admin Mock Blueprint – establishes the base structure of the
 * createClient mock.  Individual tests replace the return value of
 * createClient with a bespoke mock to control query results and
 * capture payloads.  This prevents real Supabase calls during module
 * import and execution.
 */
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

// Helper to build a Supabase mock tailored for verify‑otp tests.  It
// provides minimal query builder behaviour to return the pending row,
// scan_session lead ID and update results.  It also captures update
// payloads for assertions.
function buildVerifyOtpSupabaseMock(options: {
  pendingRow?: { id: string; phone_e164: string } | null;
  sessionLead?: string | null;
  phoneUpdateErr?: { message: string } | null;
  leadUpdateErr?: { message: string } | null;
  capture?: {
    phoneUpdatePayload?: any;
    leadUpdatePayload?: any;
  };
}) {
  const {
    pendingRow = null,
    sessionLead = null,
    phoneUpdateErr = null,
    leadUpdateErr = null,
    capture = {},
  } = options;
  return {
    from(table: string) {
      const builder: any = {
        select(_cols: string) {
          return builder;
        },
        eq(_col: string, _val: string) {
          return builder;
        },
        order(_col: string, _opts: any) {
          return builder;
        },
        limit(_count: number) {
          return builder;
        },
        maybeSingle() {
          if (table === 'phone_verifications') {
            return Promise.resolve({ data: pendingRow, error: null });
          }
          if (table === 'scan_sessions') {
            return Promise.resolve({ data: { lead_id: sessionLead }, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        update(payload: any) {
          if (table === 'phone_verifications') {
            capture.phoneUpdatePayload = payload;
            return Promise.resolve({ error: phoneUpdateErr });
          }
          if (table === 'leads') {
            capture.leadUpdatePayload = payload;
            return Promise.resolve({ error: leadUpdateErr });
          }
          return Promise.resolve({ error: null });
        },
      };
      return builder;
    },
  };
}

// Utility to load the verify‑otp handler function.  It overrides
// global Deno.serve to capture the exported handler rather than
// starting an HTTP server.  Environment variables and fetch
// implementation are overridden here as well.  After import, the
// original globals are restored.
async function loadVerifyOtpHandler({
  supabaseMock,
  env,
  fetchImpl,
}: {
  supabaseMock: any;
  env: Record<string, string>;
  fetchImpl?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}) {
  const originalDeno = (globalThis as any).Deno;
  const holder: { handler?: (req: Request) => Promise<Response> } = {};
  (globalThis as any).Deno = {
    env: {
      get: (key: string) => env[key],
    },
    serve: (h: (req: Request) => Promise<Response>) => {
      holder.handler = h;
    },
  };
  const { createClient } = await import('@supabase/supabase-js');
  (createClient as any).mockImplementation(() => supabaseMock);
  const originalFetch = globalThis.fetch;
  if (fetchImpl) {
    globalThis.fetch = fetchImpl;
  }
  await import('./index.ts?vitest=' + Math.random());
  if (fetchImpl) {
    globalThis.fetch = originalFetch;
  }
  (globalThis as any).Deno = originalDeno;
  if (!holder.handler) {
    throw new Error('verify‑otp handler not registered');
  }
  return holder.handler;
}

describe('verify‑otp edge function', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns HTTP 500 when persistence fails after Twilio approval', async () => {
    // Freeze time so phone_verified_at is deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));
    const capture: { phoneUpdatePayload?: any; leadUpdatePayload?: any } = {};
    const supabaseMock = buildVerifyOtpSupabaseMock({
      pendingRow: { id: 'pv1', phone_e164: '+15614685571' },
      sessionLead: 'lead123',
      phoneUpdateErr: { message: 'db failure' },
      leadUpdateErr: null,
      capture,
    });
    // Twilio returns approved
    const twilioApproved = vi.fn(async () => new Response(
      JSON.stringify({ status: 'approved' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));
    const handler = await loadVerifyOtpHandler({
      supabaseMock,
      env: {
        SUPABASE_URL: 'http://localhost',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        TWILIO_ACCOUNT_SID: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        TWILIO_AUTH_TOKEN: 'auth',
        TWILIO_VERIFY_SERVICE_SID: 'VSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      },
      fetchImpl: twilioApproved,
    });
    const req = new Request('https://example.com/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone_e164: '+15614685571', code: '123456', scan_session_id: 'sess1' }),
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.verified).toBe(false);
    expect(json.error).toMatch(/confirmed but could not be saved/i);
    // Ensure that the phone_verifications update was attempted
    expect(capture.phoneUpdatePayload).toBeDefined();
    vi.useRealTimers();
  });

  it('writes both phone_verified and phone_verified_at on success', async () => {
    // Freeze time so we know the expected timestamp
    vi.useFakeTimers();
    const fixed = new Date('2024-01-03T15:30:00Z');
    vi.setSystemTime(fixed);
    const capture: { phoneUpdatePayload?: any; leadUpdatePayload?: any } = {};
    const supabaseMock = buildVerifyOtpSupabaseMock({
      pendingRow: { id: 'pv42', phone_e164: '+15614685571' },
      sessionLead: 'lead42',
      phoneUpdateErr: null,
      leadUpdateErr: null,
      capture,
    });
    // Twilio returns approved
    const twilioApproved = vi.fn(async () => new Response(
      JSON.stringify({ status: 'approved' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));
    const handler = await loadVerifyOtpHandler({
      supabaseMock,
      env: {
        SUPABASE_URL: 'http://localhost',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        TWILIO_ACCOUNT_SID: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        TWILIO_AUTH_TOKEN: 'auth',
        TWILIO_VERIFY_SERVICE_SID: 'VSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      },
      fetchImpl: twilioApproved,
    });
    const req = new Request('https://example.com/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone_e164: '+15614685571', code: '654321', scan_session_id: 'sess42' }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.verified).toBe(true);
    // phone_e164 returned should match Twilio phone
    expect(json.phone_e164).toBe('+15614685571');
    // Ensure the phone_verifications row was updated to verified with timestamp
    expect(capture.phoneUpdatePayload).toBeDefined();
    expect(capture.phoneUpdatePayload.status).toBe('verified');
    expect(capture.phoneUpdatePayload.verified_at).toBe(fixed.toISOString());
    // Ensure the leads table received both phone_verified and phone_verified_at
    expect(capture.leadUpdatePayload).toBeDefined();
    expect(capture.leadUpdatePayload.phone_verified).toBe(true);
    expect(capture.leadUpdatePayload.phone_e164).toBe('+15614685571');
    expect(capture.leadUpdatePayload.phone_verified_at).toBe(fixed.toISOString());
    vi.useRealTimers();
  });
});