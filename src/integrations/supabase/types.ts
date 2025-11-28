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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          area: string
          created_at: string
          id: string
          is_primary: boolean | null
          latitude: number | null
          longitude: number | null
          pincode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          area: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          pincode: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          area?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          latitude?: number | null
          longitude?: number | null
          pincode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chef_specialties: {
        Row: {
          chef_id: string
          created_at: string
          id: string
          specialty: string
        }
        Insert: {
          chef_id: string
          created_at?: string
          id?: string
          specialty: string
        }
        Update: {
          chef_id?: string
          created_at?: string
          id?: string
          specialty?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_specialties_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "chefs"
            referencedColumns: ["id"]
          },
        ]
      }
      chefs: {
        Row: {
          avg_rating: number | null
          bio: string | null
          created_at: string
          fssai_license: boolean | null
          hygiene_certificate: boolean | null
          id: string
          is_featured: boolean | null
          kitchen_photo_url: string | null
          total_orders: number | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          avg_rating?: number | null
          bio?: string | null
          created_at?: string
          fssai_license?: boolean | null
          hygiene_certificate?: boolean | null
          id?: string
          is_featured?: boolean | null
          kitchen_photo_url?: string | null
          total_orders?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          avg_rating?: number | null
          bio?: string | null
          created_at?: string
          fssai_license?: boolean | null
          hygiene_certificate?: boolean | null
          id?: string
          is_featured?: boolean | null
          kitchen_photo_url?: string | null
          total_orders?: number | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      meals: {
        Row: {
          available: boolean
          category: string
          chef_id: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          max_quantity: number | null
          min_quantity: number | null
          oil_options: string[] | null
          price: number
          spice_levels: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          category: string
          chef_id: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          oil_options?: string[] | null
          price: number
          spice_levels?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          category?: string
          chef_id?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          oil_options?: string[] | null
          price?: number
          spice_levels?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          oil_preference: string | null
          order_id: string
          price_per_unit: number
          quantity: number
          spice_level: string | null
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          oil_preference?: string | null
          order_id: string
          price_per_unit: number
          quantity?: number
          spice_level?: string | null
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          oil_preference?: string | null
          order_id?: string
          price_per_unit?: number
          quantity?: number
          spice_level?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
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
          actual_delivery_time: string | null
          chef_id: string
          created_at: string
          customer_id: string
          delivery_address_id: string | null
          delivery_instructions: string | null
          delivery_partner_id: string | null
          id: string
          meal_id: string
          quantity: number
          scheduled_delivery_time: string | null
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          actual_delivery_time?: string | null
          chef_id: string
          created_at?: string
          customer_id: string
          delivery_address_id?: string | null
          delivery_instructions?: string | null
          delivery_partner_id?: string | null
          id?: string
          meal_id: string
          quantity?: number
          scheduled_delivery_time?: string | null
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          actual_delivery_time?: string | null
          chef_id?: string
          created_at?: string
          customer_id?: string
          delivery_address_id?: string | null
          delivery_instructions?: string | null
          delivery_partner_id?: string | null
          id?: string
          meal_id?: string
          quantity?: number
          scheduled_delivery_time?: string | null
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          chef_amount: number
          created_at: string
          id: string
          order_id: string
          platform_fee: number
          status: string
          stripe_payment_id: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          chef_amount: number
          created_at?: string
          id?: string
          order_id: string
          platform_fee: number
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          chef_amount?: number
          created_at?: string
          id?: string
          order_id?: string
          platform_fee?: number
          status?: string
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
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
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          chef_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          order_id: string
          photo_url: string | null
          rating: number
          updated_at: string
        }
        Insert: {
          chef_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          photo_url?: string | null
          rating: number
          updated_at?: string
        }
        Update: {
          chef_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          photo_url?: string | null
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "chefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_meals: {
        Row: {
          created_at: string
          delivery_date: string
          id: string
          meal_id: string
          status: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_date: string
          id?: string
          meal_id: string
          status?: string | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_date?: string
          id?: string
          meal_id?: string
          status?: string | null
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_meals_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_meals_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          chef_id: string
          created_at: string
          customer_id: string
          end_date: string
          id: string
          meals_count: number
          meals_remaining: number
          plan_type: string
          price_per_meal: number
          start_date: string
          status: string | null
          total_price: number
          updated_at: string
        }
        Insert: {
          chef_id: string
          created_at?: string
          customer_id: string
          end_date: string
          id?: string
          meals_count: number
          meals_remaining: number
          plan_type: string
          price_per_meal: number
          start_date: string
          status?: string | null
          total_price: number
          updated_at?: string
        }
        Update: {
          chef_id?: string
          created_at?: string
          customer_id?: string
          end_date?: string
          id?: string
          meals_count?: number
          meals_remaining?: number
          plan_type?: string
          price_per_meal?: number
          start_date?: string
          status?: string | null
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "chefs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
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
      app_role: "admin" | "chef" | "customer"
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
      app_role: ["admin", "chef", "customer"],
    },
  },
} as const
