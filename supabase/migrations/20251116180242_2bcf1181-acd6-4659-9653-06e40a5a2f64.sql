-- Phase 1.1: Create cover pages for books that have thumbnail_url but no cover page
INSERT INTO pages (book_id, page_number, letter, title, page_type, description, content, created_at, updated_at)
SELECT 
  b.id as book_id,
  0 as page_number,
  'Cover' as letter,
  b.book_name as title,
  'cover'::page_type as page_type,
  'Auto-migrated book cover' as description,
  '{}'::jsonb as content,
  now() as created_at,
  now() as updated_at
FROM books b
WHERE b.thumbnail_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pages p 
    WHERE p.book_id = b.id AND p.page_type = 'cover'
  );

-- Phase 1.2: Migrate thumbnail_url entries to page_image_urls
INSERT INTO page_image_urls (
  page_id, 
  book_id, 
  user_id, 
  version_number, 
  image_url, 
  source_type, 
  is_latest,
  created_at,
  updated_at
)
SELECT 
  p.id as page_id,
  b.id as book_id,
  b.user_id,
  1 as version_number,
  b.thumbnail_url as image_url,
  'user_uploaded' as source_type,
  true as is_latest,
  b.created_at,
  now() as updated_at
FROM books b
INNER JOIN pages p ON p.book_id = b.id AND p.page_type = 'cover'
WHERE b.thumbnail_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM page_image_urls piu 
    WHERE piu.page_id = p.id
  );

-- Phase 1.3: Drop the thumbnail_url column from books table
ALTER TABLE books DROP COLUMN IF EXISTS thumbnail_url;