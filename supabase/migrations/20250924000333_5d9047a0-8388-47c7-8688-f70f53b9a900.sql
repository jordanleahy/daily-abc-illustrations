-- Add new RLS policy to allow users with 'user' role to view all published daily content
CREATE POLICY "Users with user role can view all published daily content"
ON public.daily_published
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'user'::app_role) 
  AND status != 'draft'
);