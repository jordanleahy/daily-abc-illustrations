-- Create youtube_channels table for admin-approved channels
CREATE TABLE public.youtube_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  channel_thumbnail_url TEXT,
  subscriber_count INTEGER,
  video_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id)
);

-- Enable RLS
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (using profiles table to check admin status)
-- For now, allow authenticated users to view channels (needed for video playback)
CREATE POLICY "Anyone can view active channels"
ON public.youtube_channels
FOR SELECT
USING (is_active = true);

-- Only allow insert/update/delete for authenticated users (admin check in app layer)
CREATE POLICY "Authenticated users can manage channels"
ON public.youtube_channels
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create updated_at trigger
CREATE TRIGGER update_youtube_channels_updated_at
BEFORE UPDATE ON public.youtube_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();