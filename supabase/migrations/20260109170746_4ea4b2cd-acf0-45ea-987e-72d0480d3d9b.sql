-- Clean up duplicate seo_metadata records
-- Keep only the most recent active record per book, deactivate all others

UPDATE seo_metadata 
SET is_active = false, is_latest = false, updated_at = now()
WHERE is_active = true 
  AND book_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (book_id) id
    FROM seo_metadata
    WHERE book_id IS NOT NULL AND is_active = true
    ORDER BY book_id, created_at DESC
  );