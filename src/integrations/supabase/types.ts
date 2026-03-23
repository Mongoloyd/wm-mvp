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
          confidence_score: number | null
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
          confidence_score?: number | null
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
          confidence_score?: number | null
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
          first_name: string | null
          id: string
          phone_e164: string | null
          project_type: string | null
          quote_range: string | null
          session_id: string
          source: string | null
          status: string | null
          window_count: number | null
        }
        Insert: {
          county?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          phone_e164?: string | null
          project_type?: string | null
          quote_range?: string | null
          session_id: string
          source?: string | null
          status?: string | null
          window_count?: number | null
        }
        Update: {
          county?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          phone_e164?: string | null
          project_type?: string | null
          quote_range?: string | null
          session_id?: string
          source?: string | null
          status?: string | null
          window_count?: number | null
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
        Args: { p_scan_session_id: string; p_phone_e164: string }
        Returns: {
          confidence_score: number
          document_type: string
          flags: Json
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
          flag_count: number
          flag_red_count: number
          flag_amber_count: number
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
