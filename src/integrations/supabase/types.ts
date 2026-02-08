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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acknowledgments: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          decision_id: string
          id: string
          person_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          decision_id: string
          id?: string
          person_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          decision_id?: string
          id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acknowledgments_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acknowledgments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      conflicts: {
        Row: {
          created_at: string
          description: string
          entity_ids: string[]
          id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["conflict_status"]
          suggested_resolution: string | null
          type: Database["public"]["Enums"]["conflict_type"]
        }
        Insert: {
          created_at?: string
          description: string
          entity_ids?: string[]
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["conflict_status"]
          suggested_resolution?: string | null
          type: Database["public"]["Enums"]["conflict_type"]
        }
        Update: {
          created_at?: string
          description?: string
          entity_ids?: string[]
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["conflict_status"]
          suggested_resolution?: string | null
          type?: Database["public"]["Enums"]["conflict_type"]
        }
        Relationships: []
      }
      decision_versions: {
        Row: {
          change_summary: string | null
          changed_at: string
          changed_by: string | null
          content: Json
          decision_id: string
          id: string
          version: number
        }
        Insert: {
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          content: Json
          decision_id: string
          id?: string
          version: number
        }
        Update: {
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          content?: Json
          decision_id?: string
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "decision_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_versions_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          project_id: string | null
          rationale: string | null
          status: Database["public"]["Enums"]["decision_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          project_id?: string | null
          rationale?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          project_id?: string | null
          rationale?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          id: string
          source_url: string | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          source_url?: string | null
          title: string
          type?: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          source_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      persons: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string
          team_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
          team_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          owner_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          team_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          owner_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          team_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          owner_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          source_id: string
          source_type: Database["public"]["Enums"]["entity_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["entity_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          source_id: string
          source_type: Database["public"]["Enums"]["entity_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["entity_type"]
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          source_id?: string
          source_type?: Database["public"]["Enums"]["entity_type"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["entity_type"]
        }
        Relationships: []
      }
      sources: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          processed_content: string | null
          raw_content: string
          type: Database["public"]["Enums"]["source_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          processed_content?: string | null
          raw_content: string
          type: Database["public"]["Enums"]["source_type"]
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          processed_content?: string | null
          raw_content?: string
          type?: Database["public"]["Enums"]["source_type"]
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_team_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_team_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      conflict_status: "detected" | "reviewing" | "resolved" | "dismissed"
      conflict_type:
        | "duplicate"
        | "contradiction"
        | "timeline_mismatch"
        | "ownership_overlap"
        | "stale"
      decision_status: "draft" | "active" | "superseded" | "deprecated"
      document_type: "transcript" | "document" | "notes" | "email" | "other"
      entity_type:
        | "person"
        | "team"
        | "project"
        | "decision"
        | "document"
        | "source"
      event_type:
        | "created"
        | "updated"
        | "deleted"
        | "acknowledged"
        | "conflict_detected"
      project_status: "active" | "completed" | "on_hold" | "archived"
      relationship_type:
        | "owns"
        | "member_of"
        | "depends_on"
        | "relates_to"
        | "affects"
        | "stakeholder"
      source_type: "text" | "file" | "voice" | "api"
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
      conflict_status: ["detected", "reviewing", "resolved", "dismissed"],
      conflict_type: [
        "duplicate",
        "contradiction",
        "timeline_mismatch",
        "ownership_overlap",
        "stale",
      ],
      decision_status: ["draft", "active", "superseded", "deprecated"],
      document_type: ["transcript", "document", "notes", "email", "other"],
      entity_type: [
        "person",
        "team",
        "project",
        "decision",
        "document",
        "source",
      ],
      event_type: [
        "created",
        "updated",
        "deleted",
        "acknowledged",
        "conflict_detected",
      ],
      project_status: ["active", "completed", "on_hold", "archived"],
      relationship_type: [
        "owns",
        "member_of",
        "depends_on",
        "relates_to",
        "affects",
        "stakeholder",
      ],
      source_type: ["text", "file", "voice", "api"],
    },
  },
} as const
