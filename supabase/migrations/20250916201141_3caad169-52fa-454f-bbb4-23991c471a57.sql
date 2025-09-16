-- Create instagram_shared table
CREATE TABLE public.instagram_shared (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on instagram_shared
ALTER TABLE public.instagram_shared ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for instagram_shared
CREATE POLICY "Anyone can view active instagram shared content" 
ON public.instagram_shared 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can share their own books on instagram" 
ON public.instagram_shared 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = instagram_shared.book_id 
    AND books.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own instagram shares" 
ON public.instagram_shared 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = instagram_shared.book_id 
    AND books.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_instagram_shared_updated_at
BEFORE UPDATE ON public.instagram_shared
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get instagram shared pages
CREATE OR REPLACE FUNCTION public.get_instagram_shared_pages(p_book_id uuid)
RETURNS TABLE(
  id uuid, 
  book_id uuid, 
  letter text, 
  page_number integer, 
  title text, 
  description text, 
  content jsonb, 
  current_system_prompt_id uuid, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the book has an active instagram shared entry
  IF NOT EXISTS (
    SELECT 1 FROM instagram_shared 
    WHERE book_id = p_book_id 
    AND is_active = true
  ) THEN
    -- Return empty result if no valid instagram shared entry
    RETURN;
  END IF;
  
  -- Return pages for the book
  RETURN QUERY
  SELECT 
    p.id,
    p.book_id,
    p.letter,
    p.page_number,
    p.title,
    p.description,
    p.content,
    p.current_system_prompt_id,
    p.created_at,
    p.updated_at
  FROM pages p
  WHERE p.book_id = p_book_id
  ORDER BY p.page_number ASC;
END;
$function$;

-- Migrate existing Instagram records (where expires_at is null) from daily_published to instagram_shared
INSERT INTO public.instagram_shared (book_id, title, description, shared_at, created_at, updated_at)
SELECT 
  book_id, 
  title, 
  description, 
  published_at as shared_at, 
  created_at, 
  updated_at
FROM public.daily_published 
WHERE expires_at IS NULL;

-- Remove Instagram records from daily_published (where expires_at is null)
DELETE FROM public.daily_published WHERE expires_at IS NULL;