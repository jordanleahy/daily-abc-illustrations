-- Add text_overlay_config column to page_image_urls table
ALTER TABLE public.page_image_urls 
ADD COLUMN IF NOT EXISTS text_overlay_config JSONB DEFAULT NULL;

-- Add comment describing the column
COMMENT ON COLUMN public.page_image_urls.text_overlay_config 
IS 'JSON configuration for text overlay applied to the image. Contains font, color, position, and styling information.';

-- Add index for querying images with text overlays
CREATE INDEX IF NOT EXISTS idx_page_image_urls_text_overlay 
ON public.page_image_urls ((text_overlay_config IS NOT NULL))
WHERE text_overlay_config IS NOT NULL;