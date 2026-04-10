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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          ai_insights: string | null
          allocation_breakdown: Json | null
          concentration_alerts: Json | null
          created_at: string
          credits_used: number
          diversification_score: number | null
          id: string
          liquidity_score: number | null
          portfolio_id: string
          risk_score: number | null
          status: Database["public"]["Enums"]["analysis_status"]
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insights?: string | null
          allocation_breakdown?: Json | null
          concentration_alerts?: Json | null
          created_at?: string
          credits_used?: number
          diversification_score?: number | null
          id?: string
          liquidity_score?: number | null
          portfolio_id: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["analysis_status"]
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_insights?: string | null
          allocation_breakdown?: Json | null
          concentration_alerts?: Json | null
          created_at?: string
          credits_used?: number
          diversification_score?: number | null
          id?: string
          liquidity_score?: number | null
          portfolio_id?: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["analysis_status"]
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          resulting_balance: number
          type: Database["public"]["Enums"]["credit_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          resulting_balance: number
          type: Database["public"]["Enums"]["credit_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          resulting_balance?: number
          type?: Database["public"]["Enums"]["credit_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "credit_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      imports: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string
          file_url: string | null
          format: Database["public"]["Enums"]["import_format"]
          id: string
          portfolio_id: string | null
          rows_processed: number | null
          rows_total: number | null
          status: Database["public"]["Enums"]["import_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name: string
          file_url?: string | null
          format?: Database["public"]["Enums"]["import_format"]
          id?: string
          portfolio_id?: string | null
          rows_processed?: number | null
          rows_total?: number | null
          status?: Database["public"]["Enums"]["import_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_url?: string | null
          format?: Database["public"]["Enums"]["import_format"]
          id?: string
          portfolio_id?: string | null
          rows_processed?: number | null
          rows_total?: number | null
          status?: Database["public"]["Enums"]["import_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imports_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_profiles: {
        Row: {
          approximate_patrimony: string | null
          created_at: string
          experience_years: number | null
          id: string
          investment_horizon: string | null
          liquidity_need: string | null
          monthly_income_range: string | null
          objectives: string[] | null
          preference: string | null
          risk_tolerance: Database["public"]["Enums"]["investor_risk_tolerance"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approximate_patrimony?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          investment_horizon?: string | null
          liquidity_need?: string | null
          monthly_income_range?: string | null
          objectives?: string[] | null
          preference?: string | null
          risk_tolerance?: Database["public"]["Enums"]["investor_risk_tolerance"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approximate_patrimony?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          investment_horizon?: string | null
          liquidity_need?: string | null
          monthly_income_range?: string | null
          objectives?: string[] | null
          preference?: string | null
          risk_tolerance?: Database["public"]["Enums"]["investor_risk_tolerance"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_positions: {
        Row: {
          asset_class: string
          asset_subclass: string | null
          avg_price: number
          created_at: string
          currency: string | null
          current_price: number | null
          current_value: number | null
          id: string
          liquidity: string | null
          name: string
          portfolio_id: string
          quantity: number
          sector: string | null
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_class: string
          asset_subclass?: string | null
          avg_price?: number
          created_at?: string
          currency?: string | null
          current_price?: number | null
          current_value?: number | null
          id?: string
          liquidity?: string | null
          name: string
          portfolio_id: string
          quantity?: number
          sector?: string | null
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_class?: string
          asset_subclass?: string | null
          avg_price?: number
          created_at?: string
          currency?: string | null
          current_price?: number | null
          current_value?: number | null
          id?: string
          liquidity?: string | null
          name?: string
          portfolio_id?: string
          quantity?: number
          sector?: string | null
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_positions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          analysis_id: string | null
          created_at: string
          decided_at: string | null
          description: string | null
          estimated_impact: string | null
          id: string
          portfolio_id: string | null
          position_id: string | null
          recommendation_type: string
          status: Database["public"]["Enums"]["recommendation_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string | null
          estimated_impact?: string | null
          id?: string
          portfolio_id?: string | null
          position_id?: string | null
          recommendation_type: string
          status?: Database["public"]["Enums"]["recommendation_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          created_at?: string
          decided_at?: string | null
          description?: string | null
          estimated_impact?: string | null
          id?: string
          portfolio_id?: string | null
          position_id?: string | null
          recommendation_type?: string
          status?: Database["public"]["Enums"]["recommendation_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "portfolio_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          analysis_id: string | null
          created_at: string
          file_url: string | null
          id: string
          portfolio_id: string | null
          report_type: string
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          portfolio_id?: string | null
          report_type: string
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          portfolio_id?: string | null
          report_type?: string
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      analysis_status: "pending" | "running" | "completed" | "error"
      credit_type: "purchase" | "usage" | "bonus" | "refund"
      import_format: "csv" | "xlsx" | "pdf" | "ofx" | "manual"
      import_status: "pending" | "processing" | "completed" | "error"
      investor_risk_tolerance: "conservador" | "moderado" | "arrojado"
      recommendation_status: "pending" | "accepted" | "postponed" | "discarded"
      report_status: "generating" | "generated" | "error"
      subscription_plan: "free" | "essencial" | "pro"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
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
      analysis_status: ["pending", "running", "completed", "error"],
      credit_type: ["purchase", "usage", "bonus", "refund"],
      import_format: ["csv", "xlsx", "pdf", "ofx", "manual"],
      import_status: ["pending", "processing", "completed", "error"],
      investor_risk_tolerance: ["conservador", "moderado", "arrojado"],
      recommendation_status: ["pending", "accepted", "postponed", "discarded"],
      report_status: ["generating", "generated", "error"],
      subscription_plan: ["free", "essencial", "pro"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
    },
  },
} as const
