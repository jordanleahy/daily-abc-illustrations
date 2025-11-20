-- Clean up duplicate Screen Time products and fix data
-- 1. Delete the product with NULL screen_time_minutes
DELETE FROM kid_rewards_products
WHERE id = '8d7bb08f-0bbd-49a4-834d-07394ca29e20'
  AND title = 'Screen Time'
  AND screen_time_minutes IS NULL;

-- 2. Update the remaining product to have 30 minutes
UPDATE kid_rewards_products
SET 
  screen_time_minutes = 30,
  description = '30 minutes of video watch time',
  updated_at = NOW()
WHERE id = 'ec3ec002-9f4d-45c5-a6a4-61bcc7768ff7'
  AND title = 'Screen Time';

-- 3. Migrate any existing pending Screen Time purchases to fulfilled
-- (This handles any historical purchases that weren't properly fulfilled)
WITH screen_time_purchases AS (
  SELECT 
    kp.id,
    kp.kid_profile_id,
    krp.screen_time_minutes
  FROM kid_purchases kp
  JOIN kid_rewards_products krp ON kp.product_id = krp.id
  WHERE kp.purchase_status = 'pending'
    AND krp.title = 'Screen Time'
    AND krp.screen_time_minutes IS NOT NULL
)
UPDATE kid_purchases
SET 
  purchase_status = 'fulfilled',
  fulfilled_at = NOW(),
  updated_at = NOW()
FROM screen_time_purchases
WHERE kid_purchases.id = screen_time_purchases.id;