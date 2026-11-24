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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_access_grants: {
        Row: {
          active: boolean
          created_at: string
          email: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          team: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          name?: string
          role: Database["public"]["Enums"]["app_role"]
          team?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          team?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          active: boolean
          address: string
          city: string
          cnpj: string
          code: string
          created_at: string
          id: string
          name: string
          state: string
        }
        Insert: {
          active?: boolean
          address?: string
          city: string
          cnpj: string
          code: string
          created_at?: string
          id?: string
          name: string
          state: string
        }
        Update: {
          active?: boolean
          address?: string
          city?: string
          cnpj?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          state?: string
        }
        Relationships: []
      }
      carriers: {
        Row: {
          active: boolean
          cnpj: string
          created_at: string
          created_by: string
          display_name: string
          id: string
          legal_name: string
        }
        Insert: {
          active?: boolean
          cnpj: string
          created_at?: string
          created_by?: string
          display_name?: string
          id?: string
          legal_name: string
        }
        Update: {
          active?: boolean
          cnpj?: string
          created_at?: string
          created_by?: string
          display_name?: string
          id?: string
          legal_name?: string
        }
        Relationships: []
      }
      freight_square_localities: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          square_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          square_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          square_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "freight_square_localities_square_id_fkey"
            columns: ["square_id"]
            isOneToOne: false
            referencedRelation: "freight_squares"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_squares: {
        Row: {
          carrier_id: string | null
          code: string | null
          created_at: string
          id: string
          name: string
          notes: string
          state: string
        }
        Insert: {
          carrier_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string
          state: string
        }
        Update: {
          carrier_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "freight_squares_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_table_versions: {
        Row: {
          branch_id: string
          calculation_rules: Json
          carrier_id: string
          commercial: Json
          configuration: Json
          created_at: string
          created_by: string
          destination: string
          id: string
          notes: string
          previous_version_id: string | null
          square_id: string | null
          status: string
          valid_from: string
          valid_until: string | null
          weight_bands: Json
        }
        Insert: {
          branch_id: string
          calculation_rules?: Json
          carrier_id: string
          commercial?: Json
          configuration?: Json
          created_at?: string
          created_by?: string
          destination?: string
          id?: string
          notes?: string
          previous_version_id?: string | null
          square_id?: string | null
          status?: string
          valid_from: string
          valid_until?: string | null
          weight_bands?: Json
        }
        Update: {
          branch_id?: string
          calculation_rules?: Json
          carrier_id?: string
          commercial?: Json
          configuration?: Json
          created_at?: string
          created_by?: string
          destination?: string
          id?: string
          notes?: string
          previous_version_id?: string | null
          square_id?: string | null
          status?: string
          valid_from?: string
          valid_until?: string | null
          weight_bands?: Json
        }
        Relationships: [
          {
            foreignKeyName: "freight_table_versions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_table_versions_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_table_versions_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "freight_table_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_table_versions_square_id_fkey"
            columns: ["square_id"]
            isOneToOne: false
            referencedRelation: "freight_squares"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_imports: {
        Row: {
          content_hash: string
          file_name: string
          id: string
          imported_at: string
          imported_by: string
        }
        Insert: {
          content_hash: string
          file_name: string
          id?: string
          imported_at?: string
          imported_by?: string
        }
        Update: {
          content_hash?: string
          file_name?: string
          id?: string
          imported_at?: string
          imported_by?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          branch_id: string
          charged_components: Json
          charged_total: number | null
          cte_key: string | null
          cte_number: string
          id: string
          invoice_id: string
          source_row: Json
          weight_kg: number | null
        }
        Insert: {
          branch_id: string
          charged_components?: Json
          charged_total?: number | null
          cte_key?: string | null
          cte_number: string
          id?: string
          invoice_id: string
          source_row: Json
          weight_kg?: number | null
        }
        Update: {
          branch_id?: string
          charged_components?: Json
          charged_total?: number | null
          cte_key?: string | null
          cte_number?: string
          id?: string
          invoice_id?: string
          source_row?: Json
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          carrier_id: string
          created_at: string
          declared_total: number | null
          due_on: string | null
          id: string
          import_id: string
          issued_on: string
          number: string
          status: string
        }
        Insert: {
          carrier_id: string
          created_at?: string
          declared_total?: number | null
          due_on?: string | null
          id?: string
          import_id: string
          issued_on: string
          number: string
          status?: string
        }
        Update: {
          carrier_id?: string
          created_at?: string
          declared_total?: number | null
          due_on?: string | null
          id?: string
          import_id?: string
          issued_on?: string
          number?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "invoice_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          team: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id: string
          name?: string
          team?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          team?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      audit_activate_account: { Args: never; Returns: undefined }
      audit_can_read: { Args: never; Returns: boolean }
      audit_can_write: { Args: never; Returns: boolean }
      audit_import_invoices: { Args: { payload: Json }; Returns: number }
      audit_save_square: {
        Args: {
          _carrier_id: string
          _localities: string[]
          _name: string
          _state: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "transportes" | "consulta"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "transportes", "consulta"],
    },
  },
} as const
