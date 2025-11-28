-- Create admin_chat_sessions table for storing admin marketing chat conversations
CREATE TABLE IF NOT EXISTS public.admin_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.admin_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can view their own sessions
CREATE POLICY "Admins can view their own admin chat sessions"
  ON public.admin_chat_sessions
  FOR SELECT
  USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

-- Admins can create their own sessions
CREATE POLICY "Admins can create their own admin chat sessions"
  ON public.admin_chat_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

-- Admins can update their own sessions
CREATE POLICY "Admins can update their own admin chat sessions"
  ON public.admin_chat_sessions
  FOR UPDATE
  USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

-- Admins can delete their own sessions
CREATE POLICY "Admins can delete their own admin chat sessions"
  ON public.admin_chat_sessions
  FOR DELETE
  USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_admin_chat_sessions_user_id ON public.admin_chat_sessions(user_id);
CREATE INDEX idx_admin_chat_sessions_last_message_at ON public.admin_chat_sessions(last_message_at DESC);