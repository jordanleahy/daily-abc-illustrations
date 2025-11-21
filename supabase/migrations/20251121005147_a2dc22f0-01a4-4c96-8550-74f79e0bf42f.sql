-- Update Screen Time system product to 5 minutes (standard pricing)
UPDATE kid_rewards_products
SET 
  screen_time_minutes = 5,
  description = '5 minutes of video watch time',
  updated_at = NOW()
WHERE title = 'Screen Time'
  AND is_system_product = true;