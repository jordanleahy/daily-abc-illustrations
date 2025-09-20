-- Fix Graphics Designer Agent configuration for user b0c9e5f5-cf4e-4964-8af3-26691b1e4338
-- Set the most recent graphics-designer agent as the latest version

-- First, set all graphic-designer agents for this user to is_latest = false
UPDATE public.agents 
SET is_latest = false, updated_at = now()
WHERE user_id = 'b0c9e5f5-cf4e-4964-8af3-26691b1e4338'
AND type = 'graphic-designer';

-- Then set the most recent agent (created 2025-09-15) as the latest
UPDATE public.agents 
SET is_latest = true, updated_at = now()
WHERE id = '07109824-6a29-406b-9bb5-8a3e4ec545b0'
AND user_id = 'b0c9e5f5-cf4e-4964-8af3-26691b1e4338'
AND type = 'graphic-designer';