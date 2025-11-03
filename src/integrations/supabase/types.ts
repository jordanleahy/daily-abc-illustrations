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
      books: {
        Row: {
          book_description: string | null
          book_name: string
          category: string | null
          created_at: string
          current_system_prompt_id: string | null
          id: string
          is_highlighted: boolean
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
          created_at?: string
          current_system_prompt_id?: string | null
          id?: string
          is_highlighted?: boolean
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
          created_at?: string
          current_system_prompt_id?: string | null
          id?: string
          is_highlighted?: boolean
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
        ]
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
        ]
      }
      kid_profiles: {
        Row: {
          created_at: string
          earned_coins: number
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          parent_user_id: string
          profile_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          earned_coins?: number
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          parent_user_id: string
          profile_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          earned_coins?: number
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          parent_user_id?: string
          profile_image_url?: string | null
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
          parent_user_id: string
          product_image_url: string | null
          product_video_url: string | null
          quantity_available: number | null
          title: string
          updated_at: string
        }
        Insert: {
          coin_price: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parent_user_id: string
          product_image_url?: string | null
          product_video_url?: string | null
          quantity_available?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          coin_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parent_user_id?: string
          product_image_url?: string | null
          product_video_url?: string | null
          quantity_available?: number | null
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
          created_at: string
          error_message: string | null
          generation_completed_at: string | null
          generation_cost_cents: number | null
          generation_duration_ms: number | null
          generation_started_at: string | null
          generation_status: string
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
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_cost_cents?: number | null
          generation_duration_ms?: number | null
          generation_started_at?: string | null
          generation_status?: string
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
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_cost_cents?: number | null
          generation_duration_ms?: number | null
          generation_started_at?: string | null
          generation_status?: string
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
          text_overlay_config: Json | null
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
          text_overlay_config?: Json | null
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
          text_overlay_config?: Json | null
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
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
      decrement_kid_coins: {
        Args: { p_amount: number; p_kid_id: string }
        Returns: undefined
      }
      delete_habit_completion_safe: {
        Args: { p_completion_id: string }
        Returns: Json
      }
      extract_colors_from_style_guide: {
        Args: {
          p_book_id: string
          p_style_guide_content: string
          p_style_guide_id: string
        }
        Returns: string
      }
      generate_slug: { Args: { input_text: string }; Returns: string }
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
      get_user_kids: {
        Args: never
        Returns: {
          created_at: string
          earned_coins: number
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          parent_user_id: string
          profile_image_url: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "kid_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
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
          page_number: number
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
      seed_user_habits: { Args: { p_parent_user_id: string }; Returns: Json }
      skip_habit_completion: {
        Args: { p_completion_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin" | "teacher"
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
      publication_status: ["draft", "published", "archived"],
    },
  },
} as const
