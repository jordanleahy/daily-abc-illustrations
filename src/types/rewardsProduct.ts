export interface RewardsProduct {
  id: string;
  parent_user_id: string;
  title: string;
  description?: string;
  coin_price: number;
  product_image_url?: string;
  is_active: boolean;
  quantity_available?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRewardsProductInput {
  title: string;
  description?: string;
  coin_price: number;
  product_image_url?: string;
  quantity_available?: number;
}

export interface UpdateRewardsProductInput {
  title?: string;
  description?: string;
  coin_price?: number;
  product_image_url?: string;
  is_active?: boolean;
  quantity_available?: number;
}
