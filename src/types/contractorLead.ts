/**
 * Contractor CRM TypeScript Types
 * Corresponds to supabase/migrations/20260415084900_contractor_crm_schema.sql
 */

// ============================================================
// ENUM TYPES
// ============================================================

export type ContractorQualificationStatus =
  | "new"
  | "qualified"
  | "soft_reject"
  | "hard_reject";

export type ContractorBookingStatus =
  | "not_started"
  | "calendly_started"
  | "booked"
  | "completed"
  | "no_show"
  | "canceled";

export type ContractorPipelineStage =
  | "new"
  | "booked"
  | "showed"
  | "qualified_call"
  | "proposal_sent"
  | "won"
  | "lost";

export type ContractorActivityType =
  | "qualification_completed"
  | "calendly_opened"
  | "booking_created"
  | "booking_completed"
  | "no_show"
  | "reminder_sent"
  | "followup_sent"
  | "stage_changed"
  | "note_added";

export type ContractorFollowupType =
  | "confirmation_email"
  | "reminder_24h"
  | "reminder_1h"
  | "no_show_followup"
  | "post_call_followup";

export type ContractorFollowupStatus =
  | "pending"
  | "sent"
  | "failed"
  | "canceled";

// ============================================================
// QUALIFICATION QUESTION ANSWER TYPES
// ============================================================

export type AverageJobSizeBand =
  | "under8k"
  | "8to15k"
  | "15to25k"
  | "25plus";

export type MonthlyLeadVolumeBand =
  | "under20"
  | "20to50"
  | "50to100"
  | "100plus";

export type CloseRateBand =
  | "under5"
  | "5to10"
  | "10to20"
  | "20plus";

export type InstallsRegularlyAnswer =
  | "regular"
  | "small"
  | "exploring";

export type ResponseSpeedAnswer =
  | "under15min"
  | "fewhours"
  | "sameday"
  | "nextday";

export type FollowUpBehaviorAnswer =
  | "consistent"
  | "sometimes"
  | "rarely";

export type QualityVsVolumeAnswer =
  | "quality"
  | "unsure"
  | "volume";

// ============================================================
// TABLE INTERFACES
// ============================================================

export interface ContractorLead {
  id: string;
  created_at: string;
  updated_at: string;

  // Contact info
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string;
  phone: string | null;

  // Territory
  service_area: string | null;
  territory_requested: string | null;

  // Business profile bands
  average_job_size_band: string | null;
  monthly_lead_volume_band: string | null;
  close_rate_band: string | null;

  // Qualification questions
  installs_regularly: string | null;
  response_speed: string | null;
  follow_up_consistency: string | null;
  wants_quality_over_volume: string | null;

  // Qualification state
  qualification_status: ContractorQualificationStatus;
  qualification_score: number;

  // Booking state (Calendly integration)
  booking_status: ContractorBookingStatus;
  calendly_event_uri: string | null;
  calendly_invitee_uri: string | null;
  calendly_event_start: string | null;
  calendly_event_end: string | null;

  // Pipeline state
  pipeline_stage: ContractorPipelineStage;

  // Attribution
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;

  // Admin fields
  owner_name: string | null;
  notes: string | null;
}

export interface ContractorActivityLog {
  id: string;
  created_at: string;
  contractor_lead_id: string;
  activity_type: ContractorActivityType;
  activity_data: Record<string, unknown>;
}

export interface ContractorFollowup {
  id: string;
  created_at: string;
  contractor_lead_id: string;
  followup_type: ContractorFollowupType;
  scheduled_for: string;
  sent_at: string | null;
  status: ContractorFollowupStatus;
  payload: Record<string, unknown>;
}

// ============================================================
// INSERT/UPDATE TYPES (for Supabase operations)
// ============================================================

export type ContractorLeadInsert = Omit<ContractorLead, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ContractorLeadUpdate = Partial<Omit<ContractorLead, "id" | "created_at">>;

export type ContractorActivityLogInsert = Omit<ContractorActivityLog, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ContractorFollowupInsert = Omit<ContractorFollowup, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ContractorFollowupUpdate = Partial<Omit<ContractorFollowup, "id" | "created_at" | "contractor_lead_id">>;
