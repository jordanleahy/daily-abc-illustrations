-- Add column for printable coloring image (B&W with color reference thumbnail)
ALTER TABLE public.page_image_urls
ADD COLUMN IF NOT EXISTS printable_coloring_image_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.page_image_urls.printable_coloring_image_url IS 'Composited image: B&W coloring page with color reference thumbnail in top-left corner for printing';