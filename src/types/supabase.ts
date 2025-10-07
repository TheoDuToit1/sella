export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'customer' | 'merchant_admin' | 'driver' | 'platform_admin'
          phone: string | null
          default_address_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'customer' | 'merchant_admin' | 'driver' | 'platform_admin'
          phone?: string | null
          default_address_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'customer' | 'merchant_admin' | 'driver' | 'platform_admin'
          phone?: string | null
          default_address_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          profile_id: string
          line1: string
          line2: string | null
          suburb: string
          city: string
          province: string
          postcode: string
          coords: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          line1: string
          line2?: string | null
          suburb: string
          city: string
          province: string
          postcode: string
          coords?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          line1?: string
          line2?: string | null
          suburb?: string
          city?: string
          province?: string
          postcode?: string
          coords?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      merchants: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          is_active: boolean
          vat_number: string | null
          contact_email: string
          contact_phone: string
          pickup_only: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          vat_number?: string | null
          contact_email: string
          contact_phone: string
          pickup_only?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          vat_number?: string | null
          contact_email?: string
          contact_phone?: string
          pickup_only?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          merchant_id: string
          sku: string
          name: string
          description: string | null
          is_weight_based: boolean
          price_per_kg: number | null
          unit_price: number | null
          min_weight_g: number | null
          max_weight_g: number | null
          halal: boolean
          tags: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          sku: string
          name: string
          description?: string | null
          is_weight_based?: boolean
          price_per_kg?: number | null
          unit_price?: number | null
          min_weight_g?: number | null
          max_weight_g?: number | null
          halal?: boolean
          tags?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          sku?: string
          name?: string
          description?: string | null
          is_weight_based?: boolean
          price_per_kg?: number | null
          unit_price?: number | null
          min_weight_g?: number | null
          max_weight_g?: number | null
          halal?: boolean
          tags?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          outlet_id: string
          status: 'PLACED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
          subtotal: number
          delivery_fee: number
          discount_total: number
          tax_total: number
          grand_total_est: number
          grand_total_final: number | null
          payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
          payment_method: 'PAYFAST' | 'OZOW' | 'SNAPSCAN' | 'COD'
          delivery_window_start: string | null
          delivery_window_end: string | null
          delivery_address_id: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          outlet_id: string
          status?: 'PLACED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
          subtotal: number
          delivery_fee: number
          discount_total?: number
          tax_total: number
          grand_total_est: number
          grand_total_final?: number | null
          payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
          payment_method: 'PAYFAST' | 'OZOW' | 'SNAPSCAN' | 'COD'
          delivery_window_start?: string | null
          delivery_window_end?: string | null
          delivery_address_id: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          outlet_id?: string
          status?: 'PLACED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
          subtotal?: number
          delivery_fee?: number
          discount_total?: number
          tax_total?: number
          grand_total_est?: number
          grand_total_final?: number | null
          payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
          payment_method?: 'PAYFAST' | 'OZOW' | 'SNAPSCAN' | 'COD'
          delivery_window_start?: string | null
          delivery_window_end?: string | null
          delivery_address_id?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          name_snapshot: string
          is_weight_based: boolean
          est_weight_g: number | null
          final_weight_g: number | null
          unit_price: number | null
          price_per_kg: number | null
          line_total_est: number
          line_total_final: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          name_snapshot: string
          is_weight_based: boolean
          est_weight_g?: number | null
          final_weight_g?: number | null
          unit_price?: number | null
          price_per_kg?: number | null
          line_total_est: number
          line_total_final?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          name_snapshot?: string
          is_weight_based?: boolean
          est_weight_g?: number | null
          final_weight_g?: number | null
          unit_price?: number | null
          price_per_kg?: number | null
          line_total_est?: number
          line_total_final?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      reward_wallets: {
        Row: {
          id: string
          customer_id: string
          balance_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          balance_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          balance_points?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_finalize_weight: {
        Args: {
          p_order_item_id: string
          p_final_weight_g: number
        }
        Returns: Json
      }
      fn_recalc_order_totals: {
        Args: {
          p_order_id: string
        }
        Returns: Json
      }
      fn_rewards_accrue: {
        Args: {
          p_order_id: string
        }
        Returns: Json
      }
      fn_rewards_redeem: {
        Args: {
          p_order_id: string
          p_points: number
        }
        Returns: Json
      }
      fn_delivery_fee_estimate: {
        Args: {
          p_outlet_id: string
          p_address_id: string
        }
        Returns: number
      }
    }
    Enums: {
      user_role: 'customer' | 'merchant_admin' | 'driver' | 'platform_admin'
      order_status: 'PLACED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
      payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
      payment_method: 'PAYFAST' | 'OZOW' | 'SNAPSCAN' | 'COD'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
