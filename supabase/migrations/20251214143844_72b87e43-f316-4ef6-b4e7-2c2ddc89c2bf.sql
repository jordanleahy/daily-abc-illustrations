-- Add marketing_url column to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS marketing_url text;

-- Create unique index for collision prevention
CREATE UNIQUE INDEX IF NOT EXISTS books_marketing_url_unique 
ON public.books(marketing_url) WHERE marketing_url IS NOT NULL;

-- Create function to generate book marketing URL
CREATE OR REPLACE FUNCTION public.generate_book_marketing_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Only generate if marketing_url is NULL and book_name exists
  IF NEW.marketing_url IS NULL AND NEW.book_name IS NOT NULL THEN
    -- Convert to lowercase and clean up
    base_slug := lower(regexp_replace(NEW.book_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    base_slug := substring(base_slug from 1 for 60);
    base_slug := trim(both '-' from base_slug);
    
    -- Check for uniqueness
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.books WHERE marketing_url = final_slug AND id != NEW.id) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    NEW.marketing_url := final_slug;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_generate_book_marketing_url ON public.books;
CREATE TRIGGER trigger_generate_book_marketing_url
BEFORE INSERT ON public.books
FOR EACH ROW
EXECUTE FUNCTION generate_book_marketing_url();

-- Create trigger for UPDATE (regenerates if book_name changes and marketing_url is NULL)
DROP TRIGGER IF EXISTS trigger_update_book_marketing_url ON public.books;
CREATE TRIGGER trigger_update_book_marketing_url
BEFORE UPDATE ON public.books
FOR EACH ROW
WHEN (OLD.book_name IS DISTINCT FROM NEW.book_name AND NEW.marketing_url IS NULL)
EXECUTE FUNCTION generate_book_marketing_url();

-- Backfill existing books that don't have marketing_url
DO $$
DECLARE
  book_record RECORD;
  base_slug text;
  final_slug text;
  counter integer;
BEGIN
  FOR book_record IN SELECT id, book_name FROM public.books WHERE marketing_url IS NULL LOOP
    counter := 1;
    base_slug := lower(regexp_replace(book_record.book_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    base_slug := substring(base_slug from 1 for 60);
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.books WHERE marketing_url = final_slug AND id != book_record.id) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    UPDATE public.books SET marketing_url = final_slug WHERE id = book_record.id;
  END LOOP;
END $$;