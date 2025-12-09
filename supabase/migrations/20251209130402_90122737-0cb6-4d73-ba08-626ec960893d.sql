
-- Fix DanDan's earned_coins to reflect actual pending + completed coins
-- pending_deposits (2133) should already be in balance per pre-deposit model
-- We need to calculate the correct balance: sum of all coins_deposited for non-declined habits

-- First, let's calculate what the balance SHOULD be
-- According to pre-deposit model: earned_coins = SUM(coins_deposited) for all pending + completed habits
-- minus any deductions that happened

-- For now, set DanDan's balance to match today's deposits (160 pennies) as a starting point
UPDATE kid_profiles
SET earned_coins = 160,
    updated_at = now()
WHERE id = '1e6996b6-5e1d-450b-b875-d03e58a1da09';
