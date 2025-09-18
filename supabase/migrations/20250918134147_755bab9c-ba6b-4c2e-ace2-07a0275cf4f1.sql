-- Create book_thumbnails table for managing book thumbnail images
CREATE TABLE public.book_thumbnails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  thumbnail_url TEXT NULL,
  prompt_used TEXT NULL,
  generation_status TEXT NOT NULL DEFAULT 'not_started',
  generation_started_at TIMESTAMP WITH TIME ZONE NULL,
  generation_completed_at TIMESTAMP WITH TIME ZONE NULL,
  generation_duration_ms INTEGER NULL,
  aspect_ratio TEXT NOT NULL DEFAULT '1200:630',
  error_message TEXT NULL,
  is_latest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.book_thumbnails ENABLE ROW LEVEL SECURITY;

-- Create policies for book thumbnails
CREATE POLICY "Users can create thumbnails for their own books" 
ON public.book_thumbnails 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_thumbnails.book_id 
    AND books.user_id = auth.uid()
  ) 
  AND auth.uid() = user_id
);

CREATE POLICY "Users can view thumbnails for their own books" 
ON public.book_thumbnails 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_thumbnails.book_id 
    AND books.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update thumbnails for their own books" 
ON public.book_thumbnails 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_thumbnails.book_id 
    AND books.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete thumbnails for their own books" 
ON public.book_thumbnails 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_thumbnails.book_id 
    AND books.user_id = auth.uid()
  )
);

-- Admin policies
CREATE POLICY "Admins can view all book thumbnails" 
ON public.book_thumbnails 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all book thumbnails" 
ON public.book_thumbnails 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all book thumbnails" 
ON public.book_thumbnails 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public access for active daily published books
CREATE POLICY "Anyone can view thumbnails for active daily published books" 
ON public.book_thumbnails 
FOR SELECT 
USING (
  generation_status = 'complete' 
  AND is_latest = true 
  AND EXISTS (
    SELECT 1 FROM daily_published dp 
    WHERE dp.book_id = book_thumbnails.book_id 
    AND dp.is_active = true 
    AND (dp.expires_at IS NULL OR dp.expires_at > now())
  )
);

-- Function to get next version number
CREATE OR REPLACE FUNCTION public.get_next_book_thumbnail_version_number(p_book_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM book_thumbnails
  WHERE book_id = p_book_id;
  
  RETURN next_version;
END;
$function$;

-- Function to manage latest thumbnail versioning
CREATE OR REPLACE FUNCTION public.manage_book_thumbnail_latest()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- If the new record is being set to is_latest = true
  IF NEW.is_latest = true THEN
    -- Set all other thumbnails for this book to is_latest = false
    UPDATE book_thumbnails 
    SET is_latest = false, updated_at = now()
    WHERE book_id = NEW.book_id 
    AND id != NEW.id 
    AND is_latest = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for managing latest versions
CREATE TRIGGER manage_book_thumbnail_latest_trigger
  BEFORE INSERT OR UPDATE ON public.book_thumbnails
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_book_thumbnail_latest();

-- Create trigger for updating updated_at
CREATE TRIGGER update_book_thumbnails_updated_at
  BEFORE UPDATE ON public.book_thumbnails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();