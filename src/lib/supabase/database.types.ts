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
      business_partners: {
        Row: {
          address: string | null
          created_at: string
          free_registration_note: string | null
          id: string
          is_active: boolean
          legacy_id: string
          name: string
          postal_code: string | null
          short_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          free_registration_note?: string | null
          id?: string
          is_active?: boolean
          legacy_id: string
          name: string
          postal_code?: string | null
          short_name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          free_registration_note?: string | null
          id?: string
          is_active?: boolean
          legacy_id?: string
          name?: string
          postal_code?: string | null
          short_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_packages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          legacy_id: string
          notes: string | null
          package_format: string | null
          package_name: string | null
          size_standard_id: string | null
          source_sorting_title: string
          unit_price_yen_per_kg: number | null
          updated_at: string
          variety_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_id: string
          notes?: string | null
          package_format?: string | null
          package_name?: string | null
          size_standard_id?: string | null
          source_sorting_title: string
          unit_price_yen_per_kg?: number | null
          updated_at?: string
          variety_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_id?: string
          notes?: string | null
          package_format?: string | null
          package_name?: string | null
          size_standard_id?: string | null
          source_sorting_title?: string
          unit_price_yen_per_kg?: number | null
          updated_at?: string
          variety_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_packages_size_standard_id_fkey"
            columns: ["size_standard_id"]
            isOneToOne: false
            referencedRelation: "size_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_packages_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      harvest_logs: {
        Row: {
          branch: string | null
          created_at: string
          harvest_month: number | null
          harvest_year: number | null
          id: string
          legacy_id: string | null
          notes: string | null
          plot_id: string
          sorting_deadline: string
          staff_id: string
          title: string
          tree_block_id: string | null
          updated_at: string
          variety_id: string
          weight_kg: number
          work_date: string
          work_time: string
        }
        Insert: {
          branch?: string | null
          created_at?: string
          harvest_month?: number | null
          harvest_year?: number | null
          id?: string
          legacy_id?: string | null
          notes?: string | null
          plot_id: string
          sorting_deadline: string
          staff_id?: string
          title: string
          tree_block_id?: string | null
          updated_at?: string
          variety_id: string
          weight_kg: number
          work_date?: string
          work_time?: string
        }
        Update: {
          branch?: string | null
          created_at?: string
          harvest_month?: number | null
          harvest_year?: number | null
          id?: string
          legacy_id?: string | null
          notes?: string | null
          plot_id?: string
          sorting_deadline?: string
          staff_id?: string
          title?: string
          tree_block_id?: string | null
          updated_at?: string
          variety_id?: string
          weight_kg?: number
          work_date?: string
          work_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "harvest_logs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_logs_tree_block_id_fkey"
            columns: ["tree_block_id"]
            isOneToOne: false
            referencedRelation: "tree_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_logs_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          cancelled_at: string | null
          created_at: string
          created_by: string
          customer_name: string
          id: string
          notes: string | null
          reserved_at: string
          ripening_batch_id: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string
          customer_name: string
          id?: string
          notes?: string | null
          reserved_at?: string
          ripening_batch_id: string
          updated_at?: string
          weight_kg: number
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string
          customer_name?: string
          id?: string
          notes?: string | null
          reserved_at?: string
          ripening_batch_id?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_ripening_batch_id_fkey"
            columns: ["ripening_batch_id"]
            isOneToOne: false
            referencedRelation: "ripening_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_ripening_batch_id_fkey"
            columns: ["ripening_batch_id"]
            isOneToOne: false
            referencedRelation: "ripening_batches_expanded"
            referencedColumns: ["work_record_id"]
          },
        ]
      }
      inventory_shipments: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_void: boolean
          notes: string | null
          reservation_id: string
          shipped_at: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          is_void?: boolean
          notes?: string | null
          reservation_id: string
          shipped_at?: string
          updated_at?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_void?: boolean
          notes?: string | null
          reservation_id?: string
          shipped_at?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_shipments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          legacy_code: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_code?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_code?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ripening_batch_items: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_void: boolean
          ripening_batch_id: string
          sorting_log_id: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          is_void?: boolean
          ripening_batch_id: string
          sorting_log_id: string
          updated_at?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_void?: boolean
          ripening_batch_id?: string
          sorting_log_id?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "ripening_batch_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ripening_batch_items_ripening_batch_id_fkey"
            columns: ["ripening_batch_id"]
            isOneToOne: false
            referencedRelation: "ripening_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ripening_batch_items_ripening_batch_id_fkey"
            columns: ["ripening_batch_id"]
            isOneToOne: false
            referencedRelation: "ripening_batches_expanded"
            referencedColumns: ["work_record_id"]
          },
          {
            foreignKeyName: "ripening_batch_items_sorting_log_id_fkey"
            columns: ["sorting_log_id"]
            isOneToOne: false
            referencedRelation: "sorting_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ripening_batch_items_sorting_log_id_fkey"
            columns: ["sorting_log_id"]
            isOneToOne: false
            referencedRelation: "sorting_logs_expanded"
            referencedColumns: ["work_record_id"]
          },
          {
            foreignKeyName: "ripening_batch_items_sorting_log_id_fkey"
            columns: ["sorting_log_id"]
            isOneToOne: false
            referencedRelation: "sorting_ripening_status"
            referencedColumns: ["sorting_log_id"]
          },
        ]
      }
      ripening_batches: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          ethylene_ended_at: string
          ethylene_processing_hours: number
          ethylene_removed_at: string | null
          ethylene_started_at: string
          ethylene_temperature_c: number | null
          id: string
          legacy_id: string | null
          location_id: string
          notes: string | null
          notifications_enabled: boolean
          resting_duration_hours: number
          resting_started_at: string
          resting_temperature_c: number | null
          ripening_no: number
          rule_id: string | null
          shippable_at: string
          staff_id: string
          started_at: string
          title: string
          updated_at: string
          variety_id: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          ethylene_ended_at: string
          ethylene_processing_hours: number
          ethylene_removed_at?: string | null
          ethylene_started_at: string
          ethylene_temperature_c?: number | null
          id?: string
          legacy_id?: string | null
          location_id: string
          notes?: string | null
          notifications_enabled?: boolean
          resting_duration_hours: number
          resting_started_at: string
          resting_temperature_c?: number | null
          ripening_no?: never
          rule_id?: string | null
          shippable_at: string
          staff_id?: string
          started_at?: string
          title: string
          updated_at?: string
          variety_id: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          ethylene_ended_at?: string
          ethylene_processing_hours?: number
          ethylene_removed_at?: string | null
          ethylene_started_at?: string
          ethylene_temperature_c?: number | null
          id?: string
          legacy_id?: string | null
          location_id?: string
          notes?: string | null
          notifications_enabled?: boolean
          resting_duration_hours?: number
          resting_started_at?: string
          resting_temperature_c?: number | null
          ripening_no?: never
          rule_id?: string | null
          shippable_at?: string
          staff_id?: string
          started_at?: string
          title?: string
          updated_at?: string
          variety_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ripening_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "ripening_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ripening_batches_rule_id_variety_id_fkey"
            columns: ["rule_id", "variety_id"]
            isOneToOne: false
            referencedRelation: "ripening_rules"
            referencedColumns: ["id", "variety_id"]
          },
          {
            foreignKeyName: "ripening_batches_rule_id_variety_id_fkey"
            columns: ["rule_id", "variety_id"]
            isOneToOne: false
            referencedRelation: "ripening_rules_expanded"
            referencedColumns: ["id", "variety_id"]
          },
          {
            foreignKeyName: "ripening_batches_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ripening_batches_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      ripening_locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ripening_rules: {
        Row: {
          created_at: string
          ethylene_duration_hours: number | null
          ethylene_temperature_c: number | null
          id: string
          is_active: boolean
          legacy_id: number | null
          resting_duration_hours: number | null
          resting_temperature_c: number | null
          shelf_life_days: number | null
          shipping_window_days: number | null
          start_month: number
          updated_at: string
          variety_id: string
        }
        Insert: {
          created_at?: string
          ethylene_duration_hours?: number | null
          ethylene_temperature_c?: number | null
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          resting_duration_hours?: number | null
          resting_temperature_c?: number | null
          shelf_life_days?: number | null
          shipping_window_days?: number | null
          start_month: number
          updated_at?: string
          variety_id: string
        }
        Update: {
          created_at?: string
          ethylene_duration_hours?: number | null
          ethylene_temperature_c?: number | null
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          resting_duration_hours?: number | null
          resting_temperature_c?: number | null
          shelf_life_days?: number | null
          shipping_window_days?: number | null
          start_month?: number
          updated_at?: string
          variety_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ripening_rules_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_sale_allocations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          ripening_batch_item_id: string
          shipping_sale_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          ripening_batch_item_id: string
          shipping_sale_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          ripening_batch_item_id?: string
          shipping_sale_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipping_sale_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_sale_allocations_ripening_batch_item_id_fkey"
            columns: ["ripening_batch_item_id"]
            isOneToOne: false
            referencedRelation: "ripening_batch_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_sale_allocations_shipping_sale_id_fkey"
            columns: ["shipping_sale_id"]
            isOneToOne: false
            referencedRelation: "shipping_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_sales: {
        Row: {
          business_partner_id: string
          cancelled_at: string | null
          created_at: string
          created_by: string
          delivery_date: string
          delivery_package_id: string | null
          id: string
          notes: string | null
          quantity_kg: number
          shipping_date: string
          size_standard_id: string
          unit_price_yen_per_kg: number
          updated_at: string
          variety_id: string
        }
        Insert: {
          business_partner_id: string
          cancelled_at?: string | null
          created_at?: string
          created_by?: string
          delivery_date: string
          delivery_package_id?: string | null
          id?: string
          notes?: string | null
          quantity_kg: number
          shipping_date: string
          size_standard_id: string
          unit_price_yen_per_kg: number
          updated_at?: string
          variety_id: string
        }
        Update: {
          business_partner_id?: string
          cancelled_at?: string | null
          created_at?: string
          created_by?: string
          delivery_date?: string
          delivery_package_id?: string | null
          id?: string
          notes?: string | null
          quantity_kg?: number
          shipping_date?: string
          size_standard_id?: string
          unit_price_yen_per_kg?: number
          updated_at?: string
          variety_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_sales_business_partner_id_fkey"
            columns: ["business_partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_sales_delivery_package_id_fkey"
            columns: ["delivery_package_id"]
            isOneToOne: false
            referencedRelation: "delivery_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_sales_size_standard_id_fkey"
            columns: ["size_standard_id"]
            isOneToOne: false
            referencedRelation: "size_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_sales_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      size_standards: {
        Row: {
          code: string
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      sorting_logs: {
        Row: {
          created_at: string
          ethylene_start_deadline: string
          harvest_log_id: string
          id: string
          legacy_id: string | null
          size_standard_id: string
          sorting_date: string
          staff_id: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          ethylene_start_deadline?: string
          harvest_log_id: string
          id?: string
          legacy_id?: string | null
          size_standard_id: string
          sorting_date?: string
          staff_id?: string
          updated_at?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          ethylene_start_deadline?: string
          harvest_log_id?: string
          id?: string
          legacy_id?: string | null
          size_standard_id?: string
          sorting_date?: string
          staff_id?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "sorting_logs_harvest_log_id_fkey"
            columns: ["harvest_log_id"]
            isOneToOne: false
            referencedRelation: "harvest_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_logs_harvest_log_id_fkey"
            columns: ["harvest_log_id"]
            isOneToOne: false
            referencedRelation: "harvest_logs_expanded"
            referencedColumns: ["work_record_id"]
          },
          {
            foreignKeyName: "sorting_logs_harvest_log_id_fkey"
            columns: ["harvest_log_id"]
            isOneToOne: false
            referencedRelation: "harvest_sorting_status"
            referencedColumns: ["harvest_log_id"]
          },
          {
            foreignKeyName: "sorting_logs_size_standard_id_fkey"
            columns: ["size_standard_id"]
            isOneToOne: false
            referencedRelation: "size_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_blocks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          plot_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          plot_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plot_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_blocks_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      varieties: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          legacy_code: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_code?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_code?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      harvest_logs_expanded: {
        Row: {
          branch: string | null
          harvest_month: number | null
          harvest_year: number | null
          input_ts: string | null
          legacy_id: string | null
          notes: string | null
          plot_id: string | null
          plot_name: string | null
          sorting_deadline: string | null
          staff_id: string | null
          staff_name: string | null
          title: string | null
          tree_block_id: string | null
          tree_block_name: string | null
          updated_at: string | null
          variety_id: string | null
          variety_name: string | null
          weight_kg: number | null
          work_date: string | null
          work_record_id: string | null
          work_time: string | null
        }
        Relationships: [
          {
            foreignKeyName: "harvest_logs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_logs_tree_block_id_fkey"
            columns: ["tree_block_id"]
            isOneToOne: false
            referencedRelation: "tree_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_logs_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      harvest_sorting_status: {
        Row: {
          harvest_log_id: string | null
          harvest_title: string | null
          harvested_weight_kg: number | null
          is_sorting_over_harvest: boolean | null
          remaining_unsorted_kg: number | null
          sorted_weight_kg: number | null
        }
        Relationships: []
      }
      inventory_status: {
        Row: {
          customer_name: string | null
          deadline_at: string | null
          location_name: string | null
          occurred_at: string | null
          plot_name: string | null
          size_name: string | null
          source_id: string | null
          status: string | null
          title: string | null
          variety_id: string | null
          variety_name: string | null
          weight_kg: number | null
        }
        Relationships: []
      }
      ripening_batches_expanded: {
        Row: {
          breakdown: Json | null
          cancelled_at: string | null
          completed_at: string | null
          ethylene_ended_at: string | null
          ethylene_processing_hours: number | null
          ethylene_removed_at: string | null
          ethylene_started_at: string | null
          ethylene_temperature_c: number | null
          input_ts: string | null
          is_due_soon: boolean | null
          is_ethylene_processing: boolean | null
          is_overdue: boolean | null
          legacy_id: string | null
          location_id: string | null
          next_check_at: string | null
          next_check_type: string | null
          notes: string | null
          notification_status: string | null
          notifications_enabled: boolean | null
          phase: string | null
          post_ethylene_processing_hours: number | null
          resting_duration_hours: number | null
          resting_started_at: string | null
          resting_temperature_c: number | null
          ripening_location: string | null
          ripening_no: number | null
          ripening_title: string | null
          rule_id: string | null
          shippable_at: string | null
          sorting_titles: string[] | null
          staff_id: string | null
          staff_name: string | null
          started_at: string | null
          updated_at: string | null
          variety_id: string | null
          variety_name: string | null
          weight_kg: number | null
          work_record_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ripening_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "ripening_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ripening_batches_rule_id_variety_id_fkey"
            columns: ["rule_id", "variety_id"]
            isOneToOne: false
            referencedRelation: "ripening_rules"
            referencedColumns: ["id", "variety_id"]
          },
          {
            foreignKeyName: "ripening_batches_rule_id_variety_id_fkey"
            columns: ["rule_id", "variety_id"]
            isOneToOne: false
            referencedRelation: "ripening_rules_expanded"
            referencedColumns: ["id", "variety_id"]
          },
          {
            foreignKeyName: "ripening_batches_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ripening_batches_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      ripening_rules_expanded: {
        Row: {
          created_at: string | null
          ethylene_duration_hours: number | null
          ethylene_temperature_c: number | null
          id: string | null
          is_active: boolean | null
          is_schedule_configured: boolean | null
          legacy_id: number | null
          resting_duration_hours: number | null
          resting_temperature_c: number | null
          shelf_life_days: number | null
          shipping_window_days: number | null
          start_month: number | null
          updated_at: string | null
          variety_id: string | null
          variety_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ripening_rules_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_available_inventory: {
        Row: {
          available_weight_kg: number | null
          size_code: string | null
          size_standard_id: string | null
          variety_id: string | null
          variety_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "harvest_logs_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_logs_size_standard_id_fkey"
            columns: ["size_standard_id"]
            isOneToOne: false
            referencedRelation: "size_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      sorting_inventory: {
        Row: {
          ethylene_start_deadline: string | null
          last_updated_at: string | null
          plot_id: string | null
          plot_name: string | null
          size_code: string | null
          size_standard_id: string | null
          sorted_weight_kg: number | null
          sorting_title: string | null
          variety_id: string | null
          variety_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "harvest_logs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_logs_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_logs_size_standard_id_fkey"
            columns: ["size_standard_id"]
            isOneToOne: false
            referencedRelation: "size_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      sorting_logs_expanded: {
        Row: {
          ethylene_start_deadline: string | null
          harvest_log_id: string | null
          harvest_title: string | null
          input_ts: string | null
          legacy_id: string | null
          plot_id: string | null
          plot_name: string | null
          size_code: string | null
          size_name: string | null
          size_standard_id: string | null
          sorting_date: string | null
          sorting_deadline: string | null
          staff_id: string | null
          staff_name: string | null
          updated_at: string | null
          variety_id: string | null
          variety_name: string | null
          weight_kg: number | null
          work_record_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "harvest_logs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_logs_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_logs_harvest_log_id_fkey"
            columns: ["harvest_log_id"]
            isOneToOne: false
            referencedRelation: "harvest_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_logs_harvest_log_id_fkey"
            columns: ["harvest_log_id"]
            isOneToOne: false
            referencedRelation: "harvest_logs_expanded"
            referencedColumns: ["work_record_id"]
          },
          {
            foreignKeyName: "sorting_logs_harvest_log_id_fkey"
            columns: ["harvest_log_id"]
            isOneToOne: false
            referencedRelation: "harvest_sorting_status"
            referencedColumns: ["harvest_log_id"]
          },
          {
            foreignKeyName: "sorting_logs_size_standard_id_fkey"
            columns: ["size_standard_id"]
            isOneToOne: false
            referencedRelation: "size_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sorting_ripening_status: {
        Row: {
          available_weight_kg: number | null
          ethylene_start_deadline: string | null
          harvest_log_id: string | null
          harvest_title: string | null
          is_ripening_over_sorting: boolean | null
          plot_id: string | null
          plot_name: string | null
          ripening_allocated_weight_kg: number | null
          size_code: string | null
          size_name: string | null
          size_standard_id: string | null
          sorted_weight_kg: number | null
          sorting_date: string | null
          sorting_log_id: string | null
          sorting_title: string | null
          variety_id: string | null
          variety_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "harvest_logs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_logs_variety_id_fkey"
            columns: ["variety_id"]
            isOneToOne: false
            referencedRelation: "varieties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_logs_harvest_log_id_fkey"
            columns: ["harvest_log_id"]
            isOneToOne: false
            referencedRelation: "harvest_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorting_logs_harvest_log_id_fkey"
            columns: ["harvest_log_id"]
            isOneToOne: false
            referencedRelation: "harvest_logs_expanded"
            referencedColumns: ["work_record_id"]
          },
          {
            foreignKeyName: "sorting_logs_harvest_log_id_fkey"
            columns: ["harvest_log_id"]
            isOneToOne: false
            referencedRelation: "harvest_sorting_status"
            referencedColumns: ["harvest_log_id"]
          },
          {
            foreignKeyName: "sorting_logs_size_standard_id_fkey"
            columns: ["size_standard_id"]
            isOneToOne: false
            referencedRelation: "size_standards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_shipping_sale: {
        Args: {
          p_business_partner_id: string
          p_delivery_date: string
          p_delivery_package_id: string
          p_notes?: string
          p_quantity_kg: number
          p_shipping_date: string
          p_size_standard_id: string
          p_unit_price_yen_per_kg: number
          p_variety_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
