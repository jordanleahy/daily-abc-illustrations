-- Create Screen Time system product for DanDan's parent
INSERT INTO kid_rewards_products (
  parent_user_id,
  title,
  description,
  coin_price,
  screen_time_minutes,
  is_system_product,
  is_active
)
VALUES (
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'Screen Time',
  '30 minutes of video watch time',
  100,
  30,
  true,
  true
);