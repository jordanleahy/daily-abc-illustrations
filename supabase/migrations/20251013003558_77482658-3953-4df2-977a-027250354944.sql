-- Insert SEO metadata for the queued Burton Shop I Spy book
INSERT INTO seo_metadata (
  daily_published_id,
  user_id,
  version_number,
  seo_title,
  seo_description,
  og_image_url,
  optimization_status,
  is_latest,
  is_active,
  source_data
) VALUES (
  '4d5fb3d9-c064-4a0f-9ca7-baf56521ff16',  -- daily_published_id (queued entry)
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',  -- user_id
  1,                                         -- version_number
  'Burton Shop I Spy',                       -- seo_title
  'New books published daily at 7:01 AM Eastern Time featuring Burton Shop I Spy',  -- seo_description
  'https://foxdnspwzhjxjxuicute.supabase.co/storage/v1/object/public/book-covers/4b257b18-ca88-4c7a-94e6-5196605b7cc1/og-1759886319803.png',  -- og_image_url from previous publication
  'complete',                                -- optimization_status
  true,                                      -- is_latest
  true,                                      -- is_active
  jsonb_build_object(
    'bookId', '4b257b18-ca88-4c7a-94e6-5196605b7cc1',
    'action_type', 'manual_insert',
    'created_by', 'admin'
  )                                          -- source_data
);