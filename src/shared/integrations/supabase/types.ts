export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      event_participants: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          name: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          name: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          name?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      events: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          host_user_id: string;
          access_code: string;
          address: string | null;
          date: string | null;
          time: string | null;
          latitude: number | null;
          longitude: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          host_user_id: string;
          access_code: string;
          address?: string | null;
          date?: string | null;
          time?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          host_user_id?: string;
          access_code?: string;
          address?: string | null;
          date?: string | null;
          time?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_host_user_id_fkey";
            columns: ["host_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      expenses: {
        Row: {
          amount: number;
          created_at: string;
          event_id: string;
          id: string;
          paid_by_participant_id: string;
          title: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          event_id: string;
          id?: string;
          paid_by_participant_id: string;
          title: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          event_id?: string;
          id?: string;
          paid_by_participant_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paid_by_participant_id_fkey";
            columns: ["paid_by_participant_id"];
            isOneToOne: false;
            referencedRelation: "event_participants";
            referencedColumns: ["id"];
          }
        ];
      };
      playlist_items: {
        Row: {
          added_at: string;
          added_by_participant_id: string;
          channel_title: string | null;
          event_id: string;
          id: string;
          thumbnail_url: string | null;
          title: string;
          youtube_video_id: string;
        };
        Insert: {
          added_at?: string;
          added_by_participant_id: string;
          channel_title?: string | null;
          event_id: string;
          id?: string;
          thumbnail_url?: string | null;
          title: string;
          youtube_video_id: string;
        };
        Update: {
          added_at?: string;
          added_by_participant_id?: string;
          channel_title?: string | null;
          event_id?: string;
          id?: string;
          thumbnail_url?: string | null;
          title?: string;
          youtube_video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playlist_items_added_by_participant_id_fkey";
            columns: ["added_by_participant_id"];
            isOneToOne: false;
            referencedRelation: "event_participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playlist_items_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      poll_options: {
        Row: {
          created_at: string | null;
          id: string;
          poll_id: string;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          poll_id: string;
          title: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          poll_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey";
            columns: ["poll_id"];
            isOneToOne: false;
            referencedRelation: "polls";
            referencedColumns: ["id"];
          }
        ];
      };
      poll_votes: {
        Row: {
          created_at: string | null;
          id: string;
          option_id: string;
          participant_id: string;
          poll_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          option_id: string;
          participant_id: string;
          poll_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          option_id?: string;
          participant_id?: string;
          poll_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "poll_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poll_votes_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "event_participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey";
            columns: ["poll_id"];
            isOneToOne: false;
            referencedRelation: "polls";
            referencedColumns: ["id"];
          }
        ];
      };
      polls: {
        Row: {
          allow_multiple_votes: boolean | null;
          closed_at: string | null;
          created_at: string | null;
          created_by_participant_id: string;
          description: string | null;
          event_id: string;
          id: string;
          title: string;
        };
        Insert: {
          allow_multiple_votes?: boolean | null;
          closed_at?: string | null;
          created_at?: string | null;
          created_by_participant_id: string;
          description?: string | null;
          event_id: string;
          id?: string;
          title: string;
        };
        Update: {
          allow_multiple_votes?: boolean | null;
          closed_at?: string | null;
          created_at?: string | null;
          created_by_participant_id?: string;
          description?: string | null;
          event_id?: string;
          id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "polls_created_by_participant_id_fkey";
            columns: ["created_by_participant_id"];
            isOneToOne: false;
            referencedRelation: "event_participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "polls_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string;
          id: string;
          last_active_at: string;
          name: string | null;
          whatsapp_hash: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_active_at?: string;
          name?: string | null;
          whatsapp_hash?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_active_at?: string;
          name?: string | null;
          whatsapp_hash?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
