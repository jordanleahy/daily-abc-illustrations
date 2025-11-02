-- Create table for user text overlay default configurations
CREATE TABLE public.user_text_overlay_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_text_overlay_defaults ENABLE ROW LEVEL SECURITY;

-- Users can view their own defaults
CREATE POLICY "Users can view their own text overlay defaults"
ON public.user_text_overlay_defaults
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own defaults
CREATE POLICY "Users can insert their own text overlay defaults"
ON public.user_text_overlay_defaults
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own defaults
CREATE POLICY "Users can update their own text overlay defaults"
ON public.user_text_overlay_defaults
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own defaults
CREATE POLICY "Users can delete their own text overlay defaults"
ON public.user_text_overlay_defaults
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all defaults
CREATE POLICY "Admins can view all text overlay defaults"
ON public.user_text_overlay_defaults
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_text_overlay_defaults_updated_at
BEFORE UPDATE ON public.user_text_overlay_defaults
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();