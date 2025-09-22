-- Activate the ABC at the Burton Snowboard Shop content
UPDATE daily_published 
SET status = 'active', is_active = true 
WHERE title = 'ABC at the Burton Snowboard Shop' 
  AND status = 'queued' 
  AND published_at <= NOW() 
  AND expires_at > NOW();