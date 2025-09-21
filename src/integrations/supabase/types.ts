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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          assistant_id: string | null
          created_at: string
          id: string
          instructions: string
          intent: string
          is_latest: boolean
          last_modified: string
          max_completion_tokens: number
          model: string
          name: string
          operational_status: string
          parent_agent_id: string | null
          top_p: number
          type: string
          updated_at: string
          user_id: string
          version: string
          version_number: number
          what_changed: string | null
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          instructions: string
          intent: string
          is_latest?: boolean
          last_modified?: string
          max_completion_tokens?: number
          model: string
          name: string
          operational_status?: string
          parent_agent_id?: string | null
          top_p?: number
          type: string
          updated_at?: string
          user_id: string
          version?: string
          version_number?: number
          what_changed?: string | null
        }
        Update: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          instructions?: string
          intent?: string
          is_latest?: boolean
          last_modified?: string
          max_completion_tokens?: number
          model?: string
          name?: string
          operational_status?: string
          parent_agent_id?: string | null
          top_p?: number
          type?: string
          updated_at?: string
          user_id?: string
          version?: string
          version_number?: number
          what_changed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_parent_agent_id_fkey"
            columns: ["parent_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      book_system_prompts: {
        Row: {
          book_id: string
          config_hash: string | null
          config_version: string | null
          content: string
          created_at: string
          deployed_at: string | null
          generation_metadata: Json | null
          id: string
          illustration_config: Json | null
          is_deployed: boolean
          is_latest: boolean
          prompt_status: string
          source_type: string
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          book_id: string
          config_hash?: string | null
          config_version?: string | null
          content: string
          created_at?: string
          deployed_at?: string | null
          generation_metadata?: Json | null
          id?: string
          illustration_config?: Json | null
          is_deployed?: boolean
          is_latest?: boolean
          prompt_status?: string
          source_type?: string
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          book_id?: string
          config_hash?: string | null
          config_version?: string | null
          content?: string
          created_at?: string
          deployed_at?: string | null
          generation_metadata?: Json | null
          id?: string
          illustration_config?: Json | null
          is_deployed?: boolean
          is_latest?: boolean
          prompt_status?: string
          source_type?: string
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_system_prompts_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_thumbnails: {
        Row: {
          aspect_ratio: string
          book_id: string
          created_at: string
          error_message: string | null
          generation_completed_at: string | null
          generation_duration_ms: number | null
          generation_started_at: string | null
          generation_status: string
          id: string
          is_latest: boolean
          prompt_used: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          aspect_ratio?: string
          book_id: string
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_duration_ms?: number | null
          generation_started_at?: string | null
          generation_status?: string
          id?: string
          is_latest?: boolean
          prompt_used?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          aspect_ratio?: string
          book_id?: string
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_duration_ms?: number | null
          generation_started_at?: string | null
          generation_status?: string
          id?: string
          is_latest?: boolean
          prompt_used?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      books: {
        Row: {
          book_description: string | null
          book_name: string
          category: string | null
          created_at: string
          current_system_prompt_id: string | null
          id: string
          pdf_url: string | null
          status: Database["public"]["Enums"]["publication_status"]
          total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_description?: string | null
          book_name: string
          category?: string | null
          created_at?: string
          current_system_prompt_id?: string | null
          id?: string
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          total_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_description?: string | null
          book_name?: string
          category?: string | null
          created_at?: string
          current_system_prompt_id?: string | null
          id?: string
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_current_system_prompt_id_fkey"
            columns: ["current_system_prompt_id"]
            isOneToOne: false
            referencedRelation: "book_system_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_published: {
        Row: {
          book_id: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          published_at: string
          queue_position: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          published_at?: string
          queue_position?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          published_at?: string
          queue_position?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_published_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      exports: {
        Row: {
          completed_at: string | null
          content_id: string
          content_type: string
          created_at: string
          error_message: string | null
          export_config: Json | null
          export_status: string
          export_type: string
          export_url: string | null
          file_size_bytes: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          content_type: string
          created_at?: string
          error_message?: string | null
          export_config?: Json | null
          export_status?: string
          export_type: string
          export_url?: string | null
          file_size_bytes?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          error_message?: string | null
          export_config?: Json | null
          export_status?: string
          export_type?: string
          export_url?: string | null
          file_size_bytes?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instagram_shared: {
        Row: {
          book_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          shared_at: string
          title: string
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          shared_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          shared_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_image_urls: {
        Row: {
          book_id: string
          created_at: string
          error_message: string | null
          generation_completed_at: string | null
          generation_duration_ms: number | null
          generation_started_at: string | null
          generation_status: string
          id: string
          image_url: string | null
          is_latest: boolean
          page_id: string
          prompt_used: string | null
          source_type: string
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          book_id: string
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_duration_ms?: number | null
          generation_started_at?: string | null
          generation_status?: string
          id?: string
          image_url?: string | null
          is_latest?: boolean
          page_id: string
          prompt_used?: string | null
          source_type?: string
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          book_id?: string
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_duration_ms?: number | null
          generation_started_at?: string | null
          generation_status?: string
          id?: string
          image_url?: string | null
          is_latest?: boolean
          page_id?: string
          prompt_used?: string | null
          source_type?: string
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      page_simplified_prompts: {
        Row: {
          book_id: string
          created_at: string
          error_message: string | null
          generation_completed_at: string | null
          generation_duration_ms: number | null
          generation_started_at: string | null
          generation_status: string
          id: string
          is_latest: boolean
          page_id: string
          simplified_content: string
          source_prompt_id: string | null
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          book_id: string
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_duration_ms?: number | null
          generation_started_at?: string | null
          generation_status?: string
          id?: string
          is_latest?: boolean
          page_id: string
          simplified_content: string
          source_prompt_id?: string | null
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          book_id?: string
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_duration_ms?: number | null
          generation_started_at?: string | null
          generation_status?: string
          id?: string
          is_latest?: boolean
          page_id?: string
          simplified_content?: string
          source_prompt_id?: string | null
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      page_system_prompts: {
        Row: {
          agent_name: string | null
          agent_version: string | null
          book_id: string
          content: string
          created_at: string
          deployed_at: string | null
          enhanced_prompt_length: number | null
          generated_at: string | null
          generation_duration_ms: number | null
          generation_metadata: Json | null
          id: string
          is_deployed: boolean
          is_latest: boolean
          model: string | null
          original_prompt_length: number | null
          page_id: string
          page_letter: string | null
          page_title: string | null
          prompt_status: string
          prompt_type: string | null
          request_id: string | null
          safe_space_rules_applied: boolean | null
          source_type: string
          tokens_used: number | null
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          agent_name?: string | null
          agent_version?: string | null
          book_id: string
          content: string
          created_at?: string
          deployed_at?: string | null
          enhanced_prompt_length?: number | null
          generated_at?: string | null
          generation_duration_ms?: number | null
          generation_metadata?: Json | null
          id?: string
          is_deployed?: boolean
          is_latest?: boolean
          model?: string | null
          original_prompt_length?: number | null
          page_id: string
          page_letter?: string | null
          page_title?: string | null
          prompt_status: string
          prompt_type?: string | null
          request_id?: string | null
          safe_space_rules_applied?: boolean | null
          source_type?: string
          tokens_used?: number | null
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          agent_name?: string | null
          agent_version?: string | null
          book_id?: string
          content?: string
          created_at?: string
          deployed_at?: string | null
          enhanced_prompt_length?: number | null
          generated_at?: string | null
          generation_duration_ms?: number | null
          generation_metadata?: Json | null
          id?: string
          is_deployed?: boolean
          is_latest?: boolean
          model?: string | null
          original_prompt_length?: number | null
          page_id?: string
          page_letter?: string | null
          page_title?: string | null
          prompt_status?: string
          prompt_type?: string | null
          request_id?: string | null
          safe_space_rules_applied?: boolean | null
          source_type?: string
          tokens_used?: number | null
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_system_prompts_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          book_id: string
          content: Json | null
          created_at: string
          current_system_prompt_id: string | null
          description: string | null
          id: string
          letter: string
          page_number: number
          title: string
          updated_at: string
        }
        Insert: {
          book_id: string
          content?: Json | null
          created_at?: string
          current_system_prompt_id?: string | null
          description?: string | null
          id?: string
          letter: string
          page_number: number
          title: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          content?: Json | null
          created_at?: string
          current_system_prompt_id?: string | null
          description?: string | null
          id?: string
          letter?: string
          page_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id: string
          last_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_metadata: {
        Row: {
          created_at: string
          daily_published_id: string
          error_message: string | null
          generation_metadata: Json | null
          id: string
          is_active: boolean
          is_latest: boolean
          og_image_url: string | null
          optimization_status: string
          optimized_at: string | null
          seo_description: string | null
          seo_title: string | null
          source_data: Json | null
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          daily_published_id: string
          error_message?: string | null
          generation_metadata?: Json | null
          id?: string
          is_active?: boolean
          is_latest?: boolean
          og_image_url?: string | null
          optimization_status?: string
          optimized_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          source_data?: Json | null
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          created_at?: string
          daily_published_id?: string
          error_message?: string | null
          generation_metadata?: Json | null
          id?: string
          is_active?: boolean
          is_latest?: boolean
          og_image_url?: string | null
          optimization_status?: string
          optimized_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          source_data?: Json | null
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_daily_published: {
        Row: {
          book_id: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string | null
          is_active: boolean | null
          published_at: string | null
          queue_position: number | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          published_at?: string | null
          queue_position?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          published_at?: string | null
          queue_position?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_published_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_fixed_schedule_time: {
        Args: { queue_pos: number }
        Returns: string
      }
      cleanup_daily_published_queue: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_book_thumbnail: {
        Args: { p_book_id: string }
        Returns: {
          book_id: string
          created_at: string
          generation_status: string
          id: string
          is_latest: boolean
          prompt_used: string
          thumbnail_url: string
          updated_at: string
          user_id: string
          version_number: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_daily_published_pages: {
        Args: { p_book_id: string }
        Returns: {
          book_id: string
          content: Json
          created_at: string
          current_system_prompt_id: string
          description: string
          id: string
          letter: string
          page_number: number
          title: string
          updated_at: string
        }[]
      }
      get_instagram_shared_pages: {
        Args: { p_book_id: string }
        Returns: {
          book_id: string
          content: Json
          created_at: string
          current_system_prompt_id: string
          description: string
          id: string
          letter: string
          page_number: number
          title: string
          updated_at: string
        }[]
      }
      get_next_book_thumbnail_version_number: {
        Args: { p_book_id: string }
        Returns: number
      }
      get_next_fixed_activation_time: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_page_image_version_number: {
        Args: { p_page_id: string }
        Returns: number
      }
      get_next_page_prompt_version_number: {
        Args: { p_page_id: string }
        Returns: number
      }
      get_next_queue_position: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_seo_version_number: {
        Args: { p_daily_published_id: string }
        Returns: number
      }
      get_next_simplified_prompt_version_number: {
        Args: { p_page_id: string }
        Returns: number
      }
      get_next_version_number: {
        Args: { p_book_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_daily_published_queue_fixed: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin"
      publication_status: "draft" | "published" | "archived"
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
      app_role: ["user", "moderator", "admin"],
      publication_status: ["draft", "published", "archived"],
    },
  },
} as const
