-- Add attempt_number column to trick_media_uploads table
ALTER TABLE trick_media_uploads 
ADD COLUMN attempt_number integer;

-- Add comment explaining the column
COMMENT ON COLUMN trick_media_uploads.attempt_number IS 'The current_count value from trick_goals at the time of upload (e.g., 7 for "7 out of 100")';