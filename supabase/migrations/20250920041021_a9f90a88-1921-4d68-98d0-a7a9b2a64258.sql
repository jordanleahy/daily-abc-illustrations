-- Update the process_daily_published_queue_fixed function to generate SEO metadata for newly activated items
CREATE OR REPLACE FUNCTION public.process_daily_published_queue_fixed()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_activation_time TIMESTAMP WITH TIME ZONE;
  next_item_id UUID;
  current_activation_time TIMESTAMP WITH TIME ZONE;
  activated_book_id UUID;
  activated_book_user_id UUID;
BEGIN
  -- Calculate today's 11:12 PM UTC activation time
  current_activation_time := date_trunc('day', now() AT TIME ZONE 'UTC') + INTERVAL '23 hours 12 minutes';
  
  -- Mark expired items (items that were active but it's now past 11:12 PM)
  UPDATE public.daily_published 
  SET status = 'expired', is_active = false, updated_at = now()
  WHERE status = 'active' 
  AND now() AT TIME ZONE 'UTC' > current_activation_time;
  
  -- Get next activation time
  SELECT public.get_next_fixed_activation_time() INTO next_activation_time;
  
  -- Check if it's time to activate the next item (at or after 11:12 PM UTC)
  IF now() AT TIME ZONE 'UTC' >= current_activation_time THEN
    -- Get the next queued item
    SELECT id INTO next_item_id
    FROM public.daily_published 
    WHERE status = 'queued'
    ORDER BY queue_position ASC
    LIMIT 1;
    
    -- Activate the next item if one exists
    IF next_item_id IS NOT NULL THEN
      -- Get book details for the item being activated
      SELECT dp.book_id, b.user_id INTO activated_book_id, activated_book_user_id
      FROM public.daily_published dp
      JOIN public.books b ON dp.book_id = b.id
      WHERE dp.id = next_item_id;
      
      UPDATE public.daily_published 
      SET 
        status = 'active',
        is_active = true,
        published_at = current_activation_time,
        expires_at = current_activation_time + INTERVAL '1 day'
      WHERE id = next_item_id;
      
      -- Check if SEO metadata exists for this daily published item
      IF NOT EXISTS (
        SELECT 1 FROM public.seo_metadata sm 
        WHERE sm.daily_published_id = next_item_id 
        AND sm.is_latest = true 
        AND sm.is_active = true
      ) THEN
        -- Create SEO metadata using book thumbnail if available
        INSERT INTO public.seo_metadata (
          daily_published_id,
          user_id,
          seo_title,
          seo_description,
          og_image_url,
          optimization_status,
          is_latest,
          is_active,
          version_number,
          optimized_at,
          source_data
        )
        SELECT 
          next_item_id,
          activated_book_user_id,
          COALESCE(dp.title, b.book_name),
          COALESCE(dp.description, b.book_description, 'An engaging ABC book for children'),
          bt.thumbnail_url,
          'complete',
          true,
          true,
          1,
          now(),
          jsonb_build_object(
            'bookId', activated_book_id,
            'bookTitle', b.book_name,
            'bookDescription', b.book_description,
            'source', 'auto_generated',
            'created_by', 'queue_processor'
          )
        FROM public.daily_published dp
        JOIN public.books b ON dp.book_id = b.id
        LEFT JOIN public.book_thumbnails bt ON b.id = bt.book_id AND bt.is_latest = true AND bt.generation_status = 'complete'
        WHERE dp.id = next_item_id;
      END IF;
    END IF;
  END IF;
END;
$function$;