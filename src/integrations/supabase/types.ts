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
      accommodations: {
        Row: {
          code: string
          created_at: string
          description_en: string | null
          description_fr: string | null
          id: string
          name_en: string
          name_fr: string
          published: boolean
          sort_order: number
          unit_count: number
          updated_at: string
          venue_id: string
          winter_availability_confirmed: boolean
        }
        Insert: {
          code: string
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          name_en: string
          name_fr: string
          published?: boolean
          sort_order?: number
          unit_count?: number
          updated_at?: string
          venue_id: string
          winter_availability_confirmed?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          name_en?: string
          name_fr?: string
          published?: boolean
          sort_order?: number
          unit_count?: number
          updated_at?: string
          venue_id?: string
          winter_availability_confirmed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          created_at: string
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          value: string | null
          value_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          value?: string | null
          value_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: string | null
          value_type?: string
        }
        Relationships: []
      }
      event_dates: {
        Row: {
          created_at: string
          event_date: string
          id: string
          internal_notes: string | null
          is_test: boolean
          program_id: string | null
          published: boolean
          season_id: string
          status: Database["public"]["Enums"]["public_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date: string
          id?: string
          internal_notes?: string | null
          is_test?: boolean
          program_id?: string | null
          published?: boolean
          season_id: string
          status?: Database["public"]["Enums"]["public_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          internal_notes?: string | null
          is_test?: boolean
          program_id?: string | null
          published?: boolean
          season_id?: string
          status?: Database["public"]["Enums"]["public_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_dates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dates_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_fr: string | null
          id: string
          name_en: string
          name_fr: string
          published: boolean
          sort_order: number
          updated_at: string
          venue_id: string
          winter_availability_confirmed: boolean
        }
        Insert: {
          category: string
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          name_en: string
          name_fr: string
          published?: boolean
          sort_order?: number
          updated_at?: string
          venue_id: string
          winter_availability_confirmed?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          name_en?: string
          name_fr?: string
          published?: boolean
          sort_order?: number
          updated_at?: string
          venue_id?: string
          winter_availability_confirmed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "facilities_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer_en: string
          answer_fr: string
          created_at: string
          group_en: string
          group_fr: string
          id: string
          published: boolean
          question_en: string
          question_fr: string
          season_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer_en: string
          answer_fr: string
          created_at?: string
          group_en: string
          group_fr: string
          id?: string
          published?: boolean
          question_en: string
          question_fr: string
          season_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer_en?: string
          answer_fr?: string
          created_at?: string
          group_en?: string
          group_fr?: string
          id?: string
          published?: boolean
          question_en?: string
          question_fr?: string
          season_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      holds: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          quantity: number
          status: Database["public"]["Enums"]["hold_status"]
          time_slot_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          quantity: number
          status?: Database["public"]["Enums"]["hold_status"]
          time_slot_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["hold_status"]
          time_slot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holds_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_en: string | null
          alt_fr: string | null
          created_at: string
          height: number | null
          id: string
          key: string
          kind: string
          published: boolean
          updated_at: string
          url: string
          width: number | null
        }
        Insert: {
          alt_en?: string | null
          alt_fr?: string | null
          created_at?: string
          height?: number | null
          id?: string
          key: string
          kind?: string
          published?: boolean
          updated_at?: string
          url: string
          width?: number | null
        }
        Update: {
          alt_en?: string | null
          alt_fr?: string | null
          created_at?: string
          height?: number | null
          id?: string
          key?: string
          kind?: string
          published?: boolean
          updated_at?: string
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      operational_status: {
        Row: {
          created_at: string
          effective_from: string
          event_status: Database["public"]["Enums"]["public_status"]
          ice_condition: Database["public"]["Enums"]["ice_condition"]
          id: string
          public_message_en: string | null
          public_message_fr: string | null
          published: boolean
          route_status: Database["public"]["Enums"]["segment_status"]
          season_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          effective_from?: string
          event_status?: Database["public"]["Enums"]["public_status"]
          ice_condition?: Database["public"]["Enums"]["ice_condition"]
          id?: string
          public_message_en?: string | null
          public_message_fr?: string | null
          published?: boolean
          route_status?: Database["public"]["Enums"]["segment_status"]
          season_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          effective_from?: string
          event_status?: Database["public"]["Enums"]["public_status"]
          ice_condition?: Database["public"]["Enums"]["ice_condition"]
          id?: string
          public_message_en?: string | null
          public_message_fr?: string | null
          published?: boolean
          route_status?: Database["public"]["Enums"]["segment_status"]
          season_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operational_status_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          flex_selected: boolean
          id: string
          name_snapshot: string
          order_id: string
          quantity: number
          ticket_type_code: string
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          flex_selected?: boolean
          id?: string
          name_snapshot: string
          order_id: string
          quantity: number
          ticket_type_code: string
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          flex_selected?: boolean
          id?: string
          name_snapshot?: string
          order_id?: string
          quantity?: number
          ticket_type_code?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          flex_cents: number
          gst_cents: number
          hold_id: string | null
          id: string
          order_number: string
          paid_at: string | null
          qst_cents: number
          quantity: number
          season_id: string | null
          snapshot: Json
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          time_slot_id: string | null
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          flex_cents?: number
          gst_cents?: number
          hold_id?: string | null
          id?: string
          order_number: string
          paid_at?: string | null
          qst_cents?: number
          quantity?: number
          season_id?: string | null
          snapshot?: Json
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          time_slot_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          flex_cents?: number
          gst_cents?: number
          hold_id?: string | null
          id?: string
          order_number?: string
          paid_at?: string | null
          qst_cents?: number
          quantity?: number
          season_id?: string | null
          snapshot?: Json
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          time_slot_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_hold_id_fkey"
            columns: ["hold_id"]
            isOneToOne: false
            referencedRelation: "holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          block_key: string
          created_at: string
          id: string
          media_id: string | null
          page_key: string
          published: boolean
          sort_order: number
          updated_at: string
          value_en: string | null
          value_fr: string | null
        }
        Insert: {
          block_key: string
          created_at?: string
          id?: string
          media_id?: string | null
          page_key: string
          published?: boolean
          sort_order?: number
          updated_at?: string
          value_en?: string | null
          value_fr?: string | null
        }
        Update: {
          block_key?: string
          created_at?: string
          id?: string
          media_id?: string | null
          page_key?: string
          published?: boolean
          sort_order?: number
          updated_at?: string
          value_en?: string | null
          value_fr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_content_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          order_id: string
          provider: string
          provider_event_id: string | null
          provider_intent_id: string | null
          raw: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          order_id: string
          provider?: string
          provider_event_id?: string | null
          provider_intent_id?: string | null
          raw?: Json | null
          status: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          order_id?: string
          provider?: string
          provider_event_id?: string | null
          provider_intent_id?: string | null
          raw?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          accent_style: string | null
          active: boolean
          created_at: string
          description_en: string | null
          description_fr: string | null
          family_friendly: boolean
          featured: boolean
          hero_media_id: string | null
          id: string
          minimum_age: number | null
          music_genre: string | null
          published: boolean
          season_id: string
          slug: string
          sort_order: number
          subtitle_en: string | null
          subtitle_fr: string | null
          title_en: string
          title_fr: string
          updated_at: string
        }
        Insert: {
          accent_style?: string | null
          active?: boolean
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          family_friendly?: boolean
          featured?: boolean
          hero_media_id?: string | null
          id?: string
          minimum_age?: number | null
          music_genre?: string | null
          published?: boolean
          season_id: string
          slug: string
          sort_order?: number
          subtitle_en?: string | null
          subtitle_fr?: string | null
          title_en: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          accent_style?: string | null
          active?: boolean
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          family_friendly?: boolean
          featured?: boolean
          hero_media_id?: string | null
          id?: string
          minimum_age?: number | null
          music_genre?: string | null
          published?: boolean
          season_id?: string
          slug?: string
          sort_order?: number
          subtitle_en?: string | null
          subtitle_fr?: string | null
          title_en?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      route_segments: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string
          description_en: string | null
          description_fr: string | null
          id: string
          internal_notes: string | null
          lighting_style: string | null
          music_style: string | null
          name_en: string
          name_fr: string
          public_message_en: string | null
          public_message_fr: string | null
          published: boolean
          season_id: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["segment_status"]
          street_name: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          internal_notes?: string | null
          lighting_style?: string | null
          music_style?: string | null
          name_en: string
          name_fr: string
          public_message_en?: string | null
          public_message_fr?: string | null
          published?: boolean
          season_id?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["segment_status"]
          street_name?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          internal_notes?: string | null
          lighting_style?: string | null
          music_style?: string | null
          name_en?: string
          name_fr?: string
          public_message_en?: string | null
          public_message_fr?: string | null
          published?: boolean
          season_id?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["segment_status"]
          street_name?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_segments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_segments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          currency: string
          end_date: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          is_inaugural: boolean
          name_en: string
          name_fr: string
          sales_end_at: string | null
          sales_start_at: string | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["season_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_inaugural?: boolean
          name_en: string
          name_fr: string
          sales_end_at?: string | null
          sales_start_at?: string | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["season_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_inaugural?: boolean
          name_en?: string
          name_fr?: string
          sales_end_at?: string | null
          sales_start_at?: string | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["season_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          active: boolean
          code: string
          counts_as_adult: boolean
          created_at: string
          description_en: string | null
          description_fr: string | null
          id: string
          is_addon: boolean
          maximum_adults: number | null
          maximum_quantity: number
          minimum_group_size: number | null
          minimum_quantity: number
          name_en: string
          name_fr: string
          price_cents: number
          season_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          counts_as_adult?: boolean
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_addon?: boolean
          maximum_adults?: number | null
          maximum_quantity?: number
          minimum_group_size?: number | null
          minimum_quantity?: number
          name_en: string
          name_fr: string
          price_cents: number
          season_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          counts_as_adult?: boolean
          created_at?: string
          description_en?: string | null
          description_fr?: string | null
          id?: string
          is_addon?: boolean
          maximum_adults?: number | null
          maximum_quantity?: number
          minimum_group_size?: number | null
          minimum_quantity?: number
          name_en?: string
          name_fr?: string
          price_cents?: number
          season_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          flex_selected: boolean
          id: string
          name_snapshot: string
          order_id: string
          qr_token: string
          scanned_at: string | null
          scanned_by: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_type_code: string
          time_slot_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          flex_selected?: boolean
          id?: string
          name_snapshot: string
          order_id: string
          qr_token: string
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_code: string
          time_slot_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          flex_selected?: boolean
          id?: string
          name_snapshot?: string
          order_id?: string
          qr_token?: string
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_type_code?: string
          time_slot_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          capacity: number
          created_at: string
          event_date_id: string
          id: string
          published: boolean
          start_time: string
          status: Database["public"]["Enums"]["public_status"]
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          event_date_id: string
          id?: string
          published?: boolean
          start_time: string
          status?: Database["public"]["Enums"]["public_status"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          event_date_id?: string
          id?: string
          published?: boolean
          start_time?: string
          status?: Database["public"]["Enums"]["public_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_event_date_id_fkey"
            columns: ["event_date_id"]
            isOneToOne: false
            referencedRelation: "event_dates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_public: boolean
          label: string
          phone: string | null
          scope: string
          sort_order: number
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_public?: boolean
          label: string
          phone?: string | null
          scope?: string
          sort_order?: number
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_public?: boolean
          label?: string
          phone?: string | null
          scope?: string
          sort_order?: number
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_contacts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          accessibility_information: string | null
          acreage: number | null
          active: boolean
          address: string | null
          city: string | null
          country: string
          created_at: string
          directions_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          parking_information: string | null
          postal_code: string | null
          province: string | null
          public_description_en: string | null
          public_description_fr: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          accessibility_information?: string | null
          acreage?: number | null
          active?: boolean
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          directions_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          parking_information?: string | null
          postal_code?: string | null
          province?: string | null
          public_description_en?: string | null
          public_description_fr?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          accessibility_information?: string | null
          acreage?: number | null
          active?: boolean
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          directions_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          parking_information?: string | null
          postal_code?: string | null
          province?: string | null
          public_description_en?: string | null
          public_description_fr?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      weather_notices: {
        Row: {
          body_en: string | null
          body_fr: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          published: boolean
          season_id: string
          severity: string
          starts_at: string
          title_en: string
          title_fr: string
          updated_at: string
        }
        Insert: {
          body_en?: string | null
          body_fr?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          published?: boolean
          season_id: string
          severity?: string
          starts_at?: string
          title_en: string
          title_fr: string
          updated_at?: string
        }
        Update: {
          body_en?: string | null
          body_fr?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          published?: boolean
          season_id?: string
          severity?: string
          starts_at?: string
          title_en?: string
          title_fr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_notices_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_hold: {
        Args: { _minutes?: number; _quantity: number; _slot_id: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          quantity: number
          status: Database["public"]["Enums"]["hold_status"]
          time_slot_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "holds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff_admin: { Args: { _user_id: string }; Returns: boolean }
      redeem_ticket: {
        Args: { _qr_token: string; _scanner: string }
        Returns: Json
      }
      slot_remaining_capacity: { Args: { _slot_id: string }; Returns: number }
    }
    Enums: {
      app_role:
        | "GATE_STAFF"
        | "SUPERVISOR"
        | "CONTENT_EDITOR"
        | "OPERATIONS"
        | "ADMIN"
        | "SUPER_ADMIN"
      hold_status: "ACTIVE" | "CONVERTED" | "RELEASED" | "EXPIRED"
      ice_condition:
        | "EXCELLENT"
        | "GOOD"
        | "VARIABLE"
        | "MAINTENANCE"
        | "CLOSED"
      order_status:
        | "DRAFT"
        | "PENDING_PAYMENT"
        | "PAID"
        | "CANCELLED"
        | "REFUNDED"
        | "FAILED"
      public_status: "OPEN" | "ADVISORY" | "PARTIAL" | "CLOSED" | "CANCELLED"
      season_status: "DRAFT" | "ACTIVE" | "ARCHIVED"
      segment_status: "OPEN" | "ADVISORY" | "CLOSED"
      ticket_status: "VALID" | "USED" | "VOID" | "REFUNDED"
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
      app_role: [
        "GATE_STAFF",
        "SUPERVISOR",
        "CONTENT_EDITOR",
        "OPERATIONS",
        "ADMIN",
        "SUPER_ADMIN",
      ],
      hold_status: ["ACTIVE", "CONVERTED", "RELEASED", "EXPIRED"],
      ice_condition: ["EXCELLENT", "GOOD", "VARIABLE", "MAINTENANCE", "CLOSED"],
      order_status: [
        "DRAFT",
        "PENDING_PAYMENT",
        "PAID",
        "CANCELLED",
        "REFUNDED",
        "FAILED",
      ],
      public_status: ["OPEN", "ADVISORY", "PARTIAL", "CLOSED", "CANCELLED"],
      season_status: ["DRAFT", "ACTIVE", "ARCHIVED"],
      segment_status: ["OPEN", "ADVISORY", "CLOSED"],
      ticket_status: ["VALID", "USED", "VOID", "REFUNDED"],
    },
  },
} as const
