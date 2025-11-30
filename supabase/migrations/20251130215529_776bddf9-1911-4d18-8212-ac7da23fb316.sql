-- Add RLS policy for users to manage their own blog posts
CREATE POLICY "Users can manage their own posts"
ON public.blog_posts
FOR ALL
TO public
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);