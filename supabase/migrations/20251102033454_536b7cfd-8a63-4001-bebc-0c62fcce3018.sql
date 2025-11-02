-- Add metadata JSONB column to books table for structured filtering and sorting
ALTER TABLE books ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_books_metadata ON books USING gin(metadata);

-- Add helpful comments
COMMENT ON COLUMN books.metadata IS 'Structured metadata for book filtering and sorting (bookType, pageCount, letterCase, numberRange, characterTheme, etc.)';
