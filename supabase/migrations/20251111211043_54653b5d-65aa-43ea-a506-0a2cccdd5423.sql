-- Create enum for page types
CREATE TYPE page_type AS ENUM ('cover', 'educational', 'content');

-- Add page_type column to pages table
ALTER TABLE pages 
ADD COLUMN page_type page_type NOT NULL DEFAULT 'content';

-- Backfill existing data based on letter field
UPDATE pages 
SET page_type = 'cover' 
WHERE letter = 'COVER';

UPDATE pages 
SET page_type = 'educational' 
WHERE letter = 'FOCUS';

UPDATE pages 
SET page_type = 'content' 
WHERE letter NOT IN ('COVER', 'FOCUS');

-- Add indexes for efficient filtering
CREATE INDEX idx_pages_page_type ON pages(page_type);
CREATE INDEX idx_pages_book_type ON pages(book_id, page_type);

-- Add comment
COMMENT ON COLUMN pages.page_type IS 'Type of page: cover (first page), educational (focus page), or content (regular pages)';