import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/*
 * Twilio Mock Blueprint – required for isolation. Although the send‑otp
 * function uses fetch directly instead of the twilio SDK, the project
 * mandates this mock be present in all OTP tests to prevent accidental
 * network calls. It stubs out the constructor and chained APIs on the
 * default export.
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
 * Supabase Admin Mock Blueprint – the base createClient mock returns
 * a chainable API with stubbed methods. Individual tests override
 * createClient.mockImplementation to return a bespoke mock that
 * controls query results and collects updates/inserts. Keeping this
 * blueprint ensures no real calls leak out during import.
 */
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'mock_session_id', phone_verified: false }, error: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

// Helper to build a mock Supabase client with custom datasets.  The send‑otp
// function performs several chained calls against the "phone_verifications"
// table.  Each call ultimately resolves via the `.order()` method, which
// returns a promise containing { data, error }.  This helper inspects
// the selected column to decide whether to return the recent phone sends
// (created_at records) or IP based sends (id records).  It also captures
// inserts into phone_verifications so callers can assert on the normalized
// phone value.
function buildSendOtpSupabaseMock(options: {
  recentRows?: Array<{ created_at: string }>;
  ipRows?: Array<{ id: string }>;
  updateErr?: { message: string } | null;
  insertErr?: { message: string } | null;
  capture?: { insertPayload?: any };
}) {
  const {
    recentRows = [],
    ipRows = [],
    updateErr = null,
    insertErr = null,
    capture = {},
  } = options;
  return {
    from(table: string) {
      const state: any = { table, selectCols: null };
      const builder: any = {
        select(cols: string) {
          state.selectCols = cols;
          return builder;
        },
        eq(_col: string, _val: string) {
          // We don't need to record filters for this mock, return builder for chaining
          return builder;
        },
        gte(_col: string, _val: string) {
          return builder;
        },
        order(_col: string, _opts: any) {
          // Return the appropriate dataset based on selected column
          if (state.table === 'phone_verifications') {
            if (state.selectCols === 'created_at') {
              return Promise.resolve({ data: recentRows, error: null });
            }
            if (state.selectCols === 'id') {
              return Promise.resolve({ data: ipRows, error: null });
            }
          }
          return Promise.resolve({ data: [], error: null });
        },
        update(_payload: any) {
          // send‑otp calls update on phone_verifications to expire pending rows
          return Promise.resolve({ error: updateErr });
        },
        insert(payload: any) {
          // capture insert payload for assertions
          capture.insertPayload = payload;
          return Promise.resolve({ error: insertErr });
        },
      };
      return builder;
    },
  };
}

// Utility to dynamically load the send‑otp handler.  It stubs out
// `globalThis.Deno.serve` so the imported module registers its request
// handler on our stub rather than starting a real server.  The stub
// stores the handler so tests can invoke it directly.  The environment
// variables and fetch behaviour are also overridden here.
async function loadSendOtpHandler({
  supabaseMock,
  env,
  fetchImpl,
}: {
  supabaseMock: any;
  env: Record<string, string>;
  fetchImpl?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}) {
  // Override Deno globals for the module under test
  const originalDeno = (globalThis as any).Deno;
  const handlerHolder: { handler?: (req: Request) => Promise<Response> } = {};
  (globalThis as any).Deno = {
    env: {
      get: (key: string) => env[key],
    },
    serve: (h: (req: Request) => Promise<Response>) => {
      handlerHolder.handler = h;
    },
  };
  // Mock Supabase createClient to return our custom mock
  const { createClient } = await import('@supabase/supabase-js');
  (createClient as any).mockImplementation(() => supabaseMock);
  // Stub global fetch if provided (otherwise fall back to the real fetch)
  const originalFetch = globalThis.fetch;
  if (fetchImpl) {
    globalThis.fetch = fetchImpl;
  }
  // Dynamically import the send‑otp module.  The query param ensures
  // vitest does not cache the module between tests.
  await import('./index.ts?vitest=' + Math.random());
  // Restore original fetch and Deno after import
  if (fetchImpl) {
    globalThis.fetch = originalFetch;
  }
  (globalThis as any).Deno = originalDeno;
  // Return the captured handler
  if (!handlerHolder.handler) {
    throw new Error('Handler was not registered via Deno.serve');
  }
  return handlerHolder.handler;
}

