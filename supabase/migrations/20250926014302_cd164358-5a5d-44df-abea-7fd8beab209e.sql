-- Update RLS policy to limit free authenticated users to active content only
-- This makes authenticated free users have the same access as non-authenticated users

DROP POLICY IF EXISTS "Users with user role can view all published daily content" ON public.daily_published;

CREATE POLICY "Users with user role can view active daily published content" 
ON public.daily_published 
FOR SELECT 
USING (
  has_role(auth.uid(), 'user'::app_role) 
  AND status = 'active'::text 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);