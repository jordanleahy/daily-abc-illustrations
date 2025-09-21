-- Update existing SEO metadata records with their book thumbnails as og_image_url
UPDATE seo_metadata 
SET 
  og_image_url = bt.thumbnail_url,
  updated_at = now()
FROM daily_published dp
JOIN book_thumbnails bt ON bt.book_id = dp.book_id 
WHERE seo_metadata.daily_published_id = dp.id
  AND bt.is_latest = true 
  AND bt.generation_status = 'complete'
  AND dp.status = 'queued'
  AND seo_metadata.is_latest = true
  AND seo_metadata.is_active = true
  AND seo_metadata.og_image_url IS NULL
  AND bt.thumbnail_url IS NOT NULL;