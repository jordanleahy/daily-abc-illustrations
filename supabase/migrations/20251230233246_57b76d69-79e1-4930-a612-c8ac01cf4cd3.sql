-- Sync books.marketing_url with daily_published.slug for consistency
-- Only update where there's no conflict (slug doesn't already exist on another book)

UPDATE books b
SET 
  marketing_url = dp.slug,
  updated_at = now()
FROM daily_published dp
WHERE dp.book_id = b.id
  AND dp.slug IS NOT NULL
  AND dp.slug != ''
  AND b.marketing_url != dp.slug
  -- Only update if no other book already has this marketing_url
  AND NOT EXISTS (
    SELECT 1 FROM books other 
    WHERE other.marketing_url = dp.slug 
    AND other.id != b.id
  );