-- Create user_book_activity table for tracking book views
CREATE TABLE IF NOT EXISTS public.user_book_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_published_id UUID NOT NULL REFERENCES public.daily_published(id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, daily_published_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_book_activity_user_id ON public.user_book_activity(user_id);
CREATE INDEX idx_user_book_activity_last_viewed ON public.user_book_activity(user_id, last_viewed_at DESC);

-- Enable RLS
ALTER TABLE public.user_book_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own activity
CREATE POLICY "Users can view their own book activity"
ON public.user_book_activity
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policy: Users can insert their own activity
CREATE POLICY "Users can insert their own book activity"
ON public.user_book_activity
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can update their own activity
CREATE POLICY "Users can update their own book activity"
ON public.user_book_activity
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policy: Admins can view all activity
CREATE POLICY "Admins can view all book activity"
ON public.user_book_activity
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_user_book_activity_updated_at
BEFORE UPDATE ON public.user_book_activity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();