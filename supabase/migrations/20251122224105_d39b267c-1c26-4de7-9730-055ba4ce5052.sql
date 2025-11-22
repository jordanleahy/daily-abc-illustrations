-- Add captured_at column to store the original photo/video timestamp from EXIF metadata
ALTER TABLE trick_media_uploads 
ADD COLUMN captured_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN trick_media_uploads.captured_at IS 'Original timestamp when photo/video was captured (extracted from EXIF metadata if available, falls back to uploaded_at if not)';