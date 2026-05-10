import { supabase } from "@/integrations/supabase/client";

export interface CommissionTier {
  id: number;
  tier_name: string;
  commission_rate: number;
  valid_from: string;
  valid_to: string | null;
  description: string;
}

/**
 * Get the current active commission tier
 * Returns the tier that is currently valid based on today's date
 */
export async function getCurrentCommissionTier(): Promise<CommissionTier | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("commission_tiers")
      .select("*")
      .eq("is_active", true)
      .lte("valid_from", today)
      .or(`valid_to.is.null,valid_to.gte.${today}`)
      .order("valid_from", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching commission tier:", error);
      // Fallback to 0% if database query fails
      return {
        id: 0,
        tier_name: "Fallback - 0% Commission",
        commission_rate: 0,
        valid_from: new Date().toISOString(),
        valid_to: null,
        description: "Database fallback rate"
      };
    }

    return data;
  } catch (error) {
    console.error("Error in getCurrentCommissionTier:", error);
    return null;
  }
}

/**
 * Get all commission tiers (for admin display)
 */
export async function getAllCommissionTiers(): Promise<CommissionTier[]> {
  try {
    const { data, error } = await supabase
      .from("commission_tiers")
      .select("*")
      .order("valid_from", { ascending: true });

    if (error) {
      console.error("Error fetching commission tiers:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllCommissionTiers:", error);
    return [];
  }
}

/**
 * Calculate chef earnings based on order amount
 * Deducts current commission percentage
 */
export async function calculateChefEarnings(orderAmount: number): Promise<number> {
  const tier = await getCurrentCommissionTier();
  if (!tier) return orderAmount; // Fallback to full amount
  
  const commissionRate = tier.commission_rate / 100;
  return orderAmount * (1 - commissionRate);
}

/**
 * Get commission percentage as decimal (e.g., 10 = 10%)
 */
export async function getCommissionPercentage(): Promise<number> {
  const tier = await getCurrentCommissionTier();
  return tier?.commission_rate ?? 0;
}
