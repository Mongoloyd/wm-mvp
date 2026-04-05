import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNeedsReview, updateLeadManualEntry } from '../adminDataService';

// Mock the real Supabase client path
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: { access_token: 'test-jwt-token' },
        },
        error: null,
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { data: [] }, error: null }),
    },
  },
}));

// Import the mocked client so we can assert against it
import { supabase } from '@/integrations/supabase/client';

describe('Needs Review Triage Service Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default happy-path mock
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'test-jwt-token' } },
      error: null,
    });
  });

  describe('fetchNeedsReview', () => {
    it('invokes admin-data with action fetch_needs_review and empty payload', async () => {
      const mockRows = [
        { id: 'lead_1', review_reason: 'low_confidence', email: 'a@b.com', phone_e164: '+15551234567' },
      ];
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { data: mockRows },
        error: null,
      });

      const result = await fetchNeedsReview();

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'admin-data',
        expect.objectContaining({
          body: { action: 'fetch_needs_review', payload: {} },
          headers: { Authorization: 'Bearer test-jwt-token' },
        }),
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toMatchObject({
        id: expect.any(String),
        review_reason: expect.any(String),
        email: expect.any(String),
      });
    });
  });

  describe('updateLeadManualEntry', () => {
    it('sends correct payload with manually_reviewed: false', async () => {
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { data: { success: true } },
        error: null,
      });

      await updateLeadManualEntry({
        lead_id: 'lead_123',
        manually_reviewed: false,
        manual_entry_data: { note: 'Needs another look' },
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'admin-data',
        expect.objectContaining({
          body: {
            action: 'update_lead_manual_entry',
            payload: {
              lead_id: 'lead_123',
              manually_reviewed: false,
              manual_entry_data: { note: 'Needs another look' },
            },
          },
          headers: { Authorization: 'Bearer test-jwt-token' },
        }),
      );
    });

    it('throws validation error when lead_id is missing', async () => {
      await expect(
        updateLeadManualEntry({ lead_id: '' } as any),
      ).rejects.toMatchObject({
        code: 'validation_error',
        message: 'lead_id is required',
      });

      // Should never reach the network
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });
  });
});
