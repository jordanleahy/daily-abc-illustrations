-- Fix the security definer view issue by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS active_daily_published;

-- Create the view without SECURITY DEFINER to avoid security issues
-- This view will use the permissions of the querying user, which is safer
CREATE VIEW active_daily_published AS 
SELECT * FROM daily_published 
WHERE status = 'active' 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
ORDER BY queue_position ASC;