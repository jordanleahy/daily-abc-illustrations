-- Add video URL column to kid_rewards_products table
ALTER TABLE kid_rewards_products 
ADD COLUMN product_video_url text;

COMMENT ON COLUMN kid_rewards_products.product_video_url IS 'URL to the product video stored in Supabase storage';