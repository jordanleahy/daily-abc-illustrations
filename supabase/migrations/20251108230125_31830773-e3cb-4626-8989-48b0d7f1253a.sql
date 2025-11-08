-- Add composite indexes to optimize page image queries
-- These indexes will significantly speed up image fetching operations

-- Index for queries filtering by page_id and is_latest
-- Optimizes: getting the latest image for a specific page
CREATE INDEX IF NOT EXISTS idx_page_image_urls_page_latest 
ON page_image_urls(page_id, is_latest) 
WHERE is_latest = true;

-- Index for queries filtering by book_id and is_latest  
-- Optimizes: getting all latest images for a book's pages
CREATE INDEX IF NOT EXISTS idx_page_image_urls_book_latest 
ON page_image_urls(book_id, is_latest) 
WHERE is_latest = true;

-- Add comment explaining the optimization
COMMENT ON INDEX idx_page_image_urls_page_latest IS 'Optimizes queries fetching latest image for a specific page';
COMMENT ON INDEX idx_page_image_urls_book_latest IS 'Optimizes queries fetching all latest images for a book';