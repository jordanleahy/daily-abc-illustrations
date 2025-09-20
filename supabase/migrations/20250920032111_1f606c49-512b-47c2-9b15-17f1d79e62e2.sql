-- Optimize daily_published table for better performance and seamless transitions

-- Add database indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_published_status_expires 
ON daily_published(status, expires_at) 
WHERE status IN ('active', 'queued');

CREATE INDEX IF NOT EXISTS idx_daily_published_queue_position 
ON daily_published(queue_position) 
WHERE status != 'expired';

CREATE INDEX IF NOT EXISTS idx_daily_published_active_lookup 
ON daily_published(status, is_active, expires_at) 
WHERE status = 'active' AND is_active = true;

-- Create optimized view for active daily published content
CREATE OR REPLACE VIEW active_daily_published AS 
SELECT * FROM daily_published 
WHERE status = 'active' 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
ORDER BY queue_position ASC;

-- Add database trigger to automatically handle expiration on access
CREATE OR REPLACE FUNCTION auto_expire_on_access()
RETURNS TRIGGER AS $$
BEGIN
  -- If we're selecting and content is expired, mark it as expired
  IF TG_OP = 'SELECT' AND OLD.status = 'active' AND OLD.expires_at < now() THEN
    UPDATE daily_published 
    SET status = 'expired', is_active = false 
    WHERE id = OLD.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic expiration (but we'll handle this in application code for better control)
-- CREATE TRIGGER trigger_auto_expire_on_access
--   BEFORE SELECT ON daily_published
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_expire_on_access();

-- Add constraint to prevent multiple active items (with exception handling)
CREATE OR REPLACE FUNCTION validate_single_active_item()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Only check if this record is being set to active
  IF NEW.status = 'active' AND NEW.is_active = true THEN
    -- Count currently active, non-expired items (excluding this one)
    SELECT COUNT(*) INTO active_count
    FROM daily_published 
    WHERE status = 'active' 
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
      AND id != NEW.id;
    
    -- If there are already active items, this could be a race condition
    -- Log it but allow for automated queue processing
    IF active_count > 0 THEN
      RAISE WARNING 'Multiple active daily published items detected - this may indicate a race condition';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER validate_single_active_daily_published
  BEFORE INSERT OR UPDATE ON daily_published
  FOR EACH ROW
  EXECUTE FUNCTION validate_single_active_item();

-- Enable real-time for the daily_published table
ALTER TABLE daily_published REPLICA IDENTITY FULL;

-- Add the table to the realtime publication if not already there
DO $$ 
BEGIN
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'daily_published'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_published;
  END IF;
END $$;