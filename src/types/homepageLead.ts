export type HomepageLeadQualificationRequest = {
  name: string;
  email: string;
  phone: string;
  source: string;
  context?: Record<string, unknown>;
};

export type HomepageLeadQualificationResponse = {
  success: boolean;
  lead_id: string | null;
  qualified: boolean;
  can_run_ai: boolean;
  phone_e164: string | null;
  phone_line_type: string | null;
  reason: string | null;
};
