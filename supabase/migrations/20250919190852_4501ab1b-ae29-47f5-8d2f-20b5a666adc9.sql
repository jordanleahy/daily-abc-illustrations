-- Update get_book_thumbnail function to include prompt_used
CREATE OR REPLACE FUNCTION public.get_book_thumbnail(p_book_id uuid)
 RETURNS TABLE(id uuid, book_id uuid, user_id uuid, thumbnail_url text, generation_status text, is_latest boolean, version_number integer, prompt_used text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    bt.id,
    bt.book_id,
    bt.user_id,
    bt.thumbnail_url,
    bt.generation_status,
    bt.is_latest,
    bt.version_number,
    bt.prompt_used,
    bt.created_at,
    bt.updated_at
  FROM book_thumbnails bt
  WHERE bt.book_id = p_book_id
    AND bt.is_latest = true
    AND bt.generation_status = 'complete'
  LIMIT 1;
END;
$function$