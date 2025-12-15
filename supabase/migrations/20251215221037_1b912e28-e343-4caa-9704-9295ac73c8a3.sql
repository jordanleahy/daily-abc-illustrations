-- Create book_social_posts table to track which platforms posts were shared to
CREATE TABLE public.book_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin')),
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(book_id, platform)
);

-- Enable RLS
ALTER TABLE public.book_social_posts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all records
CREATE POLICY "Admins can manage all social posts"
ON public.book_social_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own records
CREATE POLICY "Users can view their own social posts"
ON public.book_social_posts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own records
CREATE POLICY "Users can create their own social posts"
ON public.book_social_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Users can delete their own social posts"
ON public.book_social_posts
FOR DELETE
USING (auth.uid() = user_id);