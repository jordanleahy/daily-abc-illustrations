-- Server-Side Filtering Performance Indexes
-- Enable trigram extension first (for future fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. GIN index on metadata JSONB column for fast theme and other metadata lookups
CREATE INDEX IF NOT EXISTS idx_books_metadata_gin ON books USING GIN (metadata);

-- 2. Expression index for direct character theme filtering (fastest for exact matches)
CREATE INDEX IF NOT EXISTS idx_books_character_theme 
ON books ((metadata->>'characterTheme')) 
WHERE metadata->>'characterTheme' IS NOT NULL;

-- 3. Composite index for common query patterns (user_id + status + updated_at)
-- This helps with the main books query that filters by user and excludes archived
CREATE INDEX IF NOT EXISTS idx_books_user_status_updated 
ON books (user_id, status, updated_at DESC) 
WHERE status != 'archived';

-- 4. Trigram index on book_name for fuzzy search (now that extension is enabled)
CREATE INDEX IF NOT EXISTS idx_books_name_trgm 
ON books USING gin (book_name gin_trgm_ops);

-- Update table statistics for query planner optimization
ANALYZE books;

-- Document the performance improvements
COMMENT ON INDEX idx_books_character_theme IS 'Fast lookup for theme filtering - reduces query time from O(n) to O(log n)';
COMMENT ON INDEX idx_books_metadata_gin IS 'General JSONB metadata search index for flexible querying';
COMMENT ON INDEX idx_books_user_status_updated IS 'Optimizes main books list query with user filter and sort';