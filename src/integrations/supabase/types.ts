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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_whitelist: {
        Row: {
          added_at: string | null
          added_by: string | null
          email: string
          id: string
          notes: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          email: string
          id?: string
          notes?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          email?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          evaluated_at: string | null
          evaluated_by: string | null
          evaluation_notes: string | null
          id: string
          project_id: string
          shortlist_file_path: string | null
          talent_profile_id: string | null
        }
        Insert: {
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          id?: string
          project_id: string
          shortlist_file_path?: string | null
          talent_profile_id?: string | null
        }
        Update: {
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_notes?: string | null
          id?: string
          project_id?: string
          shortlist_file_path?: string | null
          talent_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_talent_profile_id_fkey"
            columns: ["talent_profile_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          paid_at: string | null
          payment_provider: string | null
          project_id: string
          provider_reference: string | null
          recruiter_id: string
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          project_id: string
          provider_reference?: string | null
          recruiter_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          project_id?: string
          provider_reference?: string | null
          recruiter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          anchor_price: number | null
          candidate_count: number | null
          candidate_source: string
          candidates_completed: number | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          hours_elapsed: number | null
          id: string
          job_description: string | null
          job_summary: string | null
          organization_id: string | null
          payment_status: string
          pilot_price: number | null
          project_code: string
          recruiter_id: string
          role_title: string
          sla_deadline: string | null
          status: string
          tier_id: number
          tier_name: string
          total_candidates: number | null
          updated_at: string | null
        }
        Insert: {
          anchor_price?: number | null
          candidate_count?: number | null
          candidate_source: string
          candidates_completed?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          hours_elapsed?: number | null
          id?: string
          job_description?: string | null
          job_summary?: string | null
          organization_id?: string | null
          payment_status?: string
          pilot_price?: number | null
          project_code: string
          recruiter_id: string
          role_title: string
          sla_deadline?: string | null
          status?: string
          tier_id: number
          tier_name: string
          total_candidates?: number | null
          updated_at?: string | null
        }
        Update: {
          anchor_price?: number | null
          candidate_count?: number | null
          candidate_source?: string
          candidates_completed?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          hours_elapsed?: number | null
          id?: string
          job_description?: string | null
          job_summary?: string | null
          organization_id?: string | null
          payment_status?: string
          pilot_price?: number | null
          project_code?: string
          recruiter_id?: string
          role_title?: string
          sla_deadline?: string | null
          status?: string
          tier_id?: number
          tier_name?: string
          total_candidates?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiters: {
        Row: {
          company_name: string | null
          company_size: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          organization_id: string | null
          referral_source: string | null
          status: string
          updated_at: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          organization_id?: string | null
          referral_source?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          referral_source?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          evaluated_at: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          id: string
          parsed_email: string | null
          parsed_name: string | null
          project_id: string
          score: number | null
          shortlisted: boolean | null
          status: string | null
          uploaded_at: string | null
        }
        Insert: {
          evaluated_at?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          parsed_email?: string | null
          parsed_name?: string | null
          project_id: string
          score?: number | null
          shortlisted?: boolean | null
          status?: string | null
          uploaded_at?: string | null
        }
        Update: {
          evaluated_at?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          parsed_email?: string | null
          parsed_name?: string | null
          project_id?: string
          score?: number | null
          shortlisted?: boolean | null
          status?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_project_for_current_user: {
        Args: {
          _anchor_price: number
          _candidate_count: number
          _candidate_source: string
          _job_description: string
          _job_summary: string
          _pilot_price: number
          _role_title: string
          _tier_id: number
          _tier_name: string
        }
        Returns: string
      }
      get_admin_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          awaiting_activation: number
          calls_booked: number
          projects_created: number
          total_signups: number
        }[]
      }
      get_projects_for_current_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          candidate_count: number
          created_at: string
          id: string
          payment_status: string
          role_title: string
          status: string
          tier_name: string
        }[]
      }
      grant_admin_role: {
        Args: { _email: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_email_whitelisted: {
        Args: { _email: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "ops_manager" | "recruiter"
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
    Enums: {
      app_role: ["admin", "ops_manager", "recruiter"],
    },
  },
} as const
