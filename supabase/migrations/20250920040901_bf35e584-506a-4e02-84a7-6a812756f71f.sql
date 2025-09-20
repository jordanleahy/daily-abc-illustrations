-- Create missing SEO metadata for the active book
INSERT INTO public.seo_metadata (
  daily_published_id,
  user_id,
  seo_title,
  seo_description,
  og_image_url,
  optimization_status,
  is_latest,
  is_active,
  version_number,
  optimized_at,
  source_data
)
SELECT 
  dp.id,
  b.user_id,
  COALESCE(dp.title, b.book_name) as seo_title,
  COALESCE(dp.description, b.book_description, 'An engaging ABC book for children') as seo_description,
  bt.thumbnail_url as og_image_url,
  'complete',
  true,
  true,
  1,
  now(),
  jsonb_build_object(
    'bookId', b.id,
    'bookTitle', b.book_name,
    'bookDescription', b.book_description,
    'source', 'manual_fix',
    'created_by', 'missing_metadata_fix'
  )
FROM daily_published dp
JOIN books b ON dp.book_id = b.id
LEFT JOIN book_thumbnails bt ON b.id = bt.book_id AND bt.is_latest = true AND bt.generation_status = 'complete'
WHERE dp.id = '7640ba9b-466b-4228-8faa-cf5f32aa0e7a'
AND NOT EXISTS (
  SELECT 1 FROM seo_metadata sm 
  WHERE sm.daily_published_id = dp.id 
  AND sm.is_latest = true 
  AND sm.is_active = true
);