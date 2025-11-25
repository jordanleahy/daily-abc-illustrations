-- Add video_urls column to tricks table for storing multiple video URLs
ALTER TABLE tricks ADD COLUMN IF NOT EXISTS video_urls TEXT NULL;

COMMENT ON COLUMN tricks.video_urls IS 'JSON array of video URLs stored as text';