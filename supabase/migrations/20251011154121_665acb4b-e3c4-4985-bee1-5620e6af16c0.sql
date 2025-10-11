-- Create user_favorites table for heart collection
CREATE TABLE public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_published_id uuid NOT NULL REFERENCES public.daily_published(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, daily_published_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
  ON public.user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can add their own favorites
CREATE POLICY "Users can add their own favorites"
  ON public.user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can remove their own favorites
CREATE POLICY "Users can remove their own favorites"
  ON public.user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_user_favorites_updated_at
  BEFORE UPDATE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_daily_published_id ON public.user_favorites(daily_published_id);

-- Add comment for documentation
COMMENT ON TABLE public.user_favorites IS 'Stores user favorite books (heart collection). Each user can favorite a book once.';
COMMENT ON COLUMN public.user_favorites.user_id IS 'The user who favorited the book';
COMMENT ON COLUMN public.user_favorites.daily_published_id IS 'The book that was favorited';