describe('send‑otp edge function', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('normalizes various US phone formats to E.164 and succeeds on first send', async () => {
    // Freeze time to make created_at comparisons predictable
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const capture: { insertPayload?: any } = {};
    const supabaseMock = buildSendOtpSupabaseMock({ recentRows: [], ipRows: [], capture });
    const handler = await loadSendOtpHandler({
      supabaseMock,
      env: {
        SUPABASE_URL: 'http://localhost',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        TWILIO_LOOKUP_ENABLED: 'false',
        TWILIO_ACCOUNT_SID: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        TWILIO_AUTH_TOKEN: 'auth',
        TWILIO_VERIFY_SERVICE_SID: 'VSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      },
      // fetchImpl returns a dummy ok response for Twilio Verify.  The send‑otp
      // handler uses fetch only for Twilio; we respond with a minimal JSON.
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ status: 'pending' }), { status: 200, headers: { 'Content-Type': 'application/json' } })),
    });
    // Provide a US formatted number with dashes; the handler should
    // canonicalize this to +1XXXXXXXXXX before persisting.
    const reqBody = { phone_e164: '(561) 468-5571', scan_session_id: null };
    const req = new Request('https://example.com/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.5' },
      body: JSON.stringify(reqBody),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
    // Assert the Supabase insert payload contains the normalized E.164
    expect(capture.insertPayload).toBeDefined();
    expect(capture.insertPayload.phone_e164).toBe('+15614685571');
    expect(capture.insertPayload.status).toBe('pending');
    expect(capture.insertPayload.ip_address).toBe('203.0.113.5');
    vi.useRealTimers();
  });

  it('enforces a cooldown when the last send was within COOLDOWN_SECONDS', async () => {
    // Freeze time at a fixed instant
    vi.useFakeTimers();
    const now = new Date('2024-01-01T12:00:00Z');
    vi.setSystemTime(now);
    // Simulate a recent send at now minus 10 seconds (within 30 second cooldown)
    const recentRows = [ { created_at: new Date(now.getTime() - 10 * 1000).toISOString() } ];
    const supabaseMock = buildSendOtpSupabaseMock({ recentRows, ipRows: [] });
    const handler = await loadSendOtpHandler({
      supabaseMock,
      env: {
        SUPABASE_URL: 'http://localhost',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        TWILIO_LOOKUP_ENABLED: 'false',
        TWILIO_ACCOUNT_SID: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        TWILIO_AUTH_TOKEN: 'auth',
        TWILIO_VERIFY_SERVICE_SID: 'VSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      },
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ status: 'pending' }), { status: 200, headers: { 'Content-Type': 'application/json' } })),
    });
    const req = new Request('https://example.com/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.5' },
      body: JSON.stringify({ phone_e164: '+15614685571', scan_session_id: null }),
    });
    const res = await handler(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.success).toBe(false);
    // Expect a generic too many requests message and retry_after in seconds
    expect(body.error).toMatch(/Too many code requests/i);
    expect(body.retry_after).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('classifies Twilio errors and returns user‑friendly messages', async () => {
    // No recent sends so rate limiting passes
    const supabaseMock = buildSendOtpSupabaseMock({ recentRows: [], ipRows: [] });
    // Test with Twilio prefix block error (code 60410)
    const twilioError60410 = vi.fn(async () => new Response(
      JSON.stringify({ code: 60410 }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    ));
    const handler1 = await loadSendOtpHandler({
      supabaseMock,
      env: {
        SUPABASE_URL: 'http://localhost',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        TWILIO_LOOKUP_ENABLED: 'false',
        TWILIO_ACCOUNT_SID: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        TWILIO_AUTH_TOKEN: 'auth',
        TWILIO_VERIFY_SERVICE_SID: 'VSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      },
      fetchImpl: twilioError60410,
    });
    const req1 = new Request('https://example.com/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone_e164: '+15614685571' }),
    });
    const res1 = await handler1(req1);
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toMatch(/temporarily blocked/i);
    // Test with Twilio too many attempts error (code 60203)
    const twilioError60203 = vi.fn(async () => new Response(
      JSON.stringify({ code: 60203 }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    ));
    const handler2 = await loadSendOtpHandler({
      supabaseMock,
      env: {
        SUPABASE_URL: 'http://localhost',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        TWILIO_LOOKUP_ENABLED: 'false',
        TWILIO_ACCOUNT_SID: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        TWILIO_AUTH_TOKEN: 'auth',
        TWILIO_VERIFY_SERVICE_SID: 'VSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      },
      fetchImpl: twilioError60203,
    });
    const req2 = new Request('https://example.com/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone_e164: '+15614685571' }),
    });
    const res2 = await handler2(req2);
    expect(res2.status).toBe(400);
    const json2 = await res2.json();
    expect(json2.error).toMatch(/wait before trying again/i);
    // Test with generic Twilio failure
    const twilioErrorGeneric = vi.fn(async () => new Response(
      JSON.stringify({ code: 99999 }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    ));
    const handler3 = await loadSendOtpHandler({
      supabaseMock,
      env: {
        SUPABASE_URL: 'http://localhost',
        SUPABASE_SERVICE_ROLE_KEY: 'service-key',
        TWILIO_LOOKUP_ENABLED: 'false',
        TWILIO_ACCOUNT_SID: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        TWILIO_AUTH_TOKEN: 'auth',
        TWILIO_VERIFY_SERVICE_SID: 'VSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      },
      fetchImpl: twilioErrorGeneric,
    });
    const req3 = new Request('https://example.com/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone_e164: '+15614685571' }),
    });
    const res3 = await handler3(req3);
    expect(res3.status).toBe(400);
    const json3 = await res3.json();
    expect(json3.error).toMatch(/Failed to send verification code/i);
  });
});