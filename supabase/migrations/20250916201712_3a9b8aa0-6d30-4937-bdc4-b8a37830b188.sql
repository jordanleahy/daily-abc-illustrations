-- Fix the get_daily_published_pages function with proper column qualification
CREATE OR REPLACE FUNCTION public.get_daily_published_pages(p_book_id uuid)
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
  -- Check if the book has an active daily published entry
  IF NOT EXISTS (
    SELECT 1 FROM daily_published dp
    WHERE dp.book_id = p_book_id 
    AND dp.is_active = true 
    AND (dp.expires_at IS NULL OR dp.expires_at > now())
  ) THEN
    -- Return empty result if no valid daily published entry
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