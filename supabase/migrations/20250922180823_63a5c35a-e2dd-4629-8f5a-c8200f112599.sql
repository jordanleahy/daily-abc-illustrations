-- Drop existing restrictive SEO metadata public policy
DROP POLICY IF EXISTS "Anyone can view active, completed SEO metadata for public conte" ON public.seo_metadata;

-- Create new broader SEO metadata public policy
CREATE POLICY "Anyone can view completed SEO metadata for public content" 
ON public.seo_metadata 
FOR SELECT 
USING (
  (is_active = true) 
  AND (optimization_status = 'complete') 
  AND (EXISTS (
    SELECT 1 
    FROM daily_published dp 
    WHERE dp.id = seo_metadata.daily_published_id 
    AND dp.status IN ('active', 'queued', 'expired')
  ))
);