-- Add text_overlay_config to seo_metadata table for thumbnail text overlays
ALTER TABLE public.seo_metadata 
ADD COLUMN IF NOT EXISTS text_overlay_config JSONB DEFAULT NULL;

COMMENT ON COLUMN public.seo_metadata.text_overlay_config IS 
'Stores text overlay configuration for book thumbnails (if applied)';