-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > now())
  )
$$;

-- Update RLS policies for daily_published to require subscription
DROP POLICY IF EXISTS "Anyone can view active daily published content" ON public.daily_published;
DROP POLICY IF EXISTS "Users with user role can view active daily published content" ON public.daily_published;

CREATE POLICY "Authenticated users with subscription can view active daily published"
ON public.daily_published
FOR SELECT
TO authenticated
USING (
  status = 'active' 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'teacher'::app_role)
    OR has_active_subscription(auth.uid())
  )
);

-- Update RLS policies for page_image_urls to require subscription
DROP POLICY IF EXISTS "Anyone can view images for active daily published books" ON public.page_image_urls;
DROP POLICY IF EXISTS "Users can view images for all accessible library books" ON public.page_image_urls;
DROP POLICY IF EXISTS "Users with user role can view images for all daily published bo" ON public.page_image_urls;

CREATE POLICY "Authenticated users with subscription can view library images"
ON public.page_image_urls
FOR SELECT  
TO authenticated
USING (
  generation_status = 'complete'
  AND is_latest = true
  AND EXISTS (
    SELECT 1
    FROM pages p
    JOIN daily_published dp ON dp.book_id = p.book_id
    WHERE p.id = page_image_urls.page_id
      AND dp.status IN ('active', 'expired', 'queued')
  )
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role) 
    OR has_active_subscription(auth.uid())
  )
);