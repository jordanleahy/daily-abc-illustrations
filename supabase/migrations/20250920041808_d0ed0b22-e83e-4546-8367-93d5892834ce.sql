-- Fix Graphics Designer Agent configuration with correct user ID
-- Set the Graphics Designer Agent (ID: 07109824-6a29-406b-9bb5-8a3e4ec545b0) as the latest

-- First, set all graphic-designer agents for the correct user to is_latest = false
UPDATE public.agents 
SET is_latest = false, updated_at = now()
WHERE user_id = 'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c'
AND type = 'graphic-designer';

-- Then set the Graphics Designer Agent as the latest
UPDATE public.agents 
SET is_latest = true, updated_at = now()
WHERE id = '07109824-6a29-406b-9bb5-8a3e4ec545b0'
AND user_id = 'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c'
AND type = 'graphic-designer';