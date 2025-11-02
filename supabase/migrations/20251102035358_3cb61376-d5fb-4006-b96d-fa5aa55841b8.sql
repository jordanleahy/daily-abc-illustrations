-- Add last_activity_at column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- Backfill existing books with their updated_at value
UPDATE books SET last_activity_at = updated_at WHERE last_activity_at IS NULL;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_books_last_activity ON books(user_id, last_activity_at DESC);

-- Create trigger function to update book's last_activity_at when pages or images change
CREATE OR REPLACE FUNCTION update_book_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE books 
  SET last_activity_at = now() 
  WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for pages table (INSERT or UPDATE)
DROP TRIGGER IF EXISTS update_book_activity_on_page_change ON pages;
CREATE TRIGGER update_book_activity_on_page_change
AFTER INSERT OR UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION update_book_last_activity();

-- Trigger for page_image_urls table (INSERT or UPDATE)
DROP TRIGGER IF EXISTS update_book_activity_on_image_change ON page_image_urls;
CREATE TRIGGER update_book_activity_on_image_change
AFTER INSERT OR UPDATE ON page_image_urls
FOR EACH ROW EXECUTE FUNCTION update_book_last_activity();