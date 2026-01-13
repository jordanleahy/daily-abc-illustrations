-- Add SEO metadata columns to book_types table
ALTER TABLE public.book_types 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Add helpful comments
COMMENT ON COLUMN public.book_types.seo_title IS 'SEO title for the book type collection page';
COMMENT ON COLUMN public.book_types.seo_description IS 'SEO meta description for the book type collection page';
COMMENT ON COLUMN public.book_types.og_image_url IS 'Open Graph image URL for social sharing';