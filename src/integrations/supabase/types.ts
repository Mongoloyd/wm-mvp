export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          analysis_status: string
          anonymized_lead_id: string | null
          confidence_score: number | null
          contractor_brief: string | null
          contractor_brief_generated_at: string | null
          contractor_brief_json: Json | null
          created_at: string
          document_is_window_door_related: boolean | null
          document_type: string | null
          dollar_delta: number | null
          flags: Json | null
          full_json: Json | null
          grade: string | null
          id: string
          lead_id: string | null
          preview_json: Json | null
          proof_of_read: Json | null
          rubric_version: string | null
          scan_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_status?: string
          anonymized_lead_id?: string | null
          confidence_score?: number | null
          contractor_brief?: string | null
          contractor_brief_generated_at?: string | null
          contractor_brief_json?: Json | null
          created_at?: string
          document_is_window_door_related?: boolean | null
          document_type?: string | null
          dollar_delta?: number | null
          flags?: Json | null
          full_json?: Json | null
          grade?: string | null
          id?: string
          lead_id?: string | null
          preview_json?: Json | null
          proof_of_read?: Json | null
          rubric_version?: string | null
          scan_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_status?: string
          anonymized_lead_id?: string | null
          confidence_score?: number | null
          contractor_brief?: string | null
          contractor_brief_generated_at?: string | null
          contractor_brief_json?: Json | null
          created_at?: string
          document_is_window_door_related?: boolean | null
          document_type?: string | null
          dollar_delta?: number | null
          flags?: Json | null
          full_json?: Json | null
          grade?: string | null
          id?: string
          lead_id?: string | null
          preview_json?: Json | null
          proof_of_read?: Json | null
          rubric_version?: string | null
          scan_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_scan_session_id_fkey"
            columns: ["scan_session_id"]
            isOneToOne: false
            referencedRelation: "scan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      billable_intros: {
        Row: {
          analysis_id: string | null
          billing_model: string | null
          billing_status: string
          contact_released_at: string | null
          contractor_id: string
          created_at: string
          currency: string
          disputed_at: string | null
          fee_amount: number | null
          id: string
          invoice_reference: string | null
          lead_id: string
          notes: string | null
          opportunity_id: string
          paid_at: string | null
          refunded_at: string | null
          release_approved_at: string | null
          released_by: string | null
          route_id: string
          updated_at: string
          waived_at: string | null
        }
        Insert: {
          analysis_id?: string | null
          billing_model?: string | null
          billing_status?: string
          contact_released_at?: string | null
          contractor_id: string
          created_at?: string
          currency?: string
          disputed_at?: string | null
          fee_amount?: number | null
          id?: string
          invoice_reference?: string | null
          lead_id: string
          notes?: string | null
          opportunity_id: string
          paid_at?: string | null
          refunded_at?: string | null
          release_approved_at?: string | null
          released_by?: string | null
          route_id: string
          updated_at?: string
          waived_at?: string | null
        }
        Update: {
          analysis_id?: string | null
          billing_model?: string | null
          billing_status?: string
          contact_released_at?: string | null
          contractor_id?: string
          created_at?: string
          currency?: string
          disputed_at?: string | null
          fee_amount?: number | null
          id?: string
          invoice_reference?: string | null
          lead_id?: string
          notes?: string | null
          opportunity_id?: string
          paid_at?: string | null
          refunded_at?: string | null
          release_approved_at?: string | null
          released_by?: string | null
          route_id?: string
          updated_at?: string
          waived_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billable_intros_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billable_intros_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billable_intros_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billable_intros_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "contractor_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billable_intros_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: true
            referencedRelation: "contractor_opportunity_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_opportunities: {
        Row: {
          amber_flag_count: number
          analysis_id: string
          assigned_operator: string | null
          brief_generated_at: string | null
          brief_json: Json | null
          brief_text: string | null
          brief_version: string | null
          county: string | null
          created_at: string
          cta_source: string | null
          flag_count: number
          grade: string | null
          homeowner_contact_released_at: string | null
          id: string
          internal_notes: string | null
          intro_requested_at: string
          last_call_intent: string | null
          last_call_requested_at: string | null
          last_call_webhook_error: string | null
          last_call_webhook_status: string | null
          last_interest_at: string | null
          last_release_at: string | null
          lead_id: string
          priority_score: number
          project_type: string | null
          quote_range: string | null
          red_flag_count: number
          release_ready: boolean
          routed_at: string | null
          scan_session_id: string
          status: string
          suggested_contractor_id: string | null
          suggested_match_confidence: string | null
          suggested_match_generated_at: string | null
          suggested_match_overridden: boolean | null
          suggested_match_overridden_at: string | null
          suggested_match_override_reason: string | null
          suggested_match_reasons: Json | null
          suggested_match_snapshot: Json | null
          suggested_match_top_candidates: Json | null
          updated_at: string
          window_count: number | null
        }
        Insert: {
          amber_flag_count?: number
          analysis_id: string
          assigned_operator?: string | null
          brief_generated_at?: string | null
          brief_json?: Json | null
          brief_text?: string | null
          brief_version?: string | null
          county?: string | null
          created_at?: string
          cta_source?: string | null
          flag_count?: number
          grade?: string | null
          homeowner_contact_released_at?: string | null
          id?: string
          internal_notes?: string | null
          intro_requested_at?: string
          last_call_intent?: string | null
          last_call_requested_at?: string | null
          last_call_webhook_error?: string | null
          last_call_webhook_status?: string | null
          last_interest_at?: string | null
          last_release_at?: string | null
          lead_id: string
          priority_score?: number
          project_type?: string | null
          quote_range?: string | null
          red_flag_count?: number
          release_ready?: boolean
          routed_at?: string | null
          scan_session_id: string
          status?: string
          suggested_contractor_id?: string | null
          suggested_match_confidence?: string | null
          suggested_match_generated_at?: string | null
          suggested_match_overridden?: boolean | null
          suggested_match_overridden_at?: string | null
          suggested_match_override_reason?: string | null
          suggested_match_reasons?: Json | null
          suggested_match_snapshot?: Json | null
          suggested_match_top_candidates?: Json | null
          updated_at?: string
          window_count?: number | null
        }
        Update: {
          amber_flag_count?: number
          analysis_id?: string
          assigned_operator?: string | null
          brief_generated_at?: string | null
          brief_json?: Json | null
          brief_text?: string | null
          brief_version?: string | null
          county?: string | null
          created_at?: string
          cta_source?: string | null
          flag_count?: number
          grade?: string | null
          homeowner_contact_released_at?: string | null
          id?: string
          internal_notes?: string | null
          intro_requested_at?: string
          last_call_intent?: string | null
          last_call_requested_at?: string | null
          last_call_webhook_error?: string | null
          last_call_webhook_status?: string | null
          last_interest_at?: string | null
          last_release_at?: string | null
          lead_id?: string
          priority_score?: number
          project_type?: string | null
          quote_range?: string | null
          red_flag_count?: number
          release_ready?: boolean
          routed_at?: string | null
          scan_session_id?: string
          status?: string
          suggested_contractor_id?: string | null
          suggested_match_confidence?: string | null
          suggested_match_generated_at?: string | null
          suggested_match_overridden?: boolean | null
          suggested_match_overridden_at?: string | null
          suggested_match_override_reason?: string | null
          suggested_match_reasons?: Json | null
          suggested_match_snapshot?: Json | null
          suggested_match_top_candidates?: Json | null
          updated_at?: string
          window_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_opportunities_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_opportunities_scan_session_id_fkey"
            columns: ["scan_session_id"]
            isOneToOne: true
            referencedRelation: "scan_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_opportunities_suggested_contractor_id_fkey"
            columns: ["suggested_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_opportunity_routes: {
        Row: {
          assigned_by: string | null
          contact_released: boolean
          contact_released_at: string | null
          contractor_id: string
          created_at: string
          id: string
          interest_notes: string | null
          interested_at: string | null
          opportunity_id: string
          release_denial_reason: string | null
          release_requested_at: string | null
          release_reviewed_at: string | null
          release_reviewed_by: string | null
          release_status: string
          responded_at: string | null
          response_notes: string | null
          route_status: string
          routing_reason: string | null
          sent_at: string | null
          viewed_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          contact_released?: boolean
          contact_released_at?: string | null
          contractor_id: string
          created_at?: string
          id?: string
          interest_notes?: string | null
          interested_at?: string | null
          opportunity_id: string
          release_denial_reason?: string | null
          release_requested_at?: string | null
          release_reviewed_at?: string | null
          release_reviewed_by?: string | null
          release_status?: string
          responded_at?: string | null
          response_notes?: string | null
          route_status?: string
          routing_reason?: string | null
          sent_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          contact_released?: boolean
          contact_released_at?: string | null
          contractor_id?: string
          created_at?: string
          id?: string
          interest_notes?: string | null
          interested_at?: string | null
          opportunity_id?: string
          release_denial_reason?: string | null
          release_requested_at?: string | null
          release_reviewed_at?: string | null
          release_reviewed_by?: string | null
          release_status?: string
          responded_at?: string | null
          response_notes?: string | null
          route_status?: string
          routing_reason?: string | null
          sent_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_opportunity_routes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_opportunity_routes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "contractor_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_outcomes: {
        Row: {
          appointment_booked_at: string | null
          appointment_status: string | null
          billable_intro_id: string
          closed_at: string | null
          contractor_id: string | null
          created_at: string
          deal_status: string | null
          deal_value: number | null
          did_beat_price: boolean | null
          did_fix_scope_gaps: boolean | null
          did_improve_warranty: boolean | null
          id: string
          opportunity_id: string
          outcome_notes: string | null
          quote_status: string | null
          replacement_quote_range: string | null
          route_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_booked_at?: string | null
          appointment_status?: string | null
          billable_intro_id: string
          closed_at?: string | null
          contractor_id?: string | null
          created_at?: string
          deal_status?: string | null
          deal_value?: number | null
          did_beat_price?: boolean | null
          did_fix_scope_gaps?: boolean | null
          did_improve_warranty?: boolean | null
          id?: string
          opportunity_id: string
          outcome_notes?: string | null
          quote_status?: string | null
          replacement_quote_range?: string | null
          route_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_booked_at?: string | null
          appointment_status?: string | null
          billable_intro_id?: string
          closed_at?: string | null
          contractor_id?: string | null
          created_at?: string
          deal_status?: string | null
          deal_value?: number | null
          did_beat_price?: boolean | null
          did_fix_scope_gaps?: boolean | null
          did_improve_warranty?: boolean | null
          id?: string
          opportunity_id?: string
          outcome_notes?: string | null
          quote_status?: string | null
          replacement_quote_range?: string | null
          route_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_outcomes_billable_intro_id_fkey"
            columns: ["billable_intro_id"]
            isOneToOne: true
            referencedRelation: "billable_intros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_outcomes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_outcomes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "contractor_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_outcomes_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "contractor_opportunity_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          accepts_low_grade_leads: boolean
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_vetted: boolean
          max_window_count: number | null
          min_window_count: number | null
          notes: string | null
          phone_e164: string | null
          pricing_model: string | null
          project_types: string[]
          service_counties: string[]
          service_regions: string[]
          status: string
          updated_at: string
          vetted_at: string | null
        }
        Insert: {
          accepts_low_grade_leads?: boolean
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_vetted?: boolean
          max_window_count?: number | null
          min_window_count?: number | null
          notes?: string | null
          phone_e164?: string | null
          pricing_model?: string | null
          project_types?: string[]
          service_counties?: string[]
          service_regions?: string[]
          status?: string
          updated_at?: string
          vetted_at?: string | null
        }
        Update: {
          accepts_low_grade_leads?: boolean
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_vetted?: boolean
          max_window_count?: number | null
          min_window_count?: number | null
          notes?: string | null
          phone_e164?: string | null
          pricing_model?: string | null
          project_types?: string[]
          service_counties?: string[]
          service_regions?: string[]
          status?: string
          updated_at?: string
          vetted_at?: string | null
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          created_at: string
          event_id: string | null
          event_name: string
          fbc: string | null
          fbp: string | null
          id: number
          lead_id: string | null
          sent_to_facebook: boolean
          user_data: Json | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_name: string
          fbc?: string | null
          fbp?: string | null
          id?: number
          lead_id?: string | null
          sent_to_facebook?: boolean
          user_data?: Json | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_name?: string
          fbc?: string | null
          fbp?: string | null
          id?: number
          lead_id?: string | null
          sent_to_facebook?: boolean
          user_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          created_at: string
          event_name: string
          flow_type: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          route: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          flow_type?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          route?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          flow_type?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          route?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          county: string | null
          created_at: string
          email: string | null
          fbclid: string | null
          first_name: string | null
          id: string
          initial_referrer: string | null
          otp_failure_count: number
          otp_locked_until: string | null
          otp_state: string | null
          phone_carrier_name: string | null
          phone_e164: string | null
          phone_line_type: string | null
          phone_lookup_checked_at: string | null
          phone_lookup_valid: boolean | null
          phone_risk_tier: string | null
          phone_verification_channel: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          project_type: string | null
          quote_range: string | null
          session_id: string
          source: string | null
          status: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          window_count: number | null
        }
        Insert: {
          county?: string | null
          created_at?: string
          email?: string | null
          fbclid?: string | null
          first_name?: string | null
          id?: string
          initial_referrer?: string | null
          otp_failure_count?: number
          otp_locked_until?: string | null
          otp_state?: string | null
          phone_carrier_name?: string | null
          phone_e164?: string | null
          phone_line_type?: string | null
          phone_lookup_checked_at?: string | null
          phone_lookup_valid?: boolean | null
          phone_risk_tier?: string | null
          phone_verification_channel?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          project_type?: string | null
          quote_range?: string | null
          session_id: string
          source?: string | null
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          window_count?: number | null
        }
        Update: {
          county?: string | null
          created_at?: string
          email?: string | null
          fbclid?: string | null
          first_name?: string | null
          id?: string
          initial_referrer?: string | null
          otp_failure_count?: number
          otp_locked_until?: string | null
          otp_state?: string | null
          phone_carrier_name?: string | null
          phone_e164?: string | null
          phone_line_type?: string | null
          phone_lookup_checked_at?: string | null
          phone_lookup_valid?: boolean | null
          phone_risk_tier?: string | null
          phone_verification_channel?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          project_type?: string | null
          quote_range?: string | null
          session_id?: string
          source?: string | null
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          window_count?: number | null
        }
        Relationships: []
      }
      otp_failures: {
        Row: {
          failure_count: number
          first_failure_at: string
          ip_address: string | null
          last_failure_at: string
          last_user_agent_hash: string | null
          locked_until: string | null
          phone_e164: string
          scan_session_id: string | null
          updated_at: string
        }
        Insert: {
          failure_count?: number
          first_failure_at?: string
          ip_address?: string | null
          last_failure_at?: string
          last_user_agent_hash?: string | null
          locked_until?: string | null
          phone_e164: string
          scan_session_id?: string | null
          updated_at?: string
        }
        Update: {
          failure_count?: number
          first_failure_at?: string
          ip_address?: string | null
          last_failure_at?: string
          last_user_agent_hash?: string | null
          locked_until?: string | null
          phone_e164?: string
          scan_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          phone_e164: string
          status: string
          updated_at: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          phone_e164: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          phone_e164?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_verifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_analyses: {
        Row: {
          created_at: string
          dollar_delta: number | null
          flags: Json | null
          grade: string | null
          id: string
          lead_id: string | null
        }
        Insert: {
          created_at?: string
          dollar_delta?: number | null
          flags?: Json | null
          grade?: string | null
          id?: string
          lead_id?: string | null
        }
        Update: {
          created_at?: string
          dollar_delta?: number | null
          flags?: Json | null
          grade?: string | null
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_analyses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_files: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          status: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          status?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          status?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_files_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_sessions: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          quote_file_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          quote_file_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          quote_file_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_sessions_quote_file_id_fkey"
            columns: ["quote_file_id"]
            isOneToOne: true
            referencedRelation: "quote_files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_analysis_full: {
        Args: { p_phone_e164: string; p_scan_session_id: string }
        Returns: {
          confidence_score: number
          document_type: string
          flags: Json
          full_json: Json
          grade: string
          preview_json: Json
          proof_of_read: Json
          rubric_version: string
        }[]
      }
      get_analysis_preview: {
        Args: { p_scan_session_id: string }
        Returns: {
          confidence_score: number
          document_type: string
          flag_amber_count: number
          flag_count: number
          flag_red_count: number
          grade: string
          preview_json: Json
          proof_of_read: Json
          rubric_version: string
        }[]
      }
      get_lead_by_session: {
        Args: { p_session_id: string }
        Returns: {
          id: string
        }[]
      }
      get_rubric_stats: {
        Args: { p_days?: number }
        Returns: {
          avg_confidence: number
          avg_grade_score: number
          grade_a: number
          grade_b: number
          grade_c: number
          grade_d: number
          grade_f: number
          invalid_count: number
          max_confidence: number
          min_confidence: number
          rubric_version: string
          total_count: number
        }[]
      }
      get_scan_status: {
        Args: { p_scan_session_id: string }
        Returns: {
          id: string
          status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
