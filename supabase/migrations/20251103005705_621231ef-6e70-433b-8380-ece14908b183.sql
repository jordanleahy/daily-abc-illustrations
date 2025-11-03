-- Drop instagram_shared table and related function
DROP FUNCTION IF EXISTS public.get_instagram_shared_pages(uuid);
DROP TABLE IF EXISTS public.instagram_shared;

-- Add comment to seo_metadata.text_overlay_config to clarify usage
COMMENT ON COLUMN public.seo_metadata.text_overlay_config IS 'JSON configuration for text overlays on OpenGraph images. Used by ImageTextOverlayEditor component for adding custom text to book cover thumbnails in SEO metadata.';