-- Add thumbnail_url column to books table
ALTER TABLE books
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN books.thumbnail_url IS 'URL to the book thumbnail image used for listings and previews';