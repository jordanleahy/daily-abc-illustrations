-- Reset all screen time balances to zero
-- This migration resets existing balances after changing the Screen Time product
-- from 30 minutes to 5 minutes to ensure pricing consistency across all users

UPDATE kid_profiles 
SET 
  screen_time_balance_seconds = 0,
  updated_at = NOW()
WHERE screen_time_balance_seconds > 0;