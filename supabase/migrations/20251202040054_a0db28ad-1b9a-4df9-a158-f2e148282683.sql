-- Function to check if all pages in a book have images
CREATE OR REPLACE FUNCTION public.validate_book_images_before_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pages_without_images INTEGER;
  total_pages INTEGER;
BEGIN
  -- Count pages without latest images
  SELECT COUNT(*) INTO pages_without_images
  FROM pages p
  WHERE p.book_id = NEW.book_id
    AND NOT EXISTS (
      SELECT 1 FROM page_image_urls piu
      WHERE piu.page_id = p.id
        AND piu.is_latest = true
        AND piu.image_url IS NOT NULL
    );

  -- Get total page count
  SELECT COUNT(*) INTO total_pages
  FROM pages WHERE book_id = NEW.book_id;

  -- Block if any pages are missing images
  IF pages_without_images > 0 THEN
    RAISE EXCEPTION 'Cannot publish book: % of % pages are missing images', 
      pages_without_images, total_pages;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on daily_published table (queued or active status)
CREATE TRIGGER enforce_images_before_daily_publish
  BEFORE INSERT OR UPDATE ON public.daily_published
  FOR EACH ROW
  WHEN (NEW.status IN ('queued', 'active'))
  EXECUTE FUNCTION public.validate_book_images_before_publish();

-- Trigger on books table (is_library_book = true)
CREATE OR REPLACE FUNCTION public.validate_library_book_images()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pages_without_images INTEGER;
  total_pages INTEGER;
BEGIN
  -- Only check when setting is_library_book to true
  IF NEW.is_library_book = true AND (OLD.is_library_book IS NULL OR OLD.is_library_book = false) THEN
    SELECT COUNT(*) INTO pages_without_images
    FROM pages p
    WHERE p.book_id = NEW.id
      AND NOT EXISTS (
        SELECT 1 FROM page_image_urls piu
        WHERE piu.page_id = p.id
          AND piu.is_latest = true
          AND piu.image_url IS NOT NULL
      );

    SELECT COUNT(*) INTO total_pages
    FROM pages WHERE book_id = NEW.id;

    IF pages_without_images > 0 THEN
      RAISE EXCEPTION 'Cannot mark as library book: % of % pages are missing images', 
        pages_without_images, total_pages;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_images_before_library_publish
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_library_book_images();