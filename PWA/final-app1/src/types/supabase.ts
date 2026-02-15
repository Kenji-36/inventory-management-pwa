/**
 * Supabase Database型定義
 * データベーススキーマから自動生成される型定義
 * 
 * 生成コマンド:
 * npx supabase gen types typescript --project-id rboyrpltnaxcbqhrimwr > src/types/supabase.ts
 */

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
      audit_logs: {
        Row: {
          id: number
          user_id: string | null
          user_email: string | null
          action: string
          target_table: string | null
          target_id: string | null
          details: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          user_email?: string | null
          action: string
          target_table?: string | null
          target_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          user_email?: string | null
          action?: string
          target_table?: string | null
          target_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: number
          name: string
          image_url: string | null
          size: string
          product_code: string
          jan_code: string
          price_excluding_tax: number
          price_including_tax: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          image_url?: string | null
          size: string
          product_code: string
          jan_code: string
          price_excluding_tax: number
          price_including_tax: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          image_url?: string | null
          size?: string
          product_code?: string
          jan_code?: string
          price_excluding_tax?: number
          price_including_tax?: number
          created_at?: string
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: number
          product_id: number
          user_id: string | null
          user_email: string | null
          movement_type: string
          quantity: number
          previous_quantity: number
          new_quantity: number
          reason: string | null
          order_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          user_id?: string | null
          user_email?: string | null
          movement_type: string
          quantity: number
          previous_quantity: number
          new_quantity: number
          reason?: string | null
          order_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          user_id?: string | null
          user_email?: string | null
          movement_type?: string
          quantity?: number
          previous_quantity?: number
          new_quantity?: number
          reason?: string | null
          order_id?: number | null
          created_at?: string
        }
      }
      stock: {
        Row: {
          id: number
          product_id: number
          quantity: number
          last_stocked_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          product_id: number
          quantity?: number
          last_stocked_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          quantity?: number
          last_stocked_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          item_count: number
          total_price_excluding_tax: number
          total_price_including_tax: number
          order_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          item_count: number
          total_price_excluding_tax: number
          total_price_including_tax: number
          order_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          item_count?: number
          total_price_excluding_tax?: number
          total_price_including_tax?: number
          order_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_details: {
        Row: {
          id: number
          order_id: number
          product_id: number
          quantity: number
          unit_price_excluding_tax: number
          unit_price_including_tax: number
          subtotal_excluding_tax: number
          subtotal_including_tax: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          quantity: number
          unit_price_excluding_tax: number
          unit_price_including_tax: number
          subtotal_excluding_tax: number
          subtotal_including_tax: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          quantity?: number
          unit_price_excluding_tax?: number
          unit_price_including_tax?: number
          subtotal_excluding_tax?: number
          subtotal_including_tax?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
