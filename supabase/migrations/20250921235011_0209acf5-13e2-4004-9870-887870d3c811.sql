-- Insert SEO metadata for "ABC at the Burton Snowboard Shop"
INSERT INTO seo_metadata (
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
  'de383fdd-adad-482d-afd1-30baa88f6ea0'::uuid as daily_published_id,
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c'::uuid as user_id,
  'ABC at the Burton Snowboard Shop: Learn Letters with Real Gear' as seo_title,
  'Learn letters by looking at real snowboard shop gear like boards, boots, jackets and goggles. Perfect educational ABC book for young learners.' as seo_description,
  bt.thumbnail_url as og_image_url,
  'complete' as optimization_status,
  true as is_latest,
  true as is_active,
  1 as version_number,
  now() as optimized_at,
  jsonb_build_object(
    'bookId', '5570cea9-7744-4994-876c-9a94a5550661',
    'bookTitle', 'ABC at the Burton Snowboard Shop',
    'bookDescription', 'Learn letters by looking at real snowboard shop gear like boards, boots, jackets and goggles.',
    'source', 'manual_generation',
    'created_by', 'system_repair'
  ) as source_data
FROM book_thumbnails bt
WHERE bt.book_id = '5570cea9-7744-4994-876c-9a94a5550661'
  AND bt.is_latest = true
  AND bt.generation_status = 'complete';