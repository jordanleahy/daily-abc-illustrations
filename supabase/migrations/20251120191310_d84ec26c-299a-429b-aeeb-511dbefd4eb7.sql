-- Create video_content table to store YouTube videos
CREATE TABLE IF NOT EXISTS public.video_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create video_time_limits table for daily limits per kid
CREATE TABLE IF NOT EXISTS public.video_time_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_limit_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(kid_profile_id)
);

-- Create video_watch_sessions table to track viewing
CREATE TABLE IF NOT EXISTS public.video_watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_content_id UUID NOT NULL REFERENCES video_content(id) ON DELETE CASCADE,
  watch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  seconds_watched INTEGER NOT NULL DEFAULT 0,
  session_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_time_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_watch_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_content
CREATE POLICY "Parents can view their own videos"
ON public.video_content FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can insert their own videos"
ON public.video_content FOR INSERT
TO authenticated
WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Parents can update their own videos"
ON public.video_content FOR UPDATE
TO authenticated
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can delete their own videos"
ON public.video_content FOR DELETE
TO authenticated
USING (parent_user_id = auth.uid());

-- RLS Policies for video_time_limits
CREATE POLICY "Parents can view their kids' time limits"
ON public.video_time_limits FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can set their kids' time limits"
ON public.video_time_limits FOR INSERT
TO authenticated
WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Parents can update their kids' time limits"
ON public.video_time_limits FOR UPDATE
TO authenticated
USING (parent_user_id = auth.uid());

-- RLS Policies for video_watch_sessions
CREATE POLICY "Parents can view their kids' watch sessions"
ON public.video_watch_sessions FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can create watch sessions for their kids"
ON public.video_watch_sessions FOR INSERT
TO authenticated
WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Parents can update their kids' watch sessions"
ON public.video_watch_sessions FOR UPDATE
TO authenticated
USING (parent_user_id = auth.uid());

-- Function to get remaining video time for a kid today
CREATE OR REPLACE FUNCTION public.get_remaining_video_time(p_kid_profile_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_daily_limit_minutes INTEGER;
  v_watched_seconds INTEGER;
  v_remaining_seconds INTEGER;
BEGIN
  -- Get daily limit
  SELECT daily_limit_minutes INTO v_daily_limit_minutes
  FROM public.video_time_limits
  WHERE kid_profile_id = p_kid_profile_id;
  
  -- If no limit set, default to 30 minutes
  v_daily_limit_minutes := COALESCE(v_daily_limit_minutes, 30);
  
  -- Get total watched today
  SELECT COALESCE(SUM(seconds_watched), 0) INTO v_watched_seconds
  FROM public.video_watch_sessions
  WHERE kid_profile_id = p_kid_profile_id
    AND watch_date = CURRENT_DATE;
  
  -- Calculate remaining
  v_remaining_seconds := (v_daily_limit_minutes * 60) - v_watched_seconds;
  
  RETURN GREATEST(0, v_remaining_seconds);
END;
$$;

-- Indexes for performance
CREATE INDEX idx_video_content_parent ON public.video_content(parent_user_id);
CREATE INDEX idx_video_time_limits_kid ON public.video_time_limits(kid_profile_id);
CREATE INDEX idx_video_watch_sessions_kid_date ON public.video_watch_sessions(kid_profile_id, watch_date);
CREATE INDEX idx_video_watch_sessions_video ON public.video_watch_sessions(video_content_id);