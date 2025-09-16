-- Make expires_at nullable to support non-expiring Instagram shares
ALTER TABLE public.daily_published ALTER COLUMN expires_at DROP NOT NULL;

-- Update RLS policy to allow access to content with null expires_at (never expires)
DROP POLICY IF EXISTS "Anyone can view daily published content" ON public.daily_published;

CREATE POLICY "Anyone can view daily published content" 
ON public.daily_published 
FOR SELECT 
USING ((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now())));