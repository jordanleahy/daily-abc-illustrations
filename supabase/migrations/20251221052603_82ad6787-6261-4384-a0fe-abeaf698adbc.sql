-- Create characters table for all character themes
CREATE TABLE public.characters (
    id text PRIMARY KEY,
    theme_id text NOT NULL REFERENCES public.character_themes(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NOT NULL,
    constraint_text text, -- Pre-computed prompt constraints for this character
    thumbnail_url text,
    default_selected boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create composite index for optimal query performance
-- This covers the common query pattern: WHERE theme_id = ? AND is_active = true ORDER BY sort_order
CREATE INDEX idx_characters_theme_active_sort ON public.characters(theme_id, is_active, sort_order);

-- Enable RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read for active characters, admin write
CREATE POLICY "Anyone can view active characters"
ON public.characters
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage characters"
ON public.characters
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON public.characters
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();