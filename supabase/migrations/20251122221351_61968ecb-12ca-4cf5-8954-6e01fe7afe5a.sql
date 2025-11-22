-- Create table for trick media uploads with location tracking
CREATE TABLE IF NOT EXISTS public.trick_media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trick_id UUID NOT NULL REFERENCES public.tricks(id) ON DELETE CASCADE,
  trick_goal_id UUID REFERENCES public.trick_goals(id) ON DELETE CASCADE,
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_accuracy DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trick_media_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can view their own uploads
CREATE POLICY "Parents can view their own trick media uploads"
  ON public.trick_media_uploads
  FOR SELECT
  USING (parent_user_id = auth.uid());

-- Policy: Parents can create uploads for their kids
CREATE POLICY "Parents can create trick media uploads"
  ON public.trick_media_uploads
  FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

-- Policy: Parents can delete their own uploads
CREATE POLICY "Parents can delete their own trick media uploads"
  ON public.trick_media_uploads
  FOR DELETE
  USING (parent_user_id = auth.uid());

-- Create index for efficient queries
CREATE INDEX idx_trick_media_uploads_trick_id ON public.trick_media_uploads(trick_id);
CREATE INDEX idx_trick_media_uploads_kid_profile_id ON public.trick_media_uploads(kid_profile_id);
CREATE INDEX idx_trick_media_uploads_uploaded_at ON public.trick_media_uploads(uploaded_at DESC);