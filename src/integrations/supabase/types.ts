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
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
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
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string | null
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
      audition_scaffolds: {
        Row: {
          created_at: string | null
          definition_snapshot: Json | null
          id: string
          role_definition_id: string
          scaffold_data: Json
          scaffold_preview_html: string | null
          updated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          definition_snapshot?: Json | null
          id?: string
          role_definition_id: string
          scaffold_data: Json
          scaffold_preview_html?: string | null
          updated_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          definition_snapshot?: Json | null
          id?: string
          role_definition_id?: string
          scaffold_data?: Json
          scaffold_preview_html?: string | null
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "audition_scaffolds_role_definition_id_fkey"
            columns: ["role_definition_id"]
            isOneToOne: true
            referencedRelation: "role_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
          shortlist_file_path: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          shortlist_file_path: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          shortlist_file_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          project_id: string
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          project_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          project_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          candidate_count: number | null
          candidate_source: string | null
          candidates_completed: number | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          hours_elapsed: number | null
          id: string
          job_description: string | null
          job_summary: string | null
          payment_status: string | null
          recruiter_id: string
          role_title: string
          sla_deadline: string | null
          status: string | null
          tier_id: number | null
          tier_name: string | null
          total_candidates: number | null
          updated_at: string | null
        }
        Insert: {
          candidate_count?: number | null
          candidate_source?: string | null
          candidates_completed?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          hours_elapsed?: number | null
          id?: string
          job_description?: string | null
          job_summary?: string | null
          payment_status?: string | null
          recruiter_id: string
          role_title: string
          sla_deadline?: string | null
          status?: string | null
          tier_id?: number | null
          tier_name?: string | null
          total_candidates?: number | null
          updated_at?: string | null
        }
        Update: {
          candidate_count?: number | null
          candidate_source?: string | null
          candidates_completed?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          hours_elapsed?: number | null
          id?: string
          job_description?: string | null
          job_summary?: string | null
          payment_status?: string | null
          recruiter_id?: string
          role_title?: string
          sla_deadline?: string | null
          status?: string | null
          tier_id?: number | null
          tier_name?: string | null
          total_candidates?: number | null
          updated_at?: string | null
        }
        Relationships: [
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
          referral_source: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_role: string | null
        }
        Insert: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          referral_source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_role?: string | null
        }
        Update: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          referral_source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      role_definitions: {
        Row: {
          created_at: string | null
          definition_data: Json
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          definition_data: Json
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          definition_data?: Json
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_definitions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          file_name: string
          file_path: string
          id: string
          parsed_email: string | null
          parsed_name: string | null
          project_id: string
          status: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          id?: string
          parsed_email?: string | null
          parsed_name?: string | null
          project_id: string
          status?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          id?: string
          parsed_email?: string | null
          parsed_name?: string | null
          project_id?: string
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
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      cleanup_abandoned_drafts: { Args: never; Returns: undefined }
      create_draft_project_v3: {
        Args: { p_role_title: string | null; p_job_description: string }
        Returns: string
      }
      create_project_for_current_user: {
        Args: {
          p_candidate_count: number
          p_candidate_source: string
          p_job_summary: string
          p_role_title: string
          p_tier_id: number
          p_tier_name: string
        }
        Returns: string
      }
      get_projects_for_current_user: {
        Args: never
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
      grant_admin_role: { Args: { user_email: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin:
        | { Args: { user_id: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
      is_email_whitelisted: { Args: { email: string }; Returns: boolean }
      mark_project_awaiting_setup_call: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      update_project_status: {
        Args: { p_new_status: string; p_project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "recruiter" | "ops_manager"
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
      app_role: ["admin", "recruiter", "ops_manager"],
    },
  },
} as const
