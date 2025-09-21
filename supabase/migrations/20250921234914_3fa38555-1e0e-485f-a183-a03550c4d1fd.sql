-- Generate SEO metadata for ABC at the Burton Snowboard Shop
SELECT supabase.http(
  'POST',
  'https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/generate-seo-metadata',
  jsonb_build_object(
    'dailyPublishedId', 'de383fdd-adad-482d-afd1-30baa88f6ea0',
    'contentTitle', 'ABC at the Burton Snowboard Shop',
    'bookDescription', 'Learn letters by looking at real snowboard shop gear like boards, boots, jackets and goggles.',
    'userId', 'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c'
  ),
  jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
  )
) as response;