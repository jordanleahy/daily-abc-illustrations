-- Add unique constraint to prevent multiple active daily publications for the same book
CREATE UNIQUE INDEX daily_published_unique_active_book 
ON daily_published (book_id) 
WHERE is_active = true AND (expires_at IS NULL OR expires_at > now());

-- Add a function to check for existing active publications
CREATE OR REPLACE FUNCTION check_daily_published_duplicate()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's already an active publication for this book
  IF EXISTS (
    SELECT 1 FROM daily_published 
    WHERE book_id = NEW.book_id 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'A daily publication already exists for this book and is still active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the duplicate check
CREATE TRIGGER prevent_duplicate_daily_published
  BEFORE INSERT OR UPDATE ON daily_published
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_published_duplicate();