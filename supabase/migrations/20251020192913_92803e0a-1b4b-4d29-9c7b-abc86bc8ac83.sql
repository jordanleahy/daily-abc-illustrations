-- Add slug and public visibility columns to daily_published table
ALTER TABLE public.daily_published
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS is_publicly_visible boolean DEFAULT true NOT NULL;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_published_slug ON public.daily_published(slug);

-- Create index on is_publicly_visible for filtering
CREATE INDEX IF NOT EXISTS idx_daily_published_public ON public.daily_published(is_publicly_visible);

-- Function to generate URL-safe slug from text
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Truncate to 60 characters
  base_slug := substring(base_slug from 1 for 60);
  base_slug := trim(both '-' from base_slug);
  
  -- Check for uniqueness and add counter if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.daily_published WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- RLS Policy: Allow public read for published books
CREATE POLICY "Public books are readable by anyone"
ON public.daily_published
FOR SELECT
TO anon, authenticated
USING (
  is_publicly_visible = true 
  AND status IN ('active', 'queued', 'expired')
);

-- RLS Policy: Pages of public books are readable
CREATE POLICY "Pages of public books are readable"
ON public.pages
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.daily_published
    WHERE daily_published.book_id = pages.book_id
      AND daily_published.is_publicly_visible = true
      AND daily_published.status IN ('active', 'queued', 'expired')
  )
);

-- RLS Policy: Images of public book pages are readable
CREATE POLICY "Images of public pages are readable"
ON public.page_image_urls
FOR SELECT
TO anon, authenticated
USING (
  is_latest = true
  AND generation_status = 'complete'
  AND EXISTS (
    SELECT 1 FROM public.pages
    JOIN public.daily_published ON daily_published.book_id = pages.book_id
    WHERE pages.id = page_image_urls.page_id
      AND daily_published.is_publicly_visible = true
      AND daily_published.status IN ('active', 'queued', 'expired')
  )
);

-- Function to auto-generate slug when SEO metadata is updated
CREATE OR REPLACE FUNCTION public.auto_generate_book_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  book_title text;
BEGIN
  -- Only proceed if SEO metadata is complete and latest
  IF NEW.optimization_status = 'complete' AND NEW.is_latest = true THEN
    -- Check if the daily_published entry already has a slug
    IF NOT EXISTS (
      SELECT 1 FROM public.daily_published 
      WHERE id = NEW.daily_published_id 
      AND slug IS NOT NULL
    ) THEN
      -- Use SEO title or fallback to daily_published title
      book_title := COALESCE(NEW.seo_title, (
        SELECT title FROM public.daily_published WHERE id = NEW.daily_published_id
      ));
      
      -- Update daily_published with generated slug
      IF book_title IS NOT NULL THEN
        UPDATE public.daily_published
        SET slug = public.generate_slug(book_title)
        WHERE id = NEW.daily_published_id
        AND slug IS NULL;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate slugs
DROP TRIGGER IF EXISTS trigger_auto_generate_book_slug ON public.seo_metadata;
CREATE TRIGGER trigger_auto_generate_book_slug
AFTER INSERT OR UPDATE ON public.seo_metadata
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_book_slug();

-- Backfill slugs for existing published books (using title as fallback)
UPDATE public.daily_published
SET slug = public.generate_slug(COALESCE(
  (SELECT seo_title FROM public.seo_metadata 
   WHERE daily_published_id = daily_published.id 
   AND is_latest = true 
   LIMIT 1),
  title
))
WHERE slug IS NULL
AND status IN ('active', 'queued', 'expired');