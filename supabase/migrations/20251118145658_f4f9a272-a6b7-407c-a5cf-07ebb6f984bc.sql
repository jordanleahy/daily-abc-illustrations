-- Performance improvement indexes for books pagination
-- These indexes will significantly speed up the all-books view queries

-- Composite index for filtering and sorting books by status and updated_at
-- This covers the WHERE status != 'archived' ORDER BY updated_at DESC pattern
CREATE INDEX IF NOT EXISTS idx_books_status_updated_at 
ON public.books(status, updated_at DESC) 
WHERE status != 'archived';

-- Index for user-specific book queries
-- This speeds up the WHERE user_id = X AND status != 'archived' pattern
CREATE INDEX IF NOT EXISTS idx_books_user_status 
ON public.books(user_id, status, updated_at DESC) 
WHERE status != 'archived';

-- Index for cover image lookups in pages table
-- This speeds up the JOIN to find cover page images
CREATE INDEX IF NOT EXISTS idx_pages_book_cover 
ON public.pages(book_id, page_type) 
WHERE page_type = 'cover';

-- Index for latest page images
-- This speeds up finding the latest image version for each page
CREATE INDEX IF NOT EXISTS idx_page_image_urls_latest 
ON public.page_image_urls(page_id, is_latest) 
WHERE is_latest = true;