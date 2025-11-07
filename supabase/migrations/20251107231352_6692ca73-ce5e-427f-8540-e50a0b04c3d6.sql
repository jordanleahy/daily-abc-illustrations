-- Clean up orphaned SEO metadata records that reference deleted daily_published entries
-- This will remove 35 records that are blocking foreign key creation

DELETE FROM public.seo_metadata
WHERE NOT EXISTS (
  SELECT 1 FROM public.daily_published 
  WHERE daily_published.id = seo_metadata.daily_published_id
);