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
      admin_chat_sessions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_message_at: string | null
          messages: Json
          session_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          messages?: Json
          session_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          messages?: Json
          session_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_ideas: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      age_groups: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          max_age: number
          min_age: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          label: string
          max_age: number
          min_age: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          max_age?: number
          min_age?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_performance_metrics: {
        Row: {
          agent_id: string | null
          agent_type: string
          book_created: boolean | null
          book_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          metadata_captured: Json | null
          prompt_patterns: Json | null
          total_pages: number | null
          user_edited_pages: number | null
          user_satisfaction: number | null
        }
        Insert: {
          agent_id?: string | null
          agent_type: string
          book_created?: boolean | null
          book_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata_captured?: Json | null
          prompt_patterns?: Json | null
          total_pages?: number | null
          user_edited_pages?: number | null
          user_satisfaction?: number | null
        }
        Update: {
          agent_id?: string | null
          agent_type?: string
          book_created?: boolean | null
          book_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata_captured?: Json | null
          prompt_patterns?: Json | null
          total_pages?: number | null
          user_edited_pages?: number | null
          user_satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_performance_metrics_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_performance_metrics_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
        ]
      }
      agents: {
        Row: {
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
          provider: string
          top_p: number
          type: string
          updated_at: string
          user_id: string
          version: string
          version_number: number
          what_changed: string | null
        }
        Insert: {
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
          provider?: string
          top_p?: number
          type: string
          updated_at?: string
          user_id: string
          version?: string
          version_number?: number
          what_changed?: string | null
        }
        Update: {
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
          provider?: string
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
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      book_categorization_log: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          book_id: string
          can_rollback: boolean | null
          confidence_score: number | null
          id: string
          new_book_type: string
          notes: string | null
          old_book_type: string | null
          old_category: string | null
          rollback_at: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          book_id: string
          can_rollback?: boolean | null
          confidence_score?: number | null
          id?: string
          new_book_type: string
          notes?: string | null
          old_book_type?: string | null
          old_category?: string | null
          rollback_at?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          book_id?: string
          can_rollback?: boolean | null
          confidence_score?: number | null
          id?: string
          new_book_type?: string
          notes?: string | null
          old_book_type?: string | null
          old_category?: string | null
          rollback_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_categorization_log_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_categorization_log_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
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
          {
            foreignKeyName: "book_system_prompts_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
        ]
      }
      book_types: {
        Row: {
          clarification_context: string | null
          color: string | null
          created_at: string | null
          description: string | null
          expected_page_count: number | null
          icon_name: string
          id: string
          is_active: boolean | null
          label: string
          needs_clarification: boolean | null
          prompt: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          clarification_context?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          expected_page_count?: number | null
          icon_name?: string
          id: string
          is_active?: boolean | null
          label: string
          needs_clarification?: boolean | null
          prompt?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          clarification_context?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          expected_page_count?: number | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          label?: string
          needs_clarification?: boolean | null
          prompt?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      books: {
        Row: {
          book_description: string | null
          book_name: string
          category: string | null
          chat_session_id: string | null
          created_at: string
          current_system_prompt_id: string | null
          educational_focus: Json | null
          id: string
          is_highlighted: boolean
          is_library_book: boolean | null
          is_style_template: boolean | null
          last_activity_at: string | null
          metadata: Json | null
          pdf_url: string | null
          product_description: string | null
          reference_book_id: string | null
          status: Database["public"]["Enums"]["publication_status"]
          style_name: string | null
          tags: string[] | null
          total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_description?: string | null
          book_name: string
          category?: string | null
          chat_session_id?: string | null
          created_at?: string
          current_system_prompt_id?: string | null
          educational_focus?: Json | null
          id?: string
          is_highlighted?: boolean
          is_library_book?: boolean | null
          is_style_template?: boolean | null
          last_activity_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          product_description?: string | null
          reference_book_id?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          style_name?: string | null
          tags?: string[] | null
          total_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_description?: string | null
          book_name?: string
          category?: string | null
          chat_session_id?: string | null
          created_at?: string
          current_system_prompt_id?: string | null
          educational_focus?: Json | null
          id?: string
          is_highlighted?: boolean
          is_library_book?: boolean | null
          is_style_template?: boolean | null
          last_activity_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          product_description?: string | null
          reference_book_id?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          style_name?: string | null
          tags?: string[] | null
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "gemini_chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_current_system_prompt_id_fkey"
            columns: ["current_system_prompt_id"]
            isOneToOne: false
            referencedRelation: "book_system_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_reference_book_id_fkey"
            columns: ["reference_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_reference_book_id_fkey"
            columns: ["reference_book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
        ]
      }
      character_themes: {
        Row: {
          alt_text: string
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_special: boolean
          sort_order: number
          thumbnail_url: string
          updated_at: string
        }
        Insert: {
          alt_text: string
          created_at?: string
          display_name: string
          id: string
          is_active?: boolean
          is_special?: boolean
          sort_order?: number
          thumbnail_url: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_special?: boolean
          sort_order?: number
          thumbnail_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      color_palettes: {
        Row: {
          accent_hex: string
          accent_hsl: string
          accent_usage: string | null
          background_hex: string
          background_hsl: string
          background_usage: string | null
          book_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          primary_hex: string
          primary_hsl: string
          primary_usage: string | null
          secondary_hex: string
          secondary_hsl: string
          secondary_usage: string | null
          style_guide_id: string | null
          supporting_hex: string | null
          supporting_hsl: string | null
          supporting_usage: string | null
          text_hex: string
          text_hsl: string
          text_usage: string | null
          updated_at: string | null
        }
        Insert: {
          accent_hex: string
          accent_hsl: string
          accent_usage?: string | null
          background_hex: string
          background_hsl: string
          background_usage?: string | null
          book_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          primary_hex: string
          primary_hsl: string
          primary_usage?: string | null
          secondary_hex: string
          secondary_hsl: string
          secondary_usage?: string | null
          style_guide_id?: string | null
          supporting_hex?: string | null
          supporting_hsl?: string | null
          supporting_usage?: string | null
          text_hex: string
          text_hsl: string
          text_usage?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_hex?: string
          accent_hsl?: string
          accent_usage?: string | null
          background_hex?: string
          background_hsl?: string
          background_usage?: string | null
          book_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          primary_hex?: string
          primary_hsl?: string
          primary_usage?: string | null
          secondary_hex?: string
          secondary_hsl?: string
          secondary_usage?: string | null
          style_guide_id?: string | null
          supporting_hex?: string | null
          supporting_hsl?: string | null
          supporting_usage?: string | null
          text_hex?: string
          text_hsl?: string
          text_usage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "color_palettes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "color_palettes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "color_palettes_style_guide_id_fkey"
            columns: ["style_guide_id"]
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
          is_publicly_visible: boolean
          pdf_url: string | null
          publish_date: string
          published_at: string
          qr_code_config: Json | null
          qr_code_generated_at: string | null
          qr_code_image: string | null
          qr_code_public_url: string | null
          queue_order: number | null
          queue_position: number | null
          slug: string | null
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
          is_publicly_visible?: boolean
          pdf_url?: string | null
          publish_date?: string
          published_at?: string
          qr_code_config?: Json | null
          qr_code_generated_at?: string | null
          qr_code_image?: string | null
          qr_code_public_url?: string | null
          queue_order?: number | null
          queue_position?: number | null
          slug?: string | null
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
          is_publicly_visible?: boolean
          pdf_url?: string | null
          publish_date?: string
          published_at?: string
          qr_code_config?: Json | null
          qr_code_generated_at?: string | null
          qr_code_image?: string | null
          qr_code_public_url?: string | null
          queue_order?: number | null
          queue_position?: number | null
          slug?: string | null
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
          {
            foreignKeyName: "daily_published_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
        ]
      }
      daily_publishing_status: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          processing_date: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          processing_date: string
          started_at?: string
          status: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          processing_date?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gemini_chat_sessions: {
        Row: {
          agent_id: string | null
          created_at: string
          created_book_id: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          messages: Json
          model_used: string | null
          qa_page_images: Json | null
          qa_page_prompts: Json | null
          session_name: string | null
          total_tokens_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          created_book_id?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          messages?: Json
          model_used?: string | null
          qa_page_images?: Json | null
          qa_page_prompts?: Json | null
          session_name?: string | null
          total_tokens_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          created_book_id?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          messages?: Json
          model_used?: string | null
          qa_page_images?: Json | null
          qa_page_prompts?: Json | null
          session_name?: string | null
          total_tokens_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_assignments: {
        Row: {
          assigned_at: string
          habit_id: string
          id: string
          is_active: boolean
          kid_profile_id: string
          parent_user_id: string
        }
        Insert: {
          assigned_at?: string
          habit_id: string
          id?: string
          is_active?: boolean
          kid_profile_id: string
          parent_user_id: string
        }
        Update: {
          assigned_at?: string
          habit_id?: string
          id?: string
          is_active?: boolean
          kid_profile_id?: string
          parent_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_assignments_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_assignments_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          coins_deposited: number
          coins_retained: number
          completion_date: string
          created_at: string
          deadline_at: string | null
          habit_assignment_id: string
          id: string
          instance_number: number | null
          kid_profile_id: string
          marked_at: string | null
          parent_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          coins_deposited?: number
          coins_retained?: number
          completion_date: string
          created_at?: string
          deadline_at?: string | null
          habit_assignment_id: string
          id?: string
          instance_number?: number | null
          kid_profile_id: string
          marked_at?: string | null
          parent_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          coins_deposited?: number
          coins_retained?: number
          completion_date?: string
          created_at?: string
          deadline_at?: string | null
          habit_assignment_id?: string
          id?: string
          instance_number?: number | null
          kid_profile_id?: string
          marked_at?: string | null
          parent_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_assignment_id_fkey"
            columns: ["habit_assignment_id"]
            isOneToOne: false
            referencedRelation: "habit_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_completions_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_schedule: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          kid_profile_id: string
          parent_user_id: string
          scheduled_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          kid_profile_id: string
          parent_user_id: string
          scheduled_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          kid_profile_id?: string
          parent_user_id?: string
          scheduled_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_schedule_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_schedule_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          book_id: string | null
          coin_amount: number
          created_at: string
          deadline_time: string | null
          description: string | null
          display_order: number
          frequency: string
          id: string
          is_active: boolean
          parent_user_id: string
          photo_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          book_id?: string | null
          coin_amount?: number
          created_at?: string
          deadline_time?: string | null
          description?: string | null
          display_order?: number
          frequency?: string
          id?: string
          is_active?: boolean
          parent_user_id: string
          photo_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          book_id?: string | null
          coin_amount?: number
          created_at?: string
          deadline_time?: string | null
          description?: string | null
          display_order?: number
          frequency?: string
          id?: string
          is_active?: boolean
          parent_user_id?: string
          photo_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
        ]
      }
      kid_profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          earned_coins: number
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          parent_user_id: string
          profile_image_url: string | null
          screen_time_balance_seconds: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          earned_coins?: number
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          parent_user_id: string
          profile_image_url?: string | null
          screen_time_balance_seconds?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          earned_coins?: number
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          parent_user_id?: string
          profile_image_url?: string | null
          screen_time_balance_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_profiles_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_purchases: {
        Row: {
          coins_spent: number
          created_at: string
          fulfilled_at: string | null
          id: string
          kid_profile_id: string
          notes: string | null
          parent_user_id: string
          product_id: string
          purchase_status: string
          purchased_at: string
          updated_at: string
        }
        Insert: {
          coins_spent: number
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          kid_profile_id: string
          notes?: string | null
          parent_user_id: string
          product_id: string
          purchase_status?: string
          purchased_at?: string
          updated_at?: string
        }
        Update: {
          coins_spent?: number
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          kid_profile_id?: string
          notes?: string | null
          parent_user_id?: string
          product_id?: string
          purchase_status?: string
          purchased_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_purchases_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kid_purchases_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kid_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "kid_rewards_products"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_rewards_products: {
        Row: {
          coin_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system_product: boolean | null
          parent_user_id: string
          product_image_url: string | null
          product_video_url: string | null
          quantity_available: number | null
          screen_time_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          coin_price: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_product?: boolean | null
          parent_user_id: string
          product_image_url?: string | null
          product_video_url?: string | null
          quantity_available?: number | null
          screen_time_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          coin_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_product?: boolean | null
          parent_user_id?: string
          product_image_url?: string | null
          product_video_url?: string | null
          quantity_available?: number | null
          screen_time_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_rewards_products_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_image_urls: {
        Row: {
          book_id: string
          coloring_image_url: string | null
          created_at: string
          error_message: string | null
          generation_cost_cents: number | null
          id: string
          image_url: string | null
          is_latest: boolean
          page_id: string
          prompt_used: string | null
          source_type: string
          text_overlay_config: Json | null
          updated_at: string
          usage_metadata: Json | null
          user_id: string
          version_number: number
        }
        Insert: {
          book_id: string
          coloring_image_url?: string | null
          created_at?: string
          error_message?: string | null
          generation_cost_cents?: number | null
          id?: string
          image_url?: string | null
          is_latest?: boolean
          page_id: string
          prompt_used?: string | null
          source_type?: string
          text_overlay_config?: Json | null
          updated_at?: string
          usage_metadata?: Json | null
          user_id: string
          version_number?: number
        }
        Update: {
          book_id?: string
          coloring_image_url?: string | null
          created_at?: string
          error_message?: string | null
          generation_cost_cents?: number | null
          id?: string
          image_url?: string | null
          is_latest?: boolean
          page_id?: string
          prompt_used?: string | null
          source_type?: string
          text_overlay_config?: Json | null
          updated_at?: string
          usage_metadata?: Json | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_image_urls_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_image_urls_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "page_image_urls_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_reference_images: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          page_id: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          page_id: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_reference_images_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_reference_images_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "page_reference_images_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
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
          page_identifier: string
          page_number: number
          page_type: Database["public"]["Enums"]["page_type"]
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
          page_identifier: string
          page_number: number
          page_type?: Database["public"]["Enums"]["page_type"]
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
          page_identifier?: string
          page_number?: number
          page_type?: Database["public"]["Enums"]["page_type"]
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
          {
            foreignKeyName: "pages_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
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
      reading_preferences: {
        Row: {
          created_at: string | null
          hidden_overlay_pages: string[] | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hidden_overlay_pages?: string[] | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hidden_overlay_pages?: string[] | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      screen_time_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          kid_profile_id: string
          parent_user_id: string
          seconds_consumed: number | null
          started_at: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          kid_profile_id: string
          parent_user_id: string
          seconds_consumed?: number | null
          started_at?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          kid_profile_id?: string
          parent_user_id?: string
          seconds_consumed?: number | null
          started_at?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screen_time_sessions_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_metadata: {
        Row: {
          book_id: string | null
          created_at: string
          daily_published_id: string | null
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
          text_overlay_config: Json | null
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          daily_published_id?: string | null
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
          text_overlay_config?: Json | null
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          book_id?: string | null
          created_at?: string
          daily_published_id?: string | null
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
          text_overlay_config?: Json | null
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "seo_metadata_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_metadata_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
        ]
      }
      trick_completions: {
        Row: {
          completed_at: string
          count_increment: number
          created_at: string
          id: string
          kid_profile_id: string
          notes: string | null
          parent_user_id: string
          points_awarded: number
          trick_goal_id: string
        }
        Insert: {
          completed_at?: string
          count_increment?: number
          created_at?: string
          id?: string
          kid_profile_id: string
          notes?: string | null
          parent_user_id: string
          points_awarded: number
          trick_goal_id: string
        }
        Update: {
          completed_at?: string
          count_increment?: number
          created_at?: string
          id?: string
          kid_profile_id?: string
          notes?: string | null
          parent_user_id?: string
          points_awarded?: number
          trick_goal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trick_completions_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trick_completions_trick_goal_id_fkey"
            columns: ["trick_goal_id"]
            isOneToOne: false
            referencedRelation: "trick_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      trick_goals: {
        Row: {
          created_at: string
          current_count: number
          goal_completed_at: string | null
          goal_started_at: string
          id: string
          is_active: boolean
          kid_profile_id: string
          parent_user_id: string
          target_count: number
          trick_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_count?: number
          goal_completed_at?: string | null
          goal_started_at?: string
          id?: string
          is_active?: boolean
          kid_profile_id: string
          parent_user_id: string
          target_count: number
          trick_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_count?: number
          goal_completed_at?: string | null
          goal_started_at?: string
          id?: string
          is_active?: boolean
          kid_profile_id?: string
          parent_user_id?: string
          target_count?: number
          trick_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trick_goals_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trick_goals_trick_id_fkey"
            columns: ["trick_id"]
            isOneToOne: false
            referencedRelation: "tricks"
            referencedColumns: ["id"]
          },
        ]
      }
      trick_media_uploads: {
        Row: {
          attempt_number: number | null
          captured_at: string | null
          created_at: string
          id: string
          kid_profile_id: string
          location_accuracy: number | null
          location_latitude: number | null
          location_longitude: number | null
          media_type: string
          media_url: string
          notes: string | null
          parent_user_id: string
          trick_goal_id: string | null
          trick_id: string
          uploaded_at: string
        }
        Insert: {
          attempt_number?: number | null
          captured_at?: string | null
          created_at?: string
          id?: string
          kid_profile_id: string
          location_accuracy?: number | null
          location_latitude?: number | null
          location_longitude?: number | null
          media_type: string
          media_url: string
          notes?: string | null
          parent_user_id: string
          trick_goal_id?: string | null
          trick_id: string
          uploaded_at?: string
        }
        Update: {
          attempt_number?: number | null
          captured_at?: string | null
          created_at?: string
          id?: string
          kid_profile_id?: string
          location_accuracy?: number | null
          location_latitude?: number | null
          location_longitude?: number | null
          media_type?: string
          media_url?: string
          notes?: string | null
          parent_user_id?: string
          trick_goal_id?: string | null
          trick_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trick_media_uploads_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trick_media_uploads_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trick_media_uploads_trick_goal_id_fkey"
            columns: ["trick_goal_id"]
            isOneToOne: false
            referencedRelation: "trick_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trick_media_uploads_trick_id_fkey"
            columns: ["trick_id"]
            isOneToOne: false
            referencedRelation: "tricks"
            referencedColumns: ["id"]
          },
        ]
      }
      tricks: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          feature_angle: string | null
          id: string
          is_active: boolean
          name: string
          parent_user_id: string
          photo_url: string | null
          points_per_completion: number
          type: string | null
          updated_at: string
          video_urls: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          feature_angle?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_user_id: string
          photo_url?: string | null
          points_per_completion?: number
          type?: string | null
          updated_at?: string
          video_urls?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          feature_angle?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_user_id?: string
          photo_url?: string | null
          points_per_completion?: number
          type?: string | null
          updated_at?: string
          video_urls?: string | null
        }
        Relationships: []
      }
      type_specific_discoveries: {
        Row: {
          agent_type: string
          created_at: string
          id: string
          is_active: boolean
          options: Json
          question_key: string
          question_text: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          question_key: string
          question_text: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          question_key?: string
          question_text?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_book_activity: {
        Row: {
          book_id: string | null
          created_at: string
          id: string
          kid_id: string | null
          last_reading_session_at: string | null
          last_viewed_at: string
          pages_read: number | null
          reading_completed: boolean | null
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          id?: string
          kid_id?: string | null
          last_reading_session_at?: string | null
          last_viewed_at?: string
          pages_read?: number | null
          reading_completed?: boolean | null
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          book_id?: string | null
          created_at?: string
          id?: string
          kid_id?: string | null
          last_reading_session_at?: string | null
          last_viewed_at?: string
          pages_read?: number | null
          reading_completed?: boolean | null
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_book_activity_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_book_activity_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "user_book_activity_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          daily_published_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_published_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_published_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_daily_published_id_fkey"
            columns: ["daily_published_id"]
            isOneToOne: false
            referencedRelation: "active_daily_published"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_daily_published_id_fkey"
            columns: ["daily_published_id"]
            isOneToOne: false
            referencedRelation: "daily_published"
            referencedColumns: ["id"]
          },
        ]
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
      user_subscription_cache: {
        Row: {
          cached_at: string
          expires_at: string | null
          has_active_subscription: boolean
          subscription_tier: string | null
          user_id: string
        }
        Insert: {
          cached_at?: string
          expires_at?: string | null
          has_active_subscription?: boolean
          subscription_tier?: string | null
          user_id: string
        }
        Update: {
          cached_at?: string
          expires_at?: string | null
          has_active_subscription?: boolean
          subscription_tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_text_overlay_defaults: {
        Row: {
          config: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_content: {
        Row: {
          created_at: string | null
          description: string | null
          duration_seconds: number
          id: string
          is_active: boolean | null
          parent_user_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          youtube_video_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_seconds: number
          id?: string
          is_active?: boolean | null
          parent_user_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          youtube_video_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number
          id?: string
          is_active?: boolean | null
          parent_user_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_content_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_time_limits: {
        Row: {
          created_at: string | null
          daily_limit_minutes: number
          id: string
          kid_profile_id: string
          parent_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_limit_minutes?: number
          id?: string
          kid_profile_id: string
          parent_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_limit_minutes?: number
          id?: string
          kid_profile_id?: string
          parent_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_time_limits_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: true
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_time_limits_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watch_sessions: {
        Row: {
          created_at: string | null
          id: string
          kid_profile_id: string
          parent_user_id: string
          seconds_watched: number
          session_ended_at: string | null
          session_started_at: string | null
          updated_at: string | null
          video_content_id: string
          watch_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kid_profile_id: string
          parent_user_id: string
          seconds_watched?: number
          session_ended_at?: string | null
          session_started_at?: string | null
          updated_at?: string | null
          video_content_id: string
          watch_date?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kid_profile_id?: string
          parent_user_id?: string
          seconds_watched?: number
          session_ended_at?: string | null
          session_started_at?: string | null
          updated_at?: string | null
          video_content_id?: string
          watch_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_watch_sessions_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_watch_sessions_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_watch_sessions_video_content_id_fkey"
            columns: ["video_content_id"]
            isOneToOne: false
            referencedRelation: "video_content"
            referencedColumns: ["id"]
          },
        ]
      }
      word_assessments: {
        Row: {
          assessed_at: string | null
          book_id: string
          created_at: string | null
          id: string
          kid_profile_id: string
          knows_word: boolean
          page_id: string
          parent_user_id: string
          word: string
          word_index: number
        }
        Insert: {
          assessed_at?: string | null
          book_id: string
          created_at?: string | null
          id?: string
          kid_profile_id: string
          knows_word: boolean
          page_id: string
          parent_user_id: string
          word: string
          word_index: number
        }
        Update: {
          assessed_at?: string | null
          book_id?: string
          created_at?: string | null
          id?: string
          kid_profile_id?: string
          knows_word?: boolean
          page_id?: string
          parent_user_id?: string
          word?: string
          word_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "word_assessments_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_assessments_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "word_assessments_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_assessments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      word_learning_progress: {
        Row: {
          book_id: string | null
          created_at: string | null
          id: string
          kid_profile_id: string
          marked_at: string
          page_id: string | null
          parent_user_id: string
          sentence_context: string | null
          session_context: Json | null
          status: string
          updated_at: string | null
          word_metadata: Json | null
          word_text: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          kid_profile_id: string
          marked_at?: string
          page_id?: string | null
          parent_user_id: string
          sentence_context?: string | null
          session_context?: Json | null
          status: string
          updated_at?: string | null
          word_metadata?: Json | null
          word_text: string
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          kid_profile_id?: string
          marked_at?: string
          page_id?: string | null
          parent_user_id?: string
          sentence_context?: string | null
          session_context?: Json | null
          status?: string
          updated_at?: string | null
          word_metadata?: Json | null
          word_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_learning_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_learning_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "word_learning_progress_kid_profile_id_fkey"
            columns: ["kid_profile_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_learning_progress_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_cache: {
        Row: {
          cache_key: string
          cache_type: string
          created_at: string | null
          data: Json
          expires_at: string
          id: string
          updated_at: string | null
        }
        Insert: {
          cache_key: string
          cache_type: string
          created_at?: string | null
          data: Json
          expires_at: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          cache_key?: string
          cache_type?: string
          created_at?: string | null
          data?: Json
          expires_at?: string
          id?: string
          updated_at?: string | null
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
          is_publicly_visible: boolean | null
          pdf_url: string | null
          publish_date: string | null
          published_at: string | null
          qr_code_config: Json | null
          qr_code_generated_at: string | null
          qr_code_image: string | null
          qr_code_public_url: string | null
          queue_order: number | null
          queue_position: number | null
          slug: string | null
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
          is_publicly_visible?: boolean | null
          pdf_url?: string | null
          publish_date?: string | null
          published_at?: string | null
          qr_code_config?: Json | null
          qr_code_generated_at?: string | null
          qr_code_image?: string | null
          qr_code_public_url?: string | null
          queue_order?: number | null
          queue_position?: number | null
          slug?: string | null
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
          is_publicly_visible?: boolean | null
          pdf_url?: string | null
          publish_date?: string | null
          published_at?: string | null
          qr_code_config?: Json | null
          qr_code_generated_at?: string | null
          qr_code_image?: string | null
          qr_code_public_url?: string | null
          queue_order?: number | null
          queue_position?: number | null
          slug?: string | null
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
          {
            foreignKeyName: "daily_published_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "kid_last_viewed_book_with_cover"
            referencedColumns: ["book_id"]
          },
        ]
      }
      kid_last_viewed_book_with_cover: {
        Row: {
          book_description: string | null
          book_id: string | null
          book_name: string | null
          cover_image_url: string | null
          is_library_book: boolean | null
          kid_id: string | null
          last_viewed_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_book_activity_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kid_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_manually_activate_item: {
        Args: { p_item_id: string }
        Returns: Json
      }
      admin_update_daily_published_expiration: {
        Args: { p_daily_published_id: string; p_new_expires_at: string }
        Returns: Json
      }
      analyze_page_image_storage: { Args: never; Returns: Json }
      auto_purchase_screen_time: {
        Args: { p_kid_id: string; p_required_seconds: number }
        Returns: Json
      }
      cleanup_old_page_images: {
        Args: {
          p_dry_run?: boolean
          p_keep_versions?: number
          p_older_than_days?: number
        }
        Returns: Json
      }
      cleanup_orphaned_image_records: {
        Args: { p_dry_run?: boolean; p_older_than_days?: number }
        Returns: Json
      }
      create_daily_habit_completions: { Args: never; Returns: Json }
      create_habit_completion_unified: {
        Args: {
          p_completion_date?: string
          p_deposit_coins?: boolean
          p_habit_id: string
          p_kid_profile_id: string
          p_parent_user_id: string
        }
        Returns: Json
      }
      create_scheduled_habit_completions: { Args: never; Returns: Json }
      create_trick_completion_unified: {
        Args: { p_count_increment: number; p_goal_id: string; p_notes?: string }
        Returns: Json
      }
      decrement_kid_coins: {
        Args: { p_amount: number; p_kid_id: string }
        Returns: undefined
      }
      decrement_screen_time: {
        Args: { p_kid_id: string; p_seconds: number }
        Returns: Record<string, unknown>
      }
      delete_habit_completion_safe: {
        Args: { p_completion_id: string }
        Returns: Json
      }
      execute_sql: { Args: { query_text: string }; Returns: Json }
      extract_colors_from_style_guide: {
        Args: {
          p_book_id: string
          p_style_guide_content: string
          p_style_guide_id: string
        }
        Returns: string
      }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_all_users_with_activity: {
        Args: never
        Returns: {
          books_created: number
          first_name: string
          last_activity: string
          last_name: string
          user_email: string
          user_id: string
        }[]
      }
      get_current_user_role: {
        Args: never
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
      get_next_available_publish_date: { Args: never; Returns: string }
      get_next_gemini_image_version_number: {
        Args: { p_page_id: string }
        Returns: number
      }
      get_next_page_image_version_number: {
        Args: { p_page_id: string }
        Returns: number
      }
      get_next_page_prompt_version_number: {
        Args: { p_page_id: string }
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
      get_next_version_number: { Args: { p_book_id: string }; Returns: number }
      get_remaining_video_time: {
        Args: { p_kid_profile_id: string }
        Returns: number
      }
      get_user_kids: {
        Args: never
        Returns: {
          created_at: string
          date_of_birth: string | null
          earned_coins: number
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          parent_user_id: string
          profile_image_url: string | null
          screen_time_balance_seconds: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "kid_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_reading_activity: {
        Args: { p_user_id: string }
        Returns: {
          activity_id: string
          book_category: string
          book_id: string
          book_name: string
          created_at: string
          kid_id: string
          kid_name: string
          last_reading_session_at: string
          last_viewed_at: string
          pages_read: number
          reading_completed: boolean
          total_pages: number
          view_count: number
        }[]
      }
      has_active_subscription: { Args: { p_user_id: string }; Returns: boolean }
      has_feature_access: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_kid_coins: {
        Args: { p_amount: number; p_kid_id: string }
        Returns: undefined
      }
      increment_screen_time: {
        Args: { p_kid_id: string; p_seconds: number }
        Returns: number
      }
      insert_page_at_position: {
        Args: {
          p_book_id: string
          p_description: string
          p_insert_after_page_number: number
          p_title: string
        }
        Returns: {
          book_id: string
          content: Json | null
          created_at: string
          current_system_prompt_id: string | null
          description: string | null
          id: string
          letter: string
          page_identifier: string
          page_number: number
          page_type: Database["public"]["Enums"]["page_type"]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_book_published: { Args: { book_id: string }; Returns: boolean }
      process_enhanced_daily_publishing: { Args: never; Returns: Json }
      process_simple_daily_publishing: { Args: never; Returns: Json }
      search_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      seed_screen_time_product: {
        Args: { p_parent_user_id: string }
        Returns: Json
      }
      seed_user_habits: { Args: { p_parent_user_id: string }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      skip_habit_completion: {
        Args: { p_completion_id: string }
        Returns: Json
      }
      update_reading_progress: {
        Args: {
          p_book_id: string
          p_kid_id: string
          p_pages_read: number
          p_reading_completed: boolean
          p_user_id: string
        }
        Returns: undefined
      }
      update_subscription_cache: {
        Args: {
          p_expires_at?: string
          p_has_active_subscription: boolean
          p_subscription_tier?: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin" | "teacher"
      page_type: "cover" | "educational" | "content"
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
      app_role: ["user", "moderator", "admin", "teacher"],
      page_type: ["cover", "educational", "content"],
      publication_status: ["draft", "published", "archived"],
    },
  },
} as const
