export interface KidPurchase {
  id: string;
  kid_profile_id: string;
  product_id: string;
  parent_user_id: string;
  coins_spent: number;
  purchase_status: 'pending' | 'fulfilled' | 'cancelled';
  purchased_at: string;
  fulfilled_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface KidPurchaseWithDetails extends KidPurchase {
  kid_profiles?: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
  kid_rewards_products?: {
    title: string;
    product_image_url?: string;
  };
}
