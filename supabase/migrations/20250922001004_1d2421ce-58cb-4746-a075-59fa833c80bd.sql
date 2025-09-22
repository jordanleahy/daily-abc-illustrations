-- Clean up duplicate SEO metadata records for daily published content
-- Keep only the latest version for each daily_published_id
DELETE FROM seo_metadata 
WHERE id IN (
  SELECT s1.id 
  FROM seo_metadata s1
  WHERE EXISTS (
    SELECT 1 FROM seo_metadata s2 
    WHERE s2.daily_published_id = s1.daily_published_id 
    AND s2.is_latest = true 
    AND s1.is_latest = false
  )
);