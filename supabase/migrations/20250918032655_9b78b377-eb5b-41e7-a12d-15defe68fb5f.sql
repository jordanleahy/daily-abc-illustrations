-- Update RLS policy to allow users to see their own queued items
-- First, drop the existing policy
DROP POLICY "Anyone can view daily published content" ON public.daily_published;

-- Create new policies with better access control
-- 1. Anyone can view active daily published content (public access)
CREATE POLICY "Anyone can view active daily published content" 
ON public.daily_published 
FOR SELECT 
USING (
  status = 'active' 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- 2. Users can view their own queue items (including queued items)
CREATE POLICY "Users can view their own daily published items" 
ON public.daily_published 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = daily_published.book_id 
    AND books.user_id = auth.uid()
  )
